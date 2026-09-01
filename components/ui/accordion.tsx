import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Accordéon en details/summary natifs : accessible au clavier et
 * fonctionnel sans JavaScript. Utilisé par la FAQ.
 */
export function Accordion({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('border-line overflow-hidden rounded-lg border bg-white', className)}>
      {children}
    </div>
  )
}

export function AccordionItem({
  question,
  defaultOpen = false,
  children,
}: {
  question: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <details className="group border-line border-b last:border-b-0" open={defaultOpen}>
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4.5',
          'text-navy group-open:bg-sand text-[0.9688rem] font-bold',
          '[&::-webkit-details-marker]:hidden',
        )}
      >
        {question}
        <span
          className="text-orange-text flex-none text-2xl leading-none font-bold group-open:hidden"
          aria-hidden
        >
          +
        </span>
        <span
          className="text-orange-text hidden flex-none text-2xl leading-none font-bold group-open:block"
          aria-hidden
        >
          –
        </span>
      </summary>
      <div className="text-body-sm text-ink-soft px-5 pt-1 pb-5 leading-[1.7] [&_p]:mb-3 [&_p:last-child]:mb-0">
        {children}
      </div>
    </details>
  )
}
