'use client'

import { useActionState, useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { saisirEncaissement, type Reponse } from '../actions-facturation'

type FactureARegler = { id: string; etiquette: string; devise: string; resteDu: string }

/**
 * Saisie d'un règlement.
 *
 * Le montant est prérempli avec le reste dû : dans l'immense majorité des
 * cas, le client règle la totalité au retrait. Le lieu par défaut est
 * Abidjan quand la facture est en devise locale — c'est là qu'on encaisse
 * ces règlements.
 */
export function SaisieEncaissement({ factures }: { factures: FactureARegler[] }) {
  const [etat, action, enCours] = useActionState<Reponse | null, FormData>(saisirEncaissement, null)
  const [documentId, setDocumentId] = useState('')

  const choisie = factures.find((f) => f.id === documentId)

  return (
    <form action={action} className="border-line rounded-lg border bg-white p-5">
      <h2 className="text-h3 mb-4">Saisir un encaissement</h2>

      {etat ? (
        <Alert tone={etat.ok ? 'info' : 'warn'} className="mb-4">
          {etat.message}
        </Alert>
      ) : null}

      {factures.length === 0 ? (
        <p className="text-body-sm text-ink-soft">
          Aucune facture en attente de règlement. Toutes les factures émises sont soldées.
        </p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor="documentId"
                className="text-caption text-navy mb-1 block font-semibold"
              >
                Facture
              </label>
              <select
                id="documentId"
                name="documentId"
                required
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                className="border-line-strong text-body-sm focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
              >
                <option value="">Choisir une facture</option>
                {factures.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.etiquette}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="montant" className="text-caption text-navy mb-1 block font-semibold">
                Montant encaissé {choisie ? `(${choisie.devise})` : ''}
              </label>
              <input
                id="montant"
                name="montant"
                type="text"
                inputMode="decimal"
                required
                key={documentId}
                defaultValue={choisie?.resteDu ?? ''}
                className="border-line-strong text-body text-navy focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 font-bold focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="lieu" className="text-caption text-navy mb-1 block font-semibold">
                Lieu d&apos;encaissement
              </label>
              <select
                id="lieu"
                name="lieu"
                key={`lieu-${documentId}`}
                defaultValue={choisie && choisie.devise !== 'EUR' ? 'ABIDJAN' : 'FRANCE'}
                className="border-line-strong text-body-sm focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
              >
                <option value="FRANCE">France — bureau de Rouen</option>
                <option value="ABIDJAN">Abidjan — magasin</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            <div>
              <label htmlFor="moyen" className="text-caption text-navy mb-1 block font-semibold">
                Moyen de paiement
              </label>
              <select
                id="moyen"
                name="moyen"
                className="border-line-strong text-body-sm focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
              >
                <option value="ESPECES">Espèces</option>
                <option value="MOBILE_MONEY">Mobile money</option>
                <option value="VIREMENT">Virement</option>
                <option value="CARTE">Carte</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="reference"
                className="text-caption text-navy mb-1 block font-semibold"
              >
                Référence
              </label>
              <input
                id="reference"
                name="reference"
                type="text"
                placeholder="Facultatif — n° de transaction"
                className="border-line-strong text-body-sm focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-5">
            <Button type="submit" disabled={enCours}>
              {enCours ? 'Enregistrement…' : 'Enregistrer l’encaissement'}
            </Button>
          </div>
        </>
      )}
    </form>
  )
}
