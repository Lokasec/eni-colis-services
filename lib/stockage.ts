import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { put } from '@vercel/blob'
import { renseignee } from '@/lib/env'

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
 *
 * LE REPLI SUR DISQUE NE DOIT JAMAIS S'EXÉCUTER EN PRODUCTION, et ce
 * n'est pas une précaution de style. Le système de fichiers d'une fonction
 * serverless est en LECTURE SEULE : `mkdir` y lève `EROFS`. Cette
 * exception remontait jusqu'à la Server Action, qui la laissait échapper —
 * et le visiteur perdait sa demande ENTIÈRE parce qu'il avait joint une
 * photo. Le colis n'était pas en cause, la demande non plus : seul le
 * stockage manquait. On refuse donc explicitement ce chemin en production,
 * plutôt que d'attendre qu'il explose.
 */

const TYPES_ACCEPTES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif']
const TAILLE_MAX = 5 * 1024 * 1024

export type PhotoDeposee = { url: string; nomOriginal: string; tailleOctets: number }

/**
 * Deux échecs, qui n'appellent pas du tout la même réponse.
 *
 * `REFUS` — le fichier ne convient pas : trop lourd, mauvais format. Le
 * visiteur peut corriger, on le lui dit et on bloque l'envoi.
 *
 * `INDISPONIBLE` — notre stockage est en défaut. Le visiteur n'y est pour
 * rien, et lui refuser sa demande serait lui faire payer notre panne : la
 * demande est enregistrée sans les photos, et on lui explique comment nous
 * les faire parvenir.
 */
export type EchecDepot =
  { echec: 'REFUS'; message: string } | { echec: 'INDISPONIBLE'; message: string }

export type ResultatDepot = PhotoDeposee | EchecDepot

export function estEchec(resultat: ResultatDepot): resultat is EchecDepot {
  return 'echec' in resultat
}

/**
 * Dépose une photo et renvoie son URL.
 *
 * Le type et la taille sont revérifiés ICI, côté serveur : le contrôle du
 * navigateur est un confort, il ne protège de rien.
 */
export async function deposerPhoto(fichier: File): Promise<ResultatDepot> {
  if (fichier.size === 0) return { echec: 'REFUS', message: 'Fichier vide.' }
  if (fichier.size > TAILLE_MAX) {
    return {
      echec: 'REFUS',
      message: 'Cette photo dépasse 5 Mo. Reprenez-la ou choisissez-en une autre.',
    }
  }
  if (fichier.type && !TYPES_ACCEPTES.includes(fichier.type)) {
    return {
      echec: 'REFUS',
      message: 'Format non accepté. Utilisez une photo JPEG, PNG ou HEIC.',
    }
  }

  const nom = nomSur(fichier.name)

  // `renseignee` et pas `process.env.X` seul : Vercel crée une variable
  // VIDE pour chaque clé trouvée dans `.env.example` à l'import d'un dépôt.
  // Une chaîne vide est falsy, donc le repli disque se déclencherait — en
  // production, c'est-à-dire là où il est interdit.
  const jeton = renseignee(process.env.BLOB_READ_WRITE_TOKEN)

  if (jeton) {
    try {
      const blob = await put(`devis/${nom}`, fichier, {
        access: 'public',
        token: jeton,
        addRandomSuffix: true,
        contentType: fichier.type || 'image/jpeg',
      })
      return { url: blob.url, nomOriginal: fichier.name, tailleOctets: fichier.size }
    } catch (erreur) {
      // Quota atteint, jeton révoqué, incident réseau : ce sont nos
      // problèmes, pas ceux du visiteur.
      console.error('[stockage] dépôt Vercel Blob impossible :', erreur)
      return { echec: 'INDISPONIBLE', message: MESSAGE_INDISPONIBLE }
    }
  }

  if (process.env.NODE_ENV === 'production') {
    console.error(
      '[stockage] BLOB_READ_WRITE_TOKEN absent ou vide en production : ' +
        'aucune photo ne peut être conservée. Créer le magasin Blob en région ' +
        'Europe et renseigner le jeton (DEPLOIEMENT.md §6).',
    )
    return { echec: 'INDISPONIBLE', message: MESSAGE_INDISPONIBLE }
  }

  // Développement seulement : disque local.
  const dossier = join(process.cwd(), 'public', 'uploads')
  await mkdir(dossier, { recursive: true })
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${nom}`
  await writeFile(join(dossier, unique), Buffer.from(await fichier.arrayBuffer()))

  return { url: `/uploads/${unique}`, nomOriginal: fichier.name, tailleOctets: fichier.size }
}

const MESSAGE_INDISPONIBLE =
  'Vos photos n’ont pas pu être enregistrées à cause d’un incident de notre côté.'

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
