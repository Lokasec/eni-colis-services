import { arrondir } from './devise'
import {
  Decimal,
  type CodeRefus,
  type DemandeTarification,
  type Numerique,
  type Tarification,
} from './types'

/**
 * Moteur de tarification — CLAUDE.md §4.3.
 *
 * AUCUNE valeur tarifaire n'est écrite ici : le prix au kilo vient de la
 * liaison, le tarif de remplacement et le pourcentage viennent de la
 * catégorie. Changer un tarif se fait en base, jamais dans ce fichier.
 *
 * Ce module est PUR : il ne lit pas la base, il ne connaît pas Prisma
 * autrement que par le type Decimal. Il n'a donc aucun effet de bord et se
 * teste exhaustivement.
 *
 * IL NE DOIT ÊTRE APPELÉ QUE DEPUIS LE BACK-OFFICE, comme suggestion
 * modifiable. Aucun calcul de prix côté public, sous aucune forme
 * (CLAUDE.md §1.3). La règle est vérifiée par isolement.test.ts.
 */

/** Formate un nombre à la française, pour les libellés imprimés. */
function fr(valeur: Decimal, decimales: number): string {
  return valeur.toFixed(decimales).replace('.', ',')
}

/** Le poids s'affiche sans décimales inutiles : 12,5 kg et non 12,500 kg. */
function formaterPoids(poids: Decimal): string {
  return `${poids.toDecimalPlaces(3).toString().replace('.', ',')} kg`
}

function euros(montant: Decimal): string {
  return `${fr(montant, 2)} €`
}

/** Arrondi commercial des montants en euros : 2 décimales. */
function arrondirEuros(montant: Decimal): Decimal {
  return arrondir(montant, 2)
}

export function calculerTarif(demande: DemandeTarification): Tarification {
  const { categorie, liaison } = demande

  if (!categorie.actif) {
    return refus('CATEGORIE_INACTIVE', `La catégorie « ${categorie.libelle} » est désactivée.`)
  }

  // L'électronique se tarife à l'unité, après examen de l'appareil.
  // Le moteur ne propose rien : c'est le sens même de « sur devis ».
  if (categorie.mode === 'SUR_DEVIS') {
    return {
      statut: 'SUR_DEVIS',
      motif: `« ${categorie.libelle} » se chiffre à l'unité, après examen de l'article.`,
    }
  }

  // Toutes les catégories restantes exigent une liaison active : même quand
  // le prix n'en dépend pas, on ne tarife pas un trajet qu'on ne dessert pas.
  const liaisonInvalide = verifierLiaison(liaison)
  if (liaisonInvalide) return liaisonInvalide

  switch (categorie.mode) {
    case 'POIDS_X_TARIF_LIAISON': {
      const poids = lirePoids(demande.poidsKg)
      if (poids.erreur) return poids.erreur

      const prix = new Decimal(liaison!.prixParKg)
      const tarifInvalide = verifierMontantPositif(prix, 'TARIF_INVALIDE', 'de la liaison')
      if (tarifInvalide) return tarifInvalide

      return {
        statut: 'CALCULE',
        montantEur: arrondirEuros(poids.valeur.mul(prix)),
        detail: `${formaterPoids(poids.valeur)} × ${euros(prix)}/kg`,
      }
    }

    case 'POIDS_X_TARIF_FIXE': {
      // Le tarif de la catégorie REMPLACE celui de la liaison : il
      // s'applique quelle que soit la destination.
      if (estAbsent(categorie.valeur)) {
        return manqueParametre(categorie.libelle, 'un tarif au kilo')
      }
      const poids = lirePoids(demande.poidsKg)
      if (poids.erreur) return poids.erreur

      const tarifFixe = new Decimal(categorie.valeur!)
      const tarifInvalide = verifierMontantPositif(
        tarifFixe,
        'TARIF_INVALIDE',
        `de la catégorie « ${categorie.libelle} »`,
      )
      if (tarifInvalide) return tarifInvalide

      return {
        statut: 'CALCULE',
        montantEur: arrondirEuros(poids.valeur.mul(tarifFixe)),
        detail: `${formaterPoids(poids.valeur)} × ${euros(tarifFixe)}/kg — ${categorie.libelle}`,
      }
    }

    case 'POURCENTAGE_VALEUR': {
      // Règle confirmée par la cliente : le coût du transport EST le
      // pourcentage de la valeur d'achat. Le poids n'intervient pas, et
      // n'est donc pas exigé — ce qui permet de chiffrer sur photos, avant
      // même que le colis soit pesé.
      if (estAbsent(categorie.valeur)) {
        return manqueParametre(categorie.libelle, 'un pourcentage de la valeur')
      }
      if (estAbsent(demande.valeurAchat)) {
        return refus(
          'VALEUR_ACHAT_MANQUANTE',
          `« ${categorie.libelle} » se chiffre sur la valeur d'achat déclarée : elle est indispensable, avec son justificatif.`,
        )
      }

      const taux = new Decimal(categorie.valeur!)
      const tauxInvalide = verifierMontantPositif(
        taux,
        'TARIF_INVALIDE',
        `de la catégorie « ${categorie.libelle} »`,
      )
      if (tauxInvalide) return tauxInvalide

      const valeurAchat = new Decimal(demande.valeurAchat!)
      const valeurInvalide = verifierMontantPositif(
        valeurAchat,
        'VALEUR_ACHAT_INVALIDE',
        "d'achat déclarée",
      )
      if (valeurInvalide) return valeurInvalide

      const centieme = taux.mul(100)
      const pourcentage = fr(centieme, centieme.isInteger() ? 0 : 2)

      return {
        statut: 'CALCULE',
        montantEur: arrondirEuros(valeurAchat.mul(taux)),
        detail: `${categorie.libelle} — ${pourcentage} % de ${euros(valeurAchat)}`,
      }
    }
  }
}

