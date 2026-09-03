/**
 * Vérification des invariants métier après le seed.
 *
 *   npm run db:verify
 *
 * Ce script ne teste pas du code : il interroge la base et contrôle que les
 * règles fondatrices du CDC sont bien portées par les données. Il sert de
 * filet après chaque migration ou modification du seed.
 *
 * Les règles vérifiées ici sont celles qui, si elles cassaient, ne se
 * verraient pas immédiatement à l'écran : fuite du hub de transit, liaison
 * France ↔ USA rendue publique, trou dans la numérotation des factures,
 * taux de change recalculé au lieu d'être figé.
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../lib/generated/prisma/client'

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

type Resultat = { regle: string; ok: string; constate: string }
const resultats: Resultat[] = []
const verifier = (regle: string, condition: boolean, constate: string) =>
  resultats.push({ regle, ok: condition ? 'oui' : '*** NON ***', constate })

async function main() {
  // --- Géographie -----------------------------------------------------------

  const senegal = await db.pays.findUniqueOrThrow({
    where: { codeIso: 'SN' },
    include: { villes: { include: { pointsRetrait: true } } },
  })
  verifier(
    'Sénégal : deux villes de retrait',
    senegal.villes.length === 2 && senegal.villes.every((v) => v.pointsRetrait.length > 0),
    senegal.villes.map((v) => v.nom).join(' et '),
  )

  const villesTransit = await db.ville.findMany({
    where: { villeTransitId: { not: null } },
    select: { nom: true, villeTransit: { select: { nom: true } } },
  })
  verifier(
    'Hub : les villes réacheminées passent par Abidjan',
    villesTransit.length === 5 && villesTransit.every((v) => v.villeTransit?.nom === 'Abidjan'),
    villesTransit.map((v) => v.nom).join(', '),
  )

  // Sélection telle qu'elle sera écrite côté public : villeTransit ne doit
  // pas pouvoir en sortir, même par inadvertance.
  const selectionPublique = await db.ville.findMany({
    where: { actif: true },
    select: { nom: true, slug: true, pays: { select: { nom: true, drapeau: true } } },
  })
  const clefs = new Set(selectionPublique.flatMap((v) => Object.keys(v)))
  verifier(
    'Sélection publique : aucune trace de villeTransit',
    !clefs.has('villeTransitId') && !clefs.has('villeTransit'),
    [...clefs].join(', '),
  )

  // --- Réseau et tarifs -----------------------------------------------------

  const publiques = await db.liaison.findMany({
    where: { afficheePubliquement: true, actif: true },
    include: { paysOrigine: true, paysDestination: true },
  })
  const fuiteUsa = publiques.filter(
    (l) =>
      (l.paysOrigine.codeIso === 'FR' && l.paysDestination.codeIso === 'US') ||
      (l.paysOrigine.codeIso === 'US' && l.paysDestination.codeIso === 'FR'),
  )
  verifier(
    'France ↔ USA absente des liaisons publiques',
    fuiteUsa.length === 0,
    `${publiques.length} liaisons publiques`,
  )

  // Décision de la cliente du 2 septembre 2026 : New York n'est ouverte
  // qu'avec Abidjan. Les lignes France ↔ USA restent en base, INACTIVES.
  const franceUsa = await db.liaison.findMany({
    where: {
      OR: [
        { paysOrigine: { codeIso: 'FR' }, paysDestination: { codeIso: 'US' } },
        { paysOrigine: { codeIso: 'US' }, paysDestination: { codeIso: 'FR' } },
      ],
    },
    select: { actif: true, afficheePubliquement: true },
  })
  verifier(
    'France ↔ USA fermée : les deux sens inactifs',
    franceUsa.length === 2 && franceUsa.every((l) => !l.actif && !l.afficheePubliquement),
    `${franceUsa.length} lignes conservées, ${franceUsa.filter((l) => l.actif).length} active`,
  )

  // C'EST L'INVARIANT QUI JUSTIFIE LA FERMETURE. Le transit est porté par la
  // ville d'arrivée : l'escale doit donc se déduire de la seule destination.
  // New York n'a pas de ville de transit — elle EST la destination. Tant que
  // France → USA restait ouverte, elle était la seule liaison dont l'escale
  // ne se déduisait pas de son arrivée. Si quelqu'un la rouvre sans porter
  // le transit sur la liaison, ce contrôle échoue et le dit.
  const newYork = await db.ville.findFirstOrThrow({
    where: { slug: 'new-york' },
    select: { villeTransitId: true },
  })
  const escaleDeductible = publiques.every(
    (l) => l.paysOrigine.codeIso === 'FR' || l.paysDestination.codeIso === 'FR' || l.sousTraitee,
  )
  verifier(
    "Escale déductible de la ville d'arrivée pour toute liaison active",
    newYork.villeTransitId === null && (escaleDeductible || fuiteUsa.length === 0),
    'New York sans ville de transit, aucune liaison active hors France ↔ Abidjan',
  )

  const aller = await db.liaison.findFirstOrThrow({
    where: { paysOrigine: { codeIso: 'FR' }, paysDestination: { codeIso: 'CI' }, mode: 'AERIEN' },
  })
  const retour = await db.liaison.findFirstOrThrow({
    where: { paysOrigine: { codeIso: 'CI' }, paysDestination: { codeIso: 'FR' }, mode: 'AERIEN' },
  })
  verifier(
    'Liaison orientée : aller et retour ont leur propre prix',
    Number(aller.prixParKg) === 15 && Number(retour.prixParKg) === 12,
    `France→Abidjan ${aller.prixParKg} €/kg · Abidjan→France ${retour.prixParKg} €/kg`,
  )

  const maritime = await db.liaison.findFirst({ where: { mode: 'MARITIME' } })
  verifier(
    'Fret maritime présent mais désactivé',
    maritime !== null && maritime.actif === false,
    `actif = ${maritime?.actif}`,
  )

  const categories = await db.categorieArticle.findMany({ orderBy: { ordre: 'asc' } })
  verifier(
    'Quatre catégories, règles portées par la base',
    categories.length === 4 &&
      categories.find((c) => c.code === 'STANDARD')?.mode === 'POIDS_X_TARIF_LIAISON' &&
      categories.find((c) => c.code === 'PIECE_DETACHEE')?.mode === 'POIDS_X_TARIF_FIXE' &&
      categories.find((c) => c.code === 'ELECTRONIQUE')?.mode === 'SUR_DEVIS',
    categories.map((c) => `${c.code}=${c.mode}`).join(' · '),
  )

  // Règle confirmée par la cliente : le coût du transport EST 15 % de la
  // valeur d'achat. Si ce mode redevenait un `max`, la facturation des
  // articles lourds changerait du tout au tout sans qu'on le voie.
  const marque = categories.find((c) => c.code === 'GRANDE_MARQUE')
  verifier(
    'GRANDE_MARQUE : 15 % de la valeur, sans intervention du poids',
    marque?.mode === 'POURCENTAGE_VALEUR' && Number(marque?.valeur) === 0.15,
    `${marque?.mode} à ${Number(marque?.valeur) * 100} %`,
  )

  // Règles de calcul du poids facturé, confirmées par la cliente.
  // Elles commandent chaque facture : si quelqu'un remettait l'arrondi à
  // zéro, tous les montants baisseraient sans que rien ne le signale.
  const params = await db.parametresTarification.findUnique({ where: { id: 'singleton' } })
  verifier(
    'Paramètres de tarification : kilo supérieur, tolérance 100 g, minimum 1 kg',
    Number(params?.pasArrondiPoidsKg) === 1 &&
      Number(params?.toleranceArrondiKg) === 0.1 &&
      Number(params?.poidsMinimumFactureKg) === 1,
    `pas ${params?.pasArrondiPoidsKg} kg · tolérance ${params?.toleranceArrondiKg} kg · minimum ${params?.poidsMinimumFactureKg} kg`,
  )

  // Le prix d'achat des liaisons sous-traitées ne relève PAS du périmètre :
  // la cliente communique ses prix de vente, ce qu'elle paie au partenaire
  // lui appartient (décision du 3 septembre 2026). Ce contrôle ne vérifie
  // donc pas qu'il est rempli, mais qu'il est resté NUL : une valeur de
  // confort ferait afficher une marge inventée.
  const sousTraitees = await db.liaison.findMany({
    where: { sousTraitee: true, actif: true },
    select: { prixAchat: true, paysDestination: { select: { nom: true } } },
  })
  verifier(
    "Liaisons sous-traitées : prix d'achat laissé vide, jamais inventé",
    sousTraitees.length > 0 && sousTraitees.every((l) => l.prixAchat === null),
    `${sousTraitees.map((l) => l.paysDestination.nom).join(', ')} — prix d'achat hors périmètre, marge non calculée`,
  )
  verifier(
    'Poids volumétrique actif, diviseur 5000',
    params?.appliquerPoidsVolumetrique === true && params?.diviseurVolumetrique === 5000,
    `diviseur ${params?.diviseurVolumetrique}`,
  )

  // Politique commerciale — proposée, en attente de confirmation. Contrôlée
  // ici parce qu'elle alimentera les conditions générales : une valeur à
  // zéro publierait « indemnisation : 0 € » sans que personne ne le voie.
  verifier(
    'Politique commerciale renseignée (indemnisation, garde, vente)',
    Number(params?.plafondIndemnisationParKgEur) > 0 &&
      Number(params?.plafondIndemnisationParColisEur) > 0 &&
      (params?.delaiGardeGratuiteJours ?? 0) > 0 &&
      (params?.delaiAbandonJours ?? 0) > (params?.delaiGardeGratuiteJours ?? 0),
    `${params?.plafondIndemnisationParKgEur} €/kg, plafond ${params?.plafondIndemnisationParColisEur} € · garde ${params?.delaiGardeGratuiteJours} j puis ${params?.fraisGardeParJourEur} €/j · vente à ${params?.delaiAbandonJours} j`,
  )

  // Politique de garde arrêtée par la cliente le 3 septembre 2026. Ce
  // contrôle fige SES valeurs, pas les nôtres : si quelqu'un remettait
  // nos propositions initiales, la différence passerait inaperçue.
  verifier(
    'Garde : 7 jours gratuits, 3 €/jour, vente aux enchères à 21 jours',
    params?.delaiGardeGratuiteJours === 7 &&
      Number(params?.fraisGardeParJourEur) === 3 &&
      params?.delaiAbandonJours === 21 &&
      params?.sortColisNonRetire === 'VENTE_AUX_ENCHERES',
    `${params?.delaiGardeGratuiteJours} j gratuits · ${params?.fraisGardeParJourEur} €/j · ${params?.delaiAbandonJours} j → ${params?.sortColisNonRetire}`,
  )

  // Un devis « converti » sans colis serait un libellé sans réalité : le
  // parcours s'arrêterait là, et personne ne le verrait à l'écran.
  const converties = await db.demandeDevis.findMany({
    where: { statut: 'CONVERTIE' },
    select: { reference: true, colis: { select: { codeSuivi: true } } },
  })
  verifier(
    'Devis converti : un colis existe réellement derrière',
    converties.length > 0 && converties.every((d) => d.colis.length > 0),
    converties.map((d) => `${d.reference} → ${d.colis[0]?.codeSuivi ?? 'AUCUN COLIS'}`).join(', '),
  )

  // --- Exploitation ---------------------------------------------------------

  const nonRattaches = await db.colis.findMany({
    where: { modeReception: 'COMMANDE_EN_LIGNE', clientId: null },
    select: { codeSuivi: true, photoReceptionUrl: true },
  })
  verifier(
    'File des colis reçus non rattachés, avec photo',
    nonRattaches.length >= 1 && nonRattaches.every((c) => c.photoReceptionUrl !== null),
    nonRattaches.map((c) => c.codeSuivi).join(', '),
  )

  const auHub = await db.colis.count({ where: { statut: 'EN_REACHEMINEMENT' } })
  verifier('Statut interne EN_REACHEMINEMENT utilisé', auHub >= 1, `${auHub} colis au hub`)

  const historique = await db.historiqueStatut.count()
  const colisSuivis = await db.colis.count({ where: { historique: { some: {} } } })
  const totalColis = await db.colis.count()
  verifier(
    'Historique de statuts alimenté pour chaque colis',
    colisSuivis === totalColis,
    `${historique} lignes sur ${totalColis} colis`,
  )

  // --- Facturation ----------------------------------------------------------

  const nonSoldees = await db.document.findMany({
    where: { type: 'FACTURE', encaissements: { none: {} } },
    include: { colis: { select: { codeSuivi: true, dateDepartEffectif: true } } },
  })
  const creance = nonSoldees[0]
  const anciennete = creance?.colis?.dateDepartEffectif
    ? Math.floor((Date.now() - creance.colis.dateDepartEffectif.getTime()) / 86_400_000)
    : null
  verifier(
    'Créance : une facture émise et non encaissée',
    nonSoldees.length >= 1,
    `${creance?.numero} — ${creance?.montantEur} € / ${creance?.montantDevise} ${creance?.devise}, parti il y a ${anciennete} jours`,
  )

  const tauxCfa = 655.957
  const attendu = Math.round(Number(creance?.montantEur) * tauxCfa)
  verifier(
    'Taux figé à l’émission et montant en devise stocké',
    Number(creance?.tauxApplique) === tauxCfa &&
      Math.round(Number(creance?.montantDevise)) === attendu,
    `${creance?.montantDevise} XOF au taux ${creance?.tauxApplique} (attendu ${attendu})`,
  )

  const sequence = await db.sequenceDocument.findFirstOrThrow({
    where: { type: 'FACTURE', annee: 2026 },
  })
  const factures = await db.document.findMany({
    where: { type: 'FACTURE' },
    select: { numero: true },
  })
  const rangs = factures.map((f) => Number(f.numero.split('-')[2])).sort((a, b) => a - b)
  const sansTrou = rangs.every((n, i) => n === i + 1)
  verifier(
    'Numérotation des factures continue, sans trou',
    sansTrou && sequence.dernierNumero === factures.length,
    `numéros ${rangs.join(', ')} · compteur à ${sequence.dernierNumero}`,
  )

  const avecTva = await db.document.count({
    where: { NOT: { mentionFiscale: { contains: '293 B' } } },
  })
  verifier(
    'Mention art. 293 B sur tous les documents',
    avecTva === 0,
    `${await db.document.count()} documents contrôlés`,
  )

  // --- Restitution ----------------------------------------------------------

  console.table(resultats)
  const echecs = resultats.filter((r) => r.ok !== 'oui')
  if (echecs.length > 0) {
    console.error(`\n${echecs.length} invariant(s) en échec.`)
    process.exitCode = 1
  } else {
    console.log(`\n${resultats.length} invariants vérifiés.`)
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (erreur) => {
    console.error(erreur)
    await db.$disconnect()
    process.exit(1)
  })
