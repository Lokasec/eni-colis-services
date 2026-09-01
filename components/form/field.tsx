import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Habillage commun des champs : libellé, aide, message d'erreur.
 *
 * L'aide et l'erreur sont reliées au champ par aria-describedby, et
 * l'erreur porte role="alert" pour être annoncée à la saisie.
 */
export function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  id: string
  label: ReactNode
  hint?: ReactNode
  error?: string
  required?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('mb-5', className)}>
      <label htmlFor={id} className="text-body-sm text-navy mb-1.5 block font-semibold">
        {label}
        {required ? (
          <>
            <span aria-hidden className="text-orange-text">
              {' '}
              *
            </span>
            <span className="sr-only"> (obligatoire)</span>
          </>
        ) : null}
      </label>
      {children}
      {hint ? (
        <span id={`${id}-hint`} className="text-caption text-muted mt-1 block font-normal">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span
          id={`${id}-error`}
          role="alert"
          className="text-caption text-error mt-1 block font-semibold"
        >
          {error}
        </span>
      ) : null}
    </div>
  )
}

/** Renvoie la valeur d'aria-describedby en fonction des éléments présents. */
export function describedBy(id: string, hint?: ReactNode, error?: string): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean)
  return ids.length > 0 ? ids.join(' ') : undefined
}

/** Style commun des contrôles de saisie — hauteur tactile 52 px. */
export const controlClasses =
  'w-full min-h-13 rounded-md border-2 border-line-strong bg-white px-4 py-3.5 ' +
  'text-body text-ink placeholder:text-placeholder ' +
  'transition-colors duration-base ease-brand focus:border-orange focus:outline-none ' +
  'aria-[invalid=true]:border-error'
