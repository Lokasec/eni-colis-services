import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Marqueur d'information manquante.
 *
 * Les contenus non fournis par la cliente restent VISIBLES et signalés,
 * jamais inventés ni masqués (CLAUDE.md §16). Ce composant les rend
 * repérables d'un coup d'œil à la relecture, et son libellé se retrouve
 * par une simple recherche dans le HTML rendu avant mise en ligne.
 */
export function Todo({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <span
      data-a-completer
      className={cn(
        'bg-status-en-transit-bg inline-block rounded-sm px-2.5 py-0.5',
        'text-caption text-status-en-transit-fg font-bold',
        className,
      )}
    >
      {children ?? 'À COMPLÉTER'}
    </span>
  )
}
