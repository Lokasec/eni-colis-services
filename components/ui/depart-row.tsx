import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Ligne du « tableau d'embarquement » — la signature visuelle de
 * l'accueil. Fond navy, prix en orange.
 *
 * C'est l'un des rares blocs pleine largeur autorisés en navy
 * (design/tokens.json §rules.dominante).
 */
export function DepartBoard({
  title = 'Prochains départs',
  live,
  children,
  footer,
  className,
}: {
  title?: string
  live?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  return (
    <div
      data-tone="navy"
      className={cn('bg-navy text-on-navy overflow-hidden rounded-lg shadow-lg', className)}
    >
      <div className="bg-navy-dark flex items-center justify-between gap-3 px-5 py-4.5">
        <h2 className="text-eyebrow text-on-navy tracking-[0.12em] uppercase">{title}</h2>
        {live ? (
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/72">
            <span className="bg-orange size-[7px] rounded-full" aria-hidden />
            {live}
          </span>
        ) : null}
      </div>
      {children}
      {footer ? (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 px-5 py-4">
          {footer}
        </div>
      ) : null}
    </div>
  )
}

export function DepartRow({
  destination,
  meta,
  prixParKg,
  statut,
}: {
  destination: string
  meta: ReactNode
  prixParKg: number
  statut?: ReactNode
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3.5 gap-y-1.5 border-b border-white/10 px-5 py-4 last:border-b-0">
      <div className="text-[1.0625rem] font-bold tracking-[-0.01em]">{destination}</div>
      <div className="text-caption col-start-1 font-medium text-white/65">{meta}</div>
      <div className="row-span-2 row-start-1 text-right">
        <div className="text-orange text-[1.0625rem] leading-tight font-extrabold">
          {prixParKg} €
        </div>
        <div className="text-xs font-medium text-white/60">par kilo</div>
        {statut ? <div className="mt-1.5">{statut}</div> : null}
      </div>
    </div>
  )
}
