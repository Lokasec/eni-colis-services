import { describe, expect, it } from 'vitest'
import { arrondir, arrondirDevise, convertirDepuisEuros, decimalesDe } from './devise'
import { Decimal, type PaysDevise } from './types'

const TAUX_CFA = '655.957'

const coteDIvoire: PaysDevise = { monnaie: 'XOF', tauxFixe: TAUX_CFA, tauxManuel: null }
const congo: PaysDevise = { monnaie: 'XAF', tauxFixe: TAUX_CFA, tauxManuel: null }
const france: PaysDevise = { monnaie: 'EUR', tauxFixe: null, tauxManuel: null }
const etatsUnis: PaysDevise = { monnaie: 'USD', tauxFixe: null, tauxManuel: '0.92' }
const guinee: PaysDevise = { monnaie: 'GNF', tauxFixe: null, tauxManuel: null }

describe('Zone CFA — parité fixe, conversion automatique', () => {
  it('convertit au taux de la base et arrondit au franc', () => {
    // 187,50 € × 655,957 = 122 991,9375 → 122 992 FCFA.
    // C'est le montant figé sur la facture FAC-2026-00001 du seed.
    const resultat = convertirDepuisEuros('187.50', coteDIvoire)
    expect(resultat).toMatchObject({ statut: 'CONVERTI', devise: 'XOF', source: 'PARITE_FIXE' })
    if (resultat.statut !== 'CONVERTI') return
    expect(resultat.montant.toFixed(0)).toBe('122992')
    expect(resultat.taux.toString()).toBe(TAUX_CFA)
  })

  it('traite le XAF comme le XOF : même parité', () => {
    const xof = convertirDepuisEuros('100', coteDIvoire)
    const xaf = convertirDepuisEuros('100', congo)
    if (xof.statut !== 'CONVERTI' || xaf.statut !== 'CONVERTI')
      throw new Error('conversion attendue')
    expect(xaf.montant.toFixed(0)).toBe(xof.montant.toFixed(0))
    expect(xaf.devise).toBe('XAF')
  })

  it('ne laisse aucune décimale : le franc CFA ne se subdivise pas', () => {
    const resultat = convertirDepuisEuros('1', coteDIvoire)
    if (resultat.statut !== 'CONVERTI') throw new Error('conversion attendue')
    expect(resultat.montant.toFixed(2)).toBe('656.00')
    expect(resultat.montant.decimalPlaces()).toBe(0)
  })

  it('renvoie le taux, pour qu’il soit FIGÉ sur le document', () => {
    // Le document doit stocker ce taux : il ne sera jamais recalculé à
    // l'encaissement, même si la parité venait à changer.
    const resultat = convertirDepuisEuros('50', coteDIvoire)
    if (resultat.statut !== 'CONVERTI') throw new Error('conversion attendue')
    expect(resultat.taux).toBeInstanceOf(Decimal)
    expect(resultat.taux.equals(new Decimal(TAUX_CFA))).toBe(true)
  })
})

describe('Devises flottantes — taux saisi, jamais deviné', () => {
  it('utilise le taux manuel du back-office', () => {
    const resultat = convertirDepuisEuros('100', etatsUnis)
    expect(resultat).toMatchObject({ statut: 'CONVERTI', devise: 'USD', source: 'TAUX_SAISI' })
    if (resultat.statut !== 'CONVERTI') return
    expect(resultat.montant.toFixed(2)).toBe('92.00')
  })

  it('REFUSE de convertir sans taux saisi', () => {
    // Le point important du lot : en l'absence de taux, on ne devine pas,
    // on ne va pas chercher un cours en ligne, on bloque.
    const resultat = convertirDepuisEuros('100', guinee)
    expect(resultat).toMatchObject({ statut: 'TAUX_MANQUANT', devise: 'GNF' })
  })

  it('donne la priorité à la parité fixe si les deux sont renseignés', () => {
    const ambigu: PaysDevise = { monnaie: 'XOF', tauxFixe: TAUX_CFA, tauxManuel: '1.5' }
    const resultat = convertirDepuisEuros('10', ambigu)
    if (resultat.statut !== 'CONVERTI') throw new Error('conversion attendue')
    expect(resultat.source).toBe('PARITE_FIXE')
    expect(resultat.montant.toFixed(0)).toBe('6560')
  })
})

describe('Euros', () => {
  it('ne convertit pas un montant déjà en euros', () => {
    expect(convertirDepuisEuros('100', france)).toEqual({ statut: 'EUROS_SEULEMENT' })
  })
})

describe('Arrondi commercial', () => {
  it('arrondit la demi-unité vers le haut, pas au pair le plus proche', () => {
    // L'arrondi bancaire donnerait 0,12 : ce n'est pas la règle commerciale.
    expect(arrondir(new Decimal('0.125'), 2).toFixed(2)).toBe('0.13')
    expect(arrondir(new Decimal('2.5'), 0).toFixed(0)).toBe('3')
    expect(arrondir(new Decimal('3.5'), 0).toFixed(0)).toBe('4')
  })

  it('applique le bon nombre de décimales par devise', () => {
    expect(decimalesDe('EUR')).toBe(2)
    expect(decimalesDe('USD')).toBe(2)
    expect(decimalesDe('XOF')).toBe(0)
    expect(decimalesDe('XAF')).toBe(0)
    expect(decimalesDe('GNF')).toBe(0)
    expect(decimalesDe('CDF')).toBe(0)
  })

  it('arrondit selon la devise cible', () => {
    expect(arrondirDevise(new Decimal('1234.567'), 'EUR').toFixed(2)).toBe('1234.57')
    expect(arrondirDevise(new Decimal('1234.567'), 'XOF').toFixed(0)).toBe('1235')
  })
})
