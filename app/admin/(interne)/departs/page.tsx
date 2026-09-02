import { Topbar } from '@/components/admin/topbar'
import { Badge } from '@/components/ui/badge'
import { DataTable, Td } from '@/components/ui/data-table'
import { exigerConnexion } from '@/lib/autorisation'
import { formaterJourLong } from '@/lib/dates'
import { liaisonsExploitables, listeDeparts } from '@/lib/donnees-admin'
import { CreationDepart, StatutDepart } from './formulaires'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Départs' }

const STATUTS: Record<
  string,
  {
    label: string
    tone: 'devisNouveau' | 'devisChiffre' | 'enTransit' | 'arrive' | 'complet' | 'retire'
  }
> = {
  PLANIFIE: { label: 'Planifié', tone: 'devisChiffre' },
  DEPOTS_OUVERTS: { label: 'Dépôts ouverts', tone: 'arrive' },
  CLOTURE_DEPOTS: { label: 'Dépôts clos', tone: 'enTransit' },
  COMPLET: { label: 'Complet', tone: 'complet' },
  PARTI: { label: 'Parti', tone: 'enTransit' },
  ARRIVE: { label: 'Arrivé', tone: 'retire' },
}

export default async function Departs() {
  await exigerConnexion()
  const [departs, liaisons] = await Promise.all([listeDeparts(), liaisonsExploitables()])

  return (
    <>
      <Topbar titre="Départs" sousTitre={`${departs.length} départs enregistrés`} />

      <div className="space-y-6 p-4 md:p-6">
        <CreationDepart
          liaisons={liaisons.map((l) => ({
            id: l.id,
            etiquette: `${l.paysOrigine.nom} → ${l.paysDestination.nom} · ${String(l.prixParKg)} €/kg${l.afficheePubliquement ? '' : ' (non publiée)'}`,
          }))}
        />

        {departs.length === 0 ? (
          <div className="border-line rounded-lg border bg-white p-6">
            <p className="text-body-sm text-ink-soft">Aucun départ enregistré.</p>
          </div>
        ) : (
          <DataTable
            caption="Départs"
            head={['Référence', 'Liaison', 'Clôture des dépôts', 'Départ', 'Colis', 'Statut']}
          >
            {departs.map((depart) => (
              <tr key={depart.id}>
                <Td className="text-navy font-bold">{depart.reference}</Td>
                <Td>
                  {depart.liaison.paysOrigine.nom} → {depart.liaison.paysDestination.nom}
                  <span className="text-caption text-muted mt-0.5 block">
                    {String(depart.liaison.prixParKg)} €/kg
                  </span>
                </Td>
                <Td>{formaterJourLong(depart.dateClotureDepot)}</Td>
                <Td className="text-navy font-bold">{formaterJourLong(depart.dateDepart)}</Td>
                <Td className="text-center">{depart._count.colis}</Td>
                <Td>
                  <Badge tone={STATUTS[depart.statut]?.tone ?? 'devisNouveau'}>
                    {STATUTS[depart.statut]?.label ?? depart.statut}
                  </Badge>
                  <div className="mt-2">
                    <StatutDepart departId={depart.id} statut={depart.statut} />
                  </div>
                </Td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </>
  )
}
