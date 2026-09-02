'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { enregistrerColis, type Reponse } from '../../actions-colis'

/**
 * Saisie d'un colis au comptoir.
 *
 * Objectif : moins de soixante secondes, debout, une main sur le carton
 * (CLAUDE.md §9). D'où l'ordre des champs — mode, destination, poids —
 * et des cibles de saisie hautes.
 *
 * Le mode de réception commande le reste : en « commande en ligne », le
 * client peut rester vide et le colis part dans la file des réceptions.
 */
export function FormulaireColis({
  villes,
  clients,
}: {
  villes: Array<{ id: string; etiquette: string; viaHub: string | null }>
  clients: Array<{ id: string; etiquette: string }>
}) {
  const [etat, action, enCours] = useActionState<Reponse | null, FormData>(enregistrerColis, null)
  const [mode, setMode] = useState('DEPOT')
  const [villeId, setVilleId] = useState('')

  const ville = villes.find((v) => v.id === villeId)
  const commandeEnLigne = mode === 'COMMANDE_EN_LIGNE'

  return (
    <form action={action} className="border-line space-y-4 rounded-lg border bg-white p-5 md:p-6">
      {etat ? (
        <Alert tone={etat.ok ? 'info' : 'warn'} className="mb-2">
          {etat.message}
          {etat.ok ? (
            <>
              {' '}
              <Link href="/admin/colis/nouveau" className="text-navy font-semibold underline">
                En enregistrer un autre
              </Link>
            </>
          ) : null}
        </Alert>
      ) : null}

      <div>
        <span className="text-caption text-navy mb-2 block font-semibold">Mode de réception</span>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ['DEPOT', 'Dépôt au bureau'],
            ['EXPEDITION', 'Reçu par transporteur'],
            ['COMMANDE_EN_LIGNE', 'Commande en ligne'],
          ].map(([valeur, libelle]) => (
            <label key={valeur} className="relative block cursor-pointer">
              <input
                type="radio"
                name="modeReception"
                value={valeur}
                defaultChecked={valeur === 'DEPOT'}
                onChange={() => setMode(valeur!)}
                className="peer absolute size-0 opacity-0"
              />
              <span className="border-line-strong peer-checked:border-orange peer-checked:bg-sand text-body-sm text-navy block min-h-12 rounded-md border-2 px-3 py-3 font-semibold">
                {libelle}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="villeArriveeId" className="text-caption text-navy mb-1 block font-semibold">
          Ville de destination
        </label>
        <select
          id="villeArriveeId"
          name="villeArriveeId"
          required
          value={villeId}
          onChange={(e) => setVilleId(e.target.value)}
          className="border-line-strong text-body focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
        >
          <option value="">Choisir une ville</option>
          {villes.map((v) => (
            <option key={v.id} value={v.id}>
              {v.etiquette}
            </option>
          ))}
        </select>
        {ville?.viaHub ? (
          <p className="text-caption text-muted mt-1">
            Acheminement interne via {ville.viaHub} — le colis sera marqué à réacheminer.
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="clientId" className="text-caption text-navy mb-1 block font-semibold">
          Client {commandeEnLigne ? '(facultatif)' : ''}
        </label>
        <select
          id="clientId"
          name="clientId"
          className="border-line-strong text-body-sm focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
        >
          <option value="">{commandeEnLigne ? 'Non identifié pour l’instant' : 'Aucun'}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.etiquette}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="destinataireNom"
            className="text-caption text-navy mb-1 block font-semibold"
          >
            Destinataire {commandeEnLigne ? '(facultatif)' : ''}
          </label>
          <input
            id="destinataireNom"
            name="destinataireNom"
            type="text"
            autoComplete="off"
            className="border-line-strong text-body focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="expediteurNom"
            className="text-caption text-navy mb-1 block font-semibold"
          >
            Expéditeur
          </label>
          <input
            id="expediteurNom"
            name="expediteurNom"
            type="text"
            autoComplete="off"
            className="border-line-strong text-body focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="poidsReel" className="text-caption text-navy mb-1 block font-semibold">
            Poids réel (kg)
          </label>
          <input
            id="poidsReel"
            name="poidsReel"
            type="text"
            inputMode="decimal"
            placeholder="12,5"
            className="border-line-strong text-body focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="contenu" className="text-caption text-navy mb-1 block font-semibold">
            Contenu
          </label>
          <input
            id="contenu"
            name="contenu"
            type="text"
            placeholder="Vêtements, produits d’hygiène…"
            className="border-line-strong text-body focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
          />
        </div>
      </div>

      <Button type="submit" block disabled={enCours}>
        {enCours ? 'Enregistrement…' : 'Enregistrer le colis'}
      </Button>
    </form>
  )
}
