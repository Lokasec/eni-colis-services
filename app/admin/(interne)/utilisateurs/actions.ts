'use server'

import { revalidatePath } from 'next/cache'
import { exigerAdminAction, exigerConnexionAction, type Role } from '@/lib/autorisation'
import { db } from '@/lib/db'
import { hacher, refuserMotDePasse, verifier } from '@/lib/mot-de-passe'

/**
 * Gestion des comptes du back-office.
 *
 * Toutes les actions de ce fichier appellent `exigerAdminAction()` en
 * PREMIÈRE LIGNE — sauf `changerMonMotDePasse`, qui ne demande qu'une
 * session puisqu'elle n'agit que sur son propre compte. Masquer l'entrée de
 * menu ne protège rien : une Server Action reste appelable directement
 * (CLAUDE.md §9).
 *
 * AUCUNE SUPPRESSION DE COMPTE, et c'est délibéré. `HistoriqueStatut.auteurId`
 * et `Encaissement.operateurId` pointent vers l'utilisateur en `SetNull` :
 * supprimer un compte effacerait le nom de qui a changé un statut ou encaissé
 * un règlement, sans rien signaler. On désactive — la personne ne peut plus
 * se connecter, et la trace comptable reste lisible.
 */

export type Reponse = { ok: true; message: string } | { ok: false; message: string }

/**
 * Reste-t-il un ADMIN actif si l'on retire celui-ci du décompte ?
 *
 * C'est le garde-fou le plus important du fichier. Sans lui, le dernier
 * administrateur peut se rétrograder ou se désactiver, et PLUS PERSONNE
 * n'accède aux tarifs, aux factures ni à cette page — y compris pour
 * réparer. Il n'existe aucune procédure de secours dans l'application :
 * il faudrait repasser par la base de production.
 */
async function resteUnAdminSans(id: string): Promise<boolean> {
  const restants = await db.utilisateur.count({
    where: { role: 'ADMIN', actif: true, NOT: { id } },
  })
  return restants > 0
}

function normaliserEmail(valeur: FormDataEntryValue | null): string {
  return String(valeur ?? '')
    .trim()
    .toLowerCase()
}

// ---------------------------------------------------------------------------
// Création
// ---------------------------------------------------------------------------

export async function creerUtilisateur(_precedent: Reponse | null, donnees: FormData) {
  const session = await exigerAdminAction()
  if (!session.ok) return session

  const nom = String(donnees.get('nom') ?? '').trim()
  const email = normaliserEmail(donnees.get('email'))
  const role = String(donnees.get('role') ?? 'OPERATEUR') as Role
  const motDePasse = String(donnees.get('motDePasse') ?? '')

  if (nom.length < 2) return { ok: false as const, message: 'Indiquez le nom de la personne.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, message: 'Indiquez une adresse e-mail valide.' }
  }
  if (role !== 'ADMIN' && role !== 'OPERATEUR') {
    return { ok: false as const, message: 'Rôle inconnu.' }
  }

  const refus = refuserMotDePasse(motDePasse, { email, nom })
  if (refus) return { ok: false as const, message: refus }

  const existant = await db.utilisateur.findUnique({ where: { email }, select: { id: true } })
  if (existant) {
    return { ok: false as const, message: 'Un compte utilise déjà cette adresse e-mail.' }
  }

  await db.utilisateur.create({
    data: { nom, email, role, motDePasse: await hacher(motDePasse) },
  })

  revalidatePath('/admin/utilisateurs')
  return {
    ok: true as const,
    message: `Compte créé pour ${nom} (${email}). Communiquez-lui son mot de passe de vive voix, et demandez-lui de le changer depuis « Mon compte ».`,
  }
}

// ---------------------------------------------------------------------------
// Identité
// ---------------------------------------------------------------------------

/**
 * Corrige le nom ou l'adresse d'un compte.
 *
 * C'est ce qui permet de remplacer une adresse de démonstration
 * (`admin@eni.test`) par la vraie, SANS créer un second compte : le nom du
 * titulaire est attaché aux changements de statut et aux encaissements déjà
 * enregistrés, et repartir d'un compte neuf couperait cette trace en deux.
 */
