'use client'

import { useActionState, useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { emettreFacture, type Reponse } from '../actions-facturation'

type ColisFacturable = {
  id: string
  etiquette: string
  paiementArrivee: boolean
  devisePays: string
}

/**
 * Émission d'une facture.
 *
 * La double devise n'est proposée que sur les colis payés À L'ARRIVÉE : une
 * facture réglée au comptoir de Rouen n'a pas à porter un montant en FCFA.
 * Elle est cochée par défaut dans ce cas, parce que c'est la situation
 * normale du mode A.
 */
export function EmissionFacture({ colis }: { colis: ColisFacturable[] }) {
  const [etat, action, enCours] = useActionState<Reponse | null, FormData>(emettreFacture, null)
  const [colisId, setColisId] = useState('')

  const choisi = colis.find((c) => c.id === colisId)

  return (
    <form action={action} className="border-line rounded-lg border bg-white p-5">
      <h2 className="text-h3 mb-4">Émettre une facture</h2>

      {etat ? (
        <Alert tone={etat.ok ? 'info' : 'warn'} className="mb-4">
          {etat.message}
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="colisId" className="text-caption text-navy mb-1 block font-semibold">
            Colis à facturer
          </label>
          <select
            id="colisId"
            name="colisId"
            required
            value={colisId}
            onChange={(e) => setColisId(e.target.value)}
            className="border-line-strong text-body-sm focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
          >
            <option value="">Choisir un colis non facturé</option>
            {colis.map((c) => (
              <option key={c.id} value={c.id}>
                {c.etiquette}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="montantEur" className="text-caption text-navy mb-1 block font-semibold">
            Montant (€)
          </label>
          <input
            id="montantEur"
            name="montantEur"
            type="text"
            inputMode="decimal"
            required
            placeholder="195,00"
            className="border-line-strong text-body text-navy focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 font-bold focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="detail" className="text-caption text-navy mb-1 block font-semibold">
            Détail imprimé
          </label>
          <input
            id="detail"
            name="detail"
            type="text"
            placeholder="13 kg × 15,00 €/kg — France → Abidjan"
            className="border-line-strong text-body-sm focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
          />
        </div>
      </div>

      {choisi?.paiementArrivee ? (
        <label className="text-body-sm text-ink-soft mt-4 flex items-start gap-3">
          <input
            type="checkbox"
            name="doubleDevise"
            defaultChecked
            className="accent-orange mt-0.5 size-5 flex-none"
          />
          <span>
            Émettre en <b className="text-navy">euros et en {choisi.devisePays}</b>. Le taux du jour
            sera figé sur la facture : il ne sera jamais recalculé à l&apos;encaissement, même si la
            parité change.
          </span>
        </label>
      ) : choisi ? (
        <p className="text-caption text-muted mt-4">
          Ce colis est réglé au départ : la facture est établie en euros uniquement.
        </p>
      ) : null}

      <div className="mt-5">
        <Button type="submit" disabled={enCours}>
          {enCours ? 'Émission…' : 'Émettre la facture'}
        </Button>
      </div>
    </form>
  )
}
