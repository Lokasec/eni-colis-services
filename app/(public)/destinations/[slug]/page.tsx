import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CtaBand } from '@/components/ui/cta-band'
import { DataTable, Td } from '@/components/ui/data-table'
import { ImageFrame } from '@/components/ui/image-frame'
import { KeyValueList } from '@/components/ui/key-value-list'
import { PageHeader } from '@/components/ui/page-header'
import { Section } from '@/components/ui/section'
import { Todo } from '@/components/ui/todo'
import { DonneesService } from '@/components/donnees-structurees'
import { fichesDestination, paysParSlug } from '@/content/destinations'
import { formaterJourCourt, formaterJourLong } from '@/lib/dates'
import {
  destinationParSlug,
  destinationsPubliques,
  prochainsDeparts,
} from '@/lib/donnees-publiques'

/**
 * Fiche destination.
 *
 * Le texte éditorial vient de content/destinations.ts (validé par la
 * cliente, unique par pays). Les tarifs, les villes et les points de
 * retrait viennent de la base. Rien n'est calculé : les prix affichés sont
 * lus tels quels.
 */

/**
 * Pré-génération des fiches destination.
 *
 * La liste vient de la base : une destination retirée du réseau disparaît
 * du site sans intervention.
 *
 * LE BUILD ÉCHOUE VOLONTAIREMENT si la base est injoignable, et c'est le
 * bon comportement. J'ai essayé l'inverse — renvoyer une liste vide pour
 * que le déploiement passe quand même — et c'était une erreur : le pied de
 * page de TOUTES les pages publiques lit lui aussi les destinations en
 * base. Un build « tolérant » livrerait donc un site au pied de page vide,
 * sans que rien ne le signale. Un déploiement qui échoue se voit ; un
 * déploiement silencieusement amputé, non.
 *
 * Conséquence pratique, notée dans DEPLOIEMENT.md : la base doit être
 * RÉVEILLÉE avant un déploiement. Sur Neon, une instance en veille peut
 * refuser la première connexion.
 */
export async function generateStaticParams() {
  const destinations = await destinationsPubliques()
  return destinations.map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const codeIso = paysParSlug[slug]
  const fiche = codeIso ? fichesDestination[codeIso] : undefined
  if (!fiche) return {}

  return {
    title: fiche.titreSeo,
    description: fiche.metaDescription,
    alternates: { canonical: `/destinations/${fiche.slug}` },
  }
}

