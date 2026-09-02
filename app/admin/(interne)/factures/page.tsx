import { Topbar } from '@/components/admin/topbar'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, Td } from '@/components/ui/data-table'
import { exigerAdmin } from '@/lib/autorisation'
import { formaterJourLong } from '@/lib/dates'
import { colisAFacturer, listeFactures } from '@/lib/donnees-admin'
import { EmissionFacture } from './formulaire'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Factures' }

export default async function Factures() {
  // Rubrique réservée : un OPERATEUR est redirigé, même s'il tape l'URL.
  await exigerAdmin()
  const [factures, colis] = await Promise.all([listeFactures(), colisAFacturer()])

  const numeros = factures.map((f) => Number(f.numero.split('-')[2])).sort((a, b) => a - b)
  const continu = numeros.every((n, i) => n === i + 1)

  return (
    <>
      <Topbar
        titre="Factures"
        sousTitre={`${factures.length} factures émises`}
        actions={
          <Button href="/admin/factures/export" size="sm" variant="outline">
            Export comptable
          </Button>
        }
      />

      <div className="space-y-6 p-4 md:p-6">
        <Alert tone={continu ? 'info' : 'warn'}>
          {continu ? (
            <>
              <b>Numérotation continue.</b> {factures.length} facture
              {factures.length > 1 ? 's' : ''} émise{factures.length > 1 ? 's' : ''}, sans trou dans
              la séquence. Le compteur est incrémenté dans la même transaction que la facture.
            </>
          ) : (
            <>
              <b>Trou détecté dans la numérotation.</b> La séquence des factures doit être continue.
              Vérifiez avant toute clôture comptable.
            </>
          )}
        </Alert>

        <EmissionFacture
          colis={colis.map((c) => ({
            id: c.id,
            etiquette: `${c.codeSuivi} — ${c.destinataireNom} · ${c.villeArrivee.nom}${c.poidsReel ? ` · ${String(c.poidsReel)} kg` : ' · non pesé'}`,
            paiementArrivee: c.momentPaiement === 'ARRIVEE',
            devisePays: c.villeArrivee.pays.monnaie,
          }))}
        />

        {factures.length === 0 ? (
          <div className="border-line rounded-lg border bg-white p-6">
            <p className="text-body-sm text-ink-soft">Aucune facture émise.</p>
          </div>
        ) : (
          <DataTable
            caption="Factures émises"
            head={['Numéro', 'Colis', 'Montant', 'Devise locale', 'Émise le', 'Règlement']}
          >
            {factures.map((facture) => (
              <tr key={facture.id}>
                <Td className="whitespace-nowrap">
                  <a
                    href={`/admin/documents/${facture.numero}/pdf`}
                    target="_blank"
                    rel="noopener"
                    className="text-navy font-bold no-underline hover:underline"
                  >
                    {facture.numero}
                  </a>
                  <span className="text-caption text-muted mt-0.5 block">PDF</span>
                </Td>
                <Td>
                  {facture.colis?.codeSuivi ?? '—'}
                  <span className="text-caption text-muted mt-0.5 block">
                    {facture.colis?.destinataireNom}
                  </span>
                </Td>
                <Td className="text-orange-text font-extrabold whitespace-nowrap">
                  {Number(facture.montantEur).toFixed(2).replace('.', ',')} €
                </Td>
                <Td className="whitespace-nowrap">
                  {facture.montantDevise ? (
                    <>
                      <b className="text-navy">
                        {Number(facture.montantDevise).toFixed(0)} {facture.devise}
                      </b>
                      <span className="text-caption text-muted mt-0.5 block">
                        taux {String(facture.tauxApplique)} — figé
                      </span>
                    </>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </Td>
                <Td className="text-caption">{formaterJourLong(facture.dateEmission)}</Td>
                <Td>
                  {facture.dateReglement ? (
                    <Badge tone="disponible">Soldée</Badge>
                  ) : facture.encaissements.length > 0 ? (
                    <Badge tone="enTransit">Partielle</Badge>
                  ) : (
                    <Badge tone="litige">Non réglée</Badge>
                  )}
                </Td>
              </tr>
            ))}
          </DataTable>
        )}

        <p className="text-caption text-muted">
          Toutes les factures portent la mention « TVA non applicable, art. 293 B du CGI ». Aucun
          montant de TVA n&apos;apparaît nulle part — l&apos;activité est en franchise.
        </p>
      </div>
    </>
  )
}
