import { Topbar } from '@/components/admin/topbar'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { exigerConnexion } from '@/lib/autorisation'
import { formaterJourLong, joursDepuis } from '@/lib/dates'
import { clientsActifs, fileReceptions } from '@/lib/donnees-admin'
import { CarteReception } from './carte-reception'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Réceptions' }

/**
 * File des colis reçus non rattachés.
 *
 * C'est le module traité chaque jour, debout, avec une pile de cartons.
 * Chaque carte tient une action : rattacher, peser, valider. Le tri est du
 * plus ancien au plus récent — un carton qui attend depuis une semaine
 * remonte en premier.
 */
export default async function Receptions() {
  await exigerConnexion()
  const [colis, clients] = await Promise.all([fileReceptions(), clientsActifs()])

  return (
    <>
      <Topbar
        titre="Réceptions"
        sousTitre={`${colis.length} colis en attente de rattachement`}
        actions={
          <Button href="/admin/colis/nouveau" size="sm">
            Enregistrer un colis
          </Button>
        }
      />

      <div className="space-y-5 p-4 md:p-6">
        {colis.length === 0 ? (
          <Alert>
            <b>La file est vide.</b> Tous les cartons reçus ont trouvé leur client. Les nouveaux
            colis enregistrés sans identifiant apparaîtront ici.
          </Alert>
        ) : (
          <>
            <Alert>
              <b>Un carton sans identifiant n’existe nulle part ailleurs.</b> Rattachez-le dès que
              le client se manifeste : le local est partagé, et un colis anonyme se perd vite.
            </Alert>

            <ul className="grid list-none gap-4 p-0 xl:grid-cols-2">
              {colis.map((item) => (
                <li key={item.id} id={item.codeSuivi}>
                  <CarteReception
                    colis={{
                      id: item.id,
                      codeSuivi: item.codeSuivi,
                      contenu: item.contenu,
                      photoReceptionUrl: item.photoReceptionUrl,
                      poidsReel: item.poidsReel ? String(item.poidsReel) : null,
                      destination: `${item.villeArrivee.nom}, ${item.villeArrivee.pays.nom}`,
                      recuLe: formaterJourLong(item.creeLe),
                      anciennete: joursDepuis(item.creeLe),
                      note: item.historique[0]?.commentaire ?? null,
                    }}
                    clients={clients.map((c) => ({
                      id: c.id,
                      etiquette: `${c.nomLivraison} — ${c.numeroClient} · ${c.villeDestination?.nom ?? 'ville à préciser'}`,
                    }))}
                  />
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="text-caption text-muted">
          Les colis apparaissent ici lorsqu&apos;ils sont reçus en mode « commande en ligne » sans
          client rattaché. <Badge tone="devisNouveau">ancienneté</Badge> indique depuis combien de
          jours le carton attend.
        </p>
      </div>
    </>
  )
}
