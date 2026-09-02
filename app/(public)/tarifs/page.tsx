import type { Metadata } from 'next'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DataTable, Td } from '@/components/ui/data-table'
import { PageHeader } from '@/components/ui/page-header'
import { Section } from '@/components/ui/section'
import { SectionHeading } from '@/components/ui/section-heading'
import { grilleTarifaire } from '@/lib/donnees-publiques'

export const metadata: Metadata = {
  title: 'Nos tarifs au kilo par destination',
  description:
    'Tarifs affichés de 12 à 20 € le kilo selon la destination et le sens de l’envoi. Pièces détachées à 20 €/kg. Le montant exact est confirmé par devis.',
  alternates: { canonical: '/tarifs' },
}

export default async function Tarifs() {
  const destinations = await grilleTarifaire()

  return (
    <>
      <PageHeader
        crumb={[{ href: '/', label: 'Accueil' }, { label: 'Tarifs' }]}
        eyebrow="Combien ça coûte"
        titre="Nos tarifs"
        lede="Nos tarifs varient selon la destination, le sens de l’envoi et la nature du colis. Les prix ci-dessous sont des tarifs d’entrée : le montant exact vous est confirmé par devis, après examen des photos de votre colis."
      />

      <Section tone="white">
        <h2 className="text-h2 mb-5">Grille par destination</h2>

        <DataTable
          caption="Tarifs au kilo par destination et par sens"
          head={['Destination', 'Pays', 'Départ de France', 'Retour vers la France']}
        >
          {destinations.map((destination) => (
            <tr key={destination.slug}>
              <Td className="text-navy font-bold">
                <span aria-hidden className="mr-2">
                  {destination.drapeau}
                </span>
                {destination.villePrincipale}
              </Td>
              <Td className="text-muted">
                {destination.origineAlternative
                  ? `depuis ${destination.origineAlternative.ville}`
                  : destination.pays}
              </Td>
              <Td className="text-orange-text font-extrabold whitespace-nowrap">
                {destination.prixDepuisFrance !== null
                  ? `${destination.prixDepuisFrance} €/kg`
                  : destination.origineAlternative
                    ? `${destination.origineAlternative.prixAller} €/kg`
                    : '—'}
              </Td>
              <Td className="text-orange-text font-extrabold whitespace-nowrap">
                {destination.prixVersFrance !== null
                  ? `${destination.prixVersFrance} €/kg`
                  : destination.origineAlternative?.prixRetour
                    ? `${destination.origineAlternative.prixRetour} €/kg`
                    : '—'}
              </Td>
            </tr>
          ))}
        </DataTable>

        <p className="text-body-sm text-muted mt-4">
          Tarifs au kilogramme, en euros, pour les colis standard. Le tarif exact dépend du poids
          réel, de l&apos;encombrement et de la nature du contenu.
        </p>
      </Section>

      <Section tone="sand">
        <h2 className="text-h2 mb-5">Tarifs spécifiques par nature de colis</h2>

        <DataTable
          caption="Tarification selon la nature du colis"
          head={['Nature du colis', 'Tarification']}
        >
          <tr>
            <Td className="text-navy font-bold">Colis standard</Td>
            <Td>Tarif de la destination, au kilo</Td>
          </tr>
          <tr>
            <Td className="text-navy font-bold">Pièces détachées</Td>
            <Td>20 €/kg, toutes destinations, les deux sens</Td>
          </tr>
          <tr>
            <Td className="text-navy font-bold">Matériel électronique</Td>
            <Td>À l&apos;unité — nous consulter</Td>
          </tr>
          <tr>
            <Td className="text-navy font-bold">Articles de valeur</Td>
            <Td>15 % de la valeur d&apos;achat</Td>
          </tr>
        </DataTable>

        <Alert className="mt-6">
          <b>Le poids facturé est arrondi au kilo supérieur</b>, avec un minimum d&apos;un kilo.
          Pour un colis volumineux mais léger, c&apos;est l&apos;encombrement qui détermine le poids
          retenu. Votre devis détaille toujours le calcul.
        </Alert>
      </Section>

      <Section tone="white">
        <SectionHeading
          eyebrow="Notre méthode"
          title="Pourquoi nous ne calculons pas votre prix en ligne"
          className="mb-6"
        />
        <div className="text-body text-ink-soft max-w-[70ch] space-y-4">
          <p>
            Un colis n&apos;est pas seulement un poids. Un carton volumineux mais léger occupe la
            place de plusieurs colis compacts en soute. Un appareil électronique demande un
            conditionnement particulier. Une pièce détachée peut être soumise à restriction.
          </p>
          <p>
            C&apos;est pourquoi nous préférons{' '}
            <strong className="text-navy">voir votre colis avant de vous annoncer un prix</strong>.
            Vous nous envoyez des photos, nous vous répondons sous 24 heures avec un montant ferme.
            Pas d&apos;estimation approximative, pas de mauvaise surprise au comptoir.
          </p>
        </div>
        <div className="mt-7">
          <Button href="/devis">Demander mon devis</Button>
        </div>
      </Section>
    </>
  )
}
