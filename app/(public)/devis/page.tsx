import type { Metadata } from 'next'
import { Alert } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/page-header'
import { Section } from '@/components/ui/section'
import { optionsTrajet } from '@/lib/donnees-publiques'
import { FormulaireDevis } from './formulaire'

export const metadata: Metadata = {
  title: 'Demander un devis',
  description:
    'Décrivez votre colis, joignez une à trois photos, recevez un prix ferme sous 24 heures, valable sept jours.',
  alternates: { canonical: '/devis' },
}

export default async function Devis() {
  const options = await optionsTrajet()

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

        <div className="mt-7">
          <FormulaireDevis options={options} />
        </div>

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
