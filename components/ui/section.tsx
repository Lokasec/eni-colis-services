import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Container } from './container'

/**
 * Section de page.
 *
 * `tone` pose `data-tone`, qui bascule la couleur des cartes qu'elle
 * contient (voir la règle d'alternance dans app/globals.css).
 *
 * Rappel de charte : le BLANC est la dominante, le SABLE vient en
 * respiration une section sur deux. Le NAVY est réservé aux blocs
 * pleine largeur (tableau des départs, bloc expédition, bande CTA).
 */
const tones = {
  white: 'bg-white',
  sand: 'bg-sand',
  navy: 'bg-navy text-on-navy',
} as const

export type SectionTone = keyof typeof tones

export function Section({
  tone = 'white',
  id,
  className,
  containerClassName,
  children,
}: {
  tone?: SectionTone
  id?: string
  className?: string
  containerClassName?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      data-tone={tone}
      className={cn('py-[var(--section-y)]', tones[tone], className)}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  )
}
