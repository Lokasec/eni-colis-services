import type { ReactNode } from 'react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { WhatsAppFloat } from '@/components/layout/whatsapp-float'
import { destinationsPubliques } from '@/lib/donnees-publiques'

/**
 * Gabarit du site public.
 *
 * La colonne « Destinations » du pied de page est alimentée par la base :
 * une destination retirée du réseau disparaît du site sans intervention.
 * France ↔ USA n'y figure pas — la liaison n'est pas publiée.
 */
export default async function LayoutPublic({ children }: { children: ReactNode }) {
  const destinations = await destinationsPubliques()

  return (
    <>
      <Header />
      <main id="contenu">{children}</main>
      <Footer
        destinations={destinations.map((d) => ({
          href: `/destinations/${d.slug}`,
          label: d.villePrincipale,
        }))}
      />
      <WhatsAppFloat />
    </>
  )
}