export default async function FicheDestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const codeIso = paysParSlug[slug]
  const fiche = codeIso ? fichesDestination[codeIso] : undefined
  const destination = await destinationParSlug(slug)

  if (!fiche || !destination) notFound()

  const departs = (await prochainsDeparts()).filter((d) => d.codeIsoPays === destination.codeIso)

  const tarifAller =
    destination.prixDepuisFrance ?? destination.origineAlternative?.prixAller ?? null
  const tarifRetour =
    destination.prixVersFrance ?? destination.origineAlternative?.prixRetour ?? null
  const origine = destination.origineAlternative?.ville ?? 'France'

  return (
    <>
      <PageHeader
        crumb={[
          { href: '/', label: 'Accueil' },
          { href: '/destinations', label: 'Destinations' },
          { label: destination.villePrincipale },
        ]}
        eyebrow={fiche.surTitre}
        titre={fiche.h1}
        lede={fiche.chapo}
      />

      {/* Informations clés — alimentées par la base */}
      <Section tone="white">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div>
            <h2 className="text-h2 mb-5">Informations clés</h2>
            <KeyValueList
              items={[
                {
                  label: 'Ville d’arrivée',
                  value: destination.villes.map((v) => v.nom).join(' et '),
                },
                {
                  label: `Départ de ${origine}`,
                  value: tarifAller !== null ? `${tarifAller} €/kg` : <Todo />,
                  emphasis: tarifAller !== null,
                },
                {
                  label: `Retour vers ${origine}`,
                  value: tarifRetour !== null ? `${tarifRetour} €/kg` : <Todo />,
                  emphasis: tarifRetour !== null,
                },
                { label: 'Fréquence des départs', value: 'Départs hebdomadaires' },
                { label: 'Délai indicatif', value: <Todo /> },
                {
                  label: 'Points de retrait',
                  value: `${destination.villes.reduce((n, v) => n + v.pointsRetrait.length, 0)} point(s)`,
                },
              ]}
            />
          </div>

          <ImageFrame
            fichier={`destination-${destination.villePrincipale
              .toLowerCase()
              .normalize('NFD')
              .replace(/[̀-ͯ]/g, '')
              .replace(/\s+/g, '-')}.jpg`}
            alt={`${destination.villePrincipale}, ${destination.pays}`}
            ratio="wide"
          />
        </div>
      </Section>

      {/* Texte éditorial — unique à cette destination */}
      <Section tone="sand">
        <div className="text-body text-ink-soft max-w-[70ch] space-y-4">
          {fiche.editorial.map((paragraphe) => (
            <p key={paragraphe.slice(0, 40)}>{paragraphe}</p>
          ))}
        </div>

        {fiche.complement ? (
          <Card className="mt-8 max-w-[70ch]">
            <h2 className="text-h3">{fiche.complement.titre}</h2>
            <p className="text-body-sm text-ink-soft mt-2">{fiche.complement.texte}</p>
          </Card>
        ) : null}
      </Section>

      {/* Ce que nos clients envoient + bon à savoir */}
      <Section tone="white">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="text-h3">
              Ce que nos clients envoient vers {destination.villePrincipale}
            </h2>
            <p className="text-body-sm text-ink-soft mt-2.5">{fiche.envois}</p>
          </Card>
          <Card>
            <h2 className="text-h3">Bon à savoir</h2>
            <p className="text-body-sm text-ink-soft mt-2.5">{fiche.bonASavoir}</p>
          </Card>
        </div>

        {/* Points de retrait */}
        <div className="mt-9">
          <h2 className="text-h2 mb-5">
            {destination.villes.length > 1 ? 'Points de retrait' : 'Point de retrait'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {destination.villes.flatMap((ville) =>
              ville.pointsRetrait.map((point) => (
                <Card key={`${ville.nom}-${point.nom}`} surface="plain">
                  <h3 className="text-h3">{ville.nom}</h3>
                  <p className="text-body-sm text-ink-soft mt-2">
                    {point.adresse ?? <Todo />}
                    {point.reperage ? (
                      <>
                        <br />
                        <span className="text-muted">{point.reperage}</span>
                      </>
                    ) : null}
                  </p>
                  <p className="text-caption text-muted mt-3">
                    Horaires : {point.horaires ?? <Todo />}
                  </p>
                </Card>
              )),
            )}
          </div>
          {destination.villes.length > 1 ? (
            <Alert className="mt-5">
              <b>Deux points de retrait dans ce pays.</b> Indiquez celui qui vous arrange dans votre
              demande de devis : le colis y sera mis à disposition.
            </Alert>
          ) : null}
        </div>
      </Section>

      {/* Prochains départs vers cette destination */}
      <Section tone="sand">
        <h2 className="text-h2 mb-5">Prochains départs vers {destination.villePrincipale}</h2>
        {departs.length === 0 ? (
          <Card>
            <p className="text-body text-ink-soft">
              Aucun départ programmé pour le moment vers cette destination. Contactez-nous pour
              connaître les prochaines dates.
            </p>
          </Card>
        ) : (
          <DataTable
            caption={`Départs vers ${destination.villePrincipale}`}
            head={['Date de départ', 'Clôture des dépôts', 'Tarif', 'Statut']}
          >
            {departs.map((depart) => (
              <tr key={depart.reference}>
                <Td className="text-navy font-bold">
                  <time dateTime={depart.dateDepart.toISOString()}>
                    {formaterJourCourt(depart.dateDepart)}
                  </time>
                </Td>
                <Td>
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
        )}
      </Section>

      <Section tone="white">
        <CtaBand
          titre={fiche.cta}
          texte="Photographiez votre colis, dites-nous où il va. Réponse sous 24 heures, prix ferme, valable sept jours."
          actions={
            <>
              <Button href="/devis" variant="onNavy">
                Demander un devis
              </Button>
              <Button href="/departs" variant="ghostNavy">
                Voir tous les départs
              </Button>
            </>
          }
        />
      </Section>

      {/*
        Le prix balisé est CELUI DE LA BASE, le même que celui affiché
        au-dessus. Un balisage qui annoncerait un autre montant serait
        sanctionné par Google, et surtout mensonger pour le visiteur.
        Absent quand la liaison n'a pas de tarif : mieux vaut pas d'offre
        qu'une offre à zéro euro.
      */}
      {tarifAller !== null ? (
        <DonneesService
          destination={destination.villePrincipale}
          pays={destination.pays}
          prixParKg={tarifAller}
          slug={destination.slug}
        />
      ) : null}
    </>
  )
}
