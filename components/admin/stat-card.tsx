import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Tuile du tableau de bord.
 *
 * `alerte` met la tuile en évidence : réservé aux compteurs qui exigent
 * une action du jour — colis reçus non rattachés, créances.
 */
export function StatCard({
  label,
  valeur,
  detail,
  href,
  alerte = false,
  className,
}: {
  label: ReactNode
  valeur: ReactNode
  detail?: ReactNode
  href?: string
  alerte?: boolean
  className?: string
}) {
  const contenu = (
    <>
      <span className="text-caption text-muted block font-bold tracking-[0.08em] uppercase">
        {label}
      </span>
      <span
        className={cn(
          'mt-2 block text-[2rem] leading-none font-extrabold',
          alerte ? 'text-orange-text' : 'text-navy',
        )}
      >
        {valeur}
      </span>
      {detail ? <span className="text-caption text-ink-soft mt-2 block">{detail}</span> : null}
    </>
  )

  const classes = cn(
    'block rounded-lg border p-5 no-underline transition duration-base ease-brand',
    alerte ? 'border-orange bg-sand' : 'border-line bg-white',
    href && 'hover:border-orange hover:shadow-md',
    className,
  )

  return href ? (
    <Link href={href} className={classes}>
      {contenu}
    </Link>
  ) : (
    <div className={classes}>{contenu}</div>
  )
}
