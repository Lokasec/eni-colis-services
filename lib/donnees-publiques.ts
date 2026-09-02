import { fichesDestination } from '@/content/destinations'
import { db } from '@/lib/db'
import { statutPublic, statutsColis, type StatutColis } from '@/lib/statuts'

/**
 * Accès aux données pour le SITE PUBLIC.
 *
 * Toutes les requêtes publiques passent par ce fichier, et chacune utilise un
 * `select` EXPLICITE. C'est délibéré : avec un `include`, ajouter un champ au
 * schéma le publierait automatiquement. Ici, un champ n'est exposé que si
 * quelqu'un l'a écrit.
 *
 * Deux interdits absolus :
 *  - `Ville.villeTransit` — le hub d'éclatement d'Abidjan est INTERNE.
 *    Le client voit « en transit », jamais le détail du parcours.
 *  - Les liaisons `afficheePubliquement = false` — France ↔ USA existe mais
 *    ne doit apparaître ni dans les destinations, ni dans les sélecteurs,
 *    ni dans le sitemap.
 *
 * Le moteur de tarification n'est jamais appelé ici : les tarifs affichés
 * sont lus tels quels en base (CLAUDE.md §1.3).
 */

/** Filtre commun : une liaison visible du public. */
const LIAISON_PUBLIQUE = {
  afficheePubliquement: true,
  actif: true,
  mode: 'AERIEN',
} as const

export type PointRetraitPublic = {
  nom: string
  adresse: string | null
  horaires: string | null
  reperage: string | null
}

export type DestinationPublique = {
  /** Slug d'URL, défini par les contenus validés (content/destinations.ts). */
  slug: string
  codeIso: string
  pays: string
  drapeau: string | null
  /** Ville d'arrivée principale — celle qui porte la fiche. */
  villePrincipale: string
  /** Toutes les villes de retrait du pays. Le Sénégal en a deux. */
  villes: Array<{ nom: string; pointsRetrait: PointRetraitPublic[] }>
  prixDepuisFrance: number | null
  prixVersFrance: number | null
  /** Origine de rattachement quand la France n'est pas desservie (New York). */
  origineAlternative: { ville: string; prixAller: number; prixRetour: number | null } | null
}

/**
 * Les destinations affichées publiquement, UNE PAR PAYS.
 *
 * Le regroupement par pays est ce qui permet au Sénégal d'avoir deux villes
 * de retrait — Dakar et Thiès — sur une seule fiche, comme le prévoient les
 * contenus validés.
 *
 * New York illustre l'autre cas particulier : la liaison France → USA existe
 * en base mais n'est pas publiée. Seule Abidjan ↔ New York l'est, et c'est
 * donc Abidjan qui apparaît comme origine. Le client ne voit pas le
 * découpage réel de l'acheminement.
 */
