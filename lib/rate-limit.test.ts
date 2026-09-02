import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `verifierLimite` lit l'adresse de l'appelant dans les en-têtes de la
 * requête. En test, on simule ce module de Next : ce qu'on vérifie ici,
 * c'est le comptage et la fenêtre glissante, pas l'accès aux en-têtes.
 */
const entetes = new Map<string, string>([['x-forwarded-for', '203.0.113.7']])

vi.mock('next/headers', () => ({
  headers: async () => ({ get: (nom: string) => entetes.get(nom) ?? null }),
}))

const { verifierLimite, reinitialiserLimites, identifiantAppelant } = await import('./rate-limit')

beforeEach(() => {
  reinitialiserLimites()
  entetes.set('x-forwarded-for', '203.0.113.7')
  vi.useRealTimers()
})

describe('Limitation de débit', () => {
  it('laisse passer jusqu’au maximum, puis refuse', async () => {
    for (let essai = 1; essai <= 3; essai++) {
      const resultat = await verifierLimite('devis', { maximum: 3 })
      expect(resultat.autorise, `essai ${essai}`).toBe(true)
    }
    const quatrieme = await verifierLimite('devis', { maximum: 3 })
    expect(quatrieme.autorise).toBe(false)
  })

  it('indique combien de temps attendre', async () => {
    await verifierLimite('devis', { maximum: 1, dureeMs: 60_000 })
    const refus = await verifierLimite('devis', { maximum: 1, dureeMs: 60_000 })
    expect(refus.autorise).toBe(false)
    if (!refus.autorise) {
      expect(refus.secondesRestantes).toBeGreaterThan(0)
      expect(refus.secondesRestantes).toBeLessThanOrEqual(60)
    }
  })

  it('compte séparément chaque action', async () => {
    await verifierLimite('devis', { maximum: 1 })
    // La limite du devis est atteinte, celle de l'inscription non.
    expect((await verifierLimite('devis', { maximum: 1 })).autorise).toBe(false)
    expect((await verifierLimite('inscription', { maximum: 1 })).autorise).toBe(true)
  })

  it('compte séparément chaque appelant', async () => {
    await verifierLimite('devis', { maximum: 1 })
    expect((await verifierLimite('devis', { maximum: 1 })).autorise).toBe(false)

    entetes.set('x-forwarded-for', '198.51.100.4')
    expect((await verifierLimite('devis', { maximum: 1 })).autorise).toBe(true)
  })

  it('rouvre le passage une fois la fenêtre écoulée', async () => {
    vi.useFakeTimers()
    await verifierLimite('devis', { maximum: 1, dureeMs: 1000 })
    expect((await verifierLimite('devis', { maximum: 1, dureeMs: 1000 })).autorise).toBe(false)

    vi.advanceTimersByTime(1500)
    expect((await verifierLimite('devis', { maximum: 1, dureeMs: 1000 })).autorise).toBe(true)
  })

  it('retient la première adresse de la chaîne de proxys', async () => {
    entetes.set('x-forwarded-for', '203.0.113.9, 70.41.3.18, 150.172.238.178')
    expect(await identifiantAppelant()).toBe('203.0.113.9')
  })
})
