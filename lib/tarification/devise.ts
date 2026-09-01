import { Decimal, type Conversion, type Monnaie, type Numerique, type PaysDevise } from './types'

/**
 * Nombre de décimales par devise.
 *
 * Ce n'est pas une règle tarifaire mais une propriété des monnaies : le franc
 * CFA, le franc guinéen et le franc congolais ne se subdivisent pas dans
 * l'usage courant. Un montant à la « centime » de franc CFA n'existe pas.
 */
const DECIMALES: Record<Monnaie, number> = {
  EUR: 2,
  USD: 2,
  XOF: 0,
  XAF: 0,
  GNF: 0,
  CDF: 0,
}

/** Arrondi commercial : la moitié s'arrondit vers le haut. */
export function arrondir(valeur: Decimal, decimales: number): Decimal {
  return valeur.toDecimalPlaces(decimales, Decimal.ROUND_HALF_UP)
}

export function arrondirDevise(valeur: Decimal, devise: Monnaie): Decimal {
  return arrondir(valeur, DECIMALES[devise])
}

export function decimalesDe(devise: Monnaie): number {
  return DECIMALES[devise]
}

/**
 * Convertit un montant en euros vers la devise locale du pays d'arrivée.
 *
 * Trois cas, et un seul chemin pour chacun :
 *  - EUR                 → pas de conversion.
 *  - Parité fixe (CFA)   → conversion automatique au taux de la base.
 *  - Devise flottante    → taux SAISI en back-office. S'il est absent, on
 *                          refuse : on ne devine jamais un taux de change.
 *
 * Le taux renvoyé doit être STOCKÉ sur le document et ne plus jamais être
 * recalculé — notamment pas à l'encaissement.
 */
export function convertirDepuisEuros(montantEur: Numerique, pays: PaysDevise): Conversion {
  const montant = new Decimal(montantEur)

  if (pays.monnaie === 'EUR') {
    return { statut: 'EUROS_SEULEMENT' }
  }

  if (pays.tauxFixe !== null && pays.tauxFixe !== undefined) {
    const taux = new Decimal(pays.tauxFixe)
    return {
      statut: 'CONVERTI',
      devise: pays.monnaie,
      taux,
      montant: arrondirDevise(montant.mul(taux), pays.monnaie),
      source: 'PARITE_FIXE',
    }
  }

  if (pays.tauxManuel !== null && pays.tauxManuel !== undefined) {
    const taux = new Decimal(pays.tauxManuel)
    return {
      statut: 'CONVERTI',
      devise: pays.monnaie,
      taux,
      montant: arrondirDevise(montant.mul(taux), pays.monnaie),
      source: 'TAUX_SAISI',
    }
  }

  return {
    statut: 'TAUX_MANQUANT',
    devise: pays.monnaie,
    motif: `Aucun taux de change enregistré pour ${pays.monnaie}. Saisissez-le en back-office avant d'émettre le document.`,
  }
}
