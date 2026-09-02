'use client'

import { useActionState } from 'react'
import { TextField } from '@/components/form/text-field'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { seConnecter, type EtatConnexion } from './actions'

export function FormulaireConnexion({ suite }: { suite: string }) {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(seConnecter, {
    statut: 'initial',
  })

  return (
    <Card surface="plain">
      <h1 className="text-h2">Connexion</h1>
      <p className="text-body-sm text-ink-soft mt-2">
        Accédez au suivi des colis, des réceptions et des départs.
      </p>

      <form action={action} className="mt-6">
        {etat.statut === 'erreur' ? (
          <Alert tone="warn" className="mb-5">
            {etat.message}
          </Alert>
        ) : null}

        <input type="hidden" name="suite" value={suite} />

        <TextField
          id="email"
          name="email"
          label="Adresse e-mail"
          type="email"
          required
          autoComplete="username"
          autoFocus
        />
        <TextField
          id="motDePasse"
          name="motDePasse"
          label="Mot de passe"
          type="password"
          required
          autoComplete="current-password"
        />

        <Button type="submit" block disabled={enCours}>
          {enCours ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>
    </Card>
  )
}
