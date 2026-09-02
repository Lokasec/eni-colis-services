import { Topbar } from '@/components/admin/topbar'
import { DataTable, Td } from '@/components/ui/data-table'
import { exigerConnexion } from '@/lib/autorisation'
import { formaterJourEtHeure, formaterJourLong } from '@/lib/dates'
import { campagnes, departsAvecDestinataires } from '@/lib/donnees-admin'
import { Composeur, type DepartMessagerie } from './composeur'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Messagerie' }

export default async function Messagerie() {
  // Accessible aux deux rôles : prévenir un destinataire fait partie de
  // l'exploitation quotidienne, pas de l'administration.
  await exigerConnexion()

  const [departs, historique] = await Promise.all([departsAvecDestinataires(), campagnes()])

  const options: DepartMessagerie[] = departs.map((d) => ({
    id: d.id,
    etiquette: `${d.reference} · ${d.liaison.paysOrigine.nom} → ${d.liaison.paysDestination.nom} · ${formaterJourLong(d.dateDepart)} · ${d.colis.length} colis`,
    destination: d.liaison.paysDestination.nom,
    dateDepart: formaterJourLong(d.dateDepart),
    colis: d.colis.map((c) => ({
      codeSuivi: c.codeSuivi,
      nom: c.destinataireNom,
      email: c.destinataireEmail,
      telephone: c.destinataireTelephone,
    })),
  }))

  return (
    <>
      <Topbar
        titre="Messagerie"
        sousTitre={`${options.length} départs · ${historique.length} campagnes envoyées`}
      />

      <div className="space-y-6 p-4 md:p-6">
        {options.length === 0 ? (
          <div className="border-line rounded-lg border bg-white p-6">
            <p className="text-body-sm text-ink-soft">
              Aucun départ enregistré. Créez un départ et affectez-lui des colis avant d&apos;écrire
              à leurs destinataires.
            </p>
          </div>
        ) : (
          <Composeur departs={options} />
        )}

        <section>
          <h2 className="text-h3 mb-3">Historique des envois</h2>
          {historique.length === 0 ? (
            <div className="border-line rounded-lg border bg-white p-6">
              <p className="text-body-sm text-ink-soft">Aucune campagne envoyée pour le moment.</p>
            </div>
          ) : (
            <DataTable
              caption="Campagnes envoyées"
              head={['Envoyée le', 'Objet', 'Cible', 'Canal', 'Destinataires', 'Par']}
            >
              {historique.map((c) => (
                <tr key={c.id}>
                  <Td className="text-caption whitespace-nowrap">
                    {c.envoyeeLe ? formaterJourEtHeure(c.envoyeeLe) : 'non envoyée'}
                  </Td>
                  <Td className="text-navy font-bold">{c.sujet}</Td>
                  <Td className="text-caption text-muted">{c.cible}</Td>
                  <Td className="text-caption">{c.canal}</Td>
                  <Td className="text-orange-text font-extrabold">{c.nbDestinataires}</Td>
                  <Td className="text-caption text-muted">{c.auteurEmail ?? '—'}</Td>
                </tr>
              ))}
            </DataTable>
          )}
          <p className="text-caption text-muted mt-2">
            Le compteur indique les envois <b>réellement acceptés</b>, pas le nombre de
            destinataires visés : un rapport qui compte les intentions ment sur ce qui est arrivé.
          </p>
        </section>
      </div>
    </>
  )
}
