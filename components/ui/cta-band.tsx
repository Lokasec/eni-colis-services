import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Bande d'appel à l'action navy (.cta) — bloc pleine largeur autorisé. */
export function CtaBand({
  titre,
  texte,
  actions,
  className,
}: {
  titre: ReactNode
  texte?: ReactNode
  actions: ReactNode
  className?: string
}) {
  return (
    <div
      data-tone="navy"
      className={cn('bg-navy rounded-xl px-6 py-11 text-center md:px-12 md:py-15', className)}
    >
      <h2 className="text-h2 text-on-navy mb-3.5">{titre}</h2>
      {texte ? (
        <p className="text-body-lg mx-auto mb-7 max-w-[520px] text-white/80">{texte}</p>
      ) : null}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {actions}
      </div>
    </div>
  )
}
