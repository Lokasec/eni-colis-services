'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ToastTon = 'succes' | 'erreur' | 'info'
type Toast = { id: number; ton: ToastTon; message: string }

const tons: Record<ToastTon, string> = {
  succes: 'border-l-success bg-status-disponible-bg text-status-disponible-fg',
  erreur: 'border-l-error bg-status-litige-bg text-status-litige-fg',
  info: 'border-l-navy bg-notice text-navy',
}

const ToastContext = createContext<((ton: ToastTon, message: string) => void) | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast doit être utilisé dans un ToastProvider')
  return ctx
}

/**
 * Notifications éphémères du back-office.
 *
 * La zone est un live region poli : les messages sont annoncés sans
 * interrompre la saisie en cours.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const pousser = useCallback((ton: ToastTon, message: string) => {
    const id = Date.now() + Math.random()
    setToasts((liste) => [...liste, { id, ton, message }])
    setTimeout(() => setToasts((liste) => liste.filter((t) => t.id !== id)), 5000)
  }, [])

  const valeur = useMemo(() => pousser, [pousser])

  return (
    <ToastContext.Provider value={valeur}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-80 flex flex-col gap-2 sm:left-auto sm:w-96"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'border-line text-body-sm pointer-events-auto rounded-md border border-l-4 px-4 py-3 font-semibold shadow-md',
              tons[toast.ton],
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
