import { Topbar } from '@/components/admin/topbar'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { exigerConnexion } from '@/lib/autorisation'
import { clientsActifs, villesDestination } from '@/lib/donnees-admin'
import { FormulaireColis } from './formulaire'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Enregistrer un colis' }

export default async function NouveauColis() {
  await exigerConnexion()
  const [villes, clients] = await Promise.all([villesDestination(), clientsActifs()])

  return (
    <>
      <Topbar
        titre="Enregistrer un colis"
        sousTitre="Saisie rapide, pensée pour le comptoir"
        actions={
          <Button href="/admin/colis" variant="outline" size="sm">
            Annuler
          </Button>
        }
      />

      <div className="max-w-[720px] space-y-5 p-4 md:p-6">
        <Alert>
          <b>Le code de suivi est attribué automatiquement.</b> Un colis reçu sans identifiant
          client se laisse enregistrer sans destinataire : il rejoint la file des réceptions et sera
          rattaché plus tard.
        </Alert>

        <FormulaireColis
          villes={villes.map((v) => ({
            id: v.id,
            etiquette: `${v.nom} — ${v.pays.nom}`,
            viaHub: v.villeTransit?.nom ?? null,
          }))}
          clients={clients.map((c) => ({
            id: c.id,
            etiquette: `${c.nomLivraison} — ${c.numeroClient}`,
          }))}
        />
      </div>
    </>
  )
}
