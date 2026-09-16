import { Topbar } from '@/components/admin/topbar'
import { Alert } from '@/components/ui/alert'
import { exigerAdmin } from '@/lib/autorisation'
import { formaterJourLong } from '@/lib/dates'
import { db } from '@/lib/db'
import { CreerCompte, LigneCompte, ReinitialiserMotDePasse } from './formulaires'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Utilisateurs' }

/**
 * Comptes du back-office.
 *
 * Rubrique réservée : `exigerAdmin()` redirige un OPERATEUR même s'il tape
 * l'URL. Le contrôle est côté serveur, pas dans le menu (CLAUDE.md §9).
 *
 * `motDePasse` n'est JAMAIS sélectionné ici — même haché, une empreinte n'a
 * rien à faire dans le HTML envoyé au navigateur.
 */
export default async function Utilisateurs() {
  const moi = await exigerAdmin()

  const comptes = await db.utilisateur.findMany({
    select: {
      id: true,
      nom: true,
      email: true,
      role: true,
      actif: true,
      derniereConnexion: true,
      creeLe: true,
    },
    orderBy: [{ actif: 'desc' }, { role: 'asc' }, { nom: 'asc' }],
  })

  const affiches = comptes.map((compte) => ({
    id: compte.id,
    nom: compte.nom,
    email: compte.email,
    role: compte.role,
    actif: compte.actif,
    estMoi: compte.id === moi.id,
  }))

  // Une adresse en .test n'existe pas : c'est une donnée de démonstration
  // restée en production. Tant qu'elle est là, personne ne peut recevoir
  // quoi que ce soit sur ce compte — ni une relance, ni une réinitialisation.
  const comptesFictifs = comptes.filter((compte) =>
    /@(eni\.test|example\.[a-z]+)$/i.test(compte.email),
  )

  return (
    <>
      <Topbar
        titre="Utilisateurs"
        sousTitre={`${comptes.filter((c) => c.actif).length} compte(s) actif(s) · rubrique réservée aux administrateurs`}
      />

      <div className="max-w-[860px] space-y-5 p-4 md:p-6">
        {comptesFictifs.length > 0 ? (
          <Alert tone="warn">
            <b>
              {comptesFictifs.length === 1
                ? 'Un compte porte une adresse fictive'
                : `${comptesFictifs.length} comptes portent une adresse fictive`}{' '}
              ({comptesFictifs.map((c) => c.email).join(', ')}).
            </b>{' '}
            Ces adresses viennent des données de démonstration : elles ne reçoivent rien. Créez un
            compte à la vraie adresse de son titulaire, puis désactivez celui-ci — ne le supprimez
            pas, son nom est attaché aux changements de statut et aux encaissements déjà
            enregistrés.
          </Alert>
        ) : null}

        <div className="space-y-3">
          {affiches.map((compte) => (
            <LigneCompte key={compte.id} compte={compte} />
          ))}
        </div>

        <div className="border-line rounded-lg border bg-white p-5">
          <h2 className="text-h3 mb-3">Dernières connexions</h2>
          <dl className="text-body-sm grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {comptes.map((compte) => (
              <div key={compte.id} className="flex justify-between gap-3">
                <dt className="text-ink-soft">{compte.nom}</dt>
                <dd className="text-navy m-0 text-right font-semibold">
                  {compte.derniereConnexion
                    ? formaterJourLong(compte.derniereConnexion)
                    : 'jamais connecté'}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <CreerCompte />

        <ReinitialiserMotDePasse comptes={affiches} />

        <Alert>
          <b>Un compte ne se supprime pas, il se désactive.</b> Le nom de qui a changé un statut ou
          saisi un encaissement est attaché à son compte : le supprimer effacerait cette trace des
          écritures déjà passées. Un compte désactivé ne peut plus se connecter, et son historique
          reste lisible.
        </Alert>
      </div>
    </>
  )
}
