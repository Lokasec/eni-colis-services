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
      categories.find((c) => c.code === 'PIECE_DETACHEE')?.mode === 'POIDS_X_TARIF_FIXE' &&
      Number(categories.find((c) => c.code === 'GRANDE_MARQUE')?.valeur) === 0.15,
    categories.map((c) => c.code).join(', '),
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
