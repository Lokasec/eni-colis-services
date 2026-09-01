import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Étapes numérotées (.steps / .step de la maquette). */
export function Stepper({
  steps,
  className,
}: {
  steps: Array<{ titre: string; texte: ReactNode }>
  className?: string
}) {
  return (
    <ol
      className={cn('grid list-none gap-4.5 p-0 md:grid-cols-2 xl:grid-cols-4 xl:gap-5', className)}
    >
      {steps.map((step, index) => (
        <li
          key={step.titre}
          className="border-line rounded-lg border bg-[var(--surface-card)] px-5.5 pt-6.5 pb-6"
        >
          <span
            className="bg-orange text-navy mb-4 flex size-9.5 items-center justify-center rounded-full font-extrabold"
            aria-hidden
          >
            {index + 1}
          </span>
          <h3 className="text-h3 mb-2">{step.titre}</h3>
          <p className="text-body-sm text-ink-soft">{step.texte}</p>
        </li>
      ))}
    </ol>
  )
}
