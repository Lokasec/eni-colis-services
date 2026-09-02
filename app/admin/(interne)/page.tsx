import { StatCard } from '@/components/admin/stat-card'
import { Topbar } from '@/components/admin/topbar'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { exigerConnexion } from '@/lib/autorisation'
import { formaterJourCourt, joursDepuis } from '@/lib/dates'
import { fileReceptions, tableauDeBord } from '@/lib/donnees-admin'

export const dynamic = 'force-dynamic'

export default async function TableauDeBord({
  searchParams,
}: {
  searchParams: Promise<{ acces?: string }>
}) {
  const utilisateur = await exigerConnexion()
  const { acces } = await searchParams
  const [bord, receptions] = await Promise.all([tableauDeBord(), fileReceptions()])

  const estAdmin = utilisateur.role === 'ADMIN'

  return (
    <>
      <Topbar
        titre={`Bonjour, ${utilisateur.nom.split(' ')[0]}`}
        sousTitre={estAdmin ? 'Vue complète de l’exploitation' : 'Réceptions, colis et départs'}
        actions={
          <Button href="/admin/colis/nouveau" size="sm">
            Enregistrer un colis
          </Button>
        }
      />

      <div className="space-y-8 p-4 md:p-6">
        {acces === 'refuse' ? (
          <Alert tone="warn">
            <b>Accès refusé.</b> Cette rubrique est réservée aux administrateurs. Votre compte est
            enregistré comme opérateur.
          </Alert>
        ) : null}

        {/* Ce qui demande une action aujourd'hui */}
        <section>
          <h2 className="text-caption text-muted mb-3 font-bold tracking-[0.09em] uppercase">
            À traiter aujourd&apos;hui
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Colis non rattachés"
              valeur={bord.colisNonRattaches}
              detail={
                bord.colisNonRattaches > 0 ? 'Cartons sans client identifié' : 'Rien en attente'
              }
              alerte={bord.colisNonRattaches > 0}
              href="/admin/receptions"
            />
            <StatCard
              label="Devis en attente"
              valeur={bord.devisEnAttente}
              detail={
                bord.devisPlusAncien
                  ? `Le plus ancien : ${joursDepuis(bord.devisPlusAncien)} jour(s)`
                  : 'Aucun devis à chiffrer'
              }
              alerte={bord.devisPlusAncien !== null && joursDepuis(bord.devisPlusAncien) >= 1}
              href="/admin/devis"
            />
            <StatCard
              label="À réacheminer"
              valeur={bord.aReacheminer}
              detail="Colis au hub, second segment"
              alerte={bord.aReacheminer > 0}
              href="/admin/reacheminement"
            />
            <StatCard
              label="À retirer"
              valeur={bord.aRetirer}
              detail="Disponibles au point de retrait"
              href="/admin/colis?statut=DISPONIBLE_RETRAIT"
            />
          </div>
        </section>

        {/* Suivi */}
        <section>
          <h2 className="text-caption text-muted mb-3 font-bold tracking-[0.09em] uppercase">
            Suivi
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Départs à venir"
              valeur={bord.departsAVenir}
              detail={
                bord.prochainDepart
                  ? `Prochain : ${bord.prochainDepart.liaison.paysDestination.nom}, ${formaterJourCourt(bord.prochainDepart.dateDepart)}`
                  : 'Aucun départ programmé'
              }
              href="/admin/departs"
            />

            {/* Les créances sont réservées à ADMIN. Le masquage n'est qu'un
                confort : /admin/creances appelle exigerAdmin() de son côté. */}
            {estAdmin ? (
              <StatCard
                label="Créances"
                valeur={`${bord.creances.montant.toFixed(2).replace('.', ',')} €`}
                detail={
                  bord.creances.plusAncienne
                    ? `${bord.creances.nombre} colis · le plus ancien parti il y a ${joursDepuis(bord.creances.plusAncienne)} jours`
                    : `${bord.creances.nombre} facture(s) non soldée(s)`
                }
                alerte={bord.creances.nombre > 0}
                href="/admin/creances"
              />
            ) : null}
          </div>
        </section>

        {/* File des réceptions — le travail quotidien */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-caption text-muted font-bold tracking-[0.09em] uppercase">
              File des réceptions
            </h2>
            <Button href="/admin/receptions" variant="outline" size="sm">
              Tout voir
            </Button>
          </div>

          {receptions.length === 0 ? (
            <div className="border-line rounded-lg border bg-white p-6">
              <p className="text-body-sm text-ink-soft">
                Aucun colis en attente de rattachement. Tous les cartons reçus ont trouvé leur
                client.
              </p>
            </div>
          ) : (
            <ul className="grid list-none gap-3 p-0 md:grid-cols-2 xl:grid-cols-3">
              {receptions.slice(0, 6).map((colis) => (
                <li key={colis.id} className="border-line rounded-lg border bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-body-sm text-navy font-bold">{colis.codeSuivi}</span>
                    <Badge tone="devisNouveau">{joursDepuis(colis.creeLe)} j</Badge>
                  </div>
                  <p className="text-caption text-ink-soft mt-1.5">
                    {colis.contenu ?? 'Contenu non décrit'}
                  </p>
                  <p className="text-caption text-muted mt-1">
                    {colis.villeArrivee.nom}, {colis.villeArrivee.pays.nom}
                    {colis.poidsReel ? ` · ${String(colis.poidsReel)} kg` : ' · non pesé'}
                  </p>
                  <div className="mt-3">
                    <Button
                      href={`/admin/receptions#${colis.codeSuivi}`}
                      size="sm"
                      variant="outline"
                    >
                      Rattacher
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
