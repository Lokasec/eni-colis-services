import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Tableau de données (.tbl).
 *
 * Toujours enveloppé dans un conteneur à défilement horizontal : sur
 * téléphone, un tableau ne doit jamais faire déborder la page.
 */
export function DataTable({
  caption,
  head,
  className,
  children,
}: {
  caption?: string
  head: ReactNode[]
  className?: string
  children: ReactNode
}) {
  return (
    <div className="-mx-[var(--gutter)] overflow-x-auto px-[var(--gutter)]">
      <table
        className={cn(
          'border-line w-full min-w-[560px] border-collapse overflow-hidden rounded-lg border bg-white',
          className,
        )}
      >
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr>
            {head.map((cell, i) => (
              <th
                key={i}
                scope="col"
                className="bg-navy text-caption text-on-navy px-4 py-3.5 text-left font-bold tracking-[0.06em] uppercase"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:hover_td]:bg-sand">{children}</tbody>
      </table>
    </div>
  )
}

export function Td({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <td className={cn('border-line text-body-sm border-t px-4 py-3.5', className)}>{children}</td>
  )
}
