'use client'

import { useActionState, useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { chiffrerDevis, envoyerDevis, type Reponse } from '../../actions-facturation'

/**
 * Panneau de chiffrage.
 *
 * Le montant proposé par le moteur est PRÉREMPLI, pas imposé : la cliente
 * examine l'article sur les photos et ajuste. Un bouton remet la
 * suggestion, pour revenir en arrière sans retaper.
 *
 * L'électronique n'a pas de suggestion — elle se tarife à l'unité, après
 * examen. Le moteur le dit explicitement plutôt que d'inventer un chiffre.
 */
export function PanneauChiffrage({
  demandeId,
  documentId,
  suggestion,
  refus,
  montantExistant,
}: {
  demandeId: string
  documentId: string | null
  suggestion: { montant: string; detail: string } | null
  refus: string | null
  montantExistant: string
}) {
  const [etat, action, enCours] = useActionState<Reponse | null, FormData>(chiffrerDevis, null)
  const [montant, setMontant] = useState(montantExistant || suggestion?.montant || '')
  const [detail, setDetail] = useState(suggestion?.detail ?? '')

  return (
    <>
      <section className="border-line rounded-lg border bg-white p-5">
        <h2 className="text-h3 mb-3">Chiffrer</h2>

        {suggestion ? (
          <div className="bg-sand mb-4 rounded-md p-4">
            <p className="text-caption text-muted mb-1 font-bold tracking-[0.08em] uppercase">
              Suggestion du calcul
            </p>
            <p className="text-navy text-xl font-extrabold">
              {suggestion.montant.replace('.', ',')} €
            </p>
            <p className="text-caption text-ink-soft mt-1">{suggestion.detail}</p>
            <button
              type="button"
              onClick={() => {
                setMontant(suggestion.montant)
                setDetail(suggestion.detail)
              }}
              className="text-caption text-orange-text mt-2 min-h-11 font-semibold underline"
            >
              Reprendre cette suggestion
            </button>
          </div>
        ) : (
          <Alert tone="warn" className="mb-4">
            <b>Pas de calcul automatique.</b> {refus}
          </Alert>
        )}

        <form action={action}>
          {etat ? (
            <Alert tone={etat.ok ? 'info' : 'warn'} className="mb-3">
              {etat.message}
            </Alert>
          ) : null}

          <input type="hidden" name="demandeId" value={demandeId} />

          <label htmlFor="montantEur" className="text-caption text-navy mb-1 block font-semibold">
            Montant retenu (€)
          </label>
          <input
            id="montantEur"
            name="montantEur"
            type="text"
            inputMode="decimal"
            required
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="187,50"
            className="border-line-strong text-h3 text-navy focus:border-orange mb-3 min-h-14 w-full rounded-md border-2 bg-white px-3 font-extrabold focus:outline-none"
          />

          <label htmlFor="detail" className="text-caption text-navy mb-1 block font-semibold">
            Détail imprimé sur le devis
          </label>
          <input
            id="detail"
            name="detail"
            type="text"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="13 kg × 15,00 €/kg — France → Cotonou"
            className="border-line-strong text-body-sm focus:border-orange mb-4 min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
          />

          <Button type="submit" block disabled={enCours}>
            {enCours ? 'Enregistrement…' : documentId ? 'Réémettre le devis' : 'Établir le devis'}
          </Button>

          <p className="text-caption text-muted mt-3">
            Le devis portera la mention « TVA non applicable, art. 293 B du CGI » et sera valable
            sept jours.
          </p>
        </form>
      </section>

      {documentId ? <PanneauEnvoi documentId={documentId} /> : null}
    </>
  )
}

function PanneauEnvoi({ documentId }: { documentId: string }) {
  const [etat, action, enCours] = useActionState<Reponse | null, FormData>(envoyerDevis, null)
  return (
    <section className="border-line rounded-lg border bg-white p-5">
      <h2 className="text-h3 mb-3">Envoyer au client</h2>
      <form action={action}>
        {etat ? (
          <Alert tone={etat.ok ? 'info' : 'warn'} className="mb-3">
            {etat.message}
          </Alert>
        ) : null}
        <input type="hidden" name="documentId" value={documentId} />
        <Button type="submit" block variant="outline" disabled={enCours}>
          {enCours ? 'Envoi…' : 'Envoyer le devis par e-mail'}
        </Button>
      </form>
    </section>
  )
}
