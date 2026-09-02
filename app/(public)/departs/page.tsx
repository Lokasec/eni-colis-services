import type { Metadata } from 'next'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CtaBand } from '@/components/ui/cta-band'
import { DataTable, Td } from '@/components/ui/data-table'
import { PageHeader } from '@/components/ui/page-header'
import { Section } from '@/components/ui/section'
import { formaterJourCourt, formaterJourLong } from '@/lib/dates'
import { prochainsDeparts } from '@/lib/donnees-publiques'

export const metadata: Metadata = {
  title: 'Prochains départs',
  description:
    'Calendrier des prochains départs vers l’Afrique et New York, avec les dates de clôture des dépôts. Départs hebdomadaires sur toutes nos destinations.',
  alternates: { canonical: '/departs' },
}

// Le calendrier change tous les jours : on le régénère toutes les heures.
export const revalidate = 3600

export default async function Departs() {
  const departs = await prochainsDeparts()

  return (
    <>
      <PageHeader
        crumb={[{ href: '/', label: 'Accueil' }, { label: 'Départs' }]}
        eyebrow="Calendrier"
        titre="Prochains départs"
        lede="Chaque départ a une date de clôture des dépôts : passé cette date, votre colis part au départ suivant. Déposez en avance pour être sûr d’embarquer."
      />

      <Section tone="white">
        {departs.length === 0 ? (
          <Card>
            <p className="text-body text-ink-soft">
              Aucun départ programmé pour le moment. Contactez-nous pour connaître les prochaines
              dates.
            </p>
            <div className="mt-5">
              <Button href="/contact" size="sm">
                Nous contacter
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <DataTable
              caption="Prochains départs, dates de clôture et tarifs"
              head={[
                'Destination',
                'Pays',
                'Date de départ',
                'Clôture des dépôts',
                'Tarif',
                'Statut',
              ]}
            >
              {departs.map((depart) => (
                <tr key={depart.reference}>
                  <Td className="text-navy font-bold">
                    <span aria-hidden className="mr-2">
                      {depart.drapeau}
                    </span>
                    {depart.destination}
                  </Td>
                  <Td className="text-muted">{depart.pays}</Td>
                  <Td>
                    <time dateTime={depart.dateDepart.toISOString()}>
                      {formaterJourCourt(depart.dateDepart)}
                    </time>
                  </Td>
                  <Td className="text-navy font-bold">
                    <time dateTime={depart.dateClotureDepot.toISOString()}>
                      {formaterJourLong(depart.dateClotureDepot)}
                    </time>
                  </Td>
                  <Td className="text-orange-text font-extrabold whitespace-nowrap">
                    {depart.prixParKg} €/kg
                  </Td>
                  <Td>
                    {depart.complet ? (
                      <Badge tone="complet">Départ complet</Badge>
                    ) : (
                      <Badge tone="disponible">Places disponibles</Badge>
                    )}
                  </Td>
                </tr>
              ))}
            </DataTable>

            <Alert className="mt-6">
              <b>Déposez en avance.</b> Un colis déposé après la date de clôture part au départ
              suivant. Nous vous conseillons de venir deux à trois jours avant la clôture plutôt que
              la veille.
            </Alert>
          </>
        )}
      </Section>

      <Section tone="sand">
        <CtaBand
          titre="Un départ vous intéresse ?"
          texte="Vérifiez le tarif de votre destination, ou demandez un devis si votre colis relève d’un cas particulier."
          actions={
            <>
              <Button href="/devis" variant="onNavy">
                Demander un devis
              </Button>
              <Button href="/tarifs" variant="ghostNavy">
                Voir les tarifs
              </Button>
            </>
          }
        />
      </Section>
    </>
  )
}
