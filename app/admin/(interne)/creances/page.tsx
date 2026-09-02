import Link from 'next/link'
import { Topbar } from '@/components/admin/topbar'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { DataTable, Td } from '@/components/ui/data-table'
import { exigerAdmin } from '@/lib/autorisation'
import { formaterJourLong, joursDepuis } from '@/lib/dates'
import { creances } from '@/lib/donnees-admin'
import { statutsColis, type StatutColis } from '@/lib/statuts'
import { BoutonRelance } from './formulaire'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Créances' }

/**
 * Colis partis et non payés.
 *
 * Module critique du mode A : sur ces envois, l'entreprise a AVANCÉ le
 * transport et ne sera payée qu'au retrait (CLAUDE.md §5.4). L'ancienneté
 * court à partir du départ effectif, pas de l'émission de la facture.
 */
export default async function Creances() {
  // Rubrique réservée : un OPERATEUR est redirigé, même s'il tape l'URL.
  await exigerAdmin()
  const lignes = await creances()

  const totalEur = lignes.reduce((total, l) => total + Number(l.montantEur), 0)
  const plusAncienne = lignes
    .map((l) => l.colis?.dateDepartEffectif)
    .filter((d): d is Date => d instanceof Date)
    .sort((a, b) => a.getTime() - b.getTime())[0]

  return (
    <>
      <Topbar titre="Créances" sousTitre={`${lignes.length} facture(s) non soldée(s)`} />

      <div className="space-y-5 p-4 md:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="border-orange bg-sand rounded-lg border p-5">
            <span className="text-caption text-muted block font-bold tracking-[0.08em] uppercase">
              Total dû
            </span>
            <span className="text-orange-text mt-2 block text-[2rem] leading-none font-extrabold">
              {totalEur.toFixed(2).replace('.', ',')} €
            </span>
          </div>
          <div className="border-line rounded-lg border bg-white p-5">
            <span className="text-caption text-muted block font-bold tracking-[0.08em] uppercase">
              Colis concernés
            </span>
            <span className="text-navy mt-2 block text-[2rem] leading-none font-extrabold">
              {lignes.length}
            </span>
          </div>
          <div className="border-line rounded-lg border bg-white p-5">
            <span className="text-caption text-muted block font-bold tracking-[0.08em] uppercase">
              Plus ancienne
            </span>
            <span className="text-navy mt-2 block text-[2rem] leading-none font-extrabold">
              {plusAncienne ? `${joursDepuis(plusAncienne)} j` : '—'}
            </span>
            {plusAncienne ? (
              <span className="text-caption text-muted mt-1 block">
                depuis le {formaterJourLong(plusAncienne)}
              </span>
            ) : null}
          </div>
        </div>

        <Alert>
          <b>Le colis est remis contre paiement.</b> Sur le mode « commande en ligne »,
          l&apos;entreprise a avancé le transport : l&apos;ancienneté court à partir du départ
          effectif, pas de l&apos;émission de la facture.
        </Alert>

        {lignes.length === 0 ? (
          <div className="border-line rounded-lg border bg-white p-6">
            <p className="text-body-sm text-ink-soft">
              Aucune créance ouverte. Toutes les factures émises sont soldées.
            </p>
          </div>
        ) : (
          <DataTable
            caption="Factures non soldées"
            head={['Facture', 'Colis', 'Reste dû', 'Statut du colis', 'Parti depuis', 'Relance']}
          >
            {lignes.map((ligne) => {
              const anciennete = ligne.colis?.dateDepartEffectif
                ? joursDepuis(ligne.colis.dateDepartEffectif)
                : null
              return (
                <tr key={ligne.id}>
                  <Td className="text-navy font-bold whitespace-nowrap">
                    {ligne.numero}
                    <span className="text-caption text-muted mt-0.5 block font-normal">
                      émise le {formaterJourLong(ligne.dateEmission)}
                    </span>
                  </Td>
                  <Td>
                    {ligne.colis ? (
                      <Link
                        href={`/admin/colis/${ligne.colis.codeSuivi}`}
                        className="text-navy font-semibold no-underline hover:underline"
                      >
                        {ligne.colis.codeSuivi}
                      </Link>
                    ) : (
                      '—'
                    )}
                    <span className="text-caption text-muted mt-0.5 block">
                      {ligne.colis?.destinataireNom}
                      {ligne.colis?.client ? ` · ${ligne.colis.client.numeroClient}` : ''}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap">
                    <b className="text-orange-text">
                      {Number(ligne.montantEur).toFixed(2).replace('.', ',')} €
                    </b>
                    {ligne.montantDevise ? (
                      <span className="text-caption text-muted mt-0.5 block">
                        {Number(ligne.montantDevise).toFixed(0)} {ligne.devise}
                      </span>
                    ) : null}
                    {ligne.dejaRegle > 0 ? (
                      <span className="text-caption text-success mt-0.5 block">
                        déjà réglé : {ligne.dejaRegle.toFixed(2).replace('.', ',')}
                      </span>
                    ) : null}
                  </Td>
                  <Td>
                    {ligne.colis ? (
                      <Badge tone={statutsColis[ligne.colis.statut as StatutColis].tone}>
                        {statutsColis[ligne.colis.statut as StatutColis].label}
                      </Badge>
                    ) : null}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {anciennete !== null ? (
                      <b className={anciennete >= 30 ? 'text-error' : 'text-navy'}>
                        {anciennete} j
                      </b>
                    ) : (
                      <span className="text-muted">pas encore parti</span>
                    )}
                  </Td>
                  <Td>
                    {ligne.colis?.client?.email ? (
                      <BoutonRelance documentId={ligne.id} />
                    ) : (
                      <span className="text-caption text-muted">pas d&apos;adresse</span>
                    )}
                  </Td>
                </tr>
              )
            })}
          </DataTable>
        )}

        <p className="text-caption text-muted">
          Le délai de garde, les frais applicables au-delà et le sort d&apos;un colis jamais retiré
          restent à arbitrer avec la cliente.
        </p>
      </div>
    </>
  )
}
