import type { BadgeTone } from '@/components/ui/badge'

/**
 * Statuts de colis — CLAUDE.md §8.
 *
 * EN_REACHEMINEMENT est un statut INTERNE : il décrit le passage par le
 * hub d'Abidjan avant réacheminement vers Cotonou, Conakry, Bamako ou
 * Dakar. Le client ne doit jamais le voir. `statutPublic()` le ramène à
 * EN_TRANSIT, et c'est la seule fonction que le site public doit appeler.
 */
export const STATUTS_COLIS = [
  'DEVIS_ACCEPTE',
  'RECU',
  'EN_PREPARATION',
  'EXPEDIE',
  'EN_TRANSIT',
  'EN_REACHEMINEMENT',
  'ARRIVE',
  'DISPONIBLE_RETRAIT',
  'RETIRE',
  'LITIGE',
] as const

export type StatutColis = (typeof STATUTS_COLIS)[number]

/** Statuts affichables publiquement : EN_REACHEMINEMENT en est exclu. */
export type StatutColisPublic = Exclude<StatutColis, 'EN_REACHEMINEMENT'>

export const statutsColis: Record<StatutColis, { label: string; tone: BadgeTone; interne?: true }> =
  {
    DEVIS_ACCEPTE: { label: 'Devis accepté', tone: 'devisChiffre' },
    RECU: { label: 'Reçu au bureau', tone: 'devisNouveau' },
    EN_PREPARATION: { label: 'En préparation', tone: 'devisNouveau' },
    EXPEDIE: { label: 'Expédié', tone: 'enTransit' },
    EN_TRANSIT: { label: 'En transit', tone: 'enTransit' },
    EN_REACHEMINEMENT: { label: 'En réacheminement', tone: 'enTransit', interne: true },
    ARRIVE: { label: 'Arrivé', tone: 'arrive' },
    DISPONIBLE_RETRAIT: { label: 'Disponible au retrait', tone: 'disponible' },
    RETIRE: { label: 'Retiré', tone: 'retire' },
    LITIGE: { label: 'Litige', tone: 'litige' },
  }

/**
 * Traduction d'un statut interne en statut public.
 * À appeler systématiquement avant tout affichage côté visiteur.
 */
export function statutPublic(statut: StatutColis): StatutColisPublic {
  return statut === 'EN_REACHEMINEMENT' ? 'EN_TRANSIT' : statut
}

/** Statuts de paiement — CLAUDE.md §5.4. */
export const statutsPaiement = {
  NON_DU: { label: 'Non dû', tone: 'retire' },
  A_PAYER_DEPART: { label: 'À payer au départ', tone: 'devisNouveau' },
  A_PAYER_ARRIVEE: { label: 'À payer à l’arrivée', tone: 'devisNouveau' },
  PAYE: { label: 'Payé', tone: 'disponible' },
  PARTIELLEMENT_PAYE: { label: 'Partiellement payé', tone: 'enTransit' },
  IMPAYE_RELANCE: { label: 'Impayé — relancé', tone: 'litige' },
  ABANDONNE: { label: 'Abandonné', tone: 'complet' },
} as const satisfies Record<string, { label: string; tone: BadgeTone }>

export type StatutPaiement = keyof typeof statutsPaiement
