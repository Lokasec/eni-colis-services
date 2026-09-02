'use server'

import { db } from '@/lib/db'
import { adresseInterne, envoyer } from '@/lib/email'
import { prochainIdentifiantClient, TRANSACTION } from '@/lib/numerotation'
import { verifierLimite } from '@/lib/rate-limit'
import { site } from '@/lib/site'
import { schemaInscription } from '@/lib/validation'

export type BlocAdresse = {
  nom: string
  prenom: string
  adresse: string
  codePostal: string
  ville: string
  departement: string
  telephone: string
  email: string
}

export type EtatInscription =
  | { statut: 'initial' }
  | { statut: 'succes'; numeroClient: string; bloc: BlocAdresse }
  | { statut: 'erreur'; message: string; champs?: Record<string, string> }

/**
 * Inscription au service de réception (mode A).
 *
 * À la validation : attribution de l'identifiant dans une transaction, puis
 * renvoi du BLOC D'ADRESSE COMPLET, au format imposé par la cliente. Ce
 * format ne doit pas être modifié (CLAUDE.md §1.2) : le champ « Nom » est
 * l'identifiant qui permet de reconnaître un carton marchand anonyme, et le
 * téléphone est celui d'ENI, pas celui du client — c'est ENI qui reçoit la
 * livraison, donc ENI que le livreur doit pouvoir joindre.
 */
export async function inscrire(
  _precedent: EtatInscription,
  donnees: FormData,
): Promise<EtatInscription> {
  if (String(donnees.get('societe') ?? '') !== '') {
    // Piège à robots : on n'enregistre rien et on ne le signale pas.
    return { statut: 'erreur', message: 'Une erreur est survenue. Réessayez dans un instant.' }
  }

  const limite = await verifierLimite('inscription', { maximum: 3, dureeMs: 60 * 60 * 1000 })
  if (!limite.autorise) {
    const minutes = Math.ceil(limite.secondesRestantes / 60)
    return {
      statut: 'erreur',
      message: `Trop de tentatives d’inscription. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}, ou écrivez-nous sur WhatsApp.`,
    }
  }

  const analyse = schemaInscription.safeParse({
    prenom: donnees.get('prenom'),
    nom: donnees.get('nom'),
    telephone: donnees.get('telephone'),
    email: donnees.get('email'),
    villeRetraitId: donnees.get('villeRetraitId'),
    consentement: donnees.get('consentement') === 'on' || donnees.get('consentement') === 'true',
    societe: donnees.get('societe') ?? '',
  })

  if (!analyse.success) {
    const champs: Record<string, string> = {}
    for (const probleme of analyse.error.issues) {
      const champ = String(probleme.path[0] ?? '')
      if (champ && !champs[champ]) champs[champ] = probleme.message
    }
    return { statut: 'erreur', message: 'Vérifiez les champs signalés avant d’envoyer.', champs }
  }

  const d = analyse.data

  const ville = await db.ville.findUnique({
    where: { id: d.villeRetraitId },
    select: { id: true, nom: true, paysId: true, actif: true, pays: { select: { nom: true } } },
  })
  if (!ville || !ville.actif) {
    return {
      statut: 'erreur',
      message: 'Cette ville de retrait n’est plus proposée.',
      champs: { villeRetraitId: 'Choisissez une ville de retrait.' },
    }
  }

  // Une adresse e-mail déjà inscrite : on renvoie son identifiant plutôt que
  // d'en créer un second, qui rendrait les colis ambigus.
  const existant = await db.client.findFirst({
    where: { email: d.email, actif: true },
    select: { numeroClient: true, nomLivraison: true, email: true },
  })
  if (existant) {
    return {
      statut: 'succes',
      numeroClient: existant.numeroClient,
      bloc: blocAdresse(existant.nomLivraison, existant.email),
    }
  }

  let cree: { numeroClient: string; nomLivraison: string }
  try {
    cree = await db.$transaction(async (tx) => {
      const identifiant = await prochainIdentifiantClient(tx, d.prenom, d.nom)
      await tx.client.create({
        data: {
          numeroClient: identifiant.numeroClient,
          nomLivraison: identifiant.nomLivraison,
          sequence: identifiant.sequence,
          prenom: d.prenom,
          nom: d.nom,
          telephone: d.telephone,
          email: d.email,
          paysDestinationId: ville.paysId,
          villeDestinationId: ville.id,
          consentementLe: new Date(),
        },
      })
      return identifiant
    }, TRANSACTION)
  } catch (erreur) {
    console.error('[inscription] création impossible :', erreur)
    return {
      statut: 'erreur',
      message: 'Une erreur est survenue. Réessayez dans un instant, ou contactez-nous.',
    }
  }

  const bloc = blocAdresse(cree.nomLivraison, d.email)
  void notifier(cree.numeroClient, bloc, d, ville.nom, ville.pays.nom)

  return { statut: 'succes', numeroClient: cree.numeroClient, bloc }
}

/** Format imposé par la cliente — ne pas le modifier. */
function blocAdresse(nomLivraison: string, emailClient: string): BlocAdresse {
  return {
    nom: nomLivraison,
    prenom: 'colis service',
    adresse: site.adresse.rue,
    codePostal: site.adresse.codePostal,
    ville: site.adresse.ville,
    departement: 'Seine-Maritime',
    telephone: site.telephone,
    email: emailClient,
  }
}

function blocEnTexte(bloc: BlocAdresse): string {
  return [
    `Nom         : ${bloc.nom}`,
    `Prénom      : ${bloc.prenom}`,
    `Adresse     : ${bloc.adresse}`,
    `Code postal : ${bloc.codePostal}`,
    `Ville       : ${bloc.ville}`,
    `Département : ${bloc.departement}`,
    `Téléphone   : ${bloc.telephone}`,
    `E-mail      : ${bloc.email}`,
  ].join('\n')
}

async function notifier(
  numeroClient: string,
  bloc: BlocAdresse,
  d: { prenom: string; nom: string; email: string; telephone: string },
  villeRetrait: string,
  paysRetrait: string,
) {
  await Promise.allSettled([
    envoyer({
      destinataire: d.email,
      sujet: `Votre adresse de livraison en France — ${site.name}`,
      texte: `Bonjour ${d.prenom},

Votre inscription est enregistrée. Voici l'adresse exacte à saisir dans vos commandes, sur n'importe quel site marchand français :

${blocEnTexte(bloc)}

Deux points à retenir :

Le champ « Nom » est votre identifiant. C'est lui qui nous permet de savoir à qui appartient le carton. Un colis arrivé sans ce marquage est un carton anonyme parmi d'autres.

Le téléphone indiqué est le nôtre, pas le vôtre. C'est normal : c'est nous qui recevons le colis, donc c'est nous que le livreur doit pouvoir joindre. En revanche, indiquez bien votre propre adresse e-mail pour suivre votre livraison jusqu'à notre bureau.

Vous ne payez rien au moment de la commande ni au départ : le règlement se fait à l'arrivée, quand vous venez chercher votre colis à ${villeRetrait}.

${site.name}
${site.adresse.rue}, ${site.adresse.codePostal} ${site.adresse.ville}`,
    }),
    envoyer({
      destinataire: adresseInterne,
      sujet: `[Inscription] ${bloc.nom} — ${villeRetrait}`,
      texte: `Nouveau client du service de réception.

Identifiant : ${numeroClient}
Nom de livraison : ${bloc.nom}
Client : ${d.prenom} ${d.nom}
Téléphone : ${d.telephone}
E-mail : ${d.email}
Retrait : ${villeRetrait}, ${paysRetrait}`,
    }),
  ])
}
