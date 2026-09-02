import { headers } from 'next/headers'

/**
 * Limitation de débit des formulaires publics.
 *
 * ⚠️ Implémentation EN MÉMOIRE, volontairement simple.
 *
 * Elle protège efficacement contre un envoi répété depuis un navigateur ou
 * un script naïf, ce qui est le risque réel sur ces formulaires. Elle a une
 * limite qu'il faut connaître : sur Vercel, chaque instance de fonction a
 * sa propre mémoire, donc le compteur n'est pas partagé entre instances, et
 * il se remet à zéro à froid.
 *
 * Pour un site vitrine avec quelques demandes par jour, c'est suffisant. Si
 * le volume augmente ou si un abus survient, remplacer le `Map` ci-dessous
 * par un magasin partagé (Vercel KV, Upstash) : la signature de
 * `verifierLimite` ne changera pas.
 */

type Fenetre = { debut: number; compte: number }

const compteurs = new Map<string, Fenetre>()

/** Purge les fenêtres expirées pour que la Map ne grossisse pas sans fin. */
function nettoyer(maintenant: number, dureeMs: number) {
  for (const [cle, fenetre] of compteurs) {
    if (maintenant - fenetre.debut > dureeMs) compteurs.delete(cle)
  }
}

/**
 * Identifie l'appelant. Derrière un proxy, `x-forwarded-for` porte la
 * chaîne des relais : la première adresse est celle du client.
 */
export async function identifiantAppelant(): Promise<string> {
  const entetes = await headers()
  const transmis = entetes.get('x-forwarded-for')
  if (transmis) return transmis.split(',')[0]!.trim()
  return entetes.get('x-real-ip') ?? 'inconnu'
}

export type ResultatLimite = { autorise: true } | { autorise: false; secondesRestantes: number }

export async function verifierLimite(
  action: string,
  { maximum = 5, dureeMs = 60 * 60 * 1000 }: { maximum?: number; dureeMs?: number } = {},
): Promise<ResultatLimite> {
  const appelant = await identifiantAppelant()
  const cle = `${action}:${appelant}`
  const maintenant = Date.now()

  nettoyer(maintenant, dureeMs)

  const fenetre = compteurs.get(cle)
  if (!fenetre || maintenant - fenetre.debut > dureeMs) {
    compteurs.set(cle, { debut: maintenant, compte: 1 })
    return { autorise: true }
  }

  if (fenetre.compte >= maximum) {
    const secondesRestantes = Math.ceil((fenetre.debut + dureeMs - maintenant) / 1000)
    return { autorise: false, secondesRestantes }
  }

  fenetre.compte += 1
  return { autorise: true }
}

/** Remet les compteurs à zéro — réservé aux tests. */
export function reinitialiserLimites() {
  compteurs.clear()
}
