'use client'

import { useActionState, useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { Reponse } from '../actions-colis'
import { changerStatutDepart, creerDepart } from './actions-departs'

export function CreationDepart({
  liaisons,
}: {
  liaisons: Array<{ id: string; etiquette: string }>
}) {
  const [etat, action, enCours] = useActionState<Reponse | null, FormData>(creerDepart, null)
  const [ouvert, setOuvert] = useState(false)

  if (!ouvert) {
    return (
      <div className="flex items-center gap-3">
        <Button onClick={() => setOuvert(true)} size="sm">
          Créer un départ
        </Button>
        {etat?.ok ? (
          <span className="text-body-sm text-success font-semibold">{etat.message}</span>
        ) : null}
      </div>
    )
  }

  return (
    <form action={action} className="border-line rounded-lg border bg-white p-5">
      <h2 className="text-h3 mb-4">Créer un départ</h2>
      {etat ? (
        <Alert tone={etat.ok ? 'info' : 'warn'} className="mb-4">
          {etat.message}
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-3">
          <label htmlFor="liaisonId" className="text-caption text-navy mb-1 block font-semibold">
            Liaison
          </label>
          <select
            id="liaisonId"
            name="liaisonId"
            required
            className="border-line-strong text-body-sm focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
          >
            <option value="">Choisir une liaison</option>
            {liaisons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.etiquette}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="dateClotureDepot"
            className="text-caption text-navy mb-1 block font-semibold"
          >
            Clôture des dépôts
          </label>
          <input
            id="dateClotureDepot"
            name="dateClotureDepot"
            type="date"
            required
            className="border-line-strong text-body focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="dateDepart" className="text-caption text-navy mb-1 block font-semibold">
            Date de départ
          </label>
          <input
            id="dateDepart"
            name="dateDepart"
            type="date"
            required
            className="border-line-strong text-body focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" size="sm" disabled={enCours}>
            {enCours ? 'Création…' : 'Créer'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setOuvert(false)}>
            Annuler
          </Button>
        </div>
      </div>
    </form>
  )
}

const SUITE: Record<string, Array<[string, string]>> = {
  PLANIFIE: [['DEPOTS_OUVERTS', 'Ouvrir les dépôts']],
  DEPOTS_OUVERTS: [
    ['CLOTURE_DEPOTS', 'Clore les dépôts'],
    ['COMPLET', 'Marquer complet'],
  ],
  CLOTURE_DEPOTS: [['PARTI', 'Marquer parti']],
  COMPLET: [['PARTI', 'Marquer parti']],
  PARTI: [['ARRIVE', 'Marquer arrivé']],
}

/**
 * Une seule action proposée à la fois, celle qui suit dans le cycle.
 * Un départ ne revient pas en arrière : proposer tous les statuts
 * inviterait à des erreurs de manipulation.
 */
export function StatutDepart({ departId, statut }: { departId: string; statut: string }) {
  const [etat, action, enCours] = useActionState<Reponse | null, FormData>(
    changerStatutDepart,
    null,
  )
  const suites = SUITE[statut] ?? []
  if (suites.length === 0) return null

  return (
    <form action={action} className="flex flex-wrap gap-1.5">
      <input type="hidden" name="departId" value={departId} />
      {suites.map(([valeur, libelle]) => (
        <button
          key={valeur}
          type="submit"
          name="statut"
          value={valeur}
          disabled={enCours}
          className="border-line-strong text-caption text-navy hover:bg-sand min-h-11 rounded-md border px-2.5 font-semibold"
        >
          {libelle}
        </button>
      ))}
      {etat && !etat.ok ? (
        <span className="text-caption text-error block w-full">{etat.message}</span>
      ) : null}
    </form>
  )
}
