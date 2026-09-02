import Link from 'next/link'
import { Topbar } from '@/components/admin/topbar'
import { Badge } from '@/components/ui/badge'
import { DataTable, Td } from '@/components/ui/data-table'
import { exigerConnexion } from '@/lib/autorisation'
import { formaterJourLong, joursDepuis } from '@/lib/dates'
import { demandesDevis } from '@/lib/donnees-admin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Devis' }

const STATUTS: Record<
  string,
  { label: string; tone: 'devisNouveau' | 'devisChiffre' | 'arrive' | 'litige' | 'retire' }
> = {
  NOUVELLE: { label: 'À chiffrer', tone: 'devisNouveau' },
  CHIFFREE: { label: 'Chiffrée', tone: 'devisChiffre' },
  ENVOYEE: { label: 'Envoyée', tone: 'devisChiffre' },
  ACCEPTEE: { label: 'Acceptée', tone: 'arrive' },
  REFUSEE: { label: 'Refusée', tone: 'litige' },
  EXPIREE: { label: 'Expirée', tone: 'retire' },
  CONVERTIE: { label: 'Convertie', tone: 'retire' },
}

export default async function Devis({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>
}) {
  await exigerConnexion()
  const { statut } = await searchParams
  const demandes = await demandesDevis(statut)

  return (
    <>
      <Topbar titre="Devis" sousTitre={`${demandes.length} demandes`} />

      <div className="space-y-5 p-4 md:p-6">
        <nav className="flex flex-wrap gap-2">
          {[
            ['', 'Toutes'],
            ['NOUVELLE', 'À chiffrer'],
            ['CHIFFREE', 'Chiffrées'],
            ['ENVOYEE', 'Envoyées'],
          ].map(([valeur, libelle]) => (
            <Link
              key={libelle}
              href={valeur ? `/admin/devis?statut=${valeur}` : '/admin/devis'}
              className={`text-caption flex min-h-11 items-center rounded-md border px-3 font-semibold no-underline ${
                (statut ?? '') === valeur
                  ? 'border-orange bg-sand text-navy'
                  : 'border-line text-ink-soft hover:bg-sand bg-white'
              }`}
            >
              {libelle}
            </Link>
          ))}
        </nav>

        {demandes.length === 0 ? (
          <div className="border-line rounded-lg border bg-white p-6">
            <p className="text-body-sm text-ink-soft">Aucune demande dans cette catégorie.</p>
          </div>
        ) : (
          <DataTable
            caption="Demandes de devis"
            head={['Référence', 'Demandeur', 'Trajet', 'Nature', 'Photos', 'Attente', 'Statut']}
          >
            {demandes.map((demande) => (
              <tr key={demande.id}>
                <Td>
                  <Link
                    href={`/admin/devis/${demande.reference}`}
                    className="text-navy font-bold no-underline hover:underline"
                  >
                    {demande.reference}
                  </Link>
                  {demande.documents[0] ? (
                    <span className="text-caption text-muted mt-0.5 block">
                      {demande.documents[0].numero} ·{' '}
                      {Number(demande.documents[0].montantEur).toFixed(2).replace('.', ',')} €
                    </span>
                  ) : null}
                </Td>
                <Td>
                  {demande.nom}
                  <span className="text-caption text-muted mt-0.5 block">{demande.email}</span>
                </Td>
                <Td className="text-caption">
                  {demande.villeDepart} → <b className="text-navy">{demande.villeArrivee}</b>
                </Td>
                <Td className="text-muted text-caption">{demande.categorie?.libelle ?? '—'}</Td>
                <Td className="text-center">{demande._count.photos}</Td>
                <Td className="whitespace-nowrap">
                  <b
                    className={joursDepuis(demande.creeLe) >= 1 ? 'text-orange-text' : 'text-navy'}
                  >
                    {joursDepuis(demande.creeLe)} j
                  </b>
                  <span className="text-caption text-muted mt-0.5 block">
                    {formaterJourLong(demande.creeLe)}
                  </span>
                </Td>
                <Td>
                  <Badge tone={STATUTS[demande.statut]?.tone ?? 'devisNouveau'}>
                    {STATUTS[demande.statut]?.label ?? demande.statut}
                  </Badge>
                </Td>
              </tr>
            ))}
          </DataTable>
        )}

        <p className="text-caption text-muted">
          Le délai annoncé au client est de <b>24 heures</b>. Les demandes qui dépassent une journée
          d&apos;attente apparaissent en orange.
        </p>
      </div>
    </>
  )
}