export async function destinationsPubliques(): Promise<DestinationPublique[]> {
  const liaisons = await db.liaison.findMany({
    where: LIAISON_PUBLIQUE,
    select: {
      prixParKg: true,
      paysOrigine: { select: { codeIso: true } },
      paysDestination: { select: { codeIso: true } },
    },
  })

  const pays = await db.pays.findMany({
    where: { actif: true, NOT: { codeIso: 'FR' } },
    select: {
      codeIso: true,
      nom: true,
      drapeau: true,
      villes: {
        where: { actif: true },
        // Sélection explicite : villeTransitId et villeTransit sont absents.
        select: {
          nom: true,
          creeLe: true,
          pointsRetrait: {
            where: { actif: true },
            select: { nom: true, adresse: true, horaires: true, reperage: true },
          },
        },
        orderBy: { creeLe: 'asc' },
      },
    },
  })

  const tarif = (origine: string, destination: string) => {
    const liaison = liaisons.find(
      (l) => l.paysOrigine.codeIso === origine && l.paysDestination.codeIso === destination,
    )
    return liaison ? Number(liaison.prixParKg) : null
  }

  const villePrincipaleDe = (codeIso: string) =>
    pays.find((p) => p.codeIso === codeIso)?.villes[0]?.nom ?? null

  const destinations: DestinationPublique[] = []

  for (const p of pays) {
    const fiche = fichesDestination[p.codeIso]
    // Un pays sans fiche rédigée n'est pas publié : on n'invente pas de page.
    if (!fiche || p.villes.length === 0) continue

    const aller = tarif('FR', p.codeIso)
    const retour = tarif(p.codeIso, 'FR')

    let origineAlternative: DestinationPublique['origineAlternative'] = null
    if (aller === null && retour === null) {
      const autre = liaisons.find((l) => l.paysDestination.codeIso === p.codeIso)
      if (!autre) continue // aucune liaison publique : la destination n'existe pas côté public
      const codeOrigine = autre.paysOrigine.codeIso
      origineAlternative = {
        // On affiche la VILLE d'origine : « depuis Abidjan » est parlant,
        // « depuis Côte d'Ivoire » ne l'est pas.
        ville: villePrincipaleDe(codeOrigine) ?? codeOrigine,
        prixAller: Number(autre.prixParKg),
        prixRetour: tarif(p.codeIso, codeOrigine),
      }
    }

    destinations.push({
      slug: fiche.slug,
      codeIso: p.codeIso,
      pays: p.nom,
      drapeau: p.drapeau,
      villePrincipale: p.villes[0]!.nom,
      villes: p.villes.map((v) => ({ nom: v.nom, pointsRetrait: v.pointsRetrait })),
      prixDepuisFrance: aller,
      prixVersFrance: retour,
      origineAlternative,
    })
  }

  return destinations
}

/** Une destination par son slug d'URL, ou `null` si elle n'est pas publiée. */
export async function destinationParSlug(slug: string): Promise<DestinationPublique | null> {
  const destinations = await destinationsPubliques()
  return destinations.find((d) => d.slug === slug) ?? null
}

export type DepartPublic = {
  reference: string
  destination: string
  pays: string
  codeIsoPays: string
  drapeau: string | null
  dateDepart: Date
  dateClotureDepot: Date
  prixParKg: number
  complet: boolean
}

/**
 * Les prochains départs, alimentés par la base.
 *
 * On expose la liaison et ses dates, jamais l'affectation des colis ni le
 * parcours réel.
 */
export async function prochainsDeparts(limite?: number): Promise<DepartPublic[]> {
  const departs = await db.depart.findMany({
    where: {
      dateDepart: { gte: new Date() },
      statut: { in: ['PLANIFIE', 'DEPOTS_OUVERTS', 'CLOTURE_DEPOTS', 'COMPLET'] },
      liaison: LIAISON_PUBLIQUE,
    },
    select: {
      reference: true,
      dateDepart: true,
      dateClotureDepot: true,
      statut: true,
      liaison: {
        select: {
          prixParKg: true,
          paysDestination: { select: { nom: true, drapeau: true, codeIso: true } },
        },
      },
    },
    orderBy: { dateDepart: 'asc' },
    take: limite,
  })

  // La ville d'arrivée affichée est la ville principale du pays de destination.
  const villes = await db.ville.findMany({
    where: { actif: true },
    select: { nom: true, pays: { select: { codeIso: true } } },
    orderBy: { creeLe: 'asc' },
  })

  return departs.map((depart) => {
    const code = depart.liaison.paysDestination.codeIso
    const ville = villes.find((v) => v.pays.codeIso === code)
    return {
      reference: depart.reference,
      destination: ville?.nom ?? depart.liaison.paysDestination.nom,
      pays: depart.liaison.paysDestination.nom,
      codeIsoPays: code,
      drapeau: depart.liaison.paysDestination.drapeau,
      dateDepart: depart.dateDepart,
      dateClotureDepot: depart.dateClotureDepot,
      prixParKg: Number(depart.liaison.prixParKg),
      complet: depart.statut === 'COMPLET',
    }
  })
}

