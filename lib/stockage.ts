import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { put } from '@vercel/blob'

/**
 * Stockage des photos de devis.
 *
 * ⚠️ RGPD — les photos envoyées par les clients sont des données
 * personnelles : elles ne doivent pas quitter l'Union européenne, au même
 * titre que la base. Le magasin Vercel Blob doit être créé en RÉGION
 * EUROPE (voir DEPLOIEMENT.md §6).
 *
 * Deux implémentations, choisies sur la présence du jeton :
 *  - production : Vercel Blob ;
 *  - développement : écriture dans `public/uploads/`, ignoré par Git.
 *    Ce chemin ne fonctionne QUE localement — le système de fichiers d'une
 *    fonction serverless est en lecture seule et éphémère.
 */

const TYPES_ACCEPTES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif']
const TAILLE_MAX = 5 * 1024 * 1024

export type PhotoDeposee = { url: string; nomOriginal: string; tailleOctets: number }

export type EchecDepot = { erreur: string }

/**
 * Dépose une photo et renvoie son URL.
 *
 * Le type et la taille sont revérifiés ICI, côté serveur : le contrôle du
 * navigateur est un confort, il ne protège de rien.
 */
export async function deposerPhoto(fichier: File): Promise<PhotoDeposee | EchecDepot> {
  if (fichier.size === 0) return { erreur: 'Fichier vide.' }
  if (fichier.size > TAILLE_MAX) {
    return { erreur: 'Cette photo dépasse 5 Mo. Reprenez-la ou choisissez-en une autre.' }
  }
  if (fichier.type && !TYPES_ACCEPTES.includes(fichier.type)) {
    return { erreur: 'Format non accepté. Utilisez une photo JPEG, PNG ou HEIC.' }
  }

  const nom = nomSur(fichier.name)

  const jeton = process.env.BLOB_READ_WRITE_TOKEN
  if (jeton) {
    const blob = await put(`devis/${nom}`, fichier, {
      access: 'public',
      token: jeton,
      addRandomSuffix: true,
      contentType: fichier.type || 'image/jpeg',
    })
    return { url: blob.url, nomOriginal: fichier.name, tailleOctets: fichier.size }
  }

  // Développement : disque local.
  const dossier = join(process.cwd(), 'public', 'uploads')
  await mkdir(dossier, { recursive: true })
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${nom}`
  await writeFile(join(dossier, unique), Buffer.from(await fichier.arrayBuffer()))

  return { url: `/uploads/${unique}`, nomOriginal: fichier.name, tailleOctets: fichier.size }
}

/**
 * Assainit un nom de fichier : on ne fait jamais confiance à celui fourni
 * par le navigateur, qui peut contenir des séparateurs de chemin.
 */
function nomSur(nom: string): string {
  const base = nom.split(/[\\/]/).pop() ?? 'photo'
  const nettoye = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(-80)
  return nettoye || 'photo.jpg'
}
