/**
 * Seed de développement — ENI Colis Services.
 *
 * Contenu : la géographie et le réseau réels (pays, villes, points de
 * retrait, liaisons, tarifs, catégories), puis un jeu de données
 * d'exploitation FICTIF destiné à la recette.
 *
 * Règles tenues :
 *  - Aucun faux témoignage, aucun nom de client réel. Les six clients sont
 *    inventés et servent uniquement à la démonstration.
 *  - France ↔ USA existe en base mais INACTIVE et non publiée.
 *  - Le Sénégal a DEUX villes de retrait : Dakar et Thiès.
 *  - Les liaisons sont ORIENTÉES : l'aller et le retour sont deux lignes.
 *  - Les taux de change des documents sont FIGÉS à l'émission.
 *
 * Avant l'ouverture au public, retirer les données de démonstration
 * (clients, colis, devis, factures) — voir DEPLOIEMENT.md §3.
 *
 * Idempotent : relançable sans dupliquer.
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../lib/generated/prisma/client'
import { hacher } from '../lib/mot-de-passe'

// tsx n'ouvre pas .env : on le charge nous-memes. `loadEnvFile` est natif
// a Node et n'ecrase pas les variables deja definies (CI, production).
try {
  process.loadEnvFile('.env')
} catch {
  // Pas de .env local : les variables viennent de l'environnement.
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL est absent.')

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

/** Parité fixe euro / franc CFA. En variable d'environnement pour la traçabilité. */
const TAUX_CFA = process.env.TAUX_CFA ?? '655.957'

/** Les francs CFA ne se subdivisent pas : on arrondit à l'unité. */
function convertirEnCfa(montantEur: number, taux: string): string {
  return Math.round(montantEur * Number(taux)).toFixed(2)
}

