import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Sur-titre en capitales espacées, orange.
 *
 * Sur fond clair on utilise `orange-text` (assombri, AA en petit corps) ;
 * sur fond navy le `orange` d'origine passe largement (6,00).
 */
export function Eyebrow({
  onNavy = false,
  className,
  children,
}: {
  onNavy?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <p
      className={cn(
        'text-eyebrow uppercase',
        onNavy ? 'text-orange' : 'text-orange-text',
        className,
      )}
    >
      {children}
    </p>
  )
}
