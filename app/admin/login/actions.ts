'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/auth'
import { verifierLimite } from '@/lib/rate-limit'

export type EtatConnexion = { statut: 'initial' } | { statut: 'erreur'; message: string }

/**
 * Connexion au back-office.
 *
 * Le message d'erreur est VOLONTAIREMENT identique pour un compte inconnu
 * et un mot de passe erroné : distinguer les deux revient à confirmer
 * l'existence d'une adresse.
 *
 * La limitation de débit s'applique aussi ici — dix tentatives par quart
 * d'heure et par adresse IP suffisent à un usage normal et rendent le
 * balayage de mots de passe impraticable.
 */
export async function seConnecter(
  _precedent: EtatConnexion,
  donnees: FormData,
): Promise<EtatConnexion> {
  const limite = await verifierLimite('connexion', { maximum: 10, dureeMs: 15 * 60 * 1000 })
  if (!limite.autorise) {
    const minutes = Math.ceil(limite.secondesRestantes / 60)
    return {
      statut: 'erreur',
      message: `Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.`,
    }
  }

  const email = String(donnees.get('email') ?? '').trim()
  const motDePasse = String(donnees.get('motDePasse') ?? '')
  const suite = String(donnees.get('suite') ?? '/admin')

  if (!email || !motDePasse) {
    return { statut: 'erreur', message: 'Renseignez votre adresse e-mail et votre mot de passe.' }
  }

  try {
    await signIn('credentials', {
      email,
      motDePasse,
      redirectTo: suite.startsWith('/admin') ? suite : '/admin',
    })
  } catch (erreur) {
    // `signIn` lève une redirection en cas de succès : il faut la laisser
    // remonter, sans quoi la connexion n'aboutit jamais.
    if (erreur instanceof AuthError) {
      return { statut: 'erreur', message: 'Adresse e-mail ou mot de passe incorrect.' }
    }
    throw erreur
  }

  return { statut: 'initial' }
}