async function main() {
  console.log('Seed — nettoyage des données de démonstration…')

  // Ordre imposé par les clés étrangères.
  await db.encaissement.deleteMany()
  await db.document.deleteMany()
  await db.historiqueStatut.deleteMany()
  await db.colis.deleteMany()
  await db.photoDevis.deleteMany()
  await db.demandeDevis.deleteMany()
  await db.depart.deleteMany()
  await db.client.deleteMany()
  await db.liaison.deleteMany()
  await db.pointRetrait.deleteMany()
  await db.ville.deleteMany()
  await db.pays.deleteMany()
  await db.categorieArticle.deleteMany()
  await db.sequenceDocument.deleteMany()
  await db.parametresTarification.deleteMany()
  await db.utilisateur.deleteMany()
  await db.messageCampagne.deleteMany()

  // ==========================================================================
  // 0. Paramètres de tarification — règles confirmées par la cliente
  // ==========================================================================
  console.log('Paramètres de tarification…')

  await db.parametresTarification.create({
    data: {
      id: 'singleton',
      pasArrondiPoidsKg: '1.000', // arrondi au kilo supérieur
      toleranceArrondiKg: '0.100', // 4,050 kg → 4 kg ; 4,100 kg → 5 kg
      poidsMinimumFactureKg: '1.000', // un colis de 50 g est facturé 1 kg
      diviseurVolumetrique: 5000, // (L × l × h en cm) ÷ 5000
      appliquerPoidsVolumetrique: true,

      // Politique commerciale PROPOSÉE le 2 septembre 2026, en attente de
      // la confirmation de la cliente. Elle n'avait jamais été fixée : ces
      // valeurs sont des défauts défendables, pas un avis juridique.
      plafondIndemnisationParKgEur: '20.00',
      plafondIndemnisationParColisEur: '400.00',
      indemniserValeurDeclareeSiJustifiee: true,

      // Garde : politique arrêtée par la cliente le 3 septembre 2026.
      // Une semaine pour retirer, 3 €/jour ensuite, vente aux enchères
      // au bout de trois semaines. Le plafond que nous avions proposé
      // est écarté — voir le commentaire du schéma.
      delaiGardeGratuiteJours: 7,
      fraisGardeParJourEur: '3.00',
      plafonnerFraisGardeAuTransport: false,
      delaiAbandonJours: 21,
      sortColisNonRetire: 'VENTE_AUX_ENCHERES',
    },
  })

  // ==========================================================================
  // 1. Pays
  // ==========================================================================
  console.log('Pays…')

  const france = await db.pays.create({
    data: { codeIso: 'FR', nom: 'France', slug: 'france', drapeau: '🇫🇷', monnaie: 'EUR' },
  })
  const civ = await db.pays.create({
    data: {
      codeIso: 'CI',
      nom: "Côte d'Ivoire",
      slug: 'cote-divoire',
      drapeau: '🇨🇮',
      monnaie: 'XOF',
      tauxFixe: TAUX_CFA,
    },
  })
  const benin = await db.pays.create({
    data: {
      codeIso: 'BJ',
      nom: 'Bénin',
      slug: 'benin',
      drapeau: '🇧🇯',
      monnaie: 'XOF',
      tauxFixe: TAUX_CFA,
    },
  })
  const mali = await db.pays.create({
    data: {
      codeIso: 'ML',
      nom: 'Mali',
      slug: 'mali',
      drapeau: '🇲🇱',
      monnaie: 'XOF',
      tauxFixe: TAUX_CFA,
    },
  })
  const senegal = await db.pays.create({
    data: {
      codeIso: 'SN',
      nom: 'Sénégal',
      slug: 'senegal',
      drapeau: '🇸🇳',
      monnaie: 'XOF',
      tauxFixe: TAUX_CFA,
    },
  })
  const congo = await db.pays.create({
    data: {
      codeIso: 'CG',
      nom: 'Congo-Brazzaville',
      slug: 'congo-brazzaville',
      drapeau: '🇨🇬',
      monnaie: 'XAF',
      tauxFixe: TAUX_CFA,
    },
  })
  // Guinée et RD Congo : les envois depuis la France sont réglés en France,
  // en euros. Le taux manuel ne sert qu'aux documents émis à l'arrivée.
  const guinee = await db.pays.create({
    data: { codeIso: 'GN', nom: 'Guinée', slug: 'guinee', drapeau: '🇬🇳', monnaie: 'GNF' },
  })
  const rdc = await db.pays.create({
    data: { codeIso: 'CD', nom: 'RD Congo', slug: 'rd-congo', drapeau: '🇨🇩', monnaie: 'CDF' },
  })
  const usa = await db.pays.create({
    data: {
      codeIso: 'US',
      nom: 'États-Unis',
      slug: 'etats-unis',
      drapeau: '🇺🇸',
      monnaie: 'USD',
      // Devise flottante : le taux est SAISI en back-office, jamais deviné.
      tauxManuel: '0.92',
      tauxManuelMajLe: new Date('2026-08-25T09:00:00Z'),
    },
  })

  // ==========================================================================
  // 2. Villes — Abidjan est le hub d'éclatement (INTERNE)
  // ==========================================================================
  console.log('Villes…')

  const rouen = await db.ville.create({
    data: { nom: 'Rouen', slug: 'rouen', paysId: france.id },
  })
  const abidjan = await db.ville.create({
    data: { nom: 'Abidjan', slug: 'abidjan', paysId: civ.id, codeAeroport: 'ABJ' },
  })

  // Ces quatre villes transitent par Abidjan avant réacheminement.
  // villeTransitId est INTERNE : jamais exposé dans une réponse publique.
  const cotonou = await db.ville.create({
    data: {
      nom: 'Cotonou',
      slug: 'cotonou',
      paysId: benin.id,
      codeAeroport: 'COO',
      villeTransitId: abidjan.id,
    },
  })
  const conakry = await db.ville.create({
    data: {
      nom: 'Conakry',
      slug: 'conakry',
      paysId: guinee.id,
      codeAeroport: 'CKY',
      villeTransitId: abidjan.id,
    },
  })
  const bamako = await db.ville.create({
    data: {
      nom: 'Bamako',
      slug: 'bamako',
      paysId: mali.id,
      codeAeroport: 'BKO',
      villeTransitId: abidjan.id,
    },
  })
  const dakar = await db.ville.create({
    data: {
      nom: 'Dakar',
      slug: 'dakar',
      paysId: senegal.id,
      codeAeroport: 'DSS',
      villeTransitId: abidjan.id,
    },
  })
  // Le Sénégal a DEUX points de retrait : le modèle le supporte nativement.
  const thies = await db.ville.create({
    data: { nom: 'Thiès', slug: 'thies', paysId: senegal.id, villeTransitId: abidjan.id },
  })

  const brazzaville = await db.ville.create({
    data: { nom: 'Brazzaville', slug: 'brazzaville', paysId: congo.id, codeAeroport: 'BZV' },
  })
  const kinshasa = await db.ville.create({
    data: { nom: 'Kinshasa', slug: 'kinshasa', paysId: rdc.id, codeAeroport: 'FIH' },
  })
  const newYork = await db.ville.create({
    data: { nom: 'New York', slug: 'new-york', paysId: usa.id, codeAeroport: 'JFK' },
  })

  // ==========================================================================
  // 3. Points de retrait
  // ==========================================================================
  console.log('Points de retrait…')

  await db.pointRetrait.createMany({
    data: [
      {
        nom: 'Magasin ENI Abidjan',
        villeId: abidjan.id,
        adresse: "Angré, face à l'immeuble Konor 2",
        reperage: 'Sur Yango : « Eni Colis Service Cocody »',
      },
      { nom: 'Point de retrait de Cotonou', villeId: cotonou.id, adresse: 'Gbégamey' },
      { nom: 'Point de retrait de Conakry', villeId: conakry.id, adresse: 'Dabondy' },
      {
        nom: 'Point de retrait de Bamako',
        villeId: bamako.id,
        adresse: 'Bamako centre',
        horaires: 'Nous contacter',
      },
      { nom: 'Point de retrait de Dakar', villeId: dakar.id, horaires: 'Nous contacter' },
      { nom: 'Point de retrait de Thiès', villeId: thies.id, horaires: 'Nous contacter' },
      {
        nom: 'Point de retrait de New York',
        villeId: newYork.id,
        adresse: '2738 Hone Ave, Bronx, NY 10469',
      },
      // Sous-traités : adresses non communiquées — [À COMPLÉTER]
      { nom: 'Point de retrait de Brazzaville', villeId: brazzaville.id },
      { nom: 'Point de retrait de Kinshasa', villeId: kinshasa.id },
      // Le bureau français : lieu de dépôt et de réception.
      {
        nom: 'Bureau ENI Rouen',
        villeId: rouen.id,
        adresse: '67 rue Saint-Julien, 76100 Rouen',
        telephone: '+33 6 52 70 70 14',
        // Plage communiquée le 3 septembre 2026. Les JOURS d'ouverture
        // n'ont pas été précisés — on ne les invente pas.
        horaires: '9 h 30 – 18 h · jours d’ouverture à préciser',
      },
    ],
  })

  const retraitAbidjan = await db.pointRetrait.findFirstOrThrow({ where: { villeId: abidjan.id } })
  const retraitCotonou = await db.pointRetrait.findFirstOrThrow({ where: { villeId: cotonou.id } })
  const retraitDakar = await db.pointRetrait.findFirstOrThrow({ where: { villeId: dakar.id } })
  const retraitThies = await db.pointRetrait.findFirstOrThrow({ where: { villeId: thies.id } })
  const retraitBamako = await db.pointRetrait.findFirstOrThrow({ where: { villeId: bamako.id } })
  const retraitBrazza = await db.pointRetrait.findFirstOrThrow({
    where: { villeId: brazzaville.id },
  })
  const retraitConakry = await db.pointRetrait.findFirstOrThrow({ where: { villeId: conakry.id } })

  // ==========================================================================
  // 4. Liaisons — ORIENTÉES, un aller et un retour par couple
  //    Tarifs de CLAUDE.md §4.2. Valeurs de seed : jamais en dur dans la logique.
  // ==========================================================================
  console.log('Liaisons et tarifs…')

  const liaisons = [
    // France → Afrique, 15 €/kg (Dakar 12)
    { o: france, d: civ, prix: '15.00' },
    { o: france, d: benin, prix: '15.00' },
    { o: france, d: guinee, prix: '15.00' },
    { o: france, d: mali, prix: '15.00' },
    { o: france, d: senegal, prix: '12.00' },
    { o: france, d: congo, prix: '20.00', sousTraitee: true },
    { o: france, d: rdc, prix: '15.00', sousTraitee: true },
    // Retours vers la France, 12 €/kg (Congo 20, RDC 15, Sénégal 12)
    { o: civ, d: france, prix: '12.00' },
    { o: benin, d: france, prix: '12.00' },
    { o: guinee, d: france, prix: '12.00' },
    { o: mali, d: france, prix: '12.00' },
    { o: senegal, d: france, prix: '12.00' },
    { o: congo, d: france, prix: '20.00', sousTraitee: true },
    { o: rdc, d: france, prix: '15.00', sousTraitee: true },
    // New York ↔ Abidjan, 20 €/kg dans les deux sens
    { o: usa, d: civ, prix: '20.00' },
    { o: civ, d: usa, prix: '20.00' },
    // France ↔ USA : FERMÉE. Décision de la cliente du 2 septembre 2026 —
    // « on laisse New York ouvert seulement entre Abidjan et New York ».
    //
    // Ce n'est pas qu'une simplification commerciale. La ligne France → USA
    // aurait été la SEULE liaison dont l'escale ne se déduit pas du pays
    // d'arrivée : New York n'est pas une ville de transit, elle est la
    // destination. En la fermant, `Ville.villeTransit` redevient exact pour
    // 100 % des liaisons actives, et le modèle n'a pas besoin de déplacer
    // le transit sur la liaison.
    //
    // Les lignes restent EN BASE, inactives : rouvrir se fait d'un booléen
    // en back-office, sans migration ni perte d'historique.
    { o: france, d: usa, prix: '20.00', publique: false, actif: false },
    { o: usa, d: france, prix: '20.00', publique: false, actif: false },
  ]

  for (const l of liaisons) {
    await db.liaison.create({
      data: {
        paysOrigineId: l.o.id,
        paysDestinationId: l.d.id,
        mode: 'AERIEN',
        prixParKg: l.prix,
        sousTraitee: l.sousTraitee ?? false,
        afficheePubliquement: l.publique ?? true,
        actif: l.actif ?? true,
        // Délais réels non communiqués — [À COMPLÉTER]
        delaiJoursMin: null,
        delaiJoursMax: null,
      },
    })
  }

  // Le fret maritime existe dans le modèle mais reste désactivé (CDC annexe).
  await db.liaison.create({
    data: {
      paysOrigineId: france.id,
      paysDestinationId: civ.id,
      mode: 'MARITIME',
      prixParKg: '0.00',
      afficheePubliquement: false,
      actif: false,
    },
  })

  const liaisonFranceCiv = await db.liaison.findFirstOrThrow({
    where: { paysOrigineId: france.id, paysDestinationId: civ.id, mode: 'AERIEN' },
  })
  const liaisonFranceSenegal = await db.liaison.findFirstOrThrow({
    where: { paysOrigineId: france.id, paysDestinationId: senegal.id, mode: 'AERIEN' },
  })
  const liaisonFranceBenin = await db.liaison.findFirstOrThrow({
    where: { paysOrigineId: france.id, paysDestinationId: benin.id, mode: 'AERIEN' },
  })
  const liaisonFranceMali = await db.liaison.findFirstOrThrow({
    where: { paysOrigineId: france.id, paysDestinationId: mali.id, mode: 'AERIEN' },
  })

  // ==========================================================================
  // 5. Catégories d'articles — le moteur de tarification lit ces lignes
  // ==========================================================================
  console.log("Catégories d'articles…")

  const [standard, piece, marque, electronique] = await Promise.all([
    db.categorieArticle.create({
      data: {
        code: 'STANDARD',
        libelle: 'Colis ordinaire',
        mode: 'POIDS_X_TARIF_LIAISON',
        publie: true,
        devisRequis: false,
        ordre: 1,
      },
    }),
    db.categorieArticle.create({
      data: {
        code: 'PIECE_DETACHEE',
        libelle: 'Pièce détachée',
        mode: 'POIDS_X_TARIF_FIXE',
        valeur: '20.0000', // €/kg — REMPLACE le tarif de la liaison
        publie: true,
        devisRequis: false,
        ordre: 2,
      },
    }),
    db.categorieArticle.create({
      data: {
        code: 'GRANDE_MARQUE',
        libelle: 'Article de marque ou de valeur',
        mode: 'POURCENTAGE_VALEUR',
        valeur: '0.1500', // 15 % de la valeur d'achat — confirme par la cliente
        publie: true,
        devisRequis: true,
        ordre: 3,
      },
    }),
    db.categorieArticle.create({
      data: {
        code: 'ELECTRONIQUE',
        libelle: 'Matériel électronique',
        mode: 'SUR_DEVIS',
        publie: false, // « nous consulter » : prix à l'unité, non publié
        devisRequis: true,
        ordre: 4,
      },
    }),
  ])

  // ==========================================================================
  // 5 bis. Utilisateurs du back-office
  //
  // Mots de passe de DÉVELOPPEMENT, hachés par scrypt. À changer avant
  // toute mise en ligne — voir DEPLOIEMENT.md.
  // ==========================================================================
  console.log('Utilisateurs du back-office…')

  const motDePasseDemo = process.env.SEED_MOT_DE_PASSE ?? 'eni-demo-2026'

  await db.utilisateur.create({
    data: {
      email: 'admin@eni.test',
      nom: 'Administratrice',
      motDePasse: await hacher(motDePasseDemo),
      role: 'ADMIN',
    },
  })
  await db.utilisateur.create({
    data: {
      email: 'operateur@eni.test',
      nom: 'Opérateur comptoir',
      motDePasse: await hacher(motDePasseDemo),
      role: 'OPERATEUR',
    },
  })

  // ==========================================================================
  // 6. Clients — FICTIFS, service d'adresse en France (mode A)
  // ==========================================================================
  console.log('Clients de démonstration…')

  const clientsData = [
    { prenom: 'Aïcha', nom: 'Konan', seq: 42, pays: civ, ville: abidjan, tel: '+225 07 00 00 42' },
    {
      prenom: 'Mamadou',
      nom: 'Traoré',
      seq: 43,
      pays: mali,
      ville: bamako,
      tel: '+223 70 00 00 43',
    },
    {
      prenom: 'Fatou',
      nom: 'Ndiaye',
      seq: 44,
      pays: senegal,
      ville: thies,
      tel: '+221 77 000 00 44',
    },
    {
      prenom: 'Ibrahim',
      nom: 'Camara',
      seq: 45,
      pays: guinee,
      ville: conakry,
      tel: '+224 62 00 00 45',
    },
    {
      prenom: 'Chantal',
      nom: 'Mabiala',
      seq: 46,
      pays: congo,
      ville: brazzaville,
      tel: '+242 06 000 0046',
    },
    {
      prenom: 'Kossi',
      nom: 'Adjovi',
      seq: 47,
      pays: benin,
      ville: cotonou,
      tel: '+229 97 00 00 47',
    },
  ]

  const clients = []
  for (const c of clientsData) {
    const initiales = `${c.prenom[0]}${c.nom[0]}`.toUpperCase()
    clients.push(
      await db.client.create({
        data: {
          // Identifiant complet en base…
          numeroClient: `ENI-${initiales}-${String(c.seq).padStart(4, '0')}`,
          // …et ce que le client saisit dans le champ « Nom » de ses commandes.
          nomLivraison: `Eni ${c.prenom} ${c.seq}`,
          sequence: c.seq,
          prenom: c.prenom,
          nom: c.nom,
          telephone: c.tel,
          email: `${c.prenom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.demo@exemple.test`,
          paysDestinationId: c.pays.id,
          villeDestinationId: c.ville.id,
          consentementLe: new Date('2026-06-15T10:00:00Z'),
        },
      }),
    )
  }
  const [aicha, mamadou, fatou, ibrahim, chantal, kossi] = clients

  // ==========================================================================
  // 7. Départs — hebdomadaires
  // ==========================================================================
  console.log('Départs…')

  const departPasse = await db.depart.create({
    data: {
      reference: 'DEP-2026-0030',
      liaisonId: liaisonFranceCiv.id,
      dateClotureDepot: new Date('2026-08-12T17:00:00Z'),
      dateDepart: new Date('2026-08-14T07:00:00Z'),
      dateArriveeEstimee: new Date('2026-08-21T00:00:00Z'),
      statut: 'ARRIVE',
    },
  })
  // Depart a venir sur Abidjan, encore sans colis affecte : c'est l'etat
  // normal d'un depart dont les depots viennent d'ouvrir.
  await db.depart.create({
    data: {
      reference: 'DEP-2026-0031',
      liaisonId: liaisonFranceCiv.id,
      dateClotureDepot: new Date('2026-09-02T17:00:00Z'),
      dateDepart: new Date('2026-09-04T07:00:00Z'),
      statut: 'DEPOTS_OUVERTS',
    },
  })
  const departSenegal = await db.depart.create({
    data: {
      reference: 'DEP-2026-0032',
      liaisonId: liaisonFranceSenegal.id,
      dateClotureDepot: new Date('2026-09-03T17:00:00Z'),
      dateDepart: new Date('2026-09-05T07:00:00Z'),
      statut: 'DEPOTS_OUVERTS',
    },
  })
  const departBenin = await db.depart.create({
    data: {
      reference: 'DEP-2026-0033',
      liaisonId: liaisonFranceBenin.id,
      dateClotureDepot: new Date('2026-09-07T17:00:00Z'),
      dateDepart: new Date('2026-09-09T07:00:00Z'),
      statut: 'PLANIFIE',
    },
  })
  const departMali = await db.depart.create({
    data: {
      reference: 'DEP-2026-0034',
      liaisonId: liaisonFranceMali.id,
      dateClotureDepot: new Date('2026-08-19T17:00:00Z'),
      dateDepart: new Date('2026-08-21T07:00:00Z'),
      statut: 'PARTI',
    },
  })

  // ==========================================================================
  // 8. Colis — statuts et modes de réception variés
  // ==========================================================================
  console.log('Colis…')

  /** Petit utilitaire : crée le colis et sa première ligne d'historique. */
  async function creerColis(
    data: Parameters<typeof db.colis.create>[0]['data'],
    historique: Array<{
      statut: Parameters<typeof db.historiqueStatut.create>[0]['data']['statut']
      le: string
      commentaire?: string
    }>,
  ) {
    const colis = await db.colis.create({ data })
    for (const h of historique) {
      await db.historiqueStatut.create({
        data: {
          colisId: colis.id,
          statut: h.statut,
          survenuLe: new Date(h.le),
          commentaire: h.commentaire,
        },
      })
    }
    return colis
  }

  // 1 — Mode A, arrivé et disponible, NON PAYÉ : c'est une créance.
  const colisCreance = await creerColis(
    {
      codeSuivi: 'ENI-2026-00101',
      clientId: aicha!.id,
      modeReception: 'COMMANDE_EN_LIGNE',
      momentPaiement: 'ARRIVEE',
      destinataireNom: 'Aïcha Konan',
      destinataireTelephone: '+225 07 00 00 42',
      villeArriveeId: abidjan.id,
      pointRetraitId: retraitAbidjan.id,
      departId: departPasse.id,
      poidsReel: '12.500',
      categorieId: standard.id,
      contenu: 'Vêtements et produits d’hygiène',
      statut: 'DISPONIBLE_RETRAIT',
      statutPaiement: 'A_PAYER_ARRIVEE',
      dateDepartEffectif: new Date('2026-08-14T07:00:00Z'),
      dateArrivee: new Date('2026-08-21T09:00:00Z'),
      dateDisponible: new Date('2026-08-21T14:00:00Z'),
    },
    [
      {
        statut: 'RECU',
        le: '2026-08-08T11:20:00Z',
        commentaire: 'Carton marchand rattaché au client',
      },
      { statut: 'EN_PREPARATION', le: '2026-08-11T09:05:00Z' },
      { statut: 'EXPEDIE', le: '2026-08-14T07:40:00Z' },
      { statut: 'EN_TRANSIT', le: '2026-08-14T12:00:00Z' },
      { statut: 'ARRIVE', le: '2026-08-21T09:00:00Z' },
      { statut: 'DISPONIBLE_RETRAIT', le: '2026-08-21T14:00:00Z' },
    ],
  )

  // 2 — Mode A, colis reçu SANS client rattaché : la file des non identifiés.
  await creerColis(
    {
      codeSuivi: 'ENI-2026-00102',
      clientId: null,
      modeReception: 'COMMANDE_EN_LIGNE',
      momentPaiement: 'ARRIVEE',
      photoReceptionUrl: '/images/reception-demo.jpg',
      destinataireNom: 'Non identifié',
      villeArriveeId: abidjan.id,
      poidsReel: '3.200',
      contenu: 'Carton marchand scellé, aucun identifiant lisible',
      statut: 'RECU',
      statutPaiement: 'NON_DU',
    },
    [
      {
        statut: 'RECU',
        le: '2026-08-30T15:10:00Z',
        commentaire: 'Aucun identifiant ENI sur l’étiquette',
      },
    ],
  )

  // 3 — Mode B, dépôt au bureau, payé au dépôt.
  await creerColis(
    {
      codeSuivi: 'ENI-2026-00103',
      modeReception: 'DEPOT',
      momentPaiement: 'DEPART',
      expediteurNom: 'Awa Sylla',
      expediteurTelephone: '+33 6 00 00 01 03',
      destinataireNom: 'Ousmane Ndiaye',
      destinataireTelephone: '+221 77 000 01 03',
      villeArriveeId: dakar.id,
      pointRetraitId: retraitDakar.id,
      departId: departSenegal.id,
      poidsReel: '8.000',
      categorieId: standard.id,
      contenu: 'Effets personnels',
      statut: 'EN_PREPARATION',
      statutPaiement: 'PAYE',
    },
    [
      { statut: 'RECU', le: '2026-08-28T10:00:00Z', commentaire: 'Déposé et pesé au comptoir' },
      { statut: 'EN_PREPARATION', le: '2026-08-29T08:30:00Z' },
    ],
  )

  // 4 — Mode C, au hub d'Abidjan, en attente du second segment.
  //     Statut INTERNE : le suivi public affichera EN_TRANSIT.
  await creerColis(
    {
      codeSuivi: 'ENI-2026-00104',
      clientId: kossi!.id,
      modeReception: 'EXPEDITION',
      momentPaiement: 'DEPART',
      expediteurNom: 'Kossi Adjovi',
      destinataireNom: 'Yao Adjovi',
      destinataireTelephone: '+229 97 00 01 04',
      villeArriveeId: cotonou.id,
      pointRetraitId: retraitCotonou.id,
      departId: departBenin.id,
      necessiteReacheminement: true,
      poidsReel: '15.000',
      categorieId: piece.id,
      contenu: 'Pièces détachées automobiles',
      statut: 'EN_REACHEMINEMENT',
      statutPaiement: 'PAYE',
      dateDepartEffectif: new Date('2026-08-26T07:00:00Z'),
    },
    [
      { statut: 'DEVIS_ACCEPTE', le: '2026-08-18T14:00:00Z' },
      {
        statut: 'RECU',
        le: '2026-08-22T11:00:00Z',
        commentaire: 'Reçu par transporteur, numéro de devis collé',
      },
      { statut: 'EXPEDIE', le: '2026-08-26T07:00:00Z' },
      { statut: 'EN_TRANSIT', le: '2026-08-26T12:00:00Z' },
      {
        statut: 'EN_REACHEMINEMENT',
        le: '2026-08-29T10:00:00Z',
        commentaire: 'Arrivé au hub, attente du vol Abidjan → Cotonou',
      },
    ],
  )

  // 5 — Mode B, en transit vers Bamako.
  await creerColis(
    {
      codeSuivi: 'ENI-2026-00105',
      clientId: mamadou!.id,
      modeReception: 'DEPOT',
      momentPaiement: 'DEPART',
      expediteurNom: 'Salif Traoré',
      destinataireNom: 'Mamadou Traoré',
      destinataireTelephone: '+223 70 00 00 43',
      villeArriveeId: bamako.id,
      pointRetraitId: retraitBamako.id,
      departId: departMali.id,
      necessiteReacheminement: true,
      poidsReel: '22.400',
      categorieId: standard.id,
      contenu: 'Denrées non périssables',
      statut: 'EN_TRANSIT',
      statutPaiement: 'PAYE',
      dateDepartEffectif: new Date('2026-08-21T07:00:00Z'),
    },
    [
      { statut: 'RECU', le: '2026-08-18T09:00:00Z' },
      { statut: 'EXPEDIE', le: '2026-08-21T07:00:00Z' },
      { statut: 'EN_TRANSIT', le: '2026-08-21T13:00:00Z' },
    ],
  )

  // 6 — Mode A, reçu au bureau, en attente de départ.
  await creerColis(
    {
      codeSuivi: 'ENI-2026-00106',
      clientId: fatou!.id,
      modeReception: 'COMMANDE_EN_LIGNE',
      momentPaiement: 'ARRIVEE',
      destinataireNom: 'Fatou Ndiaye',
      villeArriveeId: thies.id,
      pointRetraitId: retraitThies.id,
      departId: departSenegal.id,
      poidsReel: '5.750',
      categorieId: standard.id,
      contenu: 'Chaussures et textile',
      statut: 'EN_PREPARATION',
      statutPaiement: 'A_PAYER_ARRIVEE',
    },
    [
      {
        statut: 'RECU',
        le: '2026-08-27T16:40:00Z',
        commentaire: 'Identifiant Eni Fatou 44 lu sur l’étiquette',
      },
      { statut: 'EN_PREPARATION', le: '2026-08-29T09:15:00Z' },
    ],
  )

  // 7 — Mode B, retiré : cycle terminé.
  await creerColis(
    {
      codeSuivi: 'ENI-2026-00107',
      clientId: chantal!.id,
      modeReception: 'DEPOT',
      momentPaiement: 'DEPART',
      expediteurNom: 'Léon Mabiala',
      destinataireNom: 'Chantal Mabiala',
      villeArriveeId: brazzaville.id,
      pointRetraitId: retraitBrazza.id,
      poidsReel: '9.100',
      categorieId: standard.id,
      contenu: 'Effets personnels',
      statut: 'RETIRE',
      statutPaiement: 'PAYE',
      dateDepartEffectif: new Date('2026-07-24T07:00:00Z'),
      dateArrivee: new Date('2026-07-31T10:00:00Z'),
      dateDisponible: new Date('2026-07-31T15:00:00Z'),
      dateRetrait: new Date('2026-08-04T11:30:00Z'),
    },
    [
      { statut: 'RECU', le: '2026-07-21T10:00:00Z' },
      { statut: 'EXPEDIE', le: '2026-07-24T07:00:00Z' },
      { statut: 'ARRIVE', le: '2026-07-31T10:00:00Z' },
      { statut: 'DISPONIBLE_RETRAIT', le: '2026-07-31T15:00:00Z' },
      { statut: 'RETIRE', le: '2026-08-04T11:30:00Z', commentaire: 'Pièce d’identité vérifiée' },
    ],
  )

  // 8 — Mode C, litige signalé.
  await creerColis(
    {
      codeSuivi: 'ENI-2026-00108',
      clientId: ibrahim!.id,
      modeReception: 'EXPEDITION',
      momentPaiement: 'DEPART',
      expediteurNom: 'Sékou Camara',
      destinataireNom: 'Ibrahim Camara',
      villeArriveeId: conakry.id,
      pointRetraitId: retraitConakry.id,
      poidsReel: '6.300',
      categorieId: marque.id,
      valeurDeclaree: '480.00',
      justificatifFourni: true,
      contenu: 'Article de marque, justificatif fourni',
      statut: 'LITIGE',
      statutPaiement: 'PAYE',
    },
    [
      { statut: 'RECU', le: '2026-08-12T14:00:00Z' },
      { statut: 'EXPEDIE', le: '2026-08-14T07:00:00Z' },
      {
        statut: 'LITIGE',
        le: '2026-08-25T16:00:00Z',
        commentaire: 'Emballage endommagé signalé à l’arrivée',
      },
    ],
  )

  // ==========================================================================
  // 9. Demandes de devis
  // ==========================================================================
  console.log('Demandes de devis…')

  const demandeElectro = await db.demandeDevis.create({
    data: {
      reference: 'DEM-2026-00001',
      paysDepart: 'France',
      villeDepart: 'Rouen',
      paysArrivee: "Côte d'Ivoire",
      villeArrivee: 'Abidjan',
      modeRemise: 'DEPOT',
      categorieId: electronique.id,
      poidsEstime: '14.000',
      dimensions: '80 × 50 × 20 cm',
      description: 'Téléviseur 50 pouces, encore emballé',
      nom: 'Serge Kouassi',
      telephone: '+33 6 00 00 00 01',
      email: 'demande1.demo@exemple.test',
      statut: 'NOUVELLE',
      consentementLe: new Date('2026-08-29T09:12:00Z'),
      photos: {
        create: [
          { url: '/images/devis-demo-1.jpg', nomOriginal: 'photo-1.jpg', ordre: 0 },
          { url: '/images/devis-demo-2.jpg', nomOriginal: 'photo-2.jpg', ordre: 1 },
        ],
      },
    },
  })

  const demandeValeur = await db.demandeDevis.create({
    data: {
      reference: 'DEM-2026-00002',
      paysDepart: 'France',
      villeDepart: 'Rouen',
      paysArrivee: 'Sénégal',
      villeArrivee: 'Dakar',
      modeRemise: 'EXPEDITION',
      categorieId: marque.id,
      poidsEstime: '4.500',
      valeurAchat: '620.00',
      description: 'Sac de marque avec facture d’achat',
      nom: 'Nadia Fall',
      telephone: '+33 6 00 00 00 02',
      email: 'demande2.demo@exemple.test',
      statut: 'CHIFFREE',
      consentementLe: new Date('2026-08-26T15:40:00Z'),
      photos: { create: [{ url: '/images/devis-demo-3.jpg', ordre: 0 }] },
    },
  })

  const demandeEncombrant = await db.demandeDevis.create({
    data: {
      reference: 'DEM-2026-00003',
      paysDepart: 'France',
      villeDepart: 'Rouen',
      paysArrivee: 'Bénin',
      villeArrivee: 'Cotonou',
      modeRemise: 'EXPEDITION',
      categorieId: piece.id,
      poidsEstime: '15.000',
      description: 'Pièces détachées automobiles, colis encombrant',
      nom: 'Kossi Adjovi',
      telephone: '+229 97 00 00 47',
      email: 'kossi.demo@exemple.test',
      statut: 'CONVERTIE',
      consentementLe: new Date('2026-08-16T08:20:00Z'),
    },
  })

  // « Convertie » doit vouloir dire quelque chose : le colis ENI-2026-00104
  // EST cette demande, une fois passée en exploitation. Sans ce lien, le
  // statut serait un libellé sans réalité, et la fiche du devis n'aurait
  // aucun colis vers lequel renvoyer.
  await db.colis.update({
    where: { codeSuivi: 'ENI-2026-00104' },
    data: { demandeDevisId: demandeEncombrant.id },
  })

  await db.demandeDevis.create({
    data: {
      reference: 'DEM-2026-00004',
      paysDepart: "Côte d'Ivoire",
      villeDepart: 'Abidjan',
      paysArrivee: 'États-Unis',
      villeArrivee: 'New York',
      modeRemise: 'DEPOT',
      categorieId: standard.id,
      poidsEstime: '18.000',
      description: 'Produits alimentaires non périssables',
      nom: 'Alice Brou',
      telephone: '+225 07 00 00 04',
      email: 'demande4.demo@exemple.test',
      statut: 'ENVOYEE',
      consentementLe: new Date('2026-08-28T11:05:00Z'),
    },
  })

  // ==========================================================================
  // 10. Documents — devis et factures
  //     Le taux est FIGÉ à l'émission et le montant en devise STOCKÉ.
  // ==========================================================================
  console.log('Devis et factures…')

  // Devis estimatif du colis en créance (mode A : devis puis facture).
  await db.document.create({
    data: {
      type: 'DEVIS',
      numero: 'DEV-2026-00001',
      colisId: colisCreance.id,
      montantEur: '195.00',
      dateEmission: new Date('2026-08-08T12:00:00Z'),
      dateValidite: new Date('2026-08-15T12:00:00Z'),
      detail: '13 kg (12,5 kg arrondis au kilo supérieur) × 15,00 €/kg — France → Abidjan',
    },
  })
  await db.document.create({
    data: {
      type: 'DEVIS',
      numero: 'DEV-2026-00002',
      demandeDevisId: demandeValeur.id,
      montantEur: '93.00',
      dateEmission: new Date('2026-08-27T10:30:00Z'),
      dateValidite: new Date('2026-09-03T10:30:00Z'),
      detail: 'Article de valeur — 15 % de 620,00 €',
    },
  })
  await db.document.create({
    data: {
      type: 'DEVIS',
      numero: 'DEV-2026-00003',
      demandeDevisId: demandeEncombrant.id,
      montantEur: '300.00',
      dateEmission: new Date('2026-08-17T09:00:00Z'),
      dateValidite: new Date('2026-08-24T09:00:00Z'),
      detail: '15 kg × 20,00 €/kg — pièces détachées, France → Cotonou',
    },
  })
  await db.document.create({
    data: {
      type: 'DEVIS',
      numero: 'DEV-2026-00004',
      demandeDevisId: demandeElectro.id,
      montantEur: '0.00',
      dateEmission: new Date('2026-08-29T09:30:00Z'),
      dateValidite: new Date('2026-09-05T09:30:00Z'),
      detail: 'Matériel électronique — chiffrage à l’unité, en attente d’examen',
    },
  })

  // Facture émise à l'ARRIVÉE, en euros ET en FCFA.
  // Le taux est celui du jour d'émission, figé : 1 € = 655,957.
  const montantCreanceEur = 195
  const factureArrivee = await db.document.create({
    data: {
      type: 'FACTURE',
      numero: 'FAC-2026-00001',
      colisId: colisCreance.id,
      montantEur: montantCreanceEur.toFixed(2),
      devise: 'XOF',
      tauxApplique: TAUX_CFA,
      montantDevise: convertirEnCfa(montantCreanceEur, TAUX_CFA),
      dateEmission: new Date('2026-08-21T15:00:00Z'),
      detail: '13 kg (12,5 kg arrondis au kilo supérieur) × 15,00 €/kg — France → Abidjan',
    },
  })

  // Facture payée au dépôt (mode B), en euros uniquement.
  const factureDepot = await db.document.create({
    data: {
      type: 'FACTURE',
      numero: 'FAC-2026-00002',
      colisId: (await db.colis.findFirstOrThrow({ where: { codeSuivi: 'ENI-2026-00103' } })).id,
      montantEur: '96.00',
      dateEmission: new Date('2026-08-28T10:15:00Z'),
      dateReglement: new Date('2026-08-28T10:15:00Z'),
      detail: '8 kg × 12,00 €/kg — France → Dakar',
    },
  })

  // Facture d'un colis déjà retiré et soldé.
  const factureRetire = await db.document.create({
    data: {
      type: 'FACTURE',
      numero: 'FAC-2026-00003',
      colisId: (await db.colis.findFirstOrThrow({ where: { codeSuivi: 'ENI-2026-00107' } })).id,
      montantEur: '200.00',
      dateEmission: new Date('2026-07-21T11:00:00Z'),
      dateReglement: new Date('2026-07-21T11:00:00Z'),
      detail: '10 kg (9,1 kg arrondis au kilo supérieur) × 20,00 €/kg — France → Brazzaville',
    },
  })

  // ==========================================================================
  // 11. Encaissements
  //     La facture d'arrivée FAC-2026-00001 reste IMPAYÉE : c'est la créance
  //     que le tableau de bord doit faire remonter.
  // ==========================================================================
  console.log('Encaissements…')

  await db.encaissement.create({
    data: {
      documentId: factureDepot.id,
      montant: '96.00',
      devise: 'EUR',
      lieu: 'FRANCE',
      moyen: 'ESPECES',
      dateEncaissement: new Date('2026-08-28T10:15:00Z'),
    },
  })
  await db.encaissement.create({
    data: {
      documentId: factureRetire.id,
      montant: '200.00',
      devise: 'EUR',
      lieu: 'FRANCE',
      moyen: 'CARTE',
      dateEncaissement: new Date('2026-07-21T11:00:00Z'),
    },
  })
  // Aucun encaissement sur factureArrivee : créance ouverte depuis le 14 août.
  void factureArrivee

  // ==========================================================================
  // 12. Séquences de numérotation
  //     Elles doivent refléter les documents déjà émis, sans quoi la
  //     prochaine facture réutiliserait un numéro.
  // ==========================================================================
  console.log('Séquences de numérotation…')

  await db.sequenceDocument.createMany({
    data: [
      { type: 'DEVIS', annee: 2026, dernierNumero: 4 },
      { type: 'FACTURE', annee: 2026, dernierNumero: 3 },
      { type: 'COLIS', annee: 2026, dernierNumero: 108 },
      { type: 'DEMANDE', annee: 2026, dernierNumero: 4 },
      { type: 'DEPART', annee: 2026, dernierNumero: 34 },
      { type: 'CLIENT', annee: 2026, dernierNumero: 47 },
    ],
  })

  // ==========================================================================
  console.log('\nSeed terminé.')
  const compte = {
    pays: await db.pays.count(),
    villes: await db.ville.count(),
    pointsRetrait: await db.pointRetrait.count(),
    liaisons: await db.liaison.count(),
    liaisonsPubliques: await db.liaison.count({
      where: { afficheePubliquement: true, actif: true },
    }),
    categories: await db.categorieArticle.count(),
    clients: await db.client.count(),
    departs: await db.depart.count(),
    colis: await db.colis.count(),
    colisNonRattaches: await db.colis.count({
      where: { modeReception: 'COMMANDE_EN_LIGNE', clientId: null },
    }),
    demandesDevis: await db.demandeDevis.count(),
    devis: await db.document.count({ where: { type: 'DEVIS' } }),
    factures: await db.document.count({ where: { type: 'FACTURE' } }),
    encaissements: await db.encaissement.count(),
    utilisateurs: await db.utilisateur.count(),
  }
  console.table(compte)
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (erreur) => {
    console.error(erreur)
    await db.$disconnect()
    process.exit(1)
  })
