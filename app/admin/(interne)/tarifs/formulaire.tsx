'use client'

import { useActionState } from 'react'
import { majTauxChange, type Reponse } from '../actions-facturation'

export function SaisieTaux({ paysId, valeur }: { paysId: string; valeur: string }) {
  const [etat, action, enCours] = useActionState<Reponse | null, FormData>(majTauxChange, null)

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="paysId" value={paysId} />
      <label htmlFor={`taux-${paysId}`} className="sr-only">
        Taux de change
      </label>
      <input
        id={`taux-${paysId}`}
        name="tauxManuel"
        type="text"
        inputMode="decimal"
        defaultValue={valeur}
        placeholder="0,92"
        className="border-line-strong text-body-sm focus:border-orange min-h-11 w-24 rounded-md border-2 bg-white px-2 focus:outline-none"
      />
      <button
        type="submit"
        disabled={enCours}
        className="border-line-strong text-caption text-navy hover:bg-sand min-h-11 rounded-md border px-3 font-semibold"
      >
        {enCours ? '…' : 'Saisir'}
      </button>
      {etat ? (
        <span
          className={`text-caption block ${etat.ok ? 'text-success' : 'text-error'}`}
          role="status"
        >
          {etat.ok ? 'Enregistré' : etat.message}
        </span>
      ) : null}
    </form>
  )
}
