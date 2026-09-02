'use client'

import { useActionState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { STATUTS_COLIS, statutsColis, type StatutColis } from '@/lib/statuts'
import { affecterAuDepart, changerStatut, peserColis, type Reponse } from '../../actions-colis'

/**
 * Panneau d'exploitation d'un colis.
 *
 * Trois gestes, trois formulaires distincts : peser, changer de statut,
 * affecter à un départ. Séparés volontairement — l'opératrice fait un geste
 * à la fois, souvent d'une seule main.
 */
export function PanneauExploitation({
  colisId,
  statut,
  departId,
  poidsReel,
  departs,
}: {
  colisId: string
  statut: StatutColis
  departId: string
  poidsReel: string
  departs: Array<{ id: string; etiquette: string }>
}) {
  return (
    <aside className="space-y-4">
      <Bloc titre="Peser">
        <FormulairePesee colisId={colisId} poidsReel={poidsReel} />
      </Bloc>

      <Bloc titre="Changer le statut">
        <FormulaireStatut colisId={colisId} statut={statut} />
      </Bloc>

      <Bloc titre="Affecter à un départ">
        <FormulaireDepart colisId={colisId} departId={departId} departs={departs} />
      </Bloc>
    </aside>
  )
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="border-line rounded-lg border bg-white p-5">
      <h2 className="text-caption text-muted mb-3 font-bold tracking-[0.09em] uppercase">
        {titre}
      </h2>
      {children}
    </section>
  )
}

function Retour({ etat }: { etat: Reponse | null }) {
  if (!etat) return null
  return (
    <Alert tone={etat.ok ? 'info' : 'warn'} className="mb-3">
      {etat.message}
    </Alert>
  )
}

function FormulairePesee({ colisId, poidsReel }: { colisId: string; poidsReel: string }) {
  const [etat, action, enCours] = useActionState<Reponse | null, FormData>(peserColis, null)
  return (
    <form action={action}>
      <Retour etat={etat} />
      <input type="hidden" name="colisId" value={colisId} />
      <label htmlFor="poids" className="text-caption text-navy mb-1 block font-semibold">
        Poids réel (kg)
      </label>
      <input
        id="poids"
        name="poidsReel"
        type="text"
        inputMode="decimal"
        defaultValue={poidsReel}
        placeholder="12,5"
        className="border-line-strong text-body focus:border-orange mb-3 min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
      />
      <Button type="submit" block size="sm" disabled={enCours}>
        {enCours ? 'Enregistrement…' : 'Enregistrer le poids'}
      </Button>
    </form>
  )
}

function FormulaireStatut({ colisId, statut }: { colisId: string; statut: StatutColis }) {
  const [etat, action, enCours] = useActionState<Reponse | null, FormData>(changerStatut, null)
  return (
    <form action={action}>
      <Retour etat={etat} />
      <input type="hidden" name="colisId" value={colisId} />
      <label htmlFor="statut" className="text-caption text-navy mb-1 block font-semibold">
        Nouveau statut
      </label>
      <select
        id="statut"
        name="statut"
        defaultValue={statut}
        className="border-line-strong text-body focus:border-orange mb-3 min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
      >
        {STATUTS_COLIS.map((s) => (
          <option key={s} value={s}>
            {statutsColis[s].label}
            {statutsColis[s].interne ? ' (interne)' : ''}
          </option>
        ))}
      </select>
      <label htmlFor="commentaire" className="text-caption text-navy mb-1 block font-semibold">
        Commentaire
      </label>
      <input
        id="commentaire"
        name="commentaire"
        type="text"
        placeholder="Facultatif — figure dans l’historique"
        className="border-line-strong text-body-sm focus:border-orange mb-3 min-h-11 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
      />
      <Button type="submit" block size="sm" disabled={enCours}>
        {enCours ? 'Mise à jour…' : 'Changer le statut'}
      </Button>
    </form>
  )
}

function FormulaireDepart({
  colisId,
  departId,
  departs,
}: {
  colisId: string
  departId: string
  departs: Array<{ id: string; etiquette: string }>
}) {
  const [etat, action, enCours] = useActionState<Reponse | null, FormData>(affecterAuDepart, null)
  return (
    <form action={action}>
      <Retour etat={etat} />
      <input type="hidden" name="colisId" value={colisId} />
      <label htmlFor="departId" className="text-caption text-navy mb-1 block font-semibold">
        Départ
      </label>
      <select
        id="departId"
        name="departId"
        defaultValue={departId}
        className="border-line-strong text-body-sm focus:border-orange mb-3 min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
      >
        <option value="">Aucun départ</option>
        {departs.map((depart) => (
          <option key={depart.id} value={depart.id}>
            {depart.etiquette}
          </option>
        ))}
      </select>
      <Button type="submit" block size="sm" variant="outline" disabled={enCours}>
        {enCours ? 'Affectation…' : 'Affecter'}
      </Button>
    </form>
  )
}