export type SuiviPublic = {
  codeSuivi: string
  statut: string
  libelleStatut: string
  destination: string
  pays: string
  /** Prénom et initiale du nom, JAMAIS le nom complet. */
  destinataire: string
  dateDepart: Date | null
  dateArrivee: Date | null
  pointRetrait: { nom: string; adresse: string | null; horaires: string | null } | null
  historique: Array<{ statut: string; libelle: string; survenuLe: Date }>
}

/**
 * Réduit un nom à « Prénom I. » — le suivi public ne révèle jamais
 * l'identité complète du destinataire (CLAUDE.md §8).
 */
export function anonymiserNom(nomComplet: string): string {
  const morceaux = nomComplet.trim().split(/\s+/).filter(Boolean)
  if (morceaux.length === 0) return ''
  const [prenom, ...reste] = morceaux
  if (reste.length === 0) return prenom!
  const initiale = reste[reste.length - 1]![0]!.toUpperCase()
  return `${prenom} ${initiale}.`
}

/**
 * Suivi d'un colis par son code.
 *
 * Ne renvoie JAMAIS : adresse complète, valeur déclarée, contenu détaillé,
 * téléphone, ni le fait qu'un colis passe par le hub. `EN_REACHEMINEMENT`
 * est ramené à `EN_TRANSIT` par `statutPublic`.
 */
export async function suivreColis(code: string): Promise<SuiviPublic | null> {
  const normalise = code.trim().toUpperCase()
  if (!/^ENI-\d{4}-\d{5}$/.test(normalise)) return null

  const colis = await db.colis.findUnique({
    where: { codeSuivi: normalise },
    select: {
      codeSuivi: true,
      statut: true,
      destinataireNom: true,
      dateDepartEffectif: true,
      dateArrivee: true,
      villeArrivee: {
        // villeTransit est volontairement absent de cette sélection.
        select: { nom: true, pays: { select: { nom: true } } },
      },
      pointRetrait: { select: { nom: true, adresse: true, horaires: true } },
      historique: {
        select: { statut: true, survenuLe: true },
        orderBy: { survenuLe: 'asc' },
      },
    },
  })

  if (!colis) return null

  const publique = statutPublic(colis.statut as StatutColis)

  // L'historique peut contenir EN_REACHEMINEMENT : on le ramène en transit,
  // puis on supprime les doublons que ce repli peut créer.
  const historique: SuiviPublic['historique'] = []
  for (const ligne of colis.historique) {
    const statut = statutPublic(ligne.statut as StatutColis)
    if (historique.at(-1)?.statut === statut) continue
    historique.push({
      statut,
      libelle: statutsColis[statut].label,
      survenuLe: ligne.survenuLe,
    })
  }

  return {
    codeSuivi: colis.codeSuivi,
    statut: publique,
    libelleStatut: statutsColis[publique].label,
    destination: colis.villeArrivee.nom,
    pays: colis.villeArrivee.pays.nom,
    destinataire: anonymiserNom(colis.destinataireNom),
    dateDepart: colis.dateDepartEffectif,
    dateArrivee: colis.dateArrivee,
    pointRetrait: colis.pointRetrait,
    historique,
  }
}

/** Grille tarifaire publique, pour la page /tarifs. */
export async function grilleTarifaire() {
  const destinations = await destinationsPubliques()
  return destinations.filter(
    (d) =>
      d.prixDepuisFrance !== null || d.prixVersFrance !== null || d.origineAlternative !== null,
  )
}

/** Catégories publiées, pour la page /tarifs et /services. */
export async function categoriesPubliees() {
  return db.categorieArticle.findMany({
    where: { actif: true },
    select: {
      code: true,
      libelle: true,
      mode: true,
      valeur: true,
      publie: true,
      devisRequis: true,
    },
    orderBy: { ordre: 'asc' },
  })
}
