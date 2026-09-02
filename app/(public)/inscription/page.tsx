import type { Metadata } from 'next'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Section } from '@/components/ui/section'
import { site, whatsappLink } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Obtenir mon adresse en France',
  description:
    'Inscrivez-vous au service de réception : vous recevez un identifiant et une adresse de livraison en France à utiliser sur les sites marchands.',
  alternates: { canonical: '/inscription' },
}

export default function Inscription() {
  return (
    <>
      <PageHeader
        crumb={[
          { href: '/', label: 'Accueil' },
          { href: '/recevoir', label: 'Recevoir mes achats' },
          { label: 'Inscription' },
        ]}
        eyebrow="Deux minutes"
        titre="Obtenez votre adresse en France"
        lede="Vous recevez immédiatement votre numéro client et l’adresse exacte à saisir dans vos commandes. L’inscription est gratuite."
      />

      <Section tone="white" containerClassName="max-w-[760px]">
        <Card surface="plain">
          <h2 className="text-h3">Formulaire en cours d&apos;intégration</h2>
          <p className="text-body-sm text-ink-soft mt-2">
            L&apos;inscription en ligne — attribution automatique de votre identifiant et affichage
            de votre bloc d&apos;adresse prêt à copier — est développée au lot suivant. En
            attendant, écrivez-nous : nous vous attribuons votre identifiant manuellement, le jour
            même.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={whatsappLink(
                'Bonjour, je souhaite obtenir une adresse de livraison en France pour mes commandes.',
              )}
              target="_blank"
              rel="noopener noreferrer"
              data-cta
              className="rounded-pill bg-whatsapp text-body-sm text-navy inline-flex min-h-11 shrink-0 items-center justify-center px-5 font-semibold no-underline"
            >
              M&apos;inscrire par WhatsApp
            </a>
            <Button href="/contact" variant="outline" size="sm">
              Autres moyens de nous joindre
            </Button>
          </div>
        </Card>

        <div className="mt-11">
          <h2 className="text-h2">Ce que nous vous demanderons</h2>
          <ul className="border-line bg-line mt-5 grid list-none gap-px overflow-hidden rounded-lg border p-0 sm:grid-cols-2">
            {[
              ['Prénom et nom', 'Votre prénom sert à composer votre identifiant.'],
              ['Téléphone', 'Nous vous joignons aussi sur WhatsApp.'],
              ['E-mail', 'Celui que vous utiliserez chez les marchands.'],
              ['Pays et ville de retrait', 'Là où vous viendrez chercher vos colis.'],
            ].map(([titre, detail]) => (
              <li key={titre} className="bg-white p-5">
                <h3 className="text-body-sm text-navy mb-1 font-bold">{titre}</h3>
                <p className="text-body-sm text-ink-soft">{detail}</p>
              </li>
            ))}
          </ul>
        </div>

        <Alert className="mt-8">
          <b>Votre identifiant est ce qui rend votre colis reconnaissable.</b> Il s&apos;écrit dans
          le champ « Nom » de vos commandes, sous la forme « Eni », votre prénom, votre numéro. Sans
          lui, un carton marchand arrive chez nous sans nom — et le local est partagé.
        </Alert>

        <div className="border-line bg-sand mt-8 rounded-lg border p-6">
          <h2 className="text-h3">L&apos;adresse que vous recevrez</h2>
          <div className="border-line text-caption text-navy mt-4 rounded-md border bg-white px-5 py-4.5 font-mono leading-[1.9]">
            <span className="text-muted">Nom :</span>{' '}
            <b className="bg-sand-deep rounded-sm px-1.5 py-0.5">Eni Prénom NN</b>
            <br />
            <span className="text-muted">Prénom :</span> colis service
            <br />
            <span className="text-muted">Adresse :</span> {site.adresse.rue}
            <br />
            <span className="text-muted">Code postal :</span> {site.adresse.codePostal}
            <br />
            <span className="text-muted">Ville :</span> {site.adresse.ville}
            <br />
            <span className="text-muted">Département :</span> Seine-Maritime
            <br />
            <span className="text-muted">Téléphone :</span> {site.telephone}
            <br />
            <span className="text-muted">E-mail :</span> le vôtre
          </div>
          <p className="mt-4">
            <Button href="/recevoir" variant="outline" size="sm">
              Comment ça marche
            </Button>
          </p>
        </div>
      </Section>
    </>
  )
}
