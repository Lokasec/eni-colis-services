import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { CountryChip } from '@/components/ui/country-chip'
import { CtaBand } from '@/components/ui/cta-band'
import { DepartBoard, DepartRow } from '@/components/ui/depart-row'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Section } from '@/components/ui/section'
import { SectionHeading } from '@/components/ui/section-heading'
import { Stepper } from '@/components/ui/stepper'
import { Todo } from '@/components/ui/todo'
import { formaterJourCourt } from '@/lib/dates'
import { destinationsPubliques, prochainsDeparts } from '@/lib/donnees-publiques'
import { site, whatsappLink } from '@/lib/site'

export const metadata: Metadata = {
  // `absolute` court-circuite le gabarit « %s — ENI Colis Services » du
  // layout : sans lui, la marque apparaîtrait deux fois dans l'onglet.
  title: {
    absolute: "ENI Colis Services — Envoi de colis vers l'Afrique et New York",
  },
  description:
    "Envoi de colis vers l'Afrique et New York. Tarifs affichés de 12 à 20 € le kilo, départs chaque semaine. Devis sur photos pour l'électronique et les articles de valeur.",
  alternates: { canonical: '/' },
}

export default async function Accueil() {
  const [departs, destinations] = await Promise.all([prochainsDeparts(4), destinationsPubliques()])

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* HERO — le tableau d'embarquement est la signature de la page      */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-11 md:py-18">
        <Container className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-14">
          <div>
            <Eyebrow>France · Afrique · New York</Eyebrow>
            <h1 className="text-display mt-3">
              De 12 à 20 €<br />
              le kilo.
              <br />
              Tarifs affichés.
            </h1>
            <p className="text-body-lg text-ink-soft mt-4 max-w-xl">
              Envoyez vos colis vers l&apos;Afrique et New York. Pour un colis ordinaire, le tarif
              au kilo de votre destination s&apos;applique : vous n&apos;avez qu&apos;à venir le
              déposer. Pour l&apos;électronique, les articles de valeur ou les colis encombrants,
              demandez un devis sur photos.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button href="/devis">Demander un devis</Button>
              <Button href="/departs" variant="outline">
                Voir les prochains départs
              </Button>
            </div>
            <p className="text-body-sm text-muted mt-6">
              Départs <b className="text-navy font-semibold">toutes les semaines</b> sur
              l&apos;ensemble de nos destinations.
            </p>
          </div>

          {departs.length > 0 ? (
            <DepartBoard
              live="Mis à jour en direct"
              footer={
                <>
                  <p className="text-caption text-white/65">
                    Un colis déposé après la clôture part au départ suivant.
                  </p>
                  <Link
                    href="/departs"
                    className="text-body-sm text-orange inline-flex min-h-11 items-center font-semibold no-underline hover:underline"
                  >
                    Tous les départs →
                  </Link>
                </>
              }
            >
              {departs.map((depart) => (
                <DepartRow
                  key={depart.reference}
                  destination={depart.destination}
                  meta={`Départ ${formaterJourCourt(depart.dateDepart)} · dépôts jusqu’au ${formaterJourCourt(
                    depart.dateClotureDepot,
                  )}`}
                  prixParKg={depart.prixParKg}
                  statut={
                    depart.complet ? (
                      <Badge tone="complet">Départ complet</Badge>
                    ) : (
                      <Badge tone="disponible">Places disponibles</Badge>
                    )
                  }
                />
              ))}
            </DepartBoard>
          ) : null}
        </Container>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* RÉASSURANCE                                                       */}
      {/* ---------------------------------------------------------------- */}
      <Container>
        <ul className="border-line bg-line grid list-none gap-px overflow-hidden rounded-lg border p-0 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              titre: 'Prix ferme, pas d’estimation',
              texte: 'Vous connaissez le montant exact avant de vous déplacer.',
            },
            {
              titre: 'Réponse sous 24 heures',
              texte: 'Un devis chiffré, envoyé par e-mail et WhatsApp.',
            },
            {
              titre: 'Sept destinations, deux continents',
              texte: 'De Dakar à Kinshasa, et jusqu’à New York.',
            },
            {
              titre: 'Suivi en ligne',
              texte: 'Un code, une page, l’état réel de votre colis.',
            },
          ].map((item, index) => (
            <li key={item.titre} className="bg-white px-5.5 py-6">
              <span className="text-orange-text mb-2.5 block text-xs font-extrabold tracking-[0.1em]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2 className="text-body-sm text-navy mb-1.5 font-bold">{item.titre}</h2>
              <p className="text-body-sm text-ink-soft">{item.texte}</p>
            </li>
          ))}
        </ul>
      </Container>

      {/* ---------------------------------------------------------------- */}
      {/* DEUX CHEMINS — le devis n'est PAS un passage obligé               */}
      {/* ---------------------------------------------------------------- */}
      <Section tone="white" id="chemins">
        <SectionHeading
          eyebrow="Connaître votre prix"
          title={
            <>
              Deux situations,
              <br />
              deux façons de faire
            </>
          }
          className="mb-9"
        />
        <div className="grid gap-4.5 lg:grid-cols-2 lg:gap-5.5">
          <article className="border-line border-t-orange flex flex-col rounded-lg border border-t-[5px] bg-[var(--surface-card)] px-6 pt-6.5 pb-6">
            <span className="rounded-pill bg-sand-deep text-orange-text mb-3.5 self-start px-3 py-1.5 text-[0.6875rem] font-bold tracking-[0.08em] uppercase">
              Cas le plus courant
            </span>
            <h3 className="text-navy mb-2 text-[1.375rem] font-extrabold tracking-[-0.015em]">
              Colis ordinaire
            </h3>
            <p className="text-body-sm text-ink-soft mb-4.5">
              Vêtements, produits d&apos;hygiène, denrées non périssables, effets personnels, pièces
              détachées.
            </p>
            <div className="bg-sand mb-5.5 flex-1 rounded-md px-4.5 py-4">
              <b className="text-navy mb-1.5 block font-bold">
                Le tarif au kilo de votre destination s&apos;applique.
              </b>
              <span className="text-body-sm text-ink-soft block">
                Nous pesons votre colis au dépôt, vous réglez sur place. Pas de démarche préalable.
              </span>
            </div>
            <Button href="/tarifs" block>
              Voir les tarifs
            </Button>
          </article>

          <article className="border-line border-t-navy flex flex-col rounded-lg border border-t-[5px] bg-[var(--surface-card)] px-6 pt-6.5 pb-6">
            <span className="rounded-pill bg-notice text-navy mb-3.5 self-start px-3 py-1.5 text-[0.6875rem] font-bold tracking-[0.08em] uppercase">
              Devis nécessaire
            </span>
            <h3 className="text-navy mb-2 text-[1.375rem] font-extrabold tracking-[-0.015em]">
              Cas particulier
            </h3>
            <p className="text-body-sm text-ink-soft mb-4.5">
              Matériel électronique, articles de marque et de valeur, colis volumineux ou contenu
              inhabituel.
            </p>
            <div className="bg-sand mb-5.5 flex-1 rounded-md px-4.5 py-4">
              <b className="text-navy mb-1.5 block font-bold">
                Envoyez-nous des photos, nous chiffrons.
              </b>
              <span className="text-body-sm text-ink-soft block">
                Réponse sous 24 heures, montant ferme, valable sept jours.
              </span>
            </div>
            <Button href="/devis" block>
              Demander un devis
            </Button>
          </article>
        </div>
        <p className="text-body-sm text-muted mt-5.5 text-center">
          Vous nous expédiez votre colis à distance ? Le devis est alors obligatoire : nous ne
          pouvons pas le peser nous-mêmes.
        </p>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* COMMENT ÇA MARCHE                                                 */}
      {/* ---------------------------------------------------------------- */}
      <Section tone="sand">
        <SectionHeading
          eyebrow="Le parcours"
          title="Quatre étapes, aucune mauvaise surprise"
          className="mb-9"
        />
        <Stepper
          steps={[
            {
              titre: 'Je photographie mon colis',
              texte:
                'Une à trois photos suffisent. Ajoutez le poids approximatif, les dimensions si vous les avez, et la destination. Deux minutes, depuis votre téléphone.',
            },
            {
              titre: 'Je reçois mon prix',
              texte:
                'Nous examinons les photos et vous envoyons un devis chiffré sous 24 heures. Le montant est ferme et valable sept jours.',
            },
            {
              titre: 'Je dépose mon colis',
              texte:
                'Vous venez au bureau avec votre colis ouvert — nous devons voir le contenu au moment du dépôt. Pesée, reçu, code de suivi : c’est réglé.',
            },
            {
              titre: 'Le destinataire retire',
              texte:
                'Le colis part au prochain départ. Votre destinataire est prévenu dès qu’il est disponible au point de retrait.',
            },
          ]}
        />
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* DESTINATIONS — lues en base                                       */}
      {/* ---------------------------------------------------------------- */}
      <Section tone="white">
        <SectionHeading
          eyebrow="Où nous allons"
          title="Nos destinations"
          lede="Nous expédions dans les deux sens : de la France vers l’Afrique, de l’Afrique vers la France, et entre Abidjan et New York. Chaque destination a son tarif, son délai et son point de retrait."
          className="mb-9"
        />
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
        <p className="mt-8">
          <Button href="/destinations" variant="outline">
            Voir toutes les destinations
          </Button>
        </p>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* SERVICES                                                          */}
      {/* ---------------------------------------------------------------- */}
      <Section tone="sand">
        <SectionHeading
          eyebrow="Nos services"
          title={
            <>
              Du carton familial
              <br />à la pièce détachée
            </>
          }
          className="mb-9"
        />
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              titre: 'Colis et cartons familiaux',
              texte:
                'Vêtements, produits d’hygiène, denrées non périssables, effets personnels. Le cœur de notre activité, tarifé au kilo.',
              tarif: 'Tarif affiché — au kilo selon la destination',
              devis: false,
            },
            {
              titre: 'Pièces détachées',
              texte:
                'Pièces automobiles, mécaniques, industrielles. Tarif spécifique de 20 €/kg, dans les deux sens et sur toutes les destinations.',
              tarif: 'Tarif affiché — 20 €/kg',
              devis: false,
            },
            {
              titre: 'Matériel électronique',
              texte:
                'Téléphones, ordinateurs, téléviseurs, électroménager. Tarification à l’unité, selon l’appareil : contactez-nous pour un prix.',
              tarif: 'Devis obligatoire — prix à l’unité',
              devis: true,
            },
            {
              titre: 'Articles de valeur',
              texte:
                'Articles de marque et biens de valeur : manutention renforcée, traçabilité, justificatif d’achat obligatoire. Tarification spécifique.',
              tarif: 'Devis obligatoire — 15 % de la valeur',
              devis: true,
            },
          ].map((service) => (
            <article
              key={service.titre}
              className="border-line border-l-orange rounded-md border border-l-4 bg-white p-6"
            >
              <h3 className="text-h3 mb-2">{service.titre}</h3>
              <p className="text-body-sm text-ink-soft mb-3">{service.texte}</p>
              <span
                className={`rounded-pill text-caption text-navy inline-block px-3 py-1.5 font-bold ${
                  service.devis ? 'bg-notice' : 'bg-sand-deep'
                }`}
              >
                {service.tarif}
              </span>
            </article>
          ))}
        </div>
        <p className="mt-8">
          <Button href="/services" variant="outline">
            Détail de nos services
          </Button>
        </p>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* EXPÉDITION À DISTANCE — bloc navy pleine largeur                  */}
      {/* ---------------------------------------------------------------- */}
      <Section tone="white">
        <div
          data-tone="navy"
          className="bg-navy grid gap-8 rounded-xl px-6 py-9 md:px-12 md:py-13 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-13"
        >
          <div>
            <Eyebrow onNavy>Vous n&apos;êtes pas à proximité ?</Eyebrow>
            <h2 className="text-h2 text-on-navy mt-3">Expédiez-nous votre colis</h2>
            <p className="text-body-lg mt-4 text-white/80">
              Vous n&apos;avez pas besoin d&apos;habiter près de notre bureau. Demandez un devis
              avec photos, puis envoyez-nous votre colis par le transporteur de votre choix : nous
              le prenons en charge à réception et il part au départ suivant.
            </p>
            <div className="mt-7">
              <Button href="/devis" variant="onNavy">
                Demander un devis
              </Button>
            </div>
          </div>
          <ol className="m-0 list-none p-0">
            {[
              {
                titre: 'Devis avec photos',
                texte:
                  'Obligatoire pour ce mode d’envoi : nous ne pouvons pas peser votre colis nous-mêmes. Le montant est ferme et valable sept jours.',
              },
              {
                titre: 'Vous nous l’expédiez',
                texte:
                  'Par le transporteur de votre choix, à vos frais. Collez votre numéro de devis bien visible sur le colis : c’est ce qui nous permet de l’identifier à l’arrivée.',
              },
              {
                titre: 'Nous prenons le relais',
                texte:
                  'Contrôle du contenu à réception, code de suivi envoyé, embarquement au prochain départ. Vous suivez tout en ligne.',
              },
            ].map((etape, index) => (
              <li
                key={etape.titre}
                className="flex gap-4 border-b border-white/12 py-4.5 first:pt-0 last:border-b-0 last:pb-0"
              >
                <span
                  aria-hidden
                  className="bg-orange text-body-sm text-navy flex size-8.5 flex-none items-center justify-center rounded-full font-extrabold"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-h3 text-on-navy mb-1">{etape.titre}</h3>
                  <p className="text-body-sm text-white/72">{etape.texte}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* MODE A — service d'adresse en France                              */}
      {/* ---------------------------------------------------------------- */}
      <Section tone="sand">
        <SectionHeading
          eyebrow="Vous vivez en Afrique ?"
          title={
            <>
              Commandez en France,
              <br />
              récupérez chez nous
            </>
          }
          lede="La plupart des marchands français ne livrent pas en Afrique. Nous vous donnons une adresse de livraison en France : vous commandez, nous recevons, nous acheminons. Vous payez au retrait, en monnaie locale."
          className="mb-9"
        />
        <div className="border-line border-t-orange rounded-lg border border-t-[5px] bg-white p-6 md:p-8">
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
            <div>
              <h3 className="text-navy mb-3.5 text-[1.375rem] font-extrabold">
                Votre adresse en France
              </h3>
              <div className="border-line bg-sand text-caption text-navy rounded-md border px-5 py-4.5 font-mono leading-[1.9]">
                <span className="text-muted">Nom :</span>{' '}
                <b className="bg-sand-deep rounded-sm px-1.5 py-0.5">Eni Aïcha 42</b>
                <br />
                <span className="text-muted">Prénom :</span> colis service
                <br />
                {site.adresse.rue}
                <br />
                {site.adresse.codePostal} {site.adresse.ville} — {site.adresse.pays}
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-body-sm text-ink-soft mb-2">
                Inscription en deux minutes. Vous recevez votre identifiant et l&apos;adresse exacte
                à saisir dans vos commandes.
              </p>
              <p className="text-body-sm text-ink-soft mb-5.5">
                Aucun paiement au départ : vous réglez à l&apos;arrivée, quand vous venez chercher
                votre colis.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button href="/inscription" size="sm">
                  Obtenir mon adresse
                </Button>
                <Button href="/recevoir" variant="outline" size="sm">
                  En savoir plus
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* BANDE CTA                                                         */}
      {/* ---------------------------------------------------------------- */}
      <Section tone="white">
        <CtaBand
          titre="Un colis à envoyer ?"
          texte="Photographiez-le, dites-nous où il va. Vous aurez votre prix sous 24 heures."
          actions={
            <>
              <Button href="/devis" variant="onNavy">
                Demander un devis
              </Button>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                data-cta
                className="rounded-pill text-button text-on-navy duration-base ease-brand inline-flex min-h-13 shrink-0 items-center justify-center border-2 border-white/45 px-6.5 font-semibold no-underline transition-colors hover:border-white hover:bg-white/10"
              >
                Nous écrire sur WhatsApp
              </a>
            </>
          }
        />
        <p className="text-caption text-muted mt-6 text-center">
          Bloc témoignages volontairement absent : aucun avis client réel n&apos;a été fourni.{' '}
          <Todo />
        </p>
      </Section>
    </>
  )
}
