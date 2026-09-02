'use server'

import { revalidatePath } from 'next/cache'
import { exigerConnexionAction } from '@/lib/autorisation'
import { db } from '@/lib/db'
import { prochainNumero } from '@/lib/numerotation'
import type { Reponse } from '../actions-colis'

/** Crée un départ sur une liaison. La référence est attribuée en transaction. */
export async function creerDepart(_precedent: Reponse | null, donnees: FormData): Promise<Reponse> {
  const session = await exigerConnexionAction()
  if (!session.ok) return session

  const liaisonId = String(donnees.get('liaisonId') ?? '')
  const dateDepart = String(donnees.get('dateDepart') ?? '')
  const dateClotureDepot = String(donnees.get('dateClotureDepot') ?? '')

  if (!liaisonId || !dateDepart || !dateClotureDepot) {
    return { ok: false, message: 'Liaison, date de départ et date de clôture sont obligatoires.' }
  }

  const depart = new Date(dateDepart)
  const cloture = new Date(dateClotureDepot)
  if (Number.isNaN(depart.getTime()) || Number.isNaN(cloture.getTime())) {
    return { ok: false, message: 'Dates illisibles.' }
  }
  if (cloture > depart) {
    // Une clôture postérieure au départ laisserait accepter des colis qui
    // ne peuvent plus embarquer.
    return { ok: false, message: 'La clôture des dépôts doit précéder le départ.' }
  }

  let reference: string
  try {
    reference = await db.$transaction(async (tx) => {
      const numero = await prochainNumero(tx, 'DEPART')
      await tx.depart.create({
        data: {
          reference: numero,
          liaisonId,
          dateDepart: depart,
          dateClotureDepot: cloture,
          statut: 'DEPOTS_OUVERTS',
        },
      })
      return numero
    })
  } catch (erreur) {
    console.error('[depart] création impossible :', erreur)
    return { ok: false, message: 'La création du départ a échoué.' }
  }

  revalidatePath('/admin/departs')
  revalidatePath('/departs')
  return { ok: true, message: `Départ ${reference} créé.` }
}

/**
 * Change le statut d'un départ.
 *
 * Au passage en PARTI, tous les colis affectés basculent en EXPEDIE, avec
 * leur date de départ effectif et une ligne d'historique chacun : c'est
 * cette date qui fait courir l'ancienneté des créances.
 */
export async function changerStatutDepart(
  _precedent: Reponse | null,
  donnees: FormData,
): Promise<Reponse> {
  const session = await exigerConnexionAction()
  if (!session.ok) return session

  const departId = String(donnees.get('departId') ?? '')
  const statut = String(donnees.get('statut') ?? '')
  if (!departId || !statut) return { ok: false, message: 'Départ ou statut manquant.' }

  try {
    await db.$transaction(async (tx) => {
      await tx.depart.update({ where: { id: departId }, data: { statut: statut as never } })

      if (statut === 'PARTI') {
        const colis = await tx.colis.findMany({
          where: { departId },
          select: { id: true, necessiteReacheminement: true },
        })
        const maintenant = new Date()
        for (const item of colis) {
          await tx.colis.update({
            where: { id: item.id },
            data: { statut: 'EXPEDIE', dateDepartEffectif: maintenant },
          })
          await tx.historiqueStatut.create({
            data: {
              colisId: item.id,
              statut: 'EXPEDIE',
              auteurId: session.utilisateur.id,
              commentaire: 'Départ effectué',
            },
          })
        }
      }
    })
  } catch (erreur) {
    console.error('[depart] changement de statut impossible :', erreur)
    return { ok: false, message: 'Le changement de statut a échoué.' }
  }

  revalidatePath('/admin/departs')
  revalidatePath('/admin/colis')
  revalidatePath('/departs')
  return { ok: true, message: 'Départ mis à jour.' }
}