export async function modifierIdentite(_precedent: Reponse | null, donnees: FormData) {
  const session = await exigerAdminAction()
  if (!session.ok) return session

  const id = String(donnees.get('id') ?? '')
  const nom = String(donnees.get('nom') ?? '').trim()
  const email = normaliserEmail(donnees.get('email'))

  if (nom.length < 2) return { ok: false as const, message: 'Indiquez le nom de la personne.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, message: 'Indiquez une adresse e-mail valide.' }
  }

  const compte = await db.utilisateur.findUnique({
    where: { id },
    select: { id: true, nom: true, email: true },
  })
  if (!compte) return { ok: false as const, message: 'Ce compte n’existe plus.' }
  if (compte.nom === nom && compte.email === email) {
    return { ok: true as const, message: 'Aucun changement.' }
  }

  const occupe = await db.utilisateur.findFirst({
    where: { email, NOT: { id: compte.id } },
    select: { id: true },
  })
  if (occupe) return { ok: false as const, message: 'Un autre compte utilise déjà cette adresse.' }

  await db.utilisateur.update({ where: { id: compte.id }, data: { nom, email } })
  revalidatePath('/admin/utilisateurs')

  // L'adresse sert d'identifiant de connexion : le dire évite qu'on
  // continue à essayer l'ancienne et qu'on croie le compte cassé.
  return {
    ok: true as const,
    message:
      compte.email === email
        ? `Nom mis à jour : ${nom}.`
        : `Compte mis à jour. La connexion se fait désormais avec ${email}.`,
  }
}

// ---------------------------------------------------------------------------
// Rôle
// ---------------------------------------------------------------------------

