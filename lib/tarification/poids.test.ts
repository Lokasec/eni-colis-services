import { describe, expect, it } from 'vitest'
import { resoudrePoidsFacture } from './poids'
import { Decimal } from './types'
import type { ParametresPoids } from './types'

/**
 * Le poids facturé, dicté par la cliente le 2 septembre 2026, dans ses mots :
 *
 *   « entre cent grammes et neuf cents grammes, on facture un kilo »
 *   « un colis qui pèse quatre kilos cinquante grammes doit rester à
 *     quatre kilos »
 *   « quatre kilos cent, deux cents, trois cents : on passe directement au
 *     kilo supérieur »
 *
 * Soit : arrondi au kilo supérieur, TOLÉRANCE de 100 g sur l'excédent,
 * minimum d'un kilo. La comparaison est stricte — à 4,100 kg pile, la
 * tolérance ne joue plus.
 *
 * Ces cas sont épinglés parce qu'ils commandent CHAQUE facture : si
 * quelqu'un portait la tolérance à 500 g, tous les montants baisseraient
 * sans qu'aucun écran ne le signale.
 */
const parametres: ParametresPoids = {
  pasArrondiPoidsKg: new Decimal('1'),
  toleranceArrondiKg: new Decimal('0.1'),
  poidsMinimumFactureKg: new Decimal('1'),
  diviseurVolumetrique: 5000,
  appliquerPoidsVolumetrique: true,
}

function facture(kg: string): string {
  const resultat = resoudrePoidsFacture(new Decimal(kg), null, parametres)
  if (resultat.statut !== 'RETENU') throw new Error(resultat.motif)
  return resultat.poidsFactureKg.toString()
}

describe('poids facturé — règles dictées par la cliente', () => {
  it('facture un kilo entre 100 g et 900 g', () => {
    expect(facture('0.100')).toBe('1')
    expect(facture('0.500')).toBe('1')
    expect(facture('0.900')).toBe('1')
  })

  it('facture un kilo en deçà de 100 g — le minimum prime sur la tolérance', () => {
    // « Si un colis pèse cinquante grammes, on facture un kilo. » 50 g
    // tombe sous la tolérance, l'arrondi donnerait 0 kg : c'est le
    // minimum facturé qui rattrape, pas l'arrondi.
    expect(facture('0.050')).toBe('1')
  })

  it('néglige un excédent inférieur à 100 g', () => {
    // « Un colis qui pèse 4,050 kg doit rester à quatre kilos. »
    expect(facture('4.050')).toBe('4')
    expect(facture('4.099')).toBe('4')
    expect(facture('12.010')).toBe('12')
  })

  it('passe au kilo supérieur dès 100 g d’excédent — comparaison stricte', () => {
    // 4,100 kg PILE bascule. C'est la frontière exacte dictée par la
    // cliente ; un `<=` au lieu d'un `<` la déplacerait d'un gramme.
    expect(facture('4.100')).toBe('5')
    expect(facture('4.200')).toBe('5')
    expect(facture('4.300')).toBe('5')
    expect(facture('12.500')).toBe('13')
  })

  it('ne gonfle pas un poids déjà rond', () => {
    // Le piège classique d'un arrondi vers le haut mal écrit : 5,000 kg
    // deviendrait 6 kg. Un client qui pèse pile 5 kg paie 5 kg.
    expect(facture('1.000')).toBe('1')
    expect(facture('5.000')).toBe('5')
  })

  it('explique la tolérance sur le document', () => {
    // Une facture qui affiche 4 kg pour un colis pesé à 4,05 kg a l'air
    // d'une erreur si elle ne s'explique pas.
    const resultat = resoudrePoidsFacture(new Decimal('4.050'), null, parametres)
    if (resultat.statut !== 'RETENU') throw new Error(resultat.motif)
    expect(resultat.detail).toBe('4 kg (4,05 kg pesés, tolérance de 0,1 kg)')
  })

  it('rétablit l’arrondi vers le haut pur si la tolérance est remise à zéro', () => {
    const sansTolerance = { ...parametres, toleranceArrondiKg: new Decimal('0') }
    const resultat = resoudrePoidsFacture(new Decimal('4.050'), null, sansTolerance)
    if (resultat.statut !== 'RETENU') throw new Error(resultat.motif)
    expect(resultat.poidsFactureKg.toString()).toBe('5')
  })

  it('applique le poids volumétrique quand il dépasse le poids réel', () => {
    // Un carton de 60 × 40 × 30 cm ne pèse que 3 kg : 72 000 ÷ 5000 = 14,4,
    // arrondi à 15. C'est l'encombrement qui est facturé, pas la masse.
    const resultat = resoudrePoidsFacture(
      new Decimal('3'),
      { longueurCm: 60, largeurCm: 40, hauteurCm: 30 },
      parametres,
    )
    expect(resultat.statut).toBe('RETENU')
    if (resultat.statut !== 'RETENU') return
    expect(resultat.poidsFactureKg.toString()).toBe('15')
    expect(resultat.source).toBe('VOLUMETRIQUE')
  })
})
