import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { CoquilleAdmin } from '@/components/admin/coquille'
import { exigerConnexion } from '@/lib/autorisation'
import { seDeconnecter } from './actions-session'

export const metadata: Metadata = {
  title: { default: 'Back-office', template: '%s — Back-office ENI' },
  robots: { index: false, follow: false },
}

/**
 * Gabarit du back-office.
 *
 * `exigerConnexion()` fait doublon avec le middleware, et c'est voulu : le
 * middleware protège la navigation, ce contrôle protège le rendu. Deux
 * barrières indépendantes valent mieux qu'une, surtout quand l'une des deux
 * s'exécute sur un runtime différent.
 */
export default async function LayoutAdmin({ children }: { children: ReactNode }) {
  const utilisateur = await exigerConnexion()

  return (
    <CoquilleAdmin
      role={utilisateur.role}
      nom={utilisateur.nom}
      email={utilisateur.email}
      deconnexion={
        <form action={seDeconnecter}>
          <button
            type="submit"
            className="text-caption flex min-h-11 w-full items-center rounded-md border border-white/25 px-3 font-semibold text-white/75 hover:bg-white/10"
          >
            Se déconnecter
          </button>
        </form>
      }
    >
      {children}
    </CoquilleAdmin>
  )
}
