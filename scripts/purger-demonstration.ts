/**
 * Purge des données de DÉMONSTRATION avant la remise à la cliente.
 *
 * POURQUOI CE SCRIPT EXISTE
 *
 * L'amorçage du 3 septembre a chargé le seed en production : la base
 * contient aujourd'hui six clients inventés, huit colis, quatre devis et
 * TROIS FACTURES numérotées FAC-2026-00001 à 00003.
 *
 * Ce n'est pas un détail cosmétique. La numérotation des factures est une
 * obligation comptable : continue, sans trou. Si la cliente émet sa
 * première vraie facture sur cette base, elle portera le numéro 4 — et ses
 * trois premières factures de l'exercice seront des factures fictives,
 * adressées à des personnes qui n'existent pas. Le même raisonnement vaut
 * pour sa liste de clients et pour ses créances : le tableau de bord
 * afficherait 195 € de créance imaginaire.
 *
 * CE QUI EST SUPPRIMÉ — la donnée d'EXPLOITATION, inventée :
 *   encaissements · documents · historique · colis · photos de devis ·
 *   demandes de devis · départs · clients · campagnes
 *   + les compteurs de numérotation, remis à zéro
 *
 * CE QUI EST CONSERVÉ — la donnée de RÉFÉRENCE, qui est vraie :
 *   pays · villes · points de retrait · liaisons et tarifs · catégories ·
 *   paramètres de tarification · COMPTES UTILISATEURS
 *
 * Les comptes sont conservés à dessein : les supprimer déconnecterait la
 * personne qui lance ce script, et les mots de passe déjà changés seraient
 * perdus.
 *
 *   npx tsx scripts/purger-demonstration.ts             # blanc : ne touche à rien
 *   npx tsx scripts/purger-demonstration.ts --vraiment  # exécute
 *
 * Le mode blanc est le défaut, et ce n'est pas de la prudence de façade :
 * ce script est irréversible et se lance contre la PRODUCTION.
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../lib/generated/prisma/client'
import { renseignee } from '../lib/env'

try {
  process.loadEnvFile('.env')
} catch {
  /* pas de .env : on prend l'environnement tel quel */
}

const connectionString =
  renseignee(process.env.DATABASE_URL_UNPOOLED) ?? renseignee(process.env.DATABASE_URL)

if (!connectionString) {
  console.error(
    'DATABASE_URL absent.\n' +
      'Pour viser la production : récupérez les variables Vercel dans un fichier local\n' +
      '  npx vercel env pull .env.production.local\n' +
      'puis relancez avec ce fichier chargé.',
  )
  process.exit(1)
}

const vraiment = process.argv.includes('--vraiment')
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

// L'hôte est affiché pour qu'on voie SUR QUELLE BASE on est sur le point
// d'agir. Le mot de passe est retiré de l'URL avant affichage.
const hote = (() => {
  try {
    return new URL(connectionString).host
  } catch {
    return 'hôte illisible'
  }
})()

const compter = async () => ({
  encaissements: await db.encaissement.count(),
  documents: await db.document.count(),
  historique: await db.historiqueStatut.count(),
  colis: await db.colis.count(),
  photos: await db.photoDevis.count(),
  demandes: await db.demandeDevis.count(),
  departs: await db.depart.count(),
  clients: await db.client.count(),
  campagnes: await db.messageCampagne.count(),
  compteurs: await db.sequenceDocument.count(),
})

const conserve = async () => ({
  pays: await db.pays.count(),
  villes: await db.ville.count(),
  liaisons: await db.liaison.count(),
  categories: await db.categorieArticle.count(),
  utilisateurs: await db.utilisateur.count(),
})

try {
  console.log(`\nBase visée : ${hote}\n`)

  const avant = await compter()
  console.table(avant)

  const total = Object.values(avant).reduce((s, n) => s + n, 0)
  if (total === 0) {
    console.log('Rien à purger : la base ne contient aucune donnée d’exploitation.')
  } else if (!vraiment) {
    console.log(
      'MODE BLANC — rien n’a été supprimé.\n' +
        'Ces lignes SERAIENT supprimées, ainsi que les compteurs de numérotation.\n' +
        'Relancez avec --vraiment pour exécuter.\n',
    )
    console.table(await conserve())
    console.log('↑ conservé dans tous les cas.')
  } else {
    // Ordre imposé par les clés étrangères : on remonte des feuilles vers
    // les racines. C'est le même ordre que `prisma/seed.ts`.
    await db.encaissement.deleteMany()
    await db.document.deleteMany()
    await db.historiqueStatut.deleteMany()
    await db.colis.deleteMany()
    await db.photoDevis.deleteMany()
    await db.demandeDevis.deleteMany()
    await db.depart.deleteMany()
    await db.client.deleteMany()
    await db.messageCampagne.deleteMany()

    // Les compteurs repartent de zéro : la première vraie facture de la
    // cliente doit porter le numéro 1 de son exercice, pas le numéro 4.
    await db.sequenceDocument.deleteMany()

    console.log('\nPurge effectuée. État après :')
    console.table(await compter())
    console.table(await conserve())
    console.log(
      '\nLes photos déjà déposées sur Vercel Blob ne sont PAS supprimées par ce script :\n' +
        'elles se retirent depuis Vercel > Storage > eni-colis-services-blob > Manage Blobs.',
    )
  }
} catch (erreur) {
  console.error('\nÉchec de la purge. Aucune garantie sur l’état de la base — vérifiez-la.')
  console.error(erreur)
  await db.$disconnect()
  process.exit(1)
}

await db.$disconnect()
