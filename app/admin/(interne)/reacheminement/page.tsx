import Link from 'next/link'
import { Topbar } from '@/components/admin/topbar'
import { Alert } from '@/components/ui/alert'
import { DataTable, Td } from '@/components/ui/data-table'
import { exigerConnexion } from '@/lib/autorisation'
import { formaterJourLong, joursDepuis } from '@/lib/dates'
import { fileReacheminement } from '@/lib/donnees-admin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Réacheminement' }

/**
 * Colis arrivés au hub, en attente du second segment.
 *
 * Ce statut est INTERNE : côté public, ces colis affichent « En transit ».
 * La page existe parce que sans elle, un colis posé à Abidjan en attente
 * d'un vol vers Cotonou n'apparaît dans aucune file de travail.
 */
export default async function Reacheminement() {
  await exigerConnexion()
  const colis = await fileReacheminement()

  return (
    <>
      <Topbar
        titre="Réacheminement"
        sousTitre={`${colis.length} colis au hub, en attente du second segment`}
      />

      <div className="space-y-5 p-4 md:p-6">
        <Alert>
          <b>Statut interne.</b> Côté client, ces colis affichent « En transit » : le passage par le
          hub ne doit jamais apparaître dans le suivi public.
        </Alert>

        {colis.length === 0 ? (
          <div className="border-line rounded-lg border bg-white p-6">
            <p className="text-body-sm text-ink-soft">Aucun colis en attente de réacheminement.</p>
          </div>
        ) : (
          <DataTable
            caption="Colis en attente de réacheminement"
            head={['Code', 'Destinataire', 'Hub', 'Destination finale', 'Poids', 'Au hub depuis']}
          >
            {colis.map((item) => {
              const arriveeHub = item.historique[0]?.survenuLe ?? item.dateDepartEffectif
              return (
                <tr key={item.id}>
                  <Td>
                    <Link
                      href={`/admin/colis/${item.codeSuivi}`}
                      className="text-navy font-bold no-underline hover:underline"
                    >
                      {item.codeSuivi}
                    </Link>
                  </Td>
                  <Td>{item.destinataireNom}</Td>
                  <Td className="text-muted">{item.villeArrivee.villeTransit?.nom ?? '—'}</Td>
                  <Td className="text-navy font-bold">
                    {item.villeArrivee.nom}
                    <span className="text-caption text-muted mt-0.5 block font-normal">
                      {item.villeArrivee.pays.nom}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap">
                    {item.poidsReel ? `${String(item.poidsReel)} kg` : '—'}
                  </Td>
                  <Td>
                    {arriveeHub ? (
                      <>
                        <b className="text-navy">{joursDepuis(arriveeHub)} jours</b>
                        <span className="text-caption text-muted mt-0.5 block">
                          depuis le {formaterJourLong(arriveeHub)}
                        </span>
                      </>
                    ) : (
                      '—'
                    )}
                  </Td>
                </tr>
              )
            })}
          </DataTable>
        )}
      </div>
    </>
  )
}
