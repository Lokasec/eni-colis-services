import { db } from '@/lib/db'
import {
  calculerTarif,
  convertirDepuisEuros,
  type CategorieTarifaire,
  type Conversion,
  type LiaisonTarifaire,
  type ParametresPoids,
  type Tarification,
} from '@/lib/tarification'

/**
 * Pont entre la base et le moteur de tarification.
 *
 * ⚠️ USAGE BACK-OFFICE EXCLUSIF. Ce module importe le moteur : il ne doit
 * jamais être appelé depuis une page publique (CLAUDE.md §1.3).
 *
 * Il vit dans lib/admin/ et non lib/ : le chemin fait partie de la
 * protection. isolement.test.ts n'autorise l'import du moteur que depuis
 * app/admin, app/api/admin, lib/tarification et lib/admin — un fichier
 * placé ailleurs ferait rougir le test.
 *
 * Ce que renvoie `suggererMontant` est une SUGGESTION. La cliente la
 * modifie librement avant d'émettre : le moteur propose, il n'impose pas.
 */

/** Paramètres de calcul du poids, avec repli si la ligne unique manque. */
async function chargerParametres(): Promise<ParametresPoids> {
  const p = await db.parametresTarification.findUnique({ where: { id: 'singleton' } })
  if (!p) {
    // Ne devrait pas arriver : le seed crée la ligne. On refuse plutôt que
    // d'inventer des règles de calcul.
    throw new Error(
      'Les paramètres de tarification sont absents de la base. Relancez le seed ou créez la ligne « singleton ».',
    )
  }
  return {
    pasArrondiPoidsKg: p.pasArrondiPoidsKg.toString(),
    toleranceArrondiKg: p.toleranceArrondiKg.toString(),
    poidsMinimumFactureKg: p.poidsMinimumFactureKg.toString(),
    diviseurVolumetrique: p.diviseurVolumetrique,
    appliquerPoidsVolumetrique: p.appliquerPoidsVolumetrique,
  }
}

/** Retrouve la liaison qui dessert un trajet, dans le sens demandé. */
async function chargerLiaison(
  codeOrigine: string,
  codeDestination: string,
): Promise<LiaisonTarifaire | null> {
  const liaison = await db.liaison.findFirst({
    where: {
      mode: 'AERIEN',
      paysOrigine: { codeIso: codeOrigine },
      paysDestination: { codeIso: codeDestination },
    },
    select: { prixParKg: true, actif: true },
  })
  return liaison ? { prixParKg: liaison.prixParKg.toString(), actif: liaison.actif } : null
}

async function chargerCategorie(code: string): Promise<CategorieTarifaire | null> {
  const c = await db.categorieArticle.findUnique({ where: { code } })
  return c
    ? {
        code: c.code,
        libelle: c.libelle,
        mode: c.mode,
        valeur: c.valeur ? c.valeur.toString() : null,
        actif: c.actif,
      }
    : null
}

export type DemandeChiffrage = {
  codeOrigine: string
  codeDestination: string
  codeCategorie: string
  poidsKg?: string | number | null
  dimensions?: { longueurCm: number; largeurCm: number; hauteurCm: number } | null
  valeurAchat?: string | number | null
}

/**
 * Propose un montant pour un envoi.
 *
 * Tout vient de la base : prix au kilo de la liaison, règle de la
 * catégorie, paramètres d'arrondi. Aucune valeur n'est écrite ici.
 */
export async function suggererMontant(demande: DemandeChiffrage): Promise<Tarification> {
  const [parametres, liaison, categorie] = await Promise.all([
    chargerParametres(),
    chargerLiaison(demande.codeOrigine, demande.codeDestination),
    chargerCategorie(demande.codeCategorie),
  ])

  if (!categorie) {
    return {
      statut: 'REFUSE',
      code: 'PARAMETRE_CATEGORIE_MANQUANT',
      motif: `La catégorie « ${demande.codeCategorie} » est introuvable en base.`,
    }
  }

  return calculerTarif({
    poidsKg: demande.poidsKg ?? null,
    dimensions: demande.dimensions ?? null,
    valeurAchat: demande.valeurAchat ?? null,
    liaison,
    categorie,
    parametres,
  })
}

/**
 * Conversion du montant d'un document vers la devise du pays d'arrivée.
 *
 * Le taux renvoyé est destiné à être STOCKÉ sur le document. Il ne sera
 * jamais recalculé, notamment pas à l'encaissement : une facture reflète
 * le taux du jour de son émission (CLAUDE.md §5.3).
 */
export async function convertirPourPays(
  montantEur: string | number,
  codePays: string,
): Promise<Conversion> {
  const pays = await db.pays.findUnique({
    where: { codeIso: codePays },
    select: { monnaie: true, tauxFixe: true, tauxManuel: true },
  })

  if (!pays) {
    return { statut: 'TAUX_MANQUANT', devise: 'EUR', motif: 'Pays introuvable.' }
  }

  return convertirDepuisEuros(montantEur, {
    monnaie: pays.monnaie,
    tauxFixe: pays.tauxFixe ? pays.tauxFixe.toString() : null,
    tauxManuel: pays.tauxManuel ? pays.tauxManuel.toString() : null,
  })
}

/**
 * Suggestion pour une demande de devis.
 *
 * La demande stocke les pays par leur NOM — c'est ce que la cliente lit
 * dans le back-office. On retrouve donc les codes ISO au passage, sans
 * quoi la liaison serait introuvable.
 */
export async function suggererPourDemande(demande: {
  paysDepart: string
  paysArrivee: string
  poidsEstime: unknown
  dimensions: string | null
  valeurAchat: unknown
  categorie: { code: string } | null
}): Promise<Tarification> {
  const [origine, destination] = await Promise.all([
    db.pays.findFirst({ where: { nom: demande.paysDepart }, select: { codeIso: true } }),
    db.pays.findFirst({ where: { nom: demande.paysArrivee }, select: { codeIso: true } }),
  ])

  if (!origine || !destination) {
    return {
      statut: 'REFUSE',
      code: 'LIAISON_INTROUVABLE',
      motif: 'Les pays de la demande ne correspondent à aucun pays enregistré.',
    }
  }

  return suggererMontant({
    codeOrigine: origine.codeIso,
    codeDestination: destination.codeIso,
    codeCategorie: demande.categorie?.code ?? 'STANDARD',
    poidsKg: demande.poidsEstime ? String(demande.poidsEstime) : null,
    dimensions: lireDimensions(demande.dimensions),
    valeurAchat: demande.valeurAchat ? String(demande.valeurAchat) : null,
  })
}

/** « 60 × 40 × 50 cm » -> trois nombres. */
function lireDimensions(
  texte: string | null,
): { longueurCm: number; largeurCm: number; hauteurCm: number } | null {
  if (!texte) return null
  const nombres = texte.match(/\d+(?:[.,]\d+)?/g)
  if (!nombres || nombres.length < 3) return null
  const [l, L, h] = nombres.map((n) => Number(n.replace(',', '.')))
  if ([l, L, h].some((v) => !Number.isFinite(v!) || v! <= 0)) return null
  return { longueurCm: l!, largeurCm: L!, hauteurCm: h! }
}
