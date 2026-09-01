import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Choix exclusif en cartes cliquables (.radios de la maquette).
 *
 * Utilisé pour le mode de remise et la nature du colis sur /devis, où le
 * choix commande l'affichage de champs conditionnels. Le contrôle radio
 * natif reste dans le DOM : navigation aux flèches et lecture d'écran
 * fonctionnent sans code supplémentaire.
 */
export type RadioCardOption = {
  value: string
  titre: string
  description?: ReactNode
}

export function RadioCards({
  name,
  legend,
  options,
  defaultValue,
  error,
  onChange,
  columns = 2,
  className,
}: {
  name: string
  legend: ReactNode
  options: RadioCardOption[]
  defaultValue?: string
  error?: string
  onChange?: (value: string) => void
  columns?: 1 | 2
  className?: string
}) {
  return (
    <fieldset className={cn('mb-5 border-0 p-0', className)}>
      <legend className="text-caption text-orange-text mb-4 p-0 font-bold tracking-[0.1em] uppercase">
        {legend}
      </legend>
      <div className={cn('grid gap-3', columns === 2 && 'sm:grid-cols-2')}>
        {options.map((option) => (
          <label key={option.value} className="relative block cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={defaultValue === option.value}
              onChange={(event) => onChange?.(event.currentTarget.value)}
              className="peer absolute size-0 opacity-0"
            />
            <span
              className={cn(
                'border-line-strong block min-h-13 rounded-md border-2 px-4.5 py-4',
                'duration-base ease-brand transition-colors',
                'peer-checked:border-orange peer-checked:bg-sand',
                'peer-focus-visible:outline-orange peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2',
              )}
            >
              <b className="text-body-sm text-navy mb-0.5 block font-bold">{option.titre}</b>
              {option.description ? (
                <span className="text-caption text-ink-soft block leading-normal font-normal">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <span role="alert" className="text-caption text-error mt-1 block font-semibold">
          {error}
        </span>
      ) : null}
    </fieldset>
  )
}
