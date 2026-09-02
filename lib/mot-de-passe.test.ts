import { describe, expect, it } from 'vitest'
import { hacher, verifier } from './mot-de-passe'

describe('Hachage des mots de passe', () => {
  it('accepte le bon mot de passe', async () => {
    const empreinte = await hacher('un-mot-de-passe-solide')
    expect(await verifier('un-mot-de-passe-solide', empreinte)).toBe(true)
  })

  it('refuse un mot de passe erroné', async () => {
    const empreinte = await hacher('un-mot-de-passe-solide')
    expect(await verifier('un-mot-de-passe-solid', empreinte)).toBe(false)
    expect(await verifier('', empreinte)).toBe(false)
  })

  it('produit une empreinte différente à chaque fois', async () => {
    // Le sel aléatoire empêche de reconnaître deux comptes qui partagent
    // le même mot de passe, et rend les tables précalculées inutiles.
    const a = await hacher('identique')
    const b = await hacher('identique')
    expect(a).not.toBe(b)
    expect(await verifier('identique', a)).toBe(true)
    expect(await verifier('identique', b)).toBe(true)
  })

  it('ne stocke jamais le mot de passe en clair', async () => {
    const empreinte = await hacher('secret-en-clair')
    expect(empreinte).not.toContain('secret-en-clair')
  })

  it('transporte ses paramètres avec l’empreinte', async () => {
    // Le jour où l'on durcit les paramètres, les anciens mots de passe
    // doivent rester vérifiables.
    const empreinte = await hacher('peu-importe')
    expect(empreinte.startsWith('scrypt$16384$8$1$')).toBe(true)
    expect(empreinte.split('$')).toHaveLength(6)
  })

  it('refuse une empreinte corrompue sans lever d’exception', async () => {
    for (const stocke of ['', 'nimporte-quoi', 'scrypt$1$2', 'bcrypt$16384$8$1$aa$bb']) {
      expect(await verifier('peu-importe', stocke)).toBe(false)
    }
  })
})
