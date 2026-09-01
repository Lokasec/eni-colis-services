import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Eyebrow } from './eyebrow'

/** Bloc de tête de section : sur-titre, titre, chapô. */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  onNavy = false,
  as: As = 'h2',
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  lede?: ReactNode
  onNavy?: boolean
  as?: 'h1' | 'h2' | 'h3'
  className?: string
}) {
  return (
    <div className={cn('max-w-[640px]', className)}>
      {eyebrow ? (
        <Eyebrow onNavy={onNavy} className="mb-3">
          {eyebrow}
        </Eyebrow>
      ) : null}
      <As className={cn(As === 'h1' ? 'text-h1' : 'text-h2', onNavy && 'text-on-navy')}>{title}</As>
      {lede ? (
        <p className={cn('text-body-lg mt-4', onNavy ? 'text-white/80' : 'text-ink-soft')}>
          {lede}
        </p>
      ) : null}
    </div>
  )
}
