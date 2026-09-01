import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Garde-fou d'architecture.
 *
 * « Aucun calcul de prix automatique côté public. Ni calculateur, ni
 *   estimation indicative. » — CLAUDE.md §1.3
 *
 * Ce test échoue si un fichier du site public importe le moteur de
 * tarification. C'est la seule protection durable : une note dans un
 * commentaire se contourne sans s'en apercevoir, un test rouge non.
 *
 * Le back-office (app/admin, components/admin) a le droit de l'appeler ;
 * il l'utilise comme suggestion modifiable.
 */

const RACINE = join(import.meta.dirname, '..', '..')

/** Dossiers scannés : tout le code applicatif. */
const DOSSIERS_SCANNES = ['app', 'components', 'lib']

/** Chemins autorisés à importer le moteur. */
const AUTORISES = [
  join('app', 'admin'),
  join('app', 'api', 'admin'),
  join('lib', 'tarification'),
  join('lib', 'admin'),
]

const EXTENSIONS = ['.ts', '.tsx', '.mts', '.js', '.jsx']
const IGNORES = new Set(['node_modules', 'generated', '.next'])

function fichiersDeCode(dossier: string): string[] {
  let entrees: string[]
  try {
    entrees = readdirSync(dossier)
  } catch {
    return []
  }

  return entrees.flatMap((entree) => {
    if (IGNORES.has(entree)) return []
    const chemin = join(dossier, entree)
    if (statSync(chemin).isDirectory()) return fichiersDeCode(chemin)
    return EXTENSIONS.some((ext) => entree.endsWith(ext)) ? [chemin] : []
  })
}

/** Repère un import du moteur, quelle que soit la forme du chemin. */
const IMPORTE_LE_MOTEUR =
  /(?:from|import|require)\s*\(?\s*['"][^'"]*(?:@\/lib\/tarification|\.\.?\/(?:\.\.\/)*tarification)[^'"]*['"]/

describe('Isolement du moteur de tarification', () => {
  const fichiers = DOSSIERS_SCANNES.flatMap((d) => fichiersDeCode(join(RACINE, d)))

  it('trouve bien des fichiers à analyser', () => {
    // Sans ce garde-fou, une erreur de chemin rendrait le test vert à vide.
    expect(fichiers.length).toBeGreaterThan(20)
  })

  it("n'est importé par aucun fichier du site public", () => {
    const fautifs = fichiers
      .map((fichier) => relative(RACINE, fichier))
      .filter((chemin) => !chemin.endsWith('.test.ts') && !chemin.endsWith('.test.tsx'))
      .filter((chemin) => !AUTORISES.some((autorise) => chemin.startsWith(autorise + sep)))
      .filter((chemin) => IMPORTE_LE_MOTEUR.test(readFileSync(join(RACINE, chemin), 'utf8')))

    expect(
      fautifs,
      `Le moteur de tarification est importé côté public : ${fautifs.join(', ')}.\n` +
        "Le site public n'affiche aucun prix calculé (CLAUDE.md §1.3). " +
        'Les tarifs au kilo affichés sont lus tels quels en base.',
    ).toEqual([])
  })

  it('détecte réellement un import fautif', () => {
    // On vérifie que la détection fonctionne, sinon le test précédent
    // pourrait rester vert alors qu'il ne teste rien.
    expect(IMPORTE_LE_MOTEUR.test(`import { calculerTarif } from '@/lib/tarification'`)).toBe(true)
    expect(IMPORTE_LE_MOTEUR.test(`import { calculerTarif } from '../tarification/calculer'`)).toBe(
      true,
    )
    expect(IMPORTE_LE_MOTEUR.test(`const t = require('@/lib/tarification')`)).toBe(true)
    expect(IMPORTE_LE_MOTEUR.test(`import { Button } from '@/components/ui/button'`)).toBe(false)
  })
})
