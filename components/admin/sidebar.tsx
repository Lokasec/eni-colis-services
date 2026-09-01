'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

/**
 * Barre latérale du back-office.
 *
 * Les entrées réservées à ADMIN sont filtrées ici pour le confort, mais
 * le masquage n'est JAMAIS la protection : chaque action serveur vérifie
 * le rôle de son côté (CLAUDE.md §9).
 */
export type AdminLien = { href: string; label: string; adminSeulement?: boolean }

export const liensAdmin: AdminLien[] = [
  { href: '/admin', label: 'Tableau de bord' },
  { href: '/admin/receptions', label: 'Réceptions' },
  { href: '/admin/colis', label: 'Colis' },
  { href: '/admin/devis', label: 'Devis' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/departs', label: 'Départs' },
  { href: '/admin/reacheminement', label: 'Réacheminement' },
  { href: '/admin/factures', label: 'Factures', adminSeulement: true },
  { href: '/admin/encaissements', label: 'Encaissements', adminSeulement: true },
  { href: '/admin/creances', label: 'Créances', adminSeulement: true },
  { href: '/admin/tarifs', label: 'Tarifs', adminSeulement: true },
  { href: '/admin/destinations', label: 'Destinations', adminSeulement: true },
  { href: '/admin/messagerie', label: 'Messagerie' },
  { href: '/admin/parametres', label: 'Paramètres', adminSeulement: true },
]

export function Sidebar({ role = 'ADMIN' }: { role?: 'ADMIN' | 'OPERATEUR' }) {
  const pathname = usePathname()
  const liens = liensAdmin.filter((lien) => role === 'ADMIN' || !lien.adminSeulement)

  return (
    <nav
      data-tone="navy"
      aria-label="Navigation du back-office"
      className="bg-navy-dark flex h-full flex-col gap-1 p-4"
    >
      <Link href="/admin" className="mb-5 block px-2 py-1">
        <Image
          src="/brand/logo-horizontal_fond-sombre.svg"
          alt="ENI Colis Services — back-office"
          width={150}
          height={67}
          className="h-auto w-[150px]"
        />
      </Link>
      {liens.map((lien) => {
        const actif = pathname === lien.href || pathname.startsWith(`${lien.href}/`)
        return (
          <Link
            key={lien.href}
            href={lien.href}
            aria-current={actif ? 'page' : undefined}
            className={cn(
              'text-body-sm flex min-h-11 items-center rounded-md px-3 font-semibold no-underline',
              'duration-base ease-brand transition-colors',
              actif ? 'bg-orange text-navy' : 'hover:text-on-navy text-white/75 hover:bg-white/10',
            )}
          >
            {lien.label}
          </Link>
        )
      })}
    </nav>
  )
}
