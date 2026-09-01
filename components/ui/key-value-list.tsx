import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Liste de définitions en grille (.kv) — récapitulatifs de colis, de devis. */
export function KeyValueList({
  items,
  className,
}: {
  items: Array<{ label: ReactNode; value: ReactNode; emphasis?: boolean }>
  className?: string
}) {
  return (
    <dl
      className={cn(
        'border-line bg-line grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2',
        className,
      )}
    >
      {items.map((item, i) => (
        <div key={i} className="bg-white px-5 py-4.5">
          <dt className="text-muted mb-1.5 text-xs font-bold tracking-[0.08em] uppercase">
            {item.label}
          </dt>
          <dd
            className={cn(
              'm-0 font-bold',
              item.emphasis
                ? 'text-orange-text text-[1.375rem] font-extrabold'
                : 'text-navy text-[1.0625rem]',
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
