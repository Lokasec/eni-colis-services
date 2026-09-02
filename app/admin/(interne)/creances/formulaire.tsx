'use client'

import { useActionState } from 'react'
import { relancerCreance, type Reponse } from '../actions-facturation'

export function BoutonRelance({ documentId }: { documentId: string }) {
  const [etat, action, enCours] = useActionState<Reponse | null, FormData>(relancerCreance, null)

  if (etat?.ok) {
    return <span className="text-caption text-success font-semibold">Relancé</span>
  }

  return (
    <form action={action}>
      <input type="hidden" name="documentId" value={documentId} />
      <button
        type="submit"
        disabled={enCours}
        className="border-line-strong text-caption text-navy hover:bg-sand min-h-11 rounded-md border px-3 font-semibold"
      >
        {enCours ? 'Envoi…' : 'Relancer'}
      </button>
      {etat && !etat.ok ? (
        <span className="text-caption text-error mt-1 block">{etat.message}</span>
      ) : null}
    </form>
  )
}
