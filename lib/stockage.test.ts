import { afterEach, describe, expect, it, vi } from 'vitest'
import { deposerPhoto, estEchec } from './stockage'

/**
 * Le dépôt d'une photo a trois issues, et la distinction entre les deux
 * dernières décide du sort d'une demande de devis :
 *
 *  - la photo est stockée ;
 *  - elle est REFUSÉE — le visiteur peut corriger, on bloque l'envoi ;
 *  - le stockage est INDISPONIBLE — le visiteur n'y est pour rien, la
 *    demande doit passer quand même.
 *
 * Confondre les deux derniers cas coûte cher dans un sens comme dans
 * l'autre : bloquer sur une panne fait perdre la demande, laisser passer
 * un fichier de 40 Mo remplit le magasin. D'où ces cas épinglés.
 */

function fichier(nom: string, type: string, octets: number): File {
  return new File([new Uint8Array(octets)], nom, { type })
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Photo refusée — le visiteur peut corriger', () => {
  it('refuse un fichier vide', async () => {
    const r = await deposerPhoto(fichier('photo.jpg', 'image/jpeg', 0))
    expect(estEchec(r) && r.echec).toBe('REFUS')
  })

  it('refuse au-delà de 5 Mo', async () => {
    const r = await deposerPhoto(fichier('photo.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1))
    expect(estEchec(r) && r.echec).toBe('REFUS')
  })

  it('refuse un format non image, quel que soit le nom du fichier', async () => {
    // Le nom est déguisé en .jpg : c'est le type déclaré qui est contrôlé,
    // et le navigateur n'est pas cru sur parole côté serveur.
    const r = await deposerPhoto(fichier('photo.jpg', 'application/pdf', 1024))
    expect(estEchec(r) && r.echec).toBe('REFUS')
  })

  it('accepte le HEIC — un iPhone n’envoie pas du JPEG par défaut', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '')
    const r = await deposerPhoto(fichier('IMG_0042.HEIC', 'image/heic', 2048))
    // Sans jeton on n'ira pas jusqu'au stockage, mais l'échec ne doit PAS
    // être un refus de format.
    expect(estEchec(r) && r.echec).toBe('INDISPONIBLE')
  })
})

describe('Stockage indisponible — la demande doit survivre', () => {
  it('ne tente pas le disque en production quand le jeton manque', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', undefined)
    const r = await deposerPhoto(fichier('photo.jpg', 'image/jpeg', 1024))
    expect(estEchec(r) && r.echec).toBe('INDISPONIBLE')
  })

  it('traite une variable VIDE comme absente', async () => {
    // Vercel crée une variable vide pour chaque clé de `.env.example` à
    // l'import d'un dépôt. Une chaîne vide ne doit pas être prise pour un
    // jeton, ni faire basculer sur le disque en lecture seule.
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '   ')
    const r = await deposerPhoto(fichier('photo.jpg', 'image/jpeg', 1024))
    expect(estEchec(r) && r.echec).toBe('INDISPONIBLE')
  })
})
