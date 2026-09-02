import { Decimal, type Dimensions, type ParametresPoids, type PoidsFacture } from './types'

/**
 * Détermination du POIDS FACTURÉ.
 *
 * Trois règles, toutes confirmées par la cliente et toutes paramétrées en
 * base — aucune valeur n'est écrite ici :
 *
 *  1. Poids volumétrique : (L × l × h en cm) ÷ diviseur. Quand il dépasse le
 *     poids réel, c'est lui qui est retenu. Un carton de couettes pèse peu
 *     et occupe la place de vingt kilos : le transport se paie au volume.
 *  2. Arrondi vers le HAUT au pas configuré — au kilo supérieur — mais
 *     avec une TOLÉRANCE sur l'excédent : en deçà de 100 g, l'excédent est
 *     négligé. Un colis à 4,050 kg reste facturé 4 kg ; à 4,100 kg il passe
 *     à 5 kg. C'est un geste commercial, et il doit se lire sur la facture.
 *  3. Poids minimum facturé — 1 kg. Il l'emporte sur tout le reste : un
 *     colis de 50 g tombe sous la tolérance, mais reste facturé 1 kg.
 *
 * Le détail renvoyé explique le calcul en clair. Il figure sur le devis et
 * la facture : un client qui voit « 13 kg » pour un colis pesé à 12,5 kg
 * doit comprendre pourquoi sans avoir à téléphoner.
 */

/**
 * Arrondi vers le haut au pas donné, avec tolérance sur l'excédent.
 *
 * La comparaison est STRICTE : à 4,100 kg pile, la tolérance de 100 g ne
 * joue plus et le colis passe à 5 kg. C'est ce qu'a dicté la cliente —
 * « quatre kilos cent, on passe directement au kilo supérieur ».
 *
 * Un pas nul ou absent laisse le poids exact ; une tolérance nulle
 * rétablit l'arrondi vers le haut pur.
 */
function arrondirAvecTolerance(poids: Decimal, pas: Decimal, tolerance: Decimal): Decimal {
  if (!pas.isFinite() || pas.lessThanOrEqualTo(0)) return poids

  const reste = poids.mod(pas)
  if (reste.isZero()) return poids

  const inferieur = poids.minus(reste)
  if (tolerance.isFinite() && tolerance.greaterThan(0) && reste.lessThan(tolerance)) {
    return inferieur
  }
  return inferieur.plus(pas)
}

export function calculerPoidsVolumetrique(
  dimensions: Dimensions,
  diviseur: number,
): Decimal | null {
  if (!Number.isFinite(diviseur) || diviseur <= 0) return null
  const l = new Decimal(dimensions.longueurCm)
  const L = new Decimal(dimensions.largeurCm)
  const h = new Decimal(dimensions.hauteurCm)
  if ([l, L, h].some((v) => !v.isFinite() || v.lessThanOrEqualTo(0))) return null
  return l.mul(L).mul(h).div(diviseur)
}

export function resoudrePoidsFacture(
  poidsReelKg: Decimal | null,
  dimensions: Dimensions | null | undefined,
  parametres: ParametresPoids,
): PoidsFacture {
  const diviseur = parametres.diviseurVolumetrique
  const volumetrique =
    parametres.appliquerPoidsVolumetrique &&
    dimensions &&
    diviseur !== null &&
    diviseur !== undefined
      ? calculerPoidsVolumetrique(dimensions, diviseur)
      : null

  if (poidsReelKg === null && volumetrique === null) {
    return {
      statut: 'INDETERMINE',
      motif:
        'Ni poids ni dimensions exploitables. Pesez le colis, ou saisissez ses trois dimensions.',
    }
  }

  // On retient le plus élevé des deux : c'est la règle du fret aérien.
  let retenu: Decimal
  let source: 'REEL' | 'VOLUMETRIQUE'
  if (poidsReelKg === null) {
    retenu = volumetrique!
    source = 'VOLUMETRIQUE'
  } else if (volumetrique !== null && volumetrique.greaterThan(poidsReelKg)) {
    retenu = volumetrique
    source = 'VOLUMETRIQUE'
  } else {
    retenu = poidsReelKg
    source = 'REEL'
  }

  const pas = new Decimal(parametres.pasArrondiPoidsKg)
  const minimum = new Decimal(parametres.poidsMinimumFactureKg)
  const tolerance = new Decimal(parametres.toleranceArrondiKg)

  const arrondi = arrondirAvecTolerance(retenu, pas, tolerance)
  const facture = arrondi.lessThan(minimum) ? minimum : arrondi

  return {
    statut: 'RETENU',
    poidsFactureKg: facture,
    poidsReelKg,
    poidsVolumetriqueKg: volumetrique,
    source,
    detail: expliquer(facture, retenu, source, minimum, tolerance),
  }
}

function nombre(valeur: Decimal): string {
  return valeur.toDecimalPlaces(3).toString().replace('.', ',')
}

function expliquer(
  facture: Decimal,
  retenu: Decimal,
  source: 'REEL' | 'VOLUMETRIQUE',
  minimum: Decimal,
  tolerance: Decimal,
): string {
  const precisions: string[] = []

  if (source === 'VOLUMETRIQUE') {
    precisions.push(`poids volumétrique ${nombre(retenu)} kg`)
  }
  if (facture.greaterThan(retenu)) {
    precisions.push(
      facture.equals(minimum) && minimum.greaterThan(retenu)
        ? `minimum facturé ${nombre(minimum)} kg`
        : `${nombre(retenu)} kg arrondis au kilo supérieur`,
    )
  } else if (facture.lessThan(retenu)) {
    // L'arrondi a joué EN FAVEUR du client. Le dire : une facture qui
    // affiche 4 kg pour un colis pesé à 4,05 kg a l'air d'une erreur si
    // elle ne s'explique pas.
    precisions.push(`${nombre(retenu)} kg pesés, tolérance de ${nombre(tolerance)} kg`)
  }

  const base = `${nombre(facture)} kg`
  return precisions.length > 0 ? `${base} (${precisions.join(', ')})` : base
}
