import { Topbar } from '@/components/admin/topbar'
import { Alert } from '@/components/ui/alert'
import { exigerConnexion } from '@/lib/autorisation'
import { ChangerMotDePasse } from './formulaire'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mon compte' }

/**
 * Compte de la personne connectée.
 *
 * `exigerConnexion()` et non `exigerAdmin()` : un opérateur doit pouvoir
 * changer son propre mot de passe. La rubrique Utilisateurs, elle, reste
 * réservée aux administrateurs.
 */
export default async function MonCompte() {
  const moi = await exigerConnexion()

  return (
    <>
      <Topbar titre="Mon compte" sousTitre={moi.email} />

      <div className="max-w-[720px] space-y-5 p-4 md:p-6">
        <div className="border-line rounded-lg border bg-white p-5">
          <dl className="text-body-sm grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-caption text-muted font-bold tracking-[0.08em] uppercase">Nom</dt>
              <dd className="text-navy m-0 mt-1 font-bold">{moi.nom}</dd>
            </div>
            <div>
              <dt className="text-caption text-muted font-bold tracking-[0.08em] uppercase">
                Adresse e-mail
              </dt>
              <dd className="text-navy m-0 mt-1 font-bold break-all">{moi.email}</dd>
            </div>
            <div>
              <dt className="text-caption text-muted font-bold tracking-[0.08em] uppercase">
                Rôle
              </dt>
              <dd className="text-navy m-0 mt-1 font-bold">
                {moi.role === 'ADMIN' ? 'Administrateur' : 'Opérateur'}
              </dd>
            </div>
          </dl>
          <p className="text-body-sm text-ink-soft mt-4">
            {moi.role === 'ADMIN'
              ? 'Vous accédez à tout, y compris aux tarifs, aux factures et aux comptes.'
              : 'Vous accédez aux colis, devis, clients, réceptions et départs. Les tarifs, les factures et les paramètres sont réservés aux administrateurs.'}
          </p>
        </div>

        <ChangerMotDePasse />

        <Alert>
          <b>Votre nom ou votre adresse ont changé ?</b> Ils se modifient depuis la rubrique
          Utilisateurs, par un administrateur — le nom figure sur les écritures déjà passées, il ne
          se change pas d’un compte à l’autre sans raison.
        </Alert>
      </div>
    </>
  )
}
