import { db } from '@/lib/db'

/**
 * Requêtes du back-office.
 *
 * Contrairement à lib/donnees-publiques.ts, ce fichier peut exposer les
 * données internes — hub de transit, poids réel, valeur déclarée. Les pages
 * qui l'appellent sont derrière le middleware, et celles qui touchent aux
 * rubriques réservées appellent `exigerAdmin()` en première ligne.
 */

/** Compteurs du tableau de bord — CLAUDE.md §9. */
export async function tableauDeBord() {
  const maintenant = new Date()

  const [
    devisEnAttente,
    devisPlusAncien,
    colisNonRattaches,
    departsAVenir,
    prochainDepart,
    aReacheminer,
    aRetirer,
    facturesNonSoldees,
  ] = await Promise.all([
    db.demandeDevis.count({ where: { statut: { in: ['NOUVELLE', 'CHIFFREE'] } } }),
    db.demandeDevis.findFirst({
      where: { statut: 'NOUVELLE' },
      orderBy: { creeLe: 'asc' },
      select: { creeLe: true },
    }),
    db.colis.count({ where: { modeReception: 'COMMANDE_EN_LIGNE', clientId: null } }),
    db.depart.count({
      where: { dateDepart: { gte: maintenant }, statut: { notIn: ['PARTI', 'ARRIVE'] } },
    }),
    db.depart.findFirst({
      where: { dateDepart: { gte: maintenant }, statut: { notIn: ['PARTI', 'ARRIVE'] } },
      orderBy: { dateDepart: 'asc' },
      select: {
        dateDepart: true,
        liaison: { select: { paysDestination: { select: { nom: true } } } },
      },
    }),
    db.colis.count({ where: { statut: 'EN_REACHEMINEMENT' } }),
    db.colis.count({ where: { statut: 'DISPONIBLE_RETRAIT' } }),
    db.document.findMany({
      where: { type: 'FACTURE', encaissements: { none: {} } },
      select: { montantEur: true, colis: { select: { dateDepartEffectif: true } } },
    }),
  ])

  const creances = facturesNonSoldees.reduce((total, f) => total + Number(f.montantEur), 0)
  const creancePlusAncienne = facturesNonSoldees
    .map((f) => f.colis?.dateDepartEffectif)
    .filter((d): d is Date => d instanceof Date)
    .sort((a, b) => a.getTime() - b.getTime())[0]

  return {
    devisEnAttente,
    devisPlusAncien: devisPlusAncien?.creeLe ?? null,
    colisNonRattaches,
    departsAVenir,
    prochainDepart,
    aReacheminer,
    aRetirer,
    creances: {
      montant: creances,
      nombre: facturesNonSoldees.length,
      plusAncienne: creancePlusAncienne ?? null,
    },
  }
}

/**
 * File des colis reçus non rattachés — le module traité chaque jour.
 *
 * Un client oubliera son numéro : sans cette file, un carton marchand
 * anonyme n'existe nulle part et se perd, d'autant que le local est
 * partagé avec un autre opérateur (CLAUDE.md §1.2).
 */
export async function fileReceptions() {
  return db.colis.findMany({
    where: { modeReception: 'COMMANDE_EN_LIGNE', clientId: null },
    select: {
      id: true,
      codeSuivi: true,
      photoReceptionUrl: true,
      poidsReel: true,
      contenu: true,
      destinataireNom: true,
      creeLe: true,
      villeArrivee: { select: { nom: true, pays: { select: { nom: true } } } },
      historique: { orderBy: { survenuLe: 'desc' }, take: 1, select: { commentaire: true } },
    },
    orderBy: { creeLe: 'asc' },
  })
}

