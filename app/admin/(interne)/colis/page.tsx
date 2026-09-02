import Link from 'next/link'
import { Topbar } from '@/components/admin/topbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, Td } from '@/components/ui/data-table'
import { exigerConnexion } from '@/lib/autorisation'
import { formaterJourCourt } from '@/lib/dates'
import { listeColis } from '@/lib/donnees-admin'
import {
  statutsColis,
  statutsPaiement,
  STATUTS_COLIS,
  type StatutColis,
  type StatutPaiement,
} from '@/lib/statuts'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Colis' }

const MODES: Record<string, string> = {
  COMMANDE_EN_LIGNE: 'Commande en ligne',
  DEPOT: 'Dépôt au bureau',
  EXPEDITION: 'Expédition',
}

export default async function Colis({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string }>
}) {
  await exigerConnexion()
  const { q, statut } = await searchParams
  const colis = await listeColis({ recherche: q, statut })

  return (
    <>
      <Topbar
        titre="Colis"
        sousTitre={`${colis.length} colis`}
        actions={
          <Button href="/admin/colis/nouveau" size="sm">
            Enregistrer un colis
          </Button>
        }
      />

      <div className="space-y-5 p-4 md:p-6">
        {/* Recherche en GET : l'URL porte le filtre, donc elle se partage
            et se met en favori. */}
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="q" className="text-caption text-navy mb-1 block font-semibold">
              Rechercher
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q ?? ''}
              placeholder="Code, destinataire, identifiant client…"
              className="border-line-strong text-body focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
            />
          </div>
          <div className="min-w-[190px]">
            <label htmlFor="statut" className="text-caption text-navy mb-1 block font-semibold">
              Statut
            </label>
            <select
              id="statut"
              name="statut"
              defaultValue={statut ?? ''}
              className="border-line-strong text-body focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
            >
              <option value="">Tous</option>
              {STATUTS_COLIS.map((s) => (
                <option key={s} value={s}>
                  {statutsColis[s].label}
                  {statutsColis[s].interne ? ' (interne)' : ''}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" size="sm">
            Filtrer
          </Button>
          {q || statut ? (
            <Button href="/admin/colis" variant="outline" size="sm">
              Réinitialiser
            </Button>
          ) : null}
        </form>

        {colis.length === 0 ? (
          <div className="border-line rounded-lg border bg-white p-6">
            <p className="text-body-sm text-ink-soft">
              Aucun colis ne correspond à cette recherche.
            </p>
          </div>
        ) : (
          <DataTable
            caption="Liste des colis"
            head={['Code', 'Destinataire', 'Destination', 'Mode', 'Poids', 'Statut', 'Paiement']}
          >
            {colis.map((item) => (
              <tr key={item.id}>
                <Td>
                  <Link
                    href={`/admin/colis/${item.codeSuivi}`}
                    className="text-navy font-bold no-underline hover:underline"
                  >
                    {item.codeSuivi}
                  </Link>
                  {item.necessiteReacheminement ? (
                    <span className="text-caption text-muted mt-0.5 block">via hub</span>
                  ) : null}
                </Td>
                <Td>
                  {item.destinataireNom}
                  {item.client ? (
                    <span className="text-caption text-muted mt-0.5 block">
                      {item.client.numeroClient}
                    </span>
                  ) : item.modeReception === 'COMMANDE_EN_LIGNE' ? (
                    <span className="text-caption text-orange-text mt-0.5 block font-semibold">
                      non rattaché
                    </span>
                  ) : null}
                </Td>
                <Td>{item.villeArrivee.nom}</Td>
                <Td className="text-muted">{MODES[item.modeReception]}</Td>
                <Td className="whitespace-nowrap">
                  {item.poidsReel ? `${String(item.poidsReel)} kg` : '—'}
                </Td>
                <Td>
                  <Badge tone={statutsColis[item.statut as StatutColis].tone}>
                    {statutsColis[item.statut as StatutColis].label}
                  </Badge>
                </Td>
                <Td>
                  <Badge tone={statutsPaiement[item.statutPaiement as StatutPaiement].tone}>
                    {statutsPaiement[item.statutPaiement as StatutPaiement].label}
                  </Badge>
                  <span className="text-caption text-muted mt-0.5 block">
                    {formaterJourCourt(item.creeLe)}
                  </span>
                </Td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </>
  )
}
