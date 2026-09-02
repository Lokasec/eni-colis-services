import type { Metadata } from 'next'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { Eyebrow } from '@/components/ui/eyebrow'

export const metadata: Metadata = {
  title: 'Page introuvable',
  robots: { index: false, follow: false },
}

/**
 * Page 404.
 *
 * Elle vit à la racine et non dans le groupe (public) : Next l'utilise pour
 * toute URL non reconnue, y compris hors du site public. Elle porte donc son
 * en-tête et son pied de page, mais sans requête en base — une 404 ne doit
 * jamais dépendre de la disponibilité de la base de données.
 */
export default function Introuvable() {
  return (
    <>
      <Header />
      <main>
        <Container className="py-20 md:py-28">
          <div className="max-w-[52ch]">
            <Eyebrow>Erreur 404</Eyebrow>
            <h1 className="text-h1 mt-3">Cette page n&apos;existe pas</h1>
            <p className="text-body-lg text-ink-soft mt-4">
              Le lien est peut-être erroné, ou la page a été déplacée.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/">Retour à l&apos;accueil</Button>
              <Button href="/suivi" variant="outline">
                Suivre un colis
              </Button>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}
