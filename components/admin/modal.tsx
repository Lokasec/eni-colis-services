'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Fenêtre modale bâtie sur l'élément <dialog> natif.
 *
 * `showModal()` fournit gratuitement le piège de focus, la fermeture par
 * Échap et l'inertie de l'arrière-plan — trois choses qu'une modale
 * artisanale rate presque toujours.
 */
export function Modal({
  ouvert,
  onClose,
  titre,
  children,
  actions,
  large = false,
}: {
  ouvert: boolean
  onClose: () => void
  titre: string
  children: ReactNode
  actions?: ReactNode
  large?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (ouvert && !dialog.open) dialog.showModal()
    if (!ouvert && dialog.open) dialog.close()
  }, [ouvert])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        // Clic sur le fond (et non sur le panneau) : on ferme.
        if (event.target === ref.current) onClose()
      }}
      aria-labelledby="modal-titre"
      className={cn(
        'border-line text-ink w-[calc(100vw-2rem)] rounded-lg border bg-white p-0 shadow-lg',
        'backdrop:bg-navy/50 open:animate-none',
        large ? 'max-w-3xl' : 'max-w-lg',
      )}
    >
      <div className="border-line flex items-start justify-between gap-4 border-b px-5 py-4">
        <h2 id="modal-titre" className="text-h3">
          {titre}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="text-navy hover:bg-sand -mr-2 flex size-11 flex-none items-center justify-center rounded-md"
        >
          <span aria-hidden className="text-2xl leading-none">
            ×
          </span>
        </button>
      </div>
      <div className="px-5 py-5">{children}</div>
      {actions ? (
        <div className="border-line flex flex-wrap justify-end gap-2 border-t px-5 py-4">
          {actions}
        </div>
      ) : null}
    </dialog>
  )
}
