import { redirect } from 'next/navigation'
import { auth } from '@/auth'

/**
 * Contrôle des droits — CÔTÉ SERVEUR.
 *
 * « OPERATEUR n'accède ni aux tarifs, ni aux paramètres, ni aux factures,
 *   ni aux exports. VÉRIFICATION CÔTÉ SERVEUR, pas seulement masquage. »
 *                                                        — CLAUDE.md §9
 *
 * Masquer une entrée de menu ne protège rien : l'URL reste tapable et la
 * Server Action reste appelable. Chaque page et chaque action réservées
 * appellent donc `exigerAdmin()` en première ligne.
 */

export type Role = 'ADMIN' | 'OPERATEUR'

export type Utilisateur = {
  id: string
  nom: string
  email: string
  role: Role
}

/** Session courante, ou `null`. Ne redirige pas. */
export async function utilisateurCourant(): Promise<Utilisateur | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  return {
    id: session.user.id,
    nom: session.user.name ?? '',
    email: session.user.email ?? '',
    role: session.user.role,
  }
}

/** Exige une session. À appeler en tête de toute page du back-office. */
export async function exigerConnexion(): Promise<Utilisateur> {
  const utilisateur = await utilisateurCourant()
  if (!utilisateur) redirect('/admin/login')
  return utilisateur
}

/**
 * Exige le rôle ADMIN. À appeler en tête des pages et des actions
 * réservées : tarifs, paramètres, factures, encaissements, créances,
 * exports, gestion des utilisateurs.
 */
export async function exigerAdmin(): Promise<Utilisateur> {
  const utilisateur = await exigerConnexion()
  if (utilisateur.role !== 'ADMIN') redirect('/admin?acces=refuse')
  return utilisateur
}

/**
 * Variante pour les Server Actions : renvoie une erreur exploitable plutôt
 * que de rediriger, pour que le formulaire puisse l'afficher.
 */
export async function exigerAdminAction(): Promise<
  { ok: true; utilisateur: Utilisateur } | { ok: false; message: string }
> {
  const utilisateur = await utilisateurCourant()
  if (!utilisateur) return { ok: false, message: 'Votre session a expiré. Reconnectez-vous.' }
  if (utilisateur.role !== 'ADMIN') {
    return { ok: false, message: 'Cette opération est réservée aux administrateurs.' }
  }
  return { ok: true, utilisateur }
}

/** Idem, sans exigence de rôle : une session suffit. */
export async function exigerConnexionAction(): Promise<
  { ok: true; utilisateur: Utilisateur } | { ok: false; message: string }
> {
  const utilisateur = await utilisateurCourant()
  if (!utilisateur) return { ok: false, message: 'Votre session a expiré. Reconnectez-vous.' }
  return { ok: true, utilisateur }
}

/** Les rubriques réservées à ADMIN. Sert au menu ET aux contrôles. */
export const RUBRIQUES_ADMIN = [
  '/admin/factures',
  '/admin/encaissements',
  '/admin/creances',
  '/admin/tarifs',
  '/admin/destinations',
  '/admin/parametres',
  '/admin/utilisateurs',
] as const

export function rubriqueReservee(chemin: string): boolean {
  return RUBRIQUES_ADMIN.some((rubrique) => chemin.startsWith(rubrique))
}
