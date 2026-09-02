import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'

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

/**
 * Un seul message pour les deux causes — jeton expiré, ou compte supprimé
 * ou désactivé. Il dit quoi faire, et ne distingue pas les cas : on
 * n'apprend pas à un visiteur si tel compte existe encore.
 */
const SESSION_INVALIDE = 'Votre session n’est plus valide. Reconnectez-vous pour poursuivre.'

export type Utilisateur = {
  id: string
  nom: string
  email: string
  role: Role
}

/**
 * Session courante, ou `null`. Ne redirige pas.
 *
 * Le jeton porte le rôle, mais il vit aussi longtemps que la session : un
 * compte rétrogradé en OPERATEUR ou désactivé conserverait ses droits
 * jusqu'à l'expiration de son jeton. **Le rôle qui fait foi est celui de
 * la base**, relu à chaque contrôle — une lecture par clé primaire, sur
 * des pages qui interrogent déjà la base largement plus.
 *
 * Ce contrôle rattrape aussi le compte qui n'existe plus. Sans lui, la
 * session restait « valide » et l'erreur ne surgissait qu'à l'écriture,
 * sous la forme d'une violation de clé étrangère sur `auteurId` —
 * incompréhensible à l'écran, et « réessayez » n'y changeait rien.
 */
export async function utilisateurCourant(): Promise<Utilisateur | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const compte = await db.utilisateur.findUnique({
    where: { id: session.user.id },
    select: { id: true, nom: true, email: true, role: true, actif: true },
  })
  if (!compte || !compte.actif) return null

  return { id: compte.id, nom: compte.nom, email: compte.email, role: compte.role }
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
  if (!utilisateur) return { ok: false, message: SESSION_INVALIDE }
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
  if (!utilisateur) return { ok: false, message: SESSION_INVALIDE }
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
