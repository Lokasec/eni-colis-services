import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { CountryChip } from '@/components/ui/country-chip'
import { CtaBand } from '@/components/ui/cta-band'
import { PageHeader } from '@/components/ui/page-header'
import { Section } from '@/components/ui/section'
import { destinationsPubliques } from '@/lib/donnees-publiques'

export const metadata: Metadata = {
  title: "Nos destinations — Afrique de l'Ouest, Afrique centrale, New York",
  description:
    "Sept pays d'Afrique et New York. Tarifs au kilo, départs réguliers, devis sous 24 h sur photos.",
  alternates: { canonical: '/destinations' },
}

export default async function Destinations() {
  const destinations = await destinationsPubliques()

  return (
    <>
      <PageHeader
        crumb={[{ href: '/', label: 'Accueil' }, { label: 'Destinations' }]}
        eyebrow="Où nous allons"
        titre="Nos destinations"
        lede="Nous desservons sept pays d’Afrique de l’Ouest et centrale, ainsi que New York. Chaque destination a son tarif, son délai et son point de retrait. Tous nos envois fonctionnent dans les deux sens."
      />

      <Section tone="white">
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((destination) => (
            <CountryChip
              key={destination.slug}
              href={`/destinations/${destination.slug}`}
              flag={destination.drapeau ?? '🏳️'}
              ville={destination.villePrincipale}
              pays={
                destination.origineAlternative
                  ? `depuis ${destination.origineAlternative.ville}`
                  : destination.pays
              }
              prixParKg={
                destination.prixDepuisFrance ??
                destination.origineAlternative?.prixAller ??
                undefined
              }
              featured={destination.origineAlternative !== null}
            />
          ))}
        </div>

        <div className="text-body text-ink-soft mt-10 max-w-[70ch] space-y-4">
          <p>
            Nos tarifs varient de 12 à 20 €/kg selon la destination et le sens de l&apos;envoi.
            Cette différence tient à la fréquence des liaisons aériennes : plus une destination est
            desservie, plus la capacité en soute est disponible, et plus le tarif au kilo est bas.
          </p>
          <p>
            Le montant indiqué sur chaque fiche est un tarif d&apos;entrée pour un colis standard.
            Le prix exact de votre envoi dépend du poids, de l&apos;encombrement et de la nature du
            contenu — il vous est confirmé par devis, sous 24 heures, après examen des photos.
          </p>
        </div>

        <div className="mt-8">
          <Button href="/tarifs" variant="outline">
            Voir la grille tarifaire complète
          </Button>
        </div>
      </Section>

      <Section tone="sand">
        <CtaBand
          titre="Un colis à envoyer ?"
          texte="Photographiez-le, dites-nous où il va. Vous aurez votre prix sous 24 heures."
          actions={
            <Button href="/devis" variant="onNavy">
              Demander un devis
            </Button>
          }
        />
      </Section>
    </>
  )
}
