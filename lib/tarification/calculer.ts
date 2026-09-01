import { arrondir } from './devise'
import { Decimal, type DemandeTarification, type Numerique, type Tarification } from './types'

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
    return {
      statut: 'REFUSE',
      code: 'CATEGORIE_INACTIVE',
      motif: `La catégorie « ${categorie.libelle} » est désactivée.`,
    }
  }

  // L'électronique se tarife à l'unité, après examen de l'appareil.
  // Le moteur ne propose rien : c'est le sens même de « sur devis ».
  if (categorie.mode === 'SUR_DEVIS') {
    return {
      statut: 'SUR_DEVIS',
      motif: `« ${categorie.libelle} » se chiffre à l'unité, après examen de l'article.`,
    }
  }

  const poids = lirePoids(demande.poidsKg)
  if (poids.erreur) return poids.erreur

  // PIECE_DETACHEE remplace le tarif de la liaison : son prix au kilo
  // s'applique quelle que soit la destination. La liaison reste néanmoins
  // exigée — on ne tarife pas un trajet qu'on ne dessert pas.
  const verif = verifierLiaison(liaison)
  if (verif) return verif

  const prixLiaison = new Decimal(liaison!.prixParKg)

  switch (categorie.mode) {
    case 'POIDS_X_TARIF_LIAISON': {
      const tarif = verifierTarif(prixLiaison, 'de la liaison')
      if (tarif) return tarif
      const montant = arrondirEuros(poids.valeur.mul(prixLiaison))
      return {
        statut: 'CALCULE',
        montantEur: montant,
        detail: `${formaterPoids(poids.valeur)} × ${euros(prixLiaison)}/kg`,
      }
    }

    case 'POIDS_X_TARIF_FIXE': {
      if (categorie.valeur === null || categorie.valeur === undefined) {
        return manqueParametre(categorie.libelle, 'un tarif au kilo')
      }
      const tarifFixe = new Decimal(categorie.valeur)
      const tarif = verifierTarif(tarifFixe, `de la catégorie « ${categorie.libelle} »`)
      if (tarif) return tarif
      const montant = arrondirEuros(poids.valeur.mul(tarifFixe))
      return {
        statut: 'CALCULE',
        montantEur: montant,
        detail: `${formaterPoids(poids.valeur)} × ${euros(tarifFixe)}/kg — ${categorie.libelle}`,
      }
    }

    case 'MAX_POIDS_OU_POURCENTAGE': {
      if (categorie.valeur === null || categorie.valeur === undefined) {
        return manqueParametre(categorie.libelle, 'un pourcentage de la valeur')
      }
      if (demande.valeurAchat === null || demande.valeurAchat === undefined) {
        return {
          statut: 'REFUSE',
          code: 'VALEUR_ACHAT_MANQUANTE',
          motif: `« ${categorie.libelle} » exige la valeur d'achat déclarée et son justificatif.`,
        }
      }

      const tarif = verifierTarif(prixLiaison, 'de la liaison')
      if (tarif) return tarif

      const taux = new Decimal(categorie.valeur)
      const valeurAchat = new Decimal(demande.valeurAchat)

      const parLePoids = arrondirEuros(poids.valeur.mul(prixLiaison))
      const parLaValeur = arrondirEuros(valeurAchat.mul(taux))
      const pourcentage = fr(taux.mul(100), taux.mul(100).isInteger() ? 0 : 2)

      // Règle [À CONFIRMER] — CDC §13 point 5 : `max` des deux, ou
      // remplacement pur par le pourcentage ? Toute la règle tient dans
      // la comparaison ci-dessous, une seule ligne à changer.
      const parLeValeurGagne = parLaValeur.greaterThan(parLePoids)
      const montant = parLeValeurGagne ? parLaValeur : parLePoids

      return {
        statut: 'CALCULE',
        montantEur: montant,
        detail:
          `${categorie.libelle} — le plus élevé de : ` +
          `${formaterPoids(poids.valeur)} × ${euros(prixLiaison)}/kg = ${euros(parLePoids)}` +
          ` ou ${pourcentage} % de ${euros(valeurAchat)} = ${euros(parLaValeur)}`,
      }
    }
  }
}

// ---------------------------------------------------------------------------

/**
 * Un tarif nul, négatif ou illisible est une erreur de paramétrage. Sans ce
 * garde-fou, elle produirait des factures à 0 € que personne ne remarquerait
 * avant des semaines.
 */
function verifierTarif(tarif: Decimal, origine: string): Tarification | null {
  if (!tarif.isFinite() || tarif.lessThanOrEqualTo(0)) {
    return {
      statut: 'REFUSE',
      code: 'TARIF_INVALIDE',
      motif: `Le tarif au kilo ${origine} vaut ${tarif.toString()} : corrigez-le en back-office avant de chiffrer.`,
    }
  }
  return null
}

function manqueParametre(libelle: string, attendu: string): Tarification {
  return {
    statut: 'REFUSE',
    code: 'PARAMETRE_CATEGORIE_MANQUANT',
    motif: `La catégorie « ${libelle} » devrait porter ${attendu} : sa valeur est absente en base.`,
  }
}

function verifierLiaison(liaison: DemandeTarification['liaison']): Tarification | null {
  if (liaison === null || liaison === undefined) {
    return {
      statut: 'REFUSE',
      code: 'LIAISON_INTROUVABLE',
      motif:
        "Aucune liaison ne dessert ce trajet. Vérifiez le sens : l'aller et le retour sont deux liaisons distinctes.",
    }
  }
  if (!liaison.actif) {
    return {
      statut: 'REFUSE',
      code: 'LIAISON_INACTIVE',
      motif: 'Cette liaison est désactivée.',
    }
  }
  return null
}

function lirePoids(
  poidsKg: Numerique | null,
): { valeur: Decimal; erreur?: undefined } | { valeur: Decimal; erreur: Tarification } {
  const zero = new Decimal(0)

  if (poidsKg === null || poidsKg === undefined || poidsKg === '') {
    return {
      valeur: zero,
      erreur: {
        statut: 'REFUSE',
        code: 'POIDS_MANQUANT',
        motif: 'Le poids est indispensable au calcul. Pesez le colis avant de chiffrer.',
      },
    }
  }

  let poids: Decimal
  try {
    poids = new Decimal(poidsKg)
  } catch {
    return {
      valeur: zero,
      erreur: {
        statut: 'REFUSE',
        code: 'POIDS_INVALIDE',
        motif: `Poids illisible : ${String(poidsKg)}.`,
      },
    }
  }

  if (!poids.isFinite() || poids.lessThanOrEqualTo(0)) {
    return {
      valeur: zero,
      erreur: {
        statut: 'REFUSE',
        code: 'POIDS_INVALIDE',
        motif: 'Le poids doit être strictement positif.',
      },
    }
  }

  return { valeur: poids }
}