export async function changerRole(_precedent: Reponse | null, donnees: FormData) {
  const session = await exigerAdminAction()
  if (!session.ok) return session

  const id = String(donnees.get('id') ?? '')
  const role = String(donnees.get('role') ?? '') as Role
  if (role !== 'ADMIN' && role !== 'OPERATEUR') {
    return { ok: false as const, message: 'Rôle inconnu.' }
  }

  const compte = await db.utilisateur.findUnique({
    where: { id },
    select: { id: true, nom: true, role: true },
  })
  if (!compte) return { ok: false as const, message: 'Ce compte n’existe plus.' }
  if (compte.role === role) return { ok: true as const, message: 'Rôle inchangé.' }

  // Se rétrograder soi-même est refusé même s'il reste un autre ADMIN : on
  // perdrait l'accès à cette page dans le mouvement, sans pouvoir revenir
  // en arrière soi-même.
  if (compte.id === session.utilisateur.id && role !== 'ADMIN') {
    return {
      ok: false as const,
      message:
        'Vous ne pouvez pas retirer votre propre rôle d’administrateur : vous perdriez l’accès à cette page. Demandez-le à un autre administrateur.',
    }
  }

  if (role !== 'ADMIN' && !(await resteUnAdminSans(compte.id))) {
    return {
      ok: false as const,
      message: `${compte.nom} est le dernier administrateur actif. Nommez-en un autre d’abord, sans quoi plus personne n’accéderait aux tarifs, aux factures ni aux comptes.`,
    }
  }

  await db.utilisateur.update({ where: { id: compte.id }, data: { role } })
  revalidatePath('/admin/utilisateurs')
  return {
    ok: true as const,
    message: `${compte.nom} est désormais ${role === 'ADMIN' ? 'administrateur' : 'opérateur'}.`,
  }
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

export async function basculerActivation(_precedent: Reponse | null, donnees: FormData) {
  const session = await exigerAdminAction()
  if (!session.ok) return session

  const id = String(donnees.get('id') ?? '')
  const compte = await db.utilisateur.findUnique({
    where: { id },
    select: { id: true, nom: true, actif: true, role: true },
  })
  if (!compte) return { ok: false as const, message: 'Ce compte n’existe plus.' }

  if (compte.id === session.utilisateur.id) {
    return {
      ok: false as const,
      message:
        'Vous ne pouvez pas désactiver votre propre compte : vous seriez déconnecté sans pouvoir revenir.',
    }
  }

  if (compte.actif && compte.role === 'ADMIN' && !(await resteUnAdminSans(compte.id))) {
    return {
      ok: false as const,
      message: `${compte.nom} est le dernier administrateur actif. Le désactiver fermerait l’accès à tout le monde.`,
    }
  }

  await db.utilisateur.update({ where: { id: compte.id }, data: { actif: !compte.actif } })
  revalidatePath('/admin/utilisateurs')

  // Le rôle et l'état sont relus en base à CHAQUE contrôle
  // (lib/autorisation.ts) : la désactivation prend effet à la requête
  // suivante, sans attendre l'expiration du jeton.
  return {
    ok: true as const,
    message: compte.actif
      ? `Compte de ${compte.nom} désactivé. La connexion lui est refusée dès maintenant ; son historique reste intact.`
      : `Compte de ${compte.nom} réactivé.`,
  }
}

// ---------------------------------------------------------------------------
// Mots de passe
// ---------------------------------------------------------------------------

export async function reinitialiserMotDePasse(_precedent: Reponse | null, donnees: FormData) {
  const session = await exigerAdminAction()
  if (!session.ok) return session

  const id = String(donnees.get('id') ?? '')
  const motDePasse = String(donnees.get('motDePasse') ?? '')

  const compte = await db.utilisateur.findUnique({
    where: { id },
    select: { id: true, nom: true, email: true },
  })
  if (!compte) return { ok: false as const, message: 'Ce compte n’existe plus.' }

  const refus = refuserMotDePasse(motDePasse, { email: compte.email, nom: compte.nom })
  if (refus) return { ok: false as const, message: refus }

  await db.utilisateur.update({
    where: { id: compte.id },
    data: { motDePasse: await hacher(motDePasse) },
  })

  revalidatePath('/admin/utilisateurs')
  return {
    ok: true as const,
    message: `Mot de passe de ${compte.nom} remplacé. Transmettez-le-lui de vive voix, jamais par e-mail, et demandez-lui de le changer.`,
  }
}

/**
 * Changement de son PROPRE mot de passe.
 *
 * Une session suffit — un opérateur doit pouvoir le faire. L'ancien mot de
 * passe est exigé : sans lui, quiconque accède à un poste resté ouvert
 * s'approprie le compte définitivement, alors que le propriétaire pourrait
 * autrement reprendre la main en se reconnectant.
 */
export async function changerMonMotDePasse(_precedent: Reponse | null, donnees: FormData) {
  const session = await exigerConnexionAction()
  if (!session.ok) return session

  const actuel = String(donnees.get('actuel') ?? '')
  const nouveau = String(donnees.get('nouveau') ?? '')
  const confirmation = String(donnees.get('confirmation') ?? '')

  if (nouveau !== confirmation) {
    return { ok: false as const, message: 'Les deux nouveaux mots de passe ne correspondent pas.' }
  }

  const compte = await db.utilisateur.findUnique({
    where: { id: session.utilisateur.id },
    select: { id: true, nom: true, email: true, motDePasse: true },
  })
  if (!compte) return { ok: false as const, message: 'Votre compte n’existe plus.' }

  if (!(await verifier(actuel, compte.motDePasse))) {
    return { ok: false as const, message: 'Votre mot de passe actuel est incorrect.' }
  }

  const refus = refuserMotDePasse(nouveau, { email: compte.email, nom: compte.nom })
  if (refus) return { ok: false as const, message: refus }

  if (await verifier(nouveau, compte.motDePasse)) {
    return { ok: false as const, message: 'Le nouveau mot de passe est identique à l’ancien.' }
  }

  await db.utilisateur.update({
    where: { id: compte.id },
    data: { motDePasse: await hacher(nouveau) },
  })

  revalidatePath('/admin/mon-compte')
  return { ok: true as const, message: 'Votre mot de passe est changé.' }
}
