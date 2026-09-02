import { Topbar } from '@/components/admin/topbar'
import { Button } from '@/components/ui/button'
import { DataTable, Td } from '@/components/ui/data-table'
import { exigerConnexion } from '@/lib/autorisation'
import { formaterJourLong } from '@/lib/dates'
import { clientsActifs } from '@/lib/donnees-admin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Clients' }

export default async function Clients({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await exigerConnexion()
  const { q } = await searchParams
  const clients = await clientsActifs(q)

  return (
    <>
      <Topbar titre="Clients" sousTitre={`${clients.length} clients du service de réception`} />

      <div className="space-y-5 p-4 md:p-6">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label htmlFor="q" className="text-caption text-navy mb-1 block font-semibold">
              Rechercher un client
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q ?? ''}
              placeholder="Identifiant, prénom, e-mail, téléphone…"
              className="border-line-strong text-body focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
            />
          </div>
          <Button type="submit" size="sm">
            Rechercher
          </Button>
          {q ? (
            <Button href="/admin/clients" variant="outline" size="sm">
              Réinitialiser
            </Button>
          ) : null}
        </form>

        {clients.length === 0 ? (
          <div className="border-line rounded-lg border bg-white p-6">
            <p className="text-body-sm text-ink-soft">
              Aucun client ne correspond à cette recherche.
            </p>
          </div>
        ) : (
          <DataTable
            caption="Clients du service de réception"
            head={['Identifiant', 'Nom de livraison', 'Client', 'Retrait', 'Contact', 'Colis']}
          >
            {clients.map((client) => (
              <tr key={client.id}>
                <Td className="text-navy font-bold whitespace-nowrap">{client.numeroClient}</Td>
                <Td>
                  <span className="bg-sand-deep text-navy rounded-sm px-2 py-0.5 font-mono font-bold">
                    {client.nomLivraison}
                  </span>
                  <span className="text-caption text-muted mt-1 block">
                    Inscrit le {formaterJourLong(client.dateInscription)}
                  </span>
                </Td>
                <Td>
                  {client.prenom} {client.nom}
                </Td>
                <Td className="text-muted">
                  {client.villeDestination
                    ? `${client.villeDestination.nom}, ${client.villeDestination.pays.nom}`
                    : '—'}
                </Td>
                <Td className="text-caption">
                  {client.email}
                  <span className="text-muted mt-0.5 block">{client.telephone}</span>
                </Td>
                <Td className="text-center font-bold">{client._count.colis}</Td>
              </tr>
            ))}
          </DataTable>
        )}

        <p className="text-caption text-muted">
          Le <b>nom de livraison</b> est ce que le client saisit dans le champ « Nom » de ses
          commandes. C&apos;est lui qui permet d&apos;identifier un carton marchand à la réception.
        </p>
      </div>
    </>
  )
}
