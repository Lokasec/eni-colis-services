import Link from 'next/link'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Variantes reprises de docs/maquette/assets/styles.css (.btn--*).
 *
 * RÈGLE DE CONTRASTE — les boutons orange portent du texte NAVY, y
 * compris au survol. La maquette passait en blanc sur `orange-dark` au
 * survol : mesuré à 3,37, sous le seuil AA de 4,5 pour un corps de 16 px.
 * Le navy sur orange est à 4,85.
 */
const variants = {
  primary: 'bg-orange text-navy hover:bg-orange-dark',
  outline: 'border-navy text-navy hover:bg-navy hover:text-on-navy',
  onNavy: 'bg-orange text-navy hover:bg-white',
  ghostNavy: 'border-white/45 text-on-navy hover:border-white hover:bg-white/10',
  whatsapp: 'bg-whatsapp text-navy hover:brightness-95',
} as const

const sizes = {
  md: 'min-h-13 px-6.5 text-button',
  sm: 'min-h-11 px-5 text-body-sm font-semibold',
} as const

export type ButtonVariant = keyof typeof variants
export type ButtonSize = keyof typeof sizes

type CommonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  className?: string
  children: ReactNode
}

type AsLink = CommonProps & { href: string } & Omit<
    ComponentPropsWithoutRef<typeof Link>,
    'href' | 'className' | 'children'
  >
type AsButton = CommonProps & { href?: undefined } & Omit<
    ComponentPropsWithoutRef<'button'>,
    'className' | 'children'
  >

const base =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-pill border-2 border-transparent ' +
  'font-semibold no-underline transition-colors duration-base ease-brand ' +
  'active:translate-y-px disabled:pointer-events-none disabled:opacity-55'

export function Button(props: AsLink | AsButton) {
  const { variant = 'primary', size = 'md', block = false, className, children } = props
  const classes = cn(base, variants[variant], sizes[size], block && 'w-full', className)

  if (props.href !== undefined) {
    const { variant: _v, size: _s, block: _b, className: _c, children: _ch, ...rest } = props
    return (
      <Link {...rest} className={classes} data-cta>
        {children}
      </Link>
    )
  }

  const { variant: _v, size: _s, block: _b, className: _c, children: _ch, ...rest } = props
  return (
    <button {...rest} className={classes}>
      {children}
    </button>
  )
}
