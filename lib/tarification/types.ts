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
  'POIDS_X_TARIF_LIAISON' | 'POIDS_X_TARIF_FIXE' | 'POURCENTAGE_VALEUR' | 'SUR_DEVIS'

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
 * un tarif au kilo pour POIDS_X_TARIF_FIXE, une part de la valeur d'achat
 * (0,15) pour POURCENTAGE_VALEUR.
 */
export type CategorieTarifaire = {
  code: string
  libelle: string
  mode: ModeCalcul
  valeur: Numerique | null
  actif: boolean
}

export type DemandeTarification = {
  /** Poids réel s'il est connu, sinon l'estimation. `null` si non pesé. */
  poidsKg: Numerique | null
  /** Dimensions, pour le poids volumétrique. Facultatives. */
  dimensions?: Dimensions | null
  /** Valeur d'achat déclarée — requise par POURCENTAGE_VALEUR. */
  valeurAchat?: Numerique | null
  /** `null` si aucune liaison ne dessert le trajet demandé. */
  liaison: LiaisonTarifaire | null
  categorie: CategorieTarifaire
  /** Paramètres lus en base : arrondi, minimum, poids volumétrique. */
  parametres: ParametresPoids
}

/** Dimensions du colis, en centimètres. */
export type Dimensions = {
  longueurCm: Numerique
  largeurCm: Numerique
  hauteurCm: Numerique
}

/**
 * Paramètres de calcul du poids facturé, lus dans la table
 * ParametresTarification. Aucune valeur par défaut n'est écrite dans le
 * moteur : la cliente les ajuste depuis le back-office.
 */
export type ParametresPoids = {
  /** Pas d'arrondi vers le haut. 1 = kilo supérieur, 0 = poids exact. */
  pasArrondiPoidsKg: Numerique
  /**
   * Tolérance sur l'excédent avant de passer au pas supérieur. 0,1 = un
   * colis à 4,050 kg reste facturé 4 kg ; à 4,100 kg il passe à 5 kg.
   * 0 rétablit l'arrondi vers le haut pur.
   */
  toleranceArrondiKg: Numerique
  /** Poids minimum facturé quel que soit le poids réel. */
  poidsMinimumFactureKg: Numerique
  /** (L × l × h en cm) ÷ diviseur = kg. `null` désactive la règle. */
  diviseurVolumetrique: number | null
  appliquerPoidsVolumetrique: boolean
}

export type PoidsFacture =
  | {
      statut: 'RETENU'
      /** Poids effectivement facturé, après volumétrique, arrondi et minimum. */
      poidsFactureKg: Decimal
      poidsReelKg: Decimal | null
      poidsVolumetriqueKg: Decimal | null
      source: 'REEL' | 'VOLUMETRIQUE'
      /** Explication en clair, destinée au devis et à la facture. */
      detail: string
    }
  | { statut: 'INDETERMINE'; motif: string }

export type CodeRefus =
  | 'LIAISON_INTROUVABLE'
  | 'LIAISON_INACTIVE'
  | 'CATEGORIE_INACTIVE'
  | 'POIDS_INDETERMINE'
  | 'POIDS_INVALIDE'
  | 'TARIF_INVALIDE'
  | 'VALEUR_ACHAT_MANQUANTE'
  | 'VALEUR_ACHAT_INVALIDE'
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
