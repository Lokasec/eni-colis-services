import { Topbar } from '@/components/admin/topbar'
import { DataTable, Td } from '@/components/ui/data-table'
import { exigerAdmin } from '@/lib/autorisation'
import { formaterJourLong } from '@/lib/dates'
import { creances, listeEncaissements } from '@/lib/donnees-admin'
import { SaisieEncaissement } from './formulaire'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Encaissements' }

const LIEUX: Record<string, string> = { FRANCE: 'France', ABIDJAN: 'Abidjan', AUTRE: 'Autre' }
const MOYENS: Record<string, string> = {
  ESPECES: 'Espèces',
  VIREMENT: 'Virement',
  MOBILE_MONEY: 'Mobile money',
  CARTE: 'Carte',
  AUTRE: 'Autre',
}

export default async function Encaissements() {
  // Rubrique réservée : un OPERATEUR est redirigé, même s'il tape l'URL.
  await exigerAdmin()
  const [saisies, aRegler] = await Promise.all([listeEncaissements(), creances()])

  return (
    <>
      <Topbar titre="Encaissements" sousTitre={`${saisies.length} règlements enregistrés`} />

      <div className="space-y-6 p-4 md:p-6">
        <SaisieEncaissement
          factures={aRegler.map((f) => ({
            id: f.id,
            etiquette: `${f.numero} — ${f.colis?.codeSuivi ?? ''} · reste ${f.resteDu.toFixed(2)} ${f.devise}`,
            devise: f.devise,
            resteDu: f.resteDu.toFixed(2),
          }))}
        />

        {saisies.length === 0 ? (
          <div className="border-line rounded-lg border bg-white p-6">
            <p className="text-body-sm text-ink-soft">Aucun encaissement enregistré.</p>
          </div>
        ) : (
          <DataTable
            caption="Encaissements"
            head={['Date', 'Facture', 'Colis', 'Montant', 'Lieu', 'Moyen', 'Saisi par']}
          >
            {saisies.map((e) => (
              <tr key={e.id}>
                <Td className="text-caption whitespace-nowrap">
                  {formaterJourLong(e.dateEncaissement)}
                </Td>
                <Td className="text-navy font-bold whitespace-nowrap">{e.document.numero}</Td>
                <Td className="text-caption">{e.document.colis?.codeSuivi ?? '—'}</Td>
                <Td className="text-orange-text font-extrabold whitespace-nowrap">
                  {Number(e.montant).toFixed(2).replace('.', ',')} {e.devise}
                </Td>
                <Td>{LIEUX[e.lieu] ?? e.lieu}</Td>
                <Td className="text-muted">{MOYENS[e.moyen] ?? e.moyen}</Td>
                <Td className="text-caption text-muted">{e.operateur?.nom ?? '—'}</Td>
              </tr>
            ))}
          </DataTable>
        )}

        <p className="text-caption text-muted">
          Le taux appliqué à un encaissement est <b>recopié de la facture</b>, jamais recalculé : un
          client règle le montant qu&apos;on lui a annoncé, même si la parité a changé depuis.
        </p>
      </div>
    </>
  )
}
