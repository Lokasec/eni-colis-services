import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { CtaBand } from '@/components/ui/cta-band'
import { PageHeader } from '@/components/ui/page-header'
import { Section } from '@/components/ui/section'

export const metadata: Metadata = {
  title: 'Nos services d’expédition',
  description:
    'Colis familiaux au kilo, pièces détachées à 20 €/kg, matériel électronique à l’unité, articles de valeur. Ce que nous expédions vers l’Afrique et New York, et comment nous le tarifons.',
  alternates: { canonical: '/services' },
}

const services = [
  {
    titre: 'Colis et cartons familiaux',
    corps: (
      <p>
        Vêtements, chaussures, produits d&apos;hygiène et de beauté, denrées non périssables, linge
        de maison, effets personnels : c&apos;est le cœur de notre activité.
      </p>
    ),
    tarification: 'Au kilo, selon la destination. De 12 à 20 €/kg.',
    aSavoir: (
      <>
        Présentez-vous avec un colis <strong>ouvert</strong>. Nous devons voir le contenu au moment
        du dépôt — c&apos;est une obligation en fret aérien, et c&apos;est aussi ce qui nous permet
        de confirmer le tarif.
      </>
    ),
  },
  {
    titre: 'Pièces détachées',
    corps: <p>Pièces automobiles, mécaniques, matériel technique, outillage.</p>,
    tarification:
      '20 €/kg, quelle que soit la destination et quel que soit le sens. Ce tarif remplace le prix standard de la destination.',
    aSavoir: (
      <>
        Les pièces contenant des batteries, des liquides ou des résidus d&apos;hydrocarbures sont
        soumises à restriction. Signalez-le dans votre demande de devis, nous vous dirons
        immédiatement si l&apos;envoi est possible.
      </>
    ),
  },
  {
    titre: 'Matériel électronique',
    corps: <p>Téléphones, tablettes, ordinateurs, téléviseurs, petit et gros électroménager.</p>,
    tarification:
      'À l’unité, selon le type d’appareil et son encombrement. Nous consulter pour obtenir un prix.',
    aSavoir: (
      <>
        Les batteries lithium sont strictement réglementées en fret aérien. Elles doivent rester
        dans l&apos;appareil, jamais expédiées seules. Un appareil qui ne respecte pas cette règle
        sera refusé au dépôt.
      </>
    ),
  },
  {
    titre: 'Articles de valeur et articles de marque',
    corps: (
      <p>
        Sacs, vêtements, montres, accessoires de marque : ces envois font l&apos;objet d&apos;une
        manutention renforcée et d&apos;une traçabilité spécifique.
      </p>
    ),
    tarification: '15 % de la valeur d’achat.',
    aSavoir: (
      <>
        Un <strong>justificatif d&apos;achat est obligatoire</strong>, sans exception. Vous restez
        responsable de l&apos;authenticité et de la provenance des articles confiés. Nous nous
        réservons le droit de refuser tout envoi en cas de doute. L&apos;indemnisation en cas de
        perte ou d&apos;avarie est plafonnée — voir nos conditions générales.
      </>
    ),
  },
]

export default function Services() {
  return (
    <>
      <PageHeader
        crumb={[{ href: '/', label: 'Accueil' }, { label: 'Services' }]}
        eyebrow="Ce que nous expédions"
        titre="Nos services d’expédition"
        lede="ENI Colis Services expédie par groupage aérien vers l’Afrique de l’Ouest, l’Afrique centrale et New York. Chaque type d’envoi a sa logique de tarification — voici comment nous fonctionnons."
      />

      <Section tone="white">
        <div className="flex flex-col gap-5">
          {services.map((service) => (
            <article
              key={service.titre}
              className="border-line border-l-orange rounded-lg border border-l-4 bg-[var(--surface-card)] p-6 md:p-8"
            >
              <h2 className="text-h2 mb-3">{service.titre}</h2>
              <div className="text-body text-ink-soft [&_p]:m-0">{service.corps}</div>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-orange-text mb-1 text-xs font-bold tracking-[0.09em] uppercase">
                    Tarification
                  </dt>
                  <dd className="text-body-sm text-ink-soft m-0">{service.tarification}</dd>
                </div>
                <div>
                  <dt className="text-orange-text mb-1 text-xs font-bold tracking-[0.09em] uppercase">
                    À savoir
                  </dt>
                  <dd className="text-body-sm text-ink-soft [&_strong]:text-navy m-0">
                    {service.aSavoir}
                  </dd>
                </div>
              </dl>
            </article>
          ))}

          <article className="border-line bg-sand rounded-lg border p-6 md:p-8">
            <h2 className="text-h2 mb-3">Envois professionnels</h2>
            <p className="text-body text-ink-soft">
              Vous êtes commerçant, artisan ou revendeur et vous expédiez régulièrement ? Nous
              travaillons avec des professionnels sur toutes nos destinations.
            </p>
            <p className="text-body text-ink-soft mt-3">
              Contactez-nous pour discuter de vos volumes et de la régularité de vos envois.
            </p>
            <div className="mt-5">
              <Button href="/contact" variant="outline" size="sm">
                Nous contacter
              </Button>
            </div>
          </article>
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
