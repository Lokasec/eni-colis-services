'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import { STATUTS_COLIS, statutsColis, type StatutColis } from '@/lib/statuts'

/**
 * Changement de statut d'un colis.
 *
 * La pastille reste affichée à côté du sélecteur : debout, à bout de
 * bras, la couleur se lit avant le texte.
 *
 * EN_REACHEMINEMENT figure ici — c'est un statut d'exploitation — mais
 * il est marqué « interne » et ne doit jamais franchir l'API publique.
 */
export function StatusSelect({
  id,
  valeur,
  onChange,
  disabled,
  className,
}: {
  id: string
  valeur: StatutColis
  onChange?: (statut: StatutColis) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Badge tone={statutsColis[valeur].tone}>{statutsColis[valeur].label}</Badge>
      <label htmlFor={id} className="sr-only">
        Statut du colis
      </label>
      <select
        id={id}
        value={valeur}
        disabled={disabled}
        onChange={(event) => onChange?.(event.currentTarget.value as StatutColis)}
        className="border-line-strong text-body-sm text-ink focus:border-orange min-h-11 rounded-md border-2 bg-white px-3 focus:outline-none"
      >
        {STATUTS_COLIS.map((statut) => (
          <option key={statut} value={statut}>
            {statutsColis[statut].label}
            {statutsColis[statut].interne ? ' (interne)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
