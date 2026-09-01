import { Prisma } from '@/lib/generated/prisma/client'

/**
 * Décimal exact (decimal.js, réexporté par Prisma).
 *
 * Les montants ne transitent JAMAIS par un `number` : 0,1 + 0,2 ne fait pas
 * 0,3 en virgule flottante, et une facturation au kilo accumule ces écarts.
 */
export const Decimal = Prisma.Decimal
export type Decimal = Prisma.Decimal

/** Toute valeur acceptée en entrée et convertie en Decimal exact. */
export type Numerique = Decimal | string | number

export type ModeCalcul =
  'POIDS_X_TARIF_LIAISON' | 'POIDS_X_TARIF_FIXE' | 'MAX_POIDS_OU_POURCENTAGE' | 'SUR_DEVIS'

export type Monnaie = 'EUR' | 'XOF' | 'XAF' | 'GNF' | 'CDF' | 'USD'

/**
 * Liaison telle que lue en base. ORIENTÉE : l'aller et le retour sont deux
 * lignes distinctes, avec chacune son prix. Le moteur ne déduit jamais
 * l'une de l'autre.
 */
export type LiaisonTarifaire = {
  prixParKg: Numerique
  actif: boolean
}

/**
 * Catégorie telle que lue en base. Le sens de `valeur` dépend du mode :
 * un tarif au kilo pour POIDS_X_TARIF_FIXE, un taux (0,15) pour
 * MAX_POIDS_OU_POURCENTAGE.
 */
export type CategorieTarifaire = {
  code: string
  libelle: string
  mode: ModeCalcul
  valeur: Numerique | null
  actif: boolean
}

export type DemandeTarification = {
  /** Poids retenu : le poids réel s'il est connu, sinon l'estimation. */
  poidsKg: Numerique | null
  /** Valeur d'achat déclarée — requise par MAX_POIDS_OU_POURCENTAGE. */
  valeurAchat?: Numerique | null
  /** `null` si aucune liaison ne dessert le trajet demandé. */
  liaison: LiaisonTarifaire | null
  categorie: CategorieTarifaire
}

export type CodeRefus =
  | 'LIAISON_INTROUVABLE'
  | 'LIAISON_INACTIVE'
  | 'CATEGORIE_INACTIVE'
  | 'POIDS_MANQUANT'
  | 'POIDS_INVALIDE'
  | 'TARIF_INVALIDE'
  | 'VALEUR_ACHAT_MANQUANTE'
  | 'PARAMETRE_CATEGORIE_MANQUANT'

/**
 * Résultat de tarification.
 *
 * C'est une SUGGESTION destinée au back-office, jamais un prix imposé :
 * la cliente peut la modifier avant d'émettre le document.
 */
export type Tarification =
  | {
      statut: 'CALCULE'
      montantEur: Decimal
      /** Libellé prêt à imprimer sur le devis ou la facture. */
      detail: string
    }
  | {
      statut: 'SUR_DEVIS'
      motif: string
    }
  | {
      statut: 'REFUSE'
      code: CodeRefus
      motif: string
    }

export type PaysDevise = {
  monnaie: Monnaie
  /** Parité fixe (655,957 en zone CFA). Conversion automatique. */
  tauxFixe: Numerique | null
  /** Taux saisi en back-office pour les devises flottantes. Jamais deviné. */
  tauxManuel: Numerique | null
}

export type Conversion =
  | { statut: 'EUROS_SEULEMENT' }
  | {
      statut: 'CONVERTI'
      devise: Monnaie
      /** Taux à FIGER sur le document : il ne sera jamais recalculé. */
      taux: Decimal
      montant: Decimal
      source: 'PARITE_FIXE' | 'TAUX_SAISI'
    }
  | { statut: 'TAUX_MANQUANT'; devise: Monnaie; motif: string }
