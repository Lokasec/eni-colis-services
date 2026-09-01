import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Pastille de statut — les huit variantes de design/tokens.json §color.status.
 *
 * Les avant-plans ont été assombris par rapport à la maquette pour passer
 * WCAG AA en petit corps : une pastille se lit en 11-13 px, elle relève
 * du texte normal (4,5), pas du gros texte.
 */
const tones = {
  devisNouveau: 'bg-status-devis-nouveau-bg text-status-devis-nouveau-fg',
  devisChiffre: 'bg-status-devis-chiffre-bg text-status-devis-chiffre-fg',
  enTransit: 'bg-status-en-transit-bg text-status-en-transit-fg',
  arrive: 'bg-status-arrive-bg text-status-arrive-fg',
  disponible: 'bg-status-disponible-bg text-status-disponible-fg',
  retire: 'bg-status-retire-bg text-status-retire-fg',
  litige: 'bg-status-litige-bg text-status-litige-fg',
  complet: 'bg-status-complet-bg text-status-complet-fg',
} as const

export type BadgeTone = keyof typeof tones

export function Badge({
  tone = 'devisNouveau',
  className,
  children,
}: {
  tone?: BadgeTone
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'rounded-pill inline-block px-2.5 py-1 text-[0.6875rem] font-bold tracking-[0.04em] uppercase',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
