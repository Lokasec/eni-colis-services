import { Topbar } from '@/components/admin/topbar'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { DataTable, Td } from '@/components/ui/data-table'
import { exigerAdmin } from '@/lib/autorisation'
import { formaterJourLong } from '@/lib/dates'
import { db } from '@/lib/db'
import { liaisonsExploitables, paysEtTaux } from '@/lib/donnees-admin'
import { SaisieTaux } from './formulaire'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tarifs' }

/** Un montant nul doit se voir : « 0,00 € » et non un tiret discret. */
function euros(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return '—'
  return `${Number(valeur).toFixed(2).replace('.', ',')} €`
}

export default async function Tarifs() {
  // Rubrique réservée : un OPERATEUR est redirigé, même s'il tape l'URL.
  await exigerAdmin()

  const [liaisons, pays, categories, parametres] = await Promise.all([
    liaisonsExploitables(),
    paysEtTaux(),
    db.categorieArticle.findMany({ orderBy: { ordre: 'asc' } }),
    db.parametresTarification.findUnique({ where: { id: 'singleton' } }),
  ])

  return (
    <>
      <Topbar titre="Tarifs" sousTitre="Prix par liaison, catégories et taux de change" />

      <div className="space-y-7 p-4 md:p-6">
        {/* Taux de change */}
        <section>
          <h2 className="text-h3 mb-3">Taux de change</h2>
          <Alert className="mb-4">
            <b>Le taux est figé à l&apos;émission d&apos;un document.</b> Modifier un taux ici
            n&apos;affecte que les factures à venir : celles déjà émises conservent le leur, et un
            client règle toujours le montant qu&apos;on lui a annoncé.
          </Alert>

          <DataTable
            caption="Taux de change par pays"
            head={['Pays', 'Devise', 'Type', 'Taux', 'Mis à jour', 'Modifier']}
          >
            {pays.map((p) => (
              <tr key={p.id}>
                <Td className="text-navy font-bold">{p.nom}</Td>
                <Td>{p.monnaie}</Td>
                <Td>
                  {p.tauxFixe ? (
                    <Badge tone="arrive">Parité fixe</Badge>
                  ) : (
                    <Badge tone="devisNouveau">Saisi</Badge>
                  )}
                </Td>
                <Td className="font-bold whitespace-nowrap">
                  {p.tauxFixe
                    ? `1 € = ${String(p.tauxFixe)}`
                    : p.tauxManuel
                      ? `1 € = ${String(p.tauxManuel)}`
                      : '—'}
                </Td>
                <Td className="text-caption text-muted">
                  {p.tauxFixe
                    ? 'parité officielle'
                    : p.tauxManuelMajLe
                      ? formaterJourLong(p.tauxManuelMajLe)
                      : 'jamais saisi'}
                </Td>
                <Td>
                  {p.tauxFixe ? (
                    <span className="text-caption text-muted">automatique</span>
                  ) : (
                    <SaisieTaux paysId={p.id} valeur={p.tauxManuel ? String(p.tauxManuel) : ''} />
                  )}
                </Td>
              </tr>
            ))}
          </DataTable>
        </section>

        {/* Paramètres de poids */}
        <section>
          <h2 className="text-h3 mb-3">Poids facturé</h2>
          <div className="border-line bg-line grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Arrondi', `${String(parametres?.pasArrondiPoidsKg ?? '—')} kg supérieur`],
              [
                'Tolérance',
                parametres && Number(parametres.toleranceArrondiKg) > 0
                  ? `${(Number(parametres.toleranceArrondiKg) * 1000).toFixed(0)} g`
                  : 'aucune',
              ],
              ['Minimum facturé', `${String(parametres?.poidsMinimumFactureKg ?? '—')} kg`],
              [
                'Poids volumétrique',
                parametres?.appliquerPoidsVolumetrique
                  ? `L × l × h ÷ ${parametres.diviseurVolumetrique}`
                  : 'désactivé',
              ],
              ['Arrondi des francs CFA', 'au franc entier'],
            ].map(([label, valeur]) => (
              <div key={label} className="bg-white p-4">
                <span className="text-caption text-muted block font-bold tracking-[0.08em] uppercase">
                  {label}
                </span>
                <span className="text-navy mt-1 block font-bold">{valeur}</span>
              </div>
            ))}
          </div>
          <p className="text-caption text-muted mt-2">
            Ces règles s&apos;appliquent à toute catégorie facturée au poids.{' '}
            <b className="text-navy">
              Un colis pesé à 4,050 kg est facturé 4 kg ; à 4,100 kg il passe à 5 kg.
            </b>{' '}
            La tolérance est expliquée sur le document remis au client. Leur modification depuis
            cette page arrive avec le module Paramètres.
          </p>
        </section>

        {/* Politique commerciale */}
        <section>
          <h2 className="text-h3 mb-3">Indemnisation, garde et abandon</h2>
          <Alert tone="warn" className="mb-4">
            <b>La vente aux enchères n&apos;est pas validée juridiquement.</b> Disposer du bien
            d&apos;autrui obéit à une procédure — commissaire de justice, mise en demeure, parfois
            autorisation judiciaire — et la vente aurait lieu à Abidjan, sous droit ivoirien. Les
            délais et les montants ci-dessous sont la décision commerciale de la cliente ; ils
            doivent être relus par un juriste avant de figurer dans les conditions générales.
          </Alert>

          <div className="border-line bg-line grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-3">
            {[
              [
                'Indemnisation, colis ordinaire',
                `${euros(parametres?.plafondIndemnisationParKgEur)} /kg`,
                `Plafonnée à ${euros(parametres?.plafondIndemnisationParColisEur)} par colis. Le tarif le plus élevé de la grille, sous le plafond de la convention de Montréal.`,
              ],
              [
                'Indemnisation, article de valeur',
                parametres?.indemniserValeurDeclareeSiJustifiee
                  ? 'Valeur déclarée'
                  : 'Barème au kilo',
                'Il est déjà facturé un pourcentage de sa valeur : il est couvert à hauteur de cette valeur, sur justificatif d’achat.',
              ],
              [
                'Garde gratuite',
                `${parametres?.delaiGardeGratuiteJours ?? '—'} jours`,
                'À compter de la mise à disposition au point de retrait, pas de l’arrivée du vol.',
              ],
              [
                'Frais de garde',
                `${euros(parametres?.fraisGardeParJourEur)} /jour`,
                parametres?.plafonnerFraisGardeAuTransport
                  ? 'Plafonnés au montant du transport facturé.'
                  : 'Sans plafond. Un colis de 5 kg vers Dakar coûte 60 € de transport ; deux semaines de garde y ajoutent 42 €. Passé un seuil, le destinataire a intérêt à ne plus venir.',
              ],
              [
                'Colis non retiré',
                `${parametres?.delaiAbandonJours ?? '—'} jours`,
                parametres?.sortColisNonRetire === 'VENTE_AUX_ENCHERES'
                  ? 'Mise en vente aux enchères pour se rembourser les frais de stockage. Procédure à faire valider par un juriste avant application.'
                  : 'Sort à définir.',
              ],
              [
                'Remise du colis',
                'Contre paiement',
                'Règle non paramétrable. Sur le mode A, ENI a avancé le transport : la remise est le seul moment où elle peut être payée.',
              ],
            ].map(([label, valeur, note]) => (
              <div key={label} className="flex flex-col bg-white p-4">
                <span className="text-caption text-muted block font-bold tracking-[0.08em] uppercase">
                  {label}
                </span>
                <span className="text-navy mt-1 block text-lg font-extrabold">{valeur}</span>
                <span className="text-caption text-ink-soft mt-2 block">{note}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Catégories */}
        <section>
          <h2 className="text-h3 mb-3">Catégories d&apos;articles</h2>
          <DataTable
            caption="Catégories et modes de calcul"
            head={['Code', 'Libellé', 'Mode de calcul', 'Valeur', 'Devis requis', 'Publiée']}
          >
            {categories.map((c) => (
              <tr key={c.id}>
                <Td className="text-navy font-bold">{c.code}</Td>
                <Td>{c.libelle}</Td>
                <Td className="text-caption text-muted">{c.mode}</Td>
                <Td className="font-bold whitespace-nowrap">
                  {c.valeur === null
                    ? '—'
                    : c.mode === 'POURCENTAGE_VALEUR'
                      ? `${(Number(c.valeur) * 100).toFixed(0)} %`
                      : `${Number(c.valeur).toFixed(2)} €/kg`}
                </Td>
                <Td>{c.devisRequis ? 'Oui' : 'Non'}</Td>
                <Td>{c.publie ? 'Oui' : 'Non — « nous consulter »'}</Td>
              </tr>
            ))}
          </DataTable>
        </section>

        {/* Liaisons */}
        <section>
          <h2 className="text-h3 mb-3">Prix par liaison</h2>
          <Alert className="mb-4">
            <b>Chaque liaison est orientée.</b> L&apos;aller et le retour sont deux lignes
            distinctes, avec chacune son prix : l&apos;une ne se déduit jamais de l&apos;autre.
          </Alert>
          <DataTable
            caption="Prix au kilo par liaison"
            head={['Origine', 'Destination', 'Prix au kilo', "Prix d'achat", 'Publiée']}
          >
            {liaisons.map((l) => (
              <tr key={l.id}>
                <Td>{l.paysOrigine.nom}</Td>
                <Td className="text-navy font-bold">{l.paysDestination.nom}</Td>
                <Td className="text-orange-text font-extrabold whitespace-nowrap">
                  {Number(l.prixParKg).toFixed(2).replace('.', ',')} €/kg
                </Td>
                <Td className="text-caption whitespace-nowrap">
                  {!l.sousTraitee ? (
                    <span className="text-muted">opérée par ENI</span>
                  ) : l.prixAchat === null ? (
                    <b className="text-orange-text">marge inconnue</b>
                  ) : (
                    <>
                      {Number(l.prixAchat).toFixed(2).replace('.', ',')} €/kg
                      <span className="text-muted block">
                        marge{' '}
                        {(Number(l.prixParKg) - Number(l.prixAchat)).toFixed(2).replace('.', ',')}{' '}
                        €/kg
                      </span>
                    </>
                  )}
                </Td>
                <Td>
                  {l.afficheePubliquement ? (
                    <Badge tone="disponible">Publiée</Badge>
                  ) : (
                    <Badge tone="retire">Interne</Badge>
                  )}
                </Td>
              </tr>
            ))}
          </DataTable>
          <p className="text-caption text-muted mt-2">
            Les liaisons marquées « interne » n&apos;apparaissent ni sur le site, ni dans les
            sélecteurs du formulaire de devis, ni dans le plan du site.
          </p>
          <Alert tone="warn" className="mt-3">
            <b>Brazzaville et Kinshasa sont sous-traitées et leur marge est inconnue.</b> Le prix
            payé au partenaire n&apos;a pas été communiqué : ces deux destinations peuvent être
            vendues à perte sans que rien ici ne le montre. Renseigner ce prix d&apos;achat est le
            seul moyen de le savoir — il n&apos;est pas estimé, il est laissé vide.
          </Alert>
        </section>
      </div>
    </>
  )
}
