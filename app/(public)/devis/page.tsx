import type { Metadata } from 'next'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Section } from '@/components/ui/section'
import { site, whatsappLink } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Demander un devis',
  description:
    'Décrivez votre colis, joignez une à trois photos, recevez un prix ferme sous 24 heures, valable sept jours.',
  alternates: { canonical: '/devis' },
}

export default function Devis() {
  return (
    <>
      <PageHeader
        crumb={[{ href: '/', label: 'Accueil' }, { label: 'Devis' }]}
        eyebrow="En deux minutes"
        titre="Demandez votre devis"
        lede="Décrivez votre colis et joignez une à trois photos. Nous vous répondons sous 24 heures avec un prix ferme, valable sept jours."
      />

      <Section tone="white" containerClassName="max-w-[760px]">
        <Alert>
          <b>Le devis n&apos;est pas obligatoire pour un colis ordinaire.</b> Si vous déposez un
          colis courant à notre bureau, le tarif au kilo de votre destination s&apos;applique
          directement : vous n&apos;avez aucune démarche à faire avant de venir. Le devis est utile
          pour l&apos;électronique, les articles de valeur, les colis encombrants — et obligatoire
          si vous nous expédiez votre colis à distance.
        </Alert>

        <Card surface="plain" className="mt-7">
          <h2 className="text-h3">Formulaire en cours d&apos;intégration</h2>
          <p className="text-body-sm text-ink-soft mt-2">
            Le formulaire de demande — sélection du trajet, nature du colis, poids et dimensions,
            envoi d&apos;une à trois photos depuis votre téléphone — est développé au lot suivant.
            En attendant, écrivez-nous directement : nous traitons les demandes de la même façon.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={whatsappLink(
                'Bonjour, je souhaite un devis pour un envoi. Voici les photos et les informations de mon colis.',
              )}
              target="_blank"
              rel="noopener noreferrer"
              data-cta
              className="rounded-pill bg-whatsapp text-body-sm text-navy inline-flex min-h-11 shrink-0 items-center justify-center px-5 font-semibold no-underline"
            >
              Demander par WhatsApp
            </a>
            <Button href="/contact" variant="outline" size="sm">
              Autres moyens de nous joindre
            </Button>
          </div>
          <p className="text-caption text-muted mt-4">
            Ou par téléphone au{' '}
            <a
              href={`tel:${site.telephone.replace(/\s/g, '')}`}
              className="text-orange-text font-semibold"
            >
              {site.telephone}
            </a>
            .
          </p>
        </Card>

        <div className="mt-11">
          <h2 className="text-h2">Ce que nous vous demanderons</h2>
          <ul className="border-line bg-line mt-5 grid list-none gap-px overflow-hidden rounded-lg border p-0 sm:grid-cols-2">
            {[
              ['Le trajet', 'Pays et ville de départ, pays et ville d’arrivée.'],
              ['Le mode de remise', 'Vous déposez au bureau, ou vous nous expédiez le colis.'],
              [
                'La nature du colis',
                'Colis standard, pièce détachée, électronique, article de valeur.',
              ],
              ['Le poids approximatif', 'Une estimation suffit, nous pèserons au dépôt.'],
              ['Les dimensions', 'Longueur × largeur × hauteur. Utile pour les colis volumineux.'],
              ['Une à trois photos', 'Prenez-les directement avec votre téléphone.'],
            ].map(([titre, detail]) => (
              <li key={titre} className="bg-white p-5">
                <h3 className="text-body-sm text-navy mb-1 font-bold">{titre}</h3>
                <p className="text-body-sm text-ink-soft">{detail}</p>
              </li>
            ))}
          </ul>
          <p className="text-body-sm text-muted mt-5">
            Pour un article de valeur, la valeur d&apos;achat et son justificatif sont demandés : le
            tarif s&apos;en déduit directement.
          </p>
        </div>
      </Section>
    </>
  )
}
