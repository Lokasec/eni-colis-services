'use server'

import { db } from '@/lib/db'
import { adresseInterne, envoyer } from '@/lib/email'
import { prochainNumero, TRANSACTION } from '@/lib/numerotation'
import { verifierLimite } from '@/lib/rate-limit'
import { site } from '@/lib/site'
import { deposerPhoto } from '@/lib/stockage'
import { schemaDevis } from '@/lib/validation'

export type EtatDevis =
  | { statut: 'initial' }
  | { statut: 'succes'; reference: string }
  | { statut: 'erreur'; message: string; champs?: Record<string, string> }

/** Correspondance entre la nature saisie et le code de catégorie en base. */
const CATEGORIES: Record<string, string> = {
  STANDARD: 'STANDARD',
  PIECE_DETACHEE: 'PIECE_DETACHEE',
  ELECTRONIQUE: 'ELECTRONIQUE',
  GRANDE_MARQUE: 'GRANDE_MARQUE',
}

/**
 * Enregistrement d'une demande de devis.
 *
 * La validation Zod est rejouée ici, indépendamment du navigateur : le
 * formulaire client est un confort de saisie, cette action est la seule
 * barrière réelle (CLAUDE.md §7.1).
 *
 * AUCUN PRIX n'est calculé ni renvoyé. Le moteur de tarification n'est pas
 * importé — la cliente chiffrera depuis le back-office, après avoir vu les
 * photos.
 */
export async function envoyerDemandeDevis(
  _precedent: EtatDevis,
  donnees: FormData,
): Promise<EtatDevis> {
  // 1. Piège à robots — on répond « succès » sans rien enregistrer, pour ne
  //    pas signaler à l'automate qu'il a été repéré.
  if (String(donnees.get('societe') ?? '') !== '') {
    return { statut: 'succes', reference: 'DEM-0000-00000' }
  }

  // 2. Limitation de débit
  const limite = await verifierLimite('devis', { maximum: 5, dureeMs: 60 * 60 * 1000 })
  if (!limite.autorise) {
    const minutes = Math.ceil(limite.secondesRestantes / 60)
    return {
      statut: 'erreur',
      message: `Vous avez envoyé plusieurs demandes coup sur coup. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}, ou écrivez-nous sur WhatsApp.`,
    }
  }

  // 3. Validation serveur
  const brut = {
    paysDepart: donnees.get('paysDepart'),
    villeDepart: donnees.get('villeDepart'),
    paysArrivee: donnees.get('paysArrivee'),
    villeArrivee: donnees.get('villeArrivee'),
    modeRemise: donnees.get('modeRemise'),
    nature: donnees.get('nature'),
    poidsEstime: donnees.get('poidsEstime'),
    longueurCm: donnees.get('longueurCm'),
    largeurCm: donnees.get('largeurCm'),
    hauteurCm: donnees.get('hauteurCm'),
    valeurAchat: donnees.get('valeurAchat'),
    description: donnees.get('description'),
    departSouhaite: donnees.get('departSouhaite'),
    nom: donnees.get('nom'),
    telephone: donnees.get('telephone'),
    email: donnees.get('email'),
    consentement: donnees.get('consentement') === 'on' || donnees.get('consentement') === 'true',
    societe: donnees.get('societe') ?? '',
  }

  const analyse = schemaDevis.safeParse(brut)
  if (!analyse.success) {
    const champs: Record<string, string> = {}
    for (const probleme of analyse.error.issues) {
      const champ = String(probleme.path[0] ?? '')
      if (champ && !champs[champ]) champs[champ] = probleme.message
    }
    return {
      statut: 'erreur',
      message: 'Vérifiez les champs signalés avant d’envoyer.',
      champs,
    }
  }

  const d = analyse.data

  // 4. Le trajet soumis doit correspondre à une liaison RÉELLEMENT PUBLIÉE.
  //    Les sélecteurs du formulaire ne proposent que celles-là, mais un
  //    formulaire se falsifie : sans ce contrôle, on pourrait enregistrer
  //    une demande France → USA, liaison qui existe sans être publique.
  const trajet = await resoudreTrajet(d.paysDepart, d.villeDepart, d.paysArrivee, d.villeArrivee)
  if ('erreur' in trajet) {
    return {
      statut: 'erreur',
      message: trajet.erreur,
      champs: { paysArrivee: 'Ce trajet n’est pas desservi.' },
    }
  }

  // 5. Photos — le type et la taille sont revérifiés côté serveur.
  const fichiers = donnees
    .getAll('photos')
    .filter((f): f is File => f instanceof File && f.size > 0)
  if (fichiers.length > 3) {
    return {
      statut: 'erreur',
      message: 'Trois photos au maximum.',
      champs: { photos: 'Trois photos au maximum.' },
    }
  }

  const photos: Array<{ url: string; nomOriginal: string; tailleOctets: number }> = []
  for (const fichier of fichiers) {
    const depose = await deposerPhoto(fichier)
    if ('erreur' in depose) {
      return { statut: 'erreur', message: depose.erreur, champs: { photos: depose.erreur } }
    }
    photos.push(depose)
  }

  // 6. Enregistrement — référence attribuée dans la transaction.
  const categorie = await db.categorieArticle.findUnique({
    where: { code: CATEGORIES[d.nature] ?? 'STANDARD' },
    select: { id: true },
  })

  const dimensions =
    d.longueurCm && d.largeurCm && d.hauteurCm
      ? `${d.longueurCm} × ${d.largeurCm} × ${d.hauteurCm} cm`
      : null

  let reference: string
  try {
    reference = await db.$transaction(async (tx) => {
      const numero = await prochainNumero(tx, 'DEMANDE')
      await tx.demandeDevis.create({
        data: {
          reference: numero,
          // Les noms résolus, pas les codes : la demande doit rester
          // lisible telle quelle dans le back-office.
          paysDepart: trajet.paysDepart,
          villeDepart: trajet.villeDepart,
          paysArrivee: trajet.paysArrivee,
          villeArrivee: trajet.villeArrivee,
          modeRemise: d.modeRemise,
          categorieId: categorie?.id ?? null,
          poidsEstime: d.poidsEstime !== undefined ? String(d.poidsEstime) : null,
          dimensions,
          valeurAchat: d.valeurAchat !== undefined ? String(d.valeurAchat) : null,
          description: d.description,
          departSouhaite: d.departSouhaite ? new Date(d.departSouhaite) : null,
          nom: d.nom,
          telephone: d.telephone,
          email: d.email,
          consentementLe: new Date(),
          photos: {
            create: photos.map((photo, ordre) => ({
              url: photo.url,
              nomOriginal: photo.nomOriginal,
              tailleOctets: photo.tailleOctets,
              ordre,
            })),
          },
        },
      })
      return numero
    }, TRANSACTION)
  } catch (erreur) {
    console.error('[devis] enregistrement impossible :', erreur)
    return {
      statut: 'erreur',
      message: 'Une erreur est survenue. Réessayez dans un instant, ou contactez-nous.',
    }
  }

  // 7. Notifications — sans faire attendre le visiteur derrière Resend.
  void notifier(reference, { ...d, ...trajet }, photos.length)

  return { statut: 'succes', reference }
}

