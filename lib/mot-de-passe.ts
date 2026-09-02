import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto'

/**
 * `promisify` perd la surcharge à quatre arguments de `scrypt` : on écrit
 * l'enveloppe à la main pour conserver le passage des options.
 */
function scrypt(
  motDePasse: string,
  sel: Buffer,
  longueur: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resoudre, rejeter) => {
    scryptCallback(motDePasse, sel, longueur, options, (erreur, cle) =>
      erreur ? rejeter(erreur) : resoudre(cle),
    )
  })
}

/**
 * Hachage des mots de passe du back-office.
 *
 * On utilise `scrypt`, fourni par la bibliothèque standard de Node. C'est
 * une fonction de dérivation de clé conçue pour ça : lente et coûteuse en
 * mémoire, donc résistante aux attaques par force brute matérielle.
 *
 * Le choix évite deux écueils : argon2 et bcrypt natifs demandent une
 * compilation qui casse régulièrement au déploiement, et les portages
 * JavaScript purs sont notablement plus lents. Ici, aucune dépendance.
 *
 * Format stocké : `scrypt$N$r$p$sel$empreinte`, tout en hexadécimal. Les
 * paramètres voyagent avec l'empreinte : le jour où on les durcit, les
 * anciens mots de passe restent vérifiables.
 */

const PARAMETRES = { N: 16_384, r: 8, p: 1, longueurCle: 64, longueurSel: 16 }

export async function hacher(motDePasse: string): Promise<string> {
  const sel = randomBytes(PARAMETRES.longueurSel)
  const empreinte = await scrypt(motDePasse.normalize('NFKC'), sel, PARAMETRES.longueurCle, {
    N: PARAMETRES.N,
    r: PARAMETRES.r,
    p: PARAMETRES.p,
    maxmem: 128 * PARAMETRES.N * PARAMETRES.r * 2,
  })

  return [
    'scrypt',
    PARAMETRES.N,
    PARAMETRES.r,
    PARAMETRES.p,
    sel.toString('hex'),
    empreinte.toString('hex'),
  ].join('$')
}

/**
 * Vérifie un mot de passe.
 *
 * La comparaison est à temps constant : comparer deux empreintes avec `===`
 * s'arrête au premier octet différent, ce qui laisse fuir de l'information
 * par le temps de réponse.
 */
export async function verifier(motDePasse: string, stocke: string): Promise<boolean> {
  try {
    const [algorithme, n, r, p, selHex, empreinteHex] = stocke.split('$')
    if (algorithme !== 'scrypt' || !selHex || !empreinteHex) return false

    const sel = Buffer.from(selHex, 'hex')
    const attendue = Buffer.from(empreinteHex, 'hex')
    const N = Number(n)
    const R = Number(r)

    const calculee = await scrypt(motDePasse.normalize('NFKC'), sel, attendue.length, {
      N,
      r: R,
      p: Number(p),
      maxmem: 128 * N * R * 2,
    })

    return calculee.length === attendue.length && timingSafeEqual(calculee, attendue)
  } catch {
    return false
  }
}
