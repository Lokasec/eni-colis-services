'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { Sidebar } from '@/components/admin/sidebar'

/**
 * Coquille du back-office.
 *
 * L'outil est utilisé DEBOUT, sur téléphone, un colis dans les mains
 * (CLAUDE.md §9). D'où deux choix :
 *  - sur grand écran, la navigation reste visible en permanence ;
 *  - sur téléphone, elle s'efface derrière un bouton et se referme dès
 *    qu'on choisit une rubrique, pour rendre l'écran au travail en cours.
 */
export function CoquilleAdmin({
  role,
  nom,
  email,
  children,
  deconnexion,
}: {
  role: 'ADMIN' | 'OPERATEUR'
  nom: string
  email: string
  children: ReactNode
  deconnexion: ReactNode
}) {
  const chemin = usePathname()
  const [ouvert, setOuvert] = useState(false)

  useEffect(() => {
    setOuvert(false)
  }, [chemin])

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      {/* Navigation permanente sur grand écran */}
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <Sidebar role={role} />
          <div className="bg-navy-dark px-4 pb-6">
            <p className="text-caption text-white/60">{nom}</p>
            <p className="text-caption mb-3 text-white/40">{email}</p>
            {deconnexion}
          </div>
        </div>
      </div>

      {/* Barre de navigation mobile */}
      <div className="lg:hidden">
        <div className="border-line flex min-h-14 items-center gap-3 border-b bg-white px-4">
          <button
            type="button"
            aria-expanded={ouvert}
            aria-controls="menu-admin"
            onClick={() => setOuvert((v) => !v)}
            className="border-navy text-navy flex size-11 items-center justify-center rounded-md border-2"
          >
            <span className="sr-only">{ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}</span>
            <span
              aria-hidden
              className="bg-navy before:bg-navy after:bg-navy relative block h-0.5 w-5 before:absolute before:-top-1.5 before:left-0 before:h-0.5 before:w-5 before:content-[''] after:absolute after:top-1.5 after:left-0 after:h-0.5 after:w-5 after:content-['']"
            />
          </button>
          <span className="text-body-sm text-navy font-bold">Back-office</span>
          <span className="text-caption text-muted ml-auto">
            {role === 'ADMIN' ? 'Administratrice' : 'Opérateur'}
          </span>
        </div>

        {ouvert ? (
          <div id="menu-admin">
            <Sidebar role={role} />
            <div className="bg-navy-dark px-4 pb-6">
              <p className="text-caption text-white/60">{nom}</p>
              <p className="text-caption mb-3 text-white/40">{email}</p>
              {deconnexion}
            </div>
          </div>
        ) : null}
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  )
}
