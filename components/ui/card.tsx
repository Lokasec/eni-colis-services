import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Carte.
 *
 * Par défaut la couleur de fond suit l'alternance définie dans
 * app/globals.css : sable dans une section blanche, blanche dans une
 * section sable. `surface="plain"` force le blanc (formulaires, encarts
 * de saisie), `surface="deep"` prend la variante soutenue.
 */
const surfaces = {
  auto: 'bg-[var(--surface-card)]',
  plain: 'bg-white',
  deep: 'bg-[var(--surface-card-deep)]',
} as const

export function Card({
  surface = 'auto',
  className,
  children,
}: {
  surface?: keyof typeof surfaces
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('border-line rounded-lg border p-6 md:p-8', surfaces[surface], className)}>
      {children}
    </div>
  )
}