/**
 * Vérifie que le couple pays/ville existe, qu'une liaison PUBLIÉE relie les
 * deux, et renvoie les noms lisibles à enregistrer.
 */
async function resoudreTrajet(
  codeDepart: string,
  villeDepart: string,
  codeArrivee: string,
  villeArrivee: string,
): Promise<
  | { paysDepart: string; villeDepart: string; paysArrivee: string; villeArrivee: string }
  | { erreur: string }
> {
  const liaison = await db.liaison.findFirst({
    where: {
      afficheePubliquement: true,
      actif: true,
      mode: 'AERIEN',
      paysOrigine: { codeIso: codeDepart, actif: true },
      paysDestination: { codeIso: codeArrivee, actif: true },
    },
    select: {
      paysOrigine: {
        select: { nom: true, villes: { where: { actif: true }, select: { nom: true } } },
      },
      paysDestination: {
        select: { nom: true, villes: { where: { actif: true }, select: { nom: true } } },
      },
    },
  })

  if (!liaison) {
    return { erreur: 'Nous ne desservons pas ce trajet. Choisissez une destination proposée.' }
  }

  const villeD = liaison.paysOrigine.villes.find((v) => v.nom === villeDepart)
  const villeA = liaison.paysDestination.villes.find((v) => v.nom === villeArrivee)
  if (!villeD || !villeA) {
    return { erreur: 'La ville choisie ne correspond pas au pays indiqué.' }
  }

  return {
    paysDepart: liaison.paysOrigine.nom,
    villeDepart: villeD.nom,
    paysArrivee: liaison.paysDestination.nom,
    villeArrivee: villeA.nom,
  }
}

async function notifier(
  reference: string,
  d: {
    nom: string
    email: string
    telephone: string
    villeArrivee: string
    paysArrivee: string
    description: string
    nature: string
    modeRemise: string
  },
  nbPhotos: number,
) {
  await Promise.allSettled([
    envoyer({
      destinataire: d.email,
      sujet: `Votre demande de devis ${reference} — ${site.name}`,
      texte: `Bonjour ${d.nom},

Nous avons bien reçu votre demande de devis, enregistrée sous la référence ${reference}.

Destination : ${d.villeArrivee}, ${d.paysArrivee}
Photos jointes : ${nbPhotos}

Vous recevrez votre devis sous 24 heures par e-mail, et par WhatsApp si vous nous avez laissé votre numéro. Le montant sera ferme et valable sept jours.

Une question en attendant ? Écrivez-nous au ${site.telephone}.

${site.name}
${site.adresse.rue}, ${site.adresse.codePostal} ${site.adresse.ville}`,
    }),
    envoyer({
      destinataire: adresseInterne,
      sujet: `[Devis ${reference}] ${d.villeArrivee} — ${d.nom}`,
      texte: `Nouvelle demande de devis à chiffrer.

Référence : ${reference}
Demandeur : ${d.nom}
Téléphone : ${d.telephone}
E-mail : ${d.email}

Destination : ${d.villeArrivee}, ${d.paysArrivee}
Nature : ${d.nature}
Mode de remise : ${d.modeRemise}
Photos : ${nbPhotos}

Description :
${d.description}

À traiter dans le back-office, rubrique Devis.`,
    }),
  ])
}
