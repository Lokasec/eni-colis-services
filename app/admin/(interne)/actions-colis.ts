'use server'

import { revalidatePath } from 'next/cache'
import { exigerConnexionAction } from '@/lib/autorisation'
import { db } from '@/lib/db'
import { prochainNumero } from '@/lib/numerotation'
import type { StatutColis } from '@/lib/statuts'

export type Reponse = { ok: true; message: string } | { ok: false; message: string }

/**
 * Actions d'exploitation sur les colis.
 *
 * CHAQUE action commence par `exigerConnexionAction()`. Le middleware
 * protège la navigation, mais une Server Action s'appelle directement :
 * sans ce contrôle en tête, l'URL du back-office serait fermée et
 * l'opération resterait ouverte.
 *
 * Les changements de statut écrivent TOUJOURS une ligne d'historique.
 * `HistoriqueStatut` est append-only : c'est la trace d'exploitation, et la
 * preuve en cas de litige.
 */

/** Journalise un changement de statut. Toujours dans la même transaction. */
async function journaliser(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  colisId: string,
  statut: StatutColis,
  auteurId: string,
  commentaire?: string,
) {
  await tx.historiqueStatut.create({
    data: { colisId, statut, auteurId, commentaire: commentaire ?? null },
  })
}

/** Rattache un colis anonyme à un client, et le pèse si le poids est fourni. */
export async function rattacherColis(
  _precedent: Reponse | null,
  donnees: FormData,
): Promise<Reponse> {
  const session = await exigerConnexionAction()
  if (!session.ok) return session

  const colisId = String(donnees.get('colisId') ?? '')
  const clientId = String(donnees.get('clientId') ?? '')
  const poidsBrut = String(donnees.get('poidsReel') ?? '')
    .replace(',', '.')
    .trim()

  if (!colisId || !clientId) return { ok: false, message: 'Colis ou client manquant.' }

  const poids = poidsBrut === '' ? null : Number(poidsBrut)
  if (poids !== null && (!Number.isFinite(poids) || poids <= 0)) {
    return { ok: false, message: 'Le poids doit être un nombre positif.' }
  }

  const client = await db.client.findUnique({
    where: { id: clientId },
    select: { id: true, prenom: true, nom: true, numeroClient: true, villeDestinationId: true },
  })
  if (!client) return { ok: false, message: 'Ce client n’existe plus.' }

  try {
    await db.$transaction(async (tx) => {
      await tx.colis.update({
        where: { id: colisId },
        data: {
          clientId: client.id,
          destinataireNom: `${client.prenom} ${client.nom}`,
          ...(client.villeDestinationId ? { villeArriveeId: client.villeDestinationId } : {}),
          ...(poids !== null ? { poidsReel: String(poids) } : {}),
          statut: 'EN_PREPARATION',
          statutPaiement: 'A_PAYER_ARRIVEE',
        },
      })
      await journaliser(
        tx,
        colisId,
        'EN_PREPARATION',
        session.utilisateur.id,
        `Rattaché à ${client.numeroClient}${poids !== null ? ` · pesé ${poids} kg` : ''}`,
      )
    })
  } catch (erreur) {
    console.error('[colis] rattachement impossible :', erreur)
    return { ok: false, message: 'Le rattachement a échoué. Réessayez.' }
  }

  revalidatePath('/admin/receptions')
  revalidatePath('/admin')
  return { ok: true, message: `Colis rattaché à ${client.numeroClient}.` }
}

/** Enregistre le poids réel constaté à la pesée. */
export async function peserColis(_precedent: Reponse | null, donnees: FormData): Promise<Reponse> {
  const session = await exigerConnexionAction()
  if (!session.ok) return session

  const colisId = String(donnees.get('colisId') ?? '')
  const poids = Number(
    String(donnees.get('poidsReel') ?? '')
      .replace(',', '.')
      .trim(),
  )
  if (!colisId || !Number.isFinite(poids) || poids <= 0) {
    return { ok: false, message: 'Indiquez un poids valide.' }
  }

  await db.colis.update({ where: { id: colisId }, data: { poidsReel: String(poids) } })
  revalidatePath('/admin/colis')
  revalidatePath('/admin/receptions')
  return { ok: true, message: `Poids enregistré : ${poids} kg.` }
}

/**
 * Change le statut d'un colis.
 *
 * Les dates clés sont renseignées au passage : elles servent au calcul de
 * l'ancienneté des créances et à l'affichage du suivi public.
 */
export async function changerStatut(
  _precedent: Reponse | null,
  donnees: FormData,
): Promise<Reponse> {
  const session = await exigerConnexionAction()
  if (!session.ok) return session

  const colisId = String(donnees.get('colisId') ?? '')
  const statut = String(donnees.get('statut') ?? '') as StatutColis
  const commentaire = String(donnees.get('commentaire') ?? '').trim() || undefined

  if (!colisId || !statut) return { ok: false, message: 'Colis ou statut manquant.' }

  const maintenant = new Date()
  const dates: Record<string, Date> = {}
  if (statut === 'EXPEDIE') dates.dateDepartEffectif = maintenant
  if (statut === 'ARRIVE') dates.dateArrivee = maintenant
  if (statut === 'DISPONIBLE_RETRAIT') dates.dateDisponible = maintenant
  if (statut === 'RETIRE') dates.dateRetrait = maintenant

  try {
    await db.$transaction(async (tx) => {
      await tx.colis.update({
        where: { id: colisId },
        data: {
          statut,
          ...dates,
          // Un colis au hub attend son second segment.
          ...(statut === 'EN_REACHEMINEMENT' ? { necessiteReacheminement: true } : {}),
          ...(statut === 'ARRIVE' ? { necessiteReacheminement: false } : {}),
        },
      })
      await journaliser(tx, colisId, statut, session.utilisateur.id, commentaire)
    })
  } catch (erreur) {
    console.error('[colis] changement de statut impossible :', erreur)
    return { ok: false, message: 'Le changement de statut a échoué.' }
  }

  revalidatePath('/admin/colis')
  revalidatePath('/admin/reacheminement')
  revalidatePath('/admin')
  return { ok: true, message: 'Statut mis à jour.' }
}

