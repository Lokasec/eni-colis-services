'use client'

import { useActionState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  basculerActivation,
  changerRole,
  creerUtilisateur,
  modifierIdentite,
  reinitialiserMotDePasse,
  type Reponse,
} from './actions'

/**
 * Formulaires de la rubrique Utilisateurs.
 *
 * Chaque opération a son propre formulaire et son propre message : sur un
 * téléphone, un message d'erreur affiché en haut d'un écran long ne se voit
 * pas. Le retour s'affiche là où l'on vient de cliquer.
 *
 * Les champs de mot de passe sont en `type="password"`, hors du tableau, et
 * `autoComplete="new-password"` — sans quoi le navigateur propose le mot de
 * passe de l'administrateur connecté au moment de créer le compte de
 * quelqu'un d'autre.
 */

const CHAMP =
  'border-line-strong text-body-sm focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none'

const LABEL = 'text-caption text-navy mb-1 block font-semibold'

export type CompteAffiche = {
  id: string
  nom: string
  email: string
  role: 'ADMIN' | 'OPERATEUR'
  actif: boolean
  estMoi: boolean
}

function Retour({ etat }: { etat: Reponse | null }) {
  if (!etat) return null
  return (
    <Alert tone={etat.ok ? 'info' : 'warn'} className="mt-3">
      {etat.message}
    </Alert>
  )
}

// ---------------------------------------------------------------------------

export function CreerCompte() {
  const [etat, action, enCours] = useActionState<Reponse | null, FormData>(creerUtilisateur, null)

  return (
    <form action={action} className="border-line rounded-lg border bg-white p-5">
      <h2 className="text-h3 mb-1">Créer un compte</h2>
      <p className="text-body-sm text-ink-soft mb-4">
        Le mot de passe est saisi ici puis communiqué de vive voix. La personne le changera
        elle-même depuis « Mon compte ».
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="nom" className={LABEL}>
            Nom et prénom
          </label>
          <input id="nom" name="nom" required autoComplete="off" className={CHAMP} />
        </div>

        <div>
          <label htmlFor="email" className={LABEL}>
            Adresse e-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="off"
            className={CHAMP}
          />
        </div>

        <div>
          <label htmlFor="role" className={LABEL}>
            Rôle
          </label>
          <select id="role" name="role" defaultValue="OPERATEUR" className={CHAMP}>
            <option value="OPERATEUR">Opérateur — colis, devis, clients, départs</option>
            <option value="ADMIN">Administrateur — tout, dont tarifs et factures</option>
          </select>
        </div>

        <div>
          <label htmlFor="motDePasse" className={LABEL}>
            Mot de passe provisoire
          </label>
          <input
            id="motDePasse"
            name="motDePasse"
            type="password"
            required
            autoComplete="new-password"
            minLength={12}
            className={CHAMP}
          />
          <p className="text-caption text-muted mt-1">
            Douze caractères au minimum. Une phrase dont on se souvient vaut mieux qu’un mot
            compliqué.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Button type="submit" size="sm" disabled={enCours}>
          {enCours ? 'Création…' : 'Créer le compte'}
        </Button>
      </div>

      <Retour etat={etat} />
    </form>
  )
}

// ---------------------------------------------------------------------------

export function LigneCompte({ compte }: { compte: CompteAffiche }) {
  const [etatRole, actionRole, roleEnCours] = useActionState<Reponse | null, FormData>(
    changerRole,
    null,
  )
  const [etatActif, actionActif, actifEnCours] = useActionState<Reponse | null, FormData>(
    basculerActivation,
    null,
  )
  const [etatIdentite, actionIdentite, identiteEnCours] = useActionState<Reponse | null, FormData>(
    modifierIdentite,
    null,
  )

  const retour = etatIdentite ?? etatRole ?? etatActif

  return (
    <div className="border-line rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-navy font-bold">
            {compte.nom}
            {compte.estMoi ? <span className="text-muted font-normal"> — vous</span> : null}
          </p>
          <p className="text-body-sm text-ink-soft break-all">{compte.email}</p>
        </div>
        {compte.actif ? null : (
          <span className="text-caption bg-status-litige-bg text-status-litige-fg rounded-sm px-2 py-0.5 font-bold">
            Désactivé
          </span>
        )}
      </div>

      <form action={actionIdentite} className="mt-3 flex flex-wrap items-end gap-2">
        <input type="hidden" name="id" value={compte.id} />
        <div className="min-w-[160px] flex-1">
          <label htmlFor={`nom-${compte.id}`} className={LABEL}>
            Nom
          </label>
          <input
            id={`nom-${compte.id}`}
            name="nom"
            defaultValue={compte.nom}
            required
            className={CHAMP}
          />
        </div>
        <div className="min-w-[200px] flex-1">
          <label htmlFor={`email-${compte.id}`} className={LABEL}>
            Adresse e-mail — sert à la connexion
          </label>
          <input
            id={`email-${compte.id}`}
            name="email"
            type="email"
            defaultValue={compte.email}
            required
            className={CHAMP}
          />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={identiteEnCours}>
          Enregistrer
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <form action={actionRole} className="flex items-end gap-2">
          <input type="hidden" name="id" value={compte.id} />
          <div>
            <label htmlFor={`role-${compte.id}`} className={LABEL}>
              Rôle
            </label>
            <select
              id={`role-${compte.id}`}
              name="role"
              defaultValue={compte.role}
              className={`${CHAMP} min-w-[150px]`}
            >
              <option value="OPERATEUR">Opérateur</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>
          <Button type="submit" variant="outline" size="sm" disabled={roleEnCours}>
            Appliquer
          </Button>
        </form>

        <form action={actionActif}>
          <input type="hidden" name="id" value={compte.id} />
          <Button type="submit" variant="outline" size="sm" disabled={actifEnCours}>
            {compte.actif ? 'Désactiver' : 'Réactiver'}
          </Button>
        </form>
      </div>

      <Retour etat={retour} />
    </div>
  )
}

// ---------------------------------------------------------------------------

export function ReinitialiserMotDePasse({ comptes }: { comptes: CompteAffiche[] }) {
  const [etat, action, enCours] = useActionState<Reponse | null, FormData>(
    reinitialiserMotDePasse,
    null,
  )

  return (
    <form action={action} className="border-line rounded-lg border bg-white p-5">
      <h2 className="text-h3 mb-1">Réinitialiser un mot de passe</h2>
      <p className="text-body-sm text-ink-soft mb-4">
        Pour quelqu’un qui a oublié le sien. Transmettez le nouveau de vive voix, jamais par e-mail,
        et demandez-lui de le changer.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="cible" className={LABEL}>
            Compte
          </label>
          <select id="cible" name="id" required defaultValue="" className={CHAMP}>
            <option value="">Choisir un compte</option>
            {comptes.map((compte) => (
              <option key={compte.id} value={compte.id}>
                {compte.nom} — {compte.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="nouveauMotDePasse" className={LABEL}>
            Nouveau mot de passe
          </label>
          <input
            id="nouveauMotDePasse"
            name="motDePasse"
            type="password"
            required
            autoComplete="new-password"
            minLength={12}
            className={CHAMP}
          />
        </div>
      </div>

      <div className="mt-4">
        <Button type="submit" size="sm" disabled={enCours}>
          {enCours ? 'Remplacement…' : 'Remplacer le mot de passe'}
        </Button>
      </div>

      <Retour etat={etat} />
    </form>
  )
}
