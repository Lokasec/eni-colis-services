import type { Metadata } from 'next'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Section } from '@/components/ui/section'
import { Todo } from '@/components/ui/todo'
import { site, whatsappLink } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Une question sur un envoi, un colis en cours, un tarif ? Écrivez-nous ou passez au bureau, 67 rue Saint-Julien à Rouen.',
  alternates: { canonical: '/contact' },
}

export default function Contact() {
  return (
    <>
      <PageHeader
        crumb={[{ href: '/', label: 'Accueil' }, { label: 'Contact' }]}
        eyebrow="Nous joindre"
        titre="Contact"
        lede="Une question sur un envoi, un colis en cours, un tarif ? Écrivez-nous ou passez au bureau."
      />

      <Section tone="white">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="text-h3">Bureau de Rouen</h2>
            <dl className="mt-5 flex flex-col gap-4">
              <div>
                <dt className="text-muted text-xs font-bold tracking-[0.09em] uppercase">
                  Adresse
                </dt>
                <dd className="text-body text-ink m-0 mt-1">
                  {site.adresse.rue}
                  <br />
                  {site.adresse.codePostal} {site.adresse.ville}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs font-bold tracking-[0.09em] uppercase">
                  Téléphone et WhatsApp
                </dt>
                <dd className="text-body text-ink m-0 mt-1">
                  <a
                    href={`tel:${site.telephone.replace(/\s/g, '')}`}
                    className="text-orange-text font-semibold"
                  >
                    {site.telephone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs font-bold tracking-[0.09em] uppercase">E-mail</dt>
                <dd className="text-body text-ink m-0 mt-1">
                  <Todo />
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs font-bold tracking-[0.09em] uppercase">
                  Horaires d&apos;ouverture
                </dt>
                <dd className="text-body text-ink m-0 mt-1">
                  {site.horaires.plage}
                  {/* Les jours n'ont pas été communiqués. Les inventer
                      ferait déplacer quelqu'un pour rien. */}
                  <span className="text-caption text-muted mt-1 block">
                    Jours d&apos;ouverture : <Todo />
                  </span>
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                data-cta
                className="rounded-pill bg-whatsapp text-body-sm text-navy inline-flex min-h-11 shrink-0 items-center justify-center px-5 font-semibold no-underline"
              >
                Écrire sur WhatsApp
              </a>
            </div>
          </Card>

          <Card>
            <h2 className="text-h3">Magasin d&apos;Abidjan</h2>
            <dl className="mt-5 flex flex-col gap-4">
              <div>
                <dt className="text-muted text-xs font-bold tracking-[0.09em] uppercase">
                  Adresse
                </dt>
                <dd className="text-body text-ink m-0 mt-1">
                  Angré, face à l&apos;immeuble Konor 2
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs font-bold tracking-[0.09em] uppercase">
                  Pour vous y rendre
                </dt>
                <dd className="text-body text-ink-soft m-0 mt-1">
                  Sur les applications de VTC, cherchez{' '}
                  <strong className="text-navy">« Eni Colis Service Cocody »</strong>.
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs font-bold tracking-[0.09em] uppercase">
                  Horaires d&apos;ouverture
                </dt>
                <dd className="text-body text-ink m-0 mt-1">
                  <Todo />
                </dd>
              </div>
            </dl>
            <p className="text-body-sm text-ink-soft mt-6">
              Les autres points de retrait sont indiqués sur chaque fiche destination.
            </p>
          </Card>
        </div>

        <Alert className="mt-8">
          <b>Pour obtenir un prix,</b> passez plutôt par le formulaire de devis : les photos nous
          permettent de vous répondre bien plus vite.
        </Alert>

        <div className="mt-7">
          <Button href="/devis">Demander un devis</Button>
        </div>
      </Section>
    </>
  )
}
