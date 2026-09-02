import { describe, expect, it } from 'vitest'
import { resoudrePoidsFacture } from './poids'
import { Decimal } from './types'
import type { ParametresPoids } from './types'

/**
 * Le poids facturé, dicté par la cliente le 2 septembre 2026, dans ses mots :
 *
 *   « entre cent grammes et neuf cents grammes, on facture un kilo »
 *   « si on est à quatre kilos cent ou quatre kilos deux cents, on facture
 *     à l'arrondi supérieur directement »
 *
 * Ces deux phrases décrivent une seule et même règle : arrondi au kilo
 * supérieur, avec un minimum d'un kilo. Elles sont épinglées ici parce
 * qu'elles commandent CHAQUE facture : si quelqu'un ramenait le pas
 * d'arrondi à 0,1 kg, tous les montants baisseraient sans qu'aucun écran
 * ne le signale.
 */
const parametres: ParametresPoids = {
  pasArrondiPoidsKg: new Decimal('1'),
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

  it('facture un kilo en deçà de 100 g — le minimum prime', () => {
    // « Si un colis pèse cinquante grammes, on facture un kilo. »
    expect(facture('0.050')).toBe('1')
  })

  it('arrondit directement au kilo supérieur au-delà du premier kilo', () => {
    expect(facture('4.100')).toBe('5')
    expect(facture('4.200')).toBe('5')
  })

  it('ne gonfle pas un poids déjà rond', () => {
    // Le piège classique d'un arrondi vers le haut mal écrit : 5,000 kg
    // deviendrait 6 kg. Un client qui pèse pile 5 kg paie 5 kg.
    expect(facture('1.000')).toBe('1')
    expect(facture('5.000')).toBe('5')
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
