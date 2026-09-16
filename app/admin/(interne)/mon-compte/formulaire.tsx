'use client'

import { useActionState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { changerMonMotDePasse, type Reponse } from '../utilisateurs/actions'

const CHAMP =
  'border-line-strong text-body-sm focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none'

const LABEL = 'text-caption text-navy mb-1 block font-semibold'

/**
 * Changement de son propre mot de passe.
 *
 * Accessible à tout compte connecté, opérateur compris : un mot de passe
 * qu'on ne peut changer soi-même finit par circuler.
 *
 * `autoComplete` est renseigné correctement — `current-password` puis
 * `new-password` — pour que les gestionnaires de mots de passe proposent
 * l'enregistrement plutôt que de remplir les trois champs à l'identique.
 */
export function ChangerMotDePasse() {
  const [etat, action, enCours] = useActionState<Reponse | null, FormData>(
    changerMonMotDePasse,
    null,
  )

  return (
    <form action={action} className="border-line rounded-lg border bg-white p-5">
      <h2 className="text-h3 mb-1">Changer mon mot de passe</h2>
      <p className="text-body-sm text-ink-soft mb-4">
        Douze caractères au minimum. Une phrase dont vous vous souvenez vaut mieux qu’un mot
        compliqué que vous finirez par noter quelque part.
      </p>

      <div className="grid max-w-[420px] gap-4">
        <div>
          <label htmlFor="actuel" className={LABEL}>
            Mot de passe actuel
          </label>
          <input
            id="actuel"
            name="actuel"
            type="password"
            required
            autoComplete="current-password"
            className={CHAMP}
          />
        </div>

        <div>
          <label htmlFor="nouveau" className={LABEL}>
            Nouveau mot de passe
          </label>
          <input
            id="nouveau"
            name="nouveau"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            className={CHAMP}
          />
        </div>

        <div>
          <label htmlFor="confirmation" className={LABEL}>
            Répétez le nouveau mot de passe
          </label>
          <input
            id="confirmation"
            name="confirmation"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            className={CHAMP}
          />
        </div>
      </div>

      <div className="mt-4">
        <Button type="submit" size="sm" disabled={enCours}>
          {enCours ? 'Changement…' : 'Changer mon mot de passe'}
        </Button>
      </div>

      {etat ? (
        <Alert tone={etat.ok ? 'info' : 'warn'} className="mt-3">
          {etat.message}
        </Alert>
      ) : null}
    </form>
  )
}
