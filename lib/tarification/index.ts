/**
 * Moteur de tarification — ENI Colis Services.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  USAGE RÉSERVÉ AU BACK-OFFICE.                                       │
 * │                                                                      │
 * │  Le site public n'affiche AUCUN prix calculé, sous aucune forme :    │
 * │  ni calculateur, ni estimation « indicative » (CLAUDE.md §1.3).      │
 * │  Les tarifs au kilo affichés publiquement sont lus tels quels en     │
 * │  base, ils ne passent pas par ce module.                             │
 * │                                                                      │
 * │  Ce que ce module renvoie est une SUGGESTION modifiable, jamais un   │
 * │  prix imposé : la cliente examine l'article avant de chiffrer.       │
 * │                                                                      │
 * │  La règle d'isolement est vérifiée par isolement.test.ts.            │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export { calculerTarif } from './calculer'
export { convertirDepuisEuros, arrondir, arrondirDevise, decimalesDe } from './devise'
export type {
  CategorieTarifaire,
  CodeRefus,
  Conversion,
  Decimal,
  DemandeTarification,
  LiaisonTarifaire,
  ModeCalcul,
  Monnaie,
  PaysDevise,
  Tarification,
} from './types'
