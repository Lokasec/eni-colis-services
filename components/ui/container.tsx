import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Gouttière et largeur maximale du gabarit (.wrap de la maquette). */
export function Container({
  as: As = 'div',
  className,
  children,
}: {
  as?: ElementType
  className?: string
  children: ReactNode
}) {
  return (
    <As className={cn('max-w-page mx-auto w-full px-[var(--gutter)]', className)}>{children}</As>
  )
}
