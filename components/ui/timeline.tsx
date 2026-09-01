import { cn } from '@/lib/cn'

/**
 * Frise d'historique (.frise) — suivi public d'un colis.
 *
 * `etat` : 'fait' (passé), 'encours' (étape actuelle), 'avenir'.
 * L'étape en cours est annoncée aux lecteurs d'écran par aria-current.
 */
export type TimelineItem = {
  titre: string
  detail?: string
  etat: 'fait' | 'encours' | 'avenir'
}

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn('m-0 list-none p-0', className)}>
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <li
            key={item.titre}
            aria-current={item.etat === 'encours' ? 'step' : undefined}
            className={cn(
              'relative ml-2 border-l-2 pt-0.5 pb-6.5 pl-8.5',
              last ? 'border-transparent pb-0' : 'border-line',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'absolute top-0.5 -left-[9px] size-4 rounded-full border-[3px] border-white',
                item.etat === 'avenir' ? 'bg-line-strong' : 'bg-orange',
                item.etat === 'encours' && 'ring-orange/20 ring-5',
              )}
            />
            <b className="text-navy block text-[0.9688rem]">{item.titre}</b>
            {item.detail ? (
              <span className="text-muted text-[0.8438rem]">{item.detail}</span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
