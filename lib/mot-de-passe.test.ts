import { afterEach, describe, expect, it, vi } from 'vitest'
import { hacher, refuserMotDePasse, verifier } from './mot-de-passe'

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

/**
 * La politique de mot de passe protège un back-office sans second facteur.
 * Deux refus comptent plus que les autres : le mot de passe de démonstration,
 * qui figure en clair dans le dépôt, et le nom du titulaire, qui est la
 * première chose qu'on essaie quand on connaît l'entreprise.
 */
describe('Politique de mot de passe', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('exige douze caractères', () => {
    expect(refuserMotDePasse('court')).toMatch(/12 caractères/)
    expect(refuserMotDePasse('douze-carac.')).toBeNull()
  })

  it('refuse le mot de passe des comptes de démonstration', () => {
    vi.stubEnv('SEED_MOT_DE_PASSE', 'eni-demo-2026')
    // Il fait plus de douze caractères : sans ce contrôle, rien ne
    // l'empêcherait de rester en place indéfiniment.
    expect(refuserMotDePasse('eni-demo-2026')).toMatch(/démonstration/)
  })

  it('refuse un mot de passe qui contient le nom ou l’adresse', () => {
    const titulaire = { email: 'aicha@enicolisservices.com', nom: 'Aïcha Konan' }
    expect(refuserMotDePasse('aicha-et-son-colis', titulaire)).toMatch(/nom/)
    expect(refuserMotDePasse('konan-transporte-tout', titulaire)).toMatch(/nom/)
    expect(refuserMotDePasse('le-fleuve-et-la-pirogue', titulaire)).toBeNull()
  })

  it('ignore les fragments trop courts pour être significatifs', () => {
    // « Li » ne doit pas interdire tout mot de passe contenant ces lettres.
    expect(refuserMotDePasse('bateau-sur-le-fleuve', { nom: 'Li Ba' })).toBeNull()
  })

  it('compare après normalisation Unicode', () => {
    vi.stubEnv('SEED_MOT_DE_PASSE', 'éni-demo-2026')
    // Même chaîne, composée différemment : « é » en un point de code ou en
    // « e » suivi d'un accent combinant. Sans normalisation, le contrôle
    // passerait à côté.
    expect(refuserMotDePasse('e\u0301ni-demo-2026')).toMatch(/démonstration/)
  })
})