/** Affecte un colis à un départ. */
export async function affecterAuDepart(
  _precedent: Reponse | null,
  donnees: FormData,
): Promise<Reponse> {
  const session = await exigerConnexionAction()
  if (!session.ok) return session

  const colisId = String(donnees.get('colisId') ?? '')
  const departId = String(donnees.get('departId') ?? '')
  if (!colisId) return { ok: false, message: 'Colis manquant.' }

  await db.colis.update({
    where: { id: colisId },
    data: { departId: departId === '' ? null : departId },
  })

  revalidatePath('/admin/colis')
  revalidatePath('/admin/departs')
  return { ok: true, message: departId ? 'Colis affecté au départ.' : 'Colis retiré du départ.' }
}

/**
 * Enregistre un colis reçu.
 *
 * Pensée pour la saisie debout, en moins de soixante secondes : le code de
 * suivi est attribué automatiquement, le client est facultatif — un carton
 * marchand anonyme entre dans la file des réceptions et sera rattaché plus
 * tard.
 */
export async function enregistrerColis(
  _precedent: Reponse | null,
  donnees: FormData,
): Promise<Reponse> {
  const session = await exigerConnexionAction()
  if (!session.ok) return session

  const modeReception = String(donnees.get('modeReception') ?? 'DEPOT')
  const villeArriveeId = String(donnees.get('villeArriveeId') ?? '')
  const destinataireNom = String(donnees.get('destinataireNom') ?? '').trim()
  const clientId = String(donnees.get('clientId') ?? '')
  const poidsBrut = String(donnees.get('poidsReel') ?? '')
    .replace(',', '.')
    .trim()
  const contenu = String(donnees.get('contenu') ?? '').trim() || null
  const expediteurNom = String(donnees.get('expediteurNom') ?? '').trim() || null

  if (!villeArriveeId) return { ok: false, message: 'Choisissez la ville de destination.' }

  const anonyme = modeReception === 'COMMANDE_EN_LIGNE' && clientId === ''
  if (!anonyme && !destinataireNom && !clientId) {
    return { ok: false, message: 'Indiquez le destinataire, ou rattachez un client.' }
  }

  const poids = poidsBrut === '' ? null : Number(poidsBrut)
  if (poids !== null && (!Number.isFinite(poids) || poids <= 0)) {
    return { ok: false, message: 'Le poids doit être un nombre positif.' }
  }

  const ville = await db.ville.findUnique({
    where: { id: villeArriveeId },
    select: {
      villeTransitId: true,
      pointsRetrait: { where: { actif: true }, select: { id: true }, take: 1 },
    },
  })
  if (!ville) return { ok: false, message: 'Cette ville n’existe plus.' }

  const client = clientId
    ? await db.client.findUnique({
        where: { id: clientId },
        select: { prenom: true, nom: true, numeroClient: true },
      })
    : null

  // Mode A : paiement à l'arrivée. Modes B et C : paiement au départ.
  const momentPaiement = modeReception === 'COMMANDE_EN_LIGNE' ? 'ARRIVEE' : 'DEPART'

  let code: string
  try {
    code = await db.$transaction(async (tx) => {
      const codeSuivi = await prochainNumero(tx, 'COLIS')
      const colis = await tx.colis.create({
        data: {
          codeSuivi,
          clientId: clientId || null,
          modeReception: modeReception as never,
          momentPaiement,
          expediteurNom,
          destinataireNom: client
            ? `${client.prenom} ${client.nom}`
            : destinataireNom || 'Non identifié',
          villeArriveeId,
          pointRetraitId: ville.pointsRetrait[0]?.id ?? null,
          // Le passage par le hub est déduit de la ville de destination.
          necessiteReacheminement: ville.villeTransitId !== null,
          poidsReel: poids !== null ? String(poids) : null,
          contenu,
          statut: 'RECU',
          statutPaiement: momentPaiement === 'ARRIVEE' ? 'A_PAYER_ARRIVEE' : 'A_PAYER_DEPART',
        },
        select: { id: true, codeSuivi: true },
      })
      await journaliser(
        tx,
        colis.id,
        'RECU',
        session.utilisateur.id,
        anonyme ? 'Reçu sans identifiant client' : undefined,
      )
      return colis.codeSuivi
    })
  } catch (erreur) {
    console.error('[colis] enregistrement impossible :', erreur)
    return { ok: false, message: 'L’enregistrement a échoué. Réessayez.' }
  }

  revalidatePath('/admin/colis')
  revalidatePath('/admin/receptions')
  revalidatePath('/admin')
  return { ok: true, message: `Colis ${code} enregistré.` }
}