// ---------------------------------------------------------------------------

function estAbsent(valeur: Numerique | null | undefined): boolean {
  return valeur === null || valeur === undefined || valeur === ''
}

function refus(code: CodeRefus, motif: string): Tarification {
  return { statut: 'REFUSE', code, motif }
}

/**
 * Un montant nul, négatif ou illisible est une erreur de saisie ou de
 * paramétrage. Sans ce garde-fou, elle produirait des factures à 0 € que
 * personne ne remarquerait avant des semaines.
 */
function verifierMontantPositif(
  montant: Decimal,
  code: 'TARIF_INVALIDE' | 'VALEUR_ACHAT_INVALIDE',
  origine: string,
): Tarification | null {
  if (!montant.isFinite() || montant.lessThanOrEqualTo(0)) {
    const quoi = code === 'TARIF_INVALIDE' ? 'Le tarif' : 'La valeur'
    return refus(
      code,
      `${quoi} ${origine} vaut ${montant.toString()} : corrigez-le avant de chiffrer.`,
    )
  }
  return null
}

function manqueParametre(libelle: string, attendu: string): Tarification {
  return refus(
    'PARAMETRE_CATEGORIE_MANQUANT',
    `La catégorie « ${libelle} » devrait porter ${attendu} : sa valeur est absente en base.`,
  )
}

function verifierLiaison(liaison: DemandeTarification['liaison']): Tarification | null {
  if (liaison === null || liaison === undefined) {
    return refus(
      'LIAISON_INTROUVABLE',
      "Aucune liaison ne dessert ce trajet. Vérifiez le sens : l'aller et le retour sont deux liaisons distinctes.",
    )
  }
  if (!liaison.actif) {
    return refus('LIAISON_INACTIVE', 'Cette liaison est désactivée.')
  }
  return null
}

function lirePoids(
  poidsKg: Numerique | null | undefined,
): { valeur: Decimal; erreur?: undefined } | { valeur: Decimal; erreur: Tarification } {
  const zero = new Decimal(0)

  if (estAbsent(poidsKg)) {
    return {
      valeur: zero,
      erreur: refus(
        'POIDS_MANQUANT',
        'Le poids est indispensable au calcul. Pesez le colis avant de chiffrer.',
      ),
    }
  }

  let poids: Decimal
  try {
    poids = new Decimal(poidsKg!)
  } catch {
    return {
      valeur: zero,
      erreur: refus('POIDS_INVALIDE', `Poids illisible : ${String(poidsKg)}.`),
    }
  }

  if (!poids.isFinite() || poids.lessThanOrEqualTo(0)) {
    return {
      valeur: zero,
      erreur: refus('POIDS_INVALIDE', 'Le poids doit être strictement positif.'),
    }
  }

  return { valeur: poids }
}
