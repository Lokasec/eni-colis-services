'use server'

import { revalidatePath } from 'next/cache'
import { exigerConnexionAction } from '@/lib/autorisation'
import { db } from '@/lib/db'
import { envoyerEnLot } from '@/lib/email'
import { site, urlSuivi } from '@/lib/site'

export type Reponse =
  { ok: true; message: string; detail?: string } | { ok: false; message: string }

/**
 * Envoi groupé aux destinataires d'un départ.
 *
 * Deux garde-fous, tous deux appris de ce que coûte leur absence :
 *
 *  1. Le message est enregistré en base AVANT l'envoi, avec `envoyeeLe` à
 *     null, puis complété. Si l'envoi casse à mi-parcours, la campagne
 *     existe quand même avec le nombre réellement parti — sans quoi
 *     personne ne saurait qui a été prévenu.
 *  2. Le compteur journalisé est le nombre d'envois ACCEPTÉS, pas le
 *     nombre de destinataires visés. Un rapport qui compte les intentions
 *     ment sur ce qui est arrivé.
 */
export async function envoyerCampagne(
  _precedent: Reponse | null,
  donnees: FormData,
): Promise<Reponse> {
  const session = await exigerConnexionAction()
  if (!session.ok) return session

  const departId = String(donnees.get('departId') ?? '')
  const sujet = String(donnees.get('sujet') ?? '').trim()
  const corps = String(donnees.get('corps') ?? '').trim()

  if (!departId) return { ok: false, message: 'Choisissez un départ.' }
  if (sujet.length < 3) return { ok: false, message: 'Indiquez un objet.' }
  if (corps.length < 10) return { ok: false, message: 'Le message est trop court.' }

  const depart = await db.depart.findUnique({
    where: { id: departId },
    select: {
      reference: true,
      dateDepart: true,
      liaison: { select: { paysDestination: { select: { nom: true } } } },
      colis: {
        select: { codeSuivi: true, destinataireNom: true, destinataireEmail: true },
      },
    },
  })
  if (!depart) return { ok: false, message: 'Ce départ n’existe plus.' }

  const joignables = depart.colis.filter((c) => c.destinataireEmail)
  if (joignables.length === 0) {
    return {
      ok: false,
      message: 'Aucun destinataire de ce départ n’a d’adresse e-mail enregistrée.',
    }
  }

  const cible = `Départ ${depart.reference} — ${depart.liaison.paysDestination.nom}`

  const campagne = await db.messageCampagne.create({
    data: {
      sujet,
      corps,
      canal: 'EMAIL',
      cible,
      departId,
      nbDestinataires: 0,
      auteurEmail: session.utilisateur.email,
    },
    select: { id: true },
  })

  // Le message est personnalisé par colis : chacun reçoit SON code de
  // suivi, avec le lien qui va avec. Un envoi groupé sans le code oblige
  // le destinataire à retrouver son numéro ailleurs — donc à téléphoner.
  let envoyes = 0
  const echecs: string[] = []

  for (const colis of joignables) {
    const personnalise = corps
      .replaceAll('{{nom}}', colis.destinataireNom)
      .replaceAll('{{code}}', colis.codeSuivi)

    const resultat = await envoyerEnLot([colis.destinataireEmail!], {
      sujet,
      texte: `${personnalise}\n\n${site.name}\n${site.telephone}`,
      action: { libelle: 'Suivre mon colis', url: urlSuivi(colis.codeSuivi) },
    })
    envoyes += resultat.envoyes
    echecs.push(...resultat.echecs)
  }

  await db.messageCampagne.update({
    where: { id: campagne.id },
    data: { nbDestinataires: envoyes, envoyeeLe: new Date() },
  })

  revalidatePath('/admin/messagerie')

  return {
    ok: true,
    message: `${envoyes} message${envoyes > 1 ? 's' : ''} envoyé${envoyes > 1 ? 's' : ''}.`,
    detail:
      echecs.length > 0
        ? `${echecs.length} échec(s) : ${echecs.join(', ')}`
        : `${depart.colis.length - joignables.length} colis sans adresse e-mail.`,
  }
}
