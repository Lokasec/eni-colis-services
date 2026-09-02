import type { ReactNode } from 'react'
import { DonneesOrganisation } from '@/components/donnees-structurees'
import { BandeauCookies } from '@/components/layout/bandeau-cookies'
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
      {/*
        Lien d'évitement. Il n'apparaît qu'au clavier, en tête de page :
        sans lui, un utilisateur de lecteur d'écran ou de clavier seul
        retraverse l'en-tête et ses dix liens de navigation à CHAQUE page
        avant d'atteindre le contenu.
      */}
      <a
        href="#contenu"
        className="bg-navy text-on-navy text-body-sm absolute -top-20 left-3 z-60 rounded-md px-5 py-3 font-semibold no-underline focus:top-3"
      >
        Aller au contenu
      </a>
      <Header />
      <main id="contenu" tabIndex={-1}>
        {children}
      </main>
      <Footer
        destinations={destinations.map((d) => ({
          href: `/destinations/${d.slug}`,
          label: d.villePrincipale,
        }))}
      />
      <WhatsAppFloat />
      <BandeauCookies />
      <DonneesOrganisation />
    </>
  )
}