/** Clients actifs, pour le rattachement et la fiche Clients. */
export async function clientsActifs(recherche?: string) {
  const filtre = recherche?.trim()
  return db.client.findMany({
    where: {
      actif: true,
      ...(filtre
        ? {
            OR: [
              { numeroClient: { contains: filtre, mode: 'insensitive' } },
              { nomLivraison: { contains: filtre, mode: 'insensitive' } },
              { prenom: { contains: filtre, mode: 'insensitive' } },
              { nom: { contains: filtre, mode: 'insensitive' } },
              { email: { contains: filtre, mode: 'insensitive' } },
              { telephone: { contains: filtre } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      numeroClient: true,
      nomLivraison: true,
      prenom: true,
      nom: true,
      email: true,
      telephone: true,
      dateInscription: true,
      villeDestination: { select: { id: true, nom: true, pays: { select: { nom: true } } } },
      _count: { select: { colis: true } },
    },
    orderBy: { dateInscription: 'desc' },
    take: 100,
  })
}

export type FiltreColis = {
  recherche?: string
  statut?: string
  departId?: string
}

export async function listeColis(filtre: FiltreColis = {}) {
  const recherche = filtre.recherche?.trim()
  return db.colis.findMany({
    where: {
      ...(filtre.statut ? { statut: filtre.statut as never } : {}),
      ...(filtre.departId ? { departId: filtre.departId } : {}),
      ...(recherche
        ? {
            OR: [
              { codeSuivi: { contains: recherche, mode: 'insensitive' } },
              { destinataireNom: { contains: recherche, mode: 'insensitive' } },
              { expediteurNom: { contains: recherche, mode: 'insensitive' } },
              { client: { numeroClient: { contains: recherche, mode: 'insensitive' } } },
              { client: { nomLivraison: { contains: recherche, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      codeSuivi: true,
      statut: true,
      statutPaiement: true,
      modeReception: true,
      poidsReel: true,
      destinataireNom: true,
      necessiteReacheminement: true,
      creeLe: true,
      client: { select: { numeroClient: true, nomLivraison: true } },
      villeArrivee: { select: { nom: true } },
      depart: { select: { reference: true } },
    },
    orderBy: { creeLe: 'desc' },
    take: 200,
  })
}

export async function colisParCode(codeSuivi: string) {
  return db.colis.findUnique({
    where: { codeSuivi },
    select: {
      id: true,
      codeSuivi: true,
      statut: true,
      statutPaiement: true,
      modeReception: true,
      momentPaiement: true,
      photoReceptionUrl: true,
      expediteurNom: true,
      expediteurTelephone: true,
      destinataireNom: true,
      destinataireTelephone: true,
      poidsEstime: true,
      poidsReel: true,
      dimensions: true,
      contenu: true,
      valeurDeclaree: true,
      justificatifFourni: true,
      necessiteReacheminement: true,
      dateDepartEffectif: true,
      dateArrivee: true,
      creeLe: true,
      client: { select: { id: true, numeroClient: true, nomLivraison: true, telephone: true } },
      categorie: { select: { code: true, libelle: true } },
      // Champ interne : le hub de transit n'a rien à faire côté public,
      // mais l'exploitation en a besoin pour préparer le réacheminement.
      villeArrivee: {
        select: {
          id: true,
          nom: true,
          villeTransit: { select: { nom: true } },
          pays: { select: { nom: true } },
        },
      },
      pointRetrait: { select: { nom: true, adresse: true } },
      depart: { select: { id: true, reference: true, dateDepart: true } },
      historique: {
        orderBy: { survenuLe: 'desc' },
        select: {
          statut: true,
          commentaire: true,
          survenuLe: true,
          auteur: { select: { nom: true } },
        },
      },
      documents: { select: { type: true, numero: true, montantEur: true, devise: true } },
    },
  })
}

/** Colis bloqués au hub, en attente du second segment. */
export async function fileReacheminement() {
  return db.colis.findMany({
    where: { statut: 'EN_REACHEMINEMENT' },
    select: {
      id: true,
      codeSuivi: true,
      destinataireNom: true,
      poidsReel: true,
      dateDepartEffectif: true,
      villeArrivee: {
        select: {
          nom: true,
          villeTransit: { select: { nom: true } },
          pays: { select: { nom: true } },
        },
      },
      historique: { orderBy: { survenuLe: 'desc' }, take: 1, select: { survenuLe: true } },
    },
    orderBy: { dateDepartEffectif: 'asc' },
  })
}

export async function listeDeparts() {
  return db.depart.findMany({
    select: {
      id: true,
      reference: true,
      statut: true,
      dateDepart: true,
      dateClotureDepot: true,
      dateArriveeEstimee: true,
      liaison: {
        select: {
          prixParKg: true,
          paysOrigine: { select: { nom: true } },
          paysDestination: { select: { nom: true, codeIso: true } },
        },
      },
      _count: { select: { colis: true } },
    },
    orderBy: { dateDepart: 'desc' },
    take: 60,
  })
}

/** Liaisons ouvertes, pour créer un départ ou enregistrer un colis. */
export async function liaisonsExploitables() {
  return db.liaison.findMany({
    where: { actif: true, mode: 'AERIEN' },
    select: {
      id: true,
      prixParKg: true,
      afficheePubliquement: true,
      // Deux destinations sont sous-traitées et leur prix d'achat n'a pas
      // été communiqué. Sans ces deux champs, l'écran laisserait croire
      // que le prix de vente est de la marge.
      sousTraitee: true,
      prixAchat: true,
      paysOrigine: { select: { nom: true, codeIso: true } },
      paysDestination: { select: { nom: true, codeIso: true } },
    },
    orderBy: [{ paysOrigine: { nom: 'asc' } }, { paysDestination: { nom: 'asc' } }],
  })
}

/** Villes de destination avec leurs points de retrait, pour la saisie. */
export async function villesDestination() {
  return db.ville.findMany({
    where: { actif: true, NOT: { pays: { codeIso: 'FR' } } },
    select: {
      id: true,
      nom: true,
      pays: { select: { nom: true, codeIso: true } },
      villeTransit: { select: { nom: true } },
      pointsRetrait: { where: { actif: true }, select: { id: true, nom: true } },
    },
    orderBy: [{ pays: { nom: 'asc' } }, { nom: 'asc' }],
  })
}

/** Départs ouverts aux affectations. */
export async function departsOuverts() {
  return db.depart.findMany({
    where: { statut: { in: ['PLANIFIE', 'DEPOTS_OUVERTS'] }, dateDepart: { gte: new Date() } },
    select: {
      id: true,
      reference: true,
      dateDepart: true,
      liaison: { select: { paysDestination: { select: { nom: true, codeIso: true } } } },
    },
    orderBy: { dateDepart: 'asc' },
  })
}

// ===========================================================================
// Facturation
// ===========================================================================

export async function demandesDevis(statut?: string) {
  return db.demandeDevis.findMany({
    where: statut ? { statut: statut as never } : {},
    select: {
      id: true,
      reference: true,
      statut: true,
      nom: true,
      email: true,
      telephone: true,
      villeDepart: true,
      paysDepart: true,
      villeArrivee: true,
      paysArrivee: true,
      poidsEstime: true,
      valeurAchat: true,
      creeLe: true,
      categorie: { select: { code: true, libelle: true } },
      _count: { select: { photos: true } },
      documents: { select: { numero: true, montantEur: true } },
    },
    orderBy: { creeLe: 'asc' },
    take: 100,
  })
}

export async function demandeParReference(reference: string) {
  return db.demandeDevis.findUnique({
    where: { reference },
    include: {
      photos: { orderBy: { ordre: 'asc' } },
      categorie: true,
      documents: { orderBy: { dateEmission: 'desc' } },
    },
  })
}

/** Colis pesés et non encore facturés — la file d'émission. */
export async function colisAFacturer() {
  return db.colis.findMany({
    where: { documents: { none: { type: 'FACTURE' } } },
    select: {
      id: true,
      codeSuivi: true,
      statut: true,
      momentPaiement: true,
      poidsReel: true,
      valeurDeclaree: true,
      destinataireNom: true,
      categorie: { select: { code: true, libelle: true } },
      villeArrivee: {
        select: { nom: true, pays: { select: { nom: true, codeIso: true, monnaie: true } } },
      },
      client: { select: { numeroClient: true } },
    },
    orderBy: { creeLe: 'desc' },
    take: 60,
  })
}

export async function listeFactures() {
  return db.document.findMany({
    where: { type: 'FACTURE' },
    select: {
      id: true,
      numero: true,
      montantEur: true,
      devise: true,
      tauxApplique: true,
      montantDevise: true,
      dateEmission: true,
      dateReglement: true,
      detail: true,
      mentionFiscale: true,
      colis: { select: { codeSuivi: true, destinataireNom: true } },
      encaissements: {
        select: { montant: true, devise: true, dateEncaissement: true, lieu: true },
      },
    },
    orderBy: { numero: 'desc' },
    take: 200,
  })
}

/**
 * Créances : factures émises et non soldées, sur des colis déjà partis.
 *
 * C'est le module critique du mode A — l'entreprise avance le transport et
 * n'est payée qu'à l'arrivée (CLAUDE.md §5.4).
 */
export async function creances() {
  const factures = await db.document.findMany({
    where: { type: 'FACTURE', dateReglement: null },
    select: {
      id: true,
      numero: true,
      montantEur: true,
      devise: true,
      montantDevise: true,
      dateEmission: true,
      colis: {
        select: {
          codeSuivi: true,
          destinataireNom: true,
          statut: true,
          statutPaiement: true,
          dateDepartEffectif: true,
          dateDisponible: true,
          client: { select: { numeroClient: true, email: true } },
          villeArrivee: { select: { nom: true } },
        },
      },
      encaissements: { select: { montant: true } },
    },
    orderBy: { dateEmission: 'asc' },
  })

  return factures.map((f) => {
    const regle = f.encaissements.reduce((total, e) => total + Number(e.montant), 0)
    const du = f.devise === 'EUR' ? Number(f.montantEur) : Number(f.montantDevise ?? f.montantEur)
    return { ...f, dejaRegle: regle, resteDu: Math.max(0, du - regle) }
  })
}

export async function listeEncaissements() {
  return db.encaissement.findMany({
    select: {
      id: true,
      montant: true,
      devise: true,
      lieu: true,
      moyen: true,
      reference: true,
      dateEncaissement: true,
      operateur: { select: { nom: true } },
      document: { select: { numero: true, colis: { select: { codeSuivi: true } } } },
    },
    orderBy: { dateEncaissement: 'desc' },
    take: 200,
  })
}

/** Pays et leurs taux — parité fixe ou taux saisi. */
export async function paysEtTaux() {
  return db.pays.findMany({
    where: { actif: true, NOT: { codeIso: 'FR' } },
    select: {
      id: true,
      nom: true,
      codeIso: true,
      monnaie: true,
      tauxFixe: true,
      tauxManuel: true,
      tauxManuelMajLe: true,
    },
    orderBy: { nom: 'asc' },
  })
}
