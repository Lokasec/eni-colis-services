import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Encart d'information (.alert) — filet de couleur à gauche. */
const tones = {
  info: 'bg-notice border-l-navy',
  warn: 'bg-status-en-transit-bg border-l-orange',
} as const

export function Alert({
  tone = 'info',
  className,
  children,
}: {
  tone?: keyof typeof tones
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'text-body-sm text-ink-soft rounded-md border-l-4 px-4.5 py-4 leading-relaxed',
        '[&_b]:text-navy [&_strong]:text-navy',
        tones[tone],
        className,
      )}
    >
      {children}
    </div>
  )
}
