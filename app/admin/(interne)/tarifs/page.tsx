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
            Ces règles s&apos;appliquent à toute catégorie facturée au poids. Leur modification
            depuis cette page arrive avec le module Paramètres.
          </p>
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
            head={['Origine', 'Destination', 'Prix au kilo', 'Publiée']}
          >
            {liaisons.map((l) => (
              <tr key={l.id}>
                <Td>{l.paysOrigine.nom}</Td>
                <Td className="text-navy font-bold">{l.paysDestination.nom}</Td>
                <Td className="text-orange-text font-extrabold whitespace-nowrap">
                  {Number(l.prixParKg).toFixed(2).replace('.', ',')} €/kg
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
        </section>
      </div>
    </>
  )
}
