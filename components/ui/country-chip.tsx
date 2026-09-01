import Link from 'next/link'
import { cn } from '@/lib/cn'

/**
 * Carte-destination cliquable (.dest de la maquette) : drapeau, ville,
 * pays et tarif au kilo.
 *
 * Les drapeaux en emoji sont autorisés — ils sont fonctionnels, pas
 * décoratifs (design/tokens.json §rules.interdits).
 *
 * Le prix est un TARIF AFFICHÉ lu en base, jamais un calcul.
 */
export function CountryChip({
  href,
  flag,
  ville,
  pays,
  prixParKg,
  featured = false,
  className,
}: {
  href: string
  flag: string
  ville: string
  pays: string
  prixParKg?: number
  featured?: boolean
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group duration-base ease-brand block rounded-lg border p-5 no-underline transition',
        'hover:border-orange hover:-translate-y-[3px] hover:shadow-md',
        featured ? 'border-navy bg-navy' : 'border-line bg-[var(--surface-card)]',
        className,
      )}
    >
      <span className="mb-3.5 block text-2xl leading-none" aria-hidden>
        {flag}
      </span>
      <span
        className={cn(
          'block text-[1.0625rem] font-extrabold tracking-[-0.01em]',
          featured ? 'text-on-navy' : 'text-navy',
        )}
      >
        {ville}
      </span>
      <span
        className={cn(
          'text-caption mt-0.5 mb-3.5 block font-medium',
          featured ? 'text-white/65' : 'text-muted',
        )}
      >
        {pays}
      </span>
      {prixParKg !== undefined ? (
        <span
          className={cn(
            'flex items-baseline gap-1.5 border-t pt-3.5',
            featured ? 'border-white/20' : 'border-line',
          )}
        >
          <b
            className={cn('text-xl font-extrabold', featured ? 'text-orange' : 'text-orange-text')}
          >
            {prixParKg} €
          </b>
          <span
            className={cn('text-caption font-medium', featured ? 'text-white/65' : 'text-muted')}
          >
            par kilo
          </span>
        </span>
      ) : null}
    </Link>
  )
}
