/**
 * Amorçage de la base de production — UNE SEULE FOIS.
 *
 * Une base fraîchement migrée est vide. Sans données de référence — pays,
 * villes, liaisons, catégories, paramètres de tarification — le site se
 * construit mais n'affiche rien : pas de destinations, pas de tarifs, et
 * les fiches destination répondent 404.
 *
 * Ce script tourne au build, avant `next build`. Il est ANODIN quand la
 * base contient déjà quelque chose : il ne fait rien et rend la main.
 *
 * Le garde-fou n'est pas une précaution de style. `prisma/seed.ts`
 * commence par un `deleteMany()` sur toutes les tables : lancé sans
 * condition à chaque déploiement, il effacerait les vrais colis, les
 * vraies factures et les vrais encaissements. Le contrôle ci-dessous est
 * la seule chose qui empêche un `git push` d'effacer la comptabilité.
 */
import { execSync } from 'node:child_process'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../lib/generated/prisma/client'
import { renseignee } from '../lib/env'

// Sur Vercel, les variables sont déjà dans l'environnement. En local, il
// faut lire `.env` — sans quoi ce script ne serait testable qu'en
// production, c'est-à-dire jamais avant qu'il soit trop tard.
try {
  process.loadEnvFile('.env')
} catch {
  /* pas de .env : on prend l'environnement tel quel */
}

const connectionString =
  renseignee(process.env.DATABASE_URL_UNPOOLED) ?? renseignee(process.env.DATABASE_URL)

if (!connectionString) {
  console.error('[amorçage] DATABASE_URL absent — impossible de vérifier la base.')
  process.exit(1)
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

try {
  // CE QU'IL FAUT PROTEGER, c'est la donnée d'exploitation : les colis
  // reçus, les factures émises, les encaissements. Elle est irremplaçable.
  //
  // Les données de RÉFÉRENCE — pays, villes, liaisons, tarifs — ne le sont
  // pas : elles se rechargent depuis le seed à l'identique. Le garde-fou
  // porte donc sur les premières, pas sur les secondes.
  //
  // La première version testait `pays > 0`, et c'était faux. Le seed avait
  // échoué APRÈS avoir créé la France et avant la Côte d'Ivoire : au
  // déploiement suivant, une seule ligne suffisait à faire passer la base
  // pour peuplée, le seed était sauté, et le site restait sans
  // destinations. Une base à moitié chargée ressemblait à une base pleine.
  const [colis, documents, clients, pays] = await Promise.all([
    db.colis.count(),
    db.document.count(),
    db.client.count(),
    db.pays.count(),
  ])

  const donneesReelles = colis + documents + clients

  if (donneesReelles > 0) {
    console.log(
      `[amorçage] ${colis} colis, ${documents} documents, ${clients} clients en base. ` +
        'Aucune écriture — le seed effacerait des données réelles.',
    )
  } else {
    console.log(
      pays > 0
        ? `[amorçage] ${pays} pays mais aucune donnée d'exploitation : chargement de référence incomplet, on recharge.`
        : '[amorçage] Base vide : chargement des données de référence…',
    )
    execSync('npx prisma db seed', { stdio: 'inherit' })
    console.log('[amorçage] Terminé.')
  }
} catch (erreur) {
  // J'AI EU TORT ICI, et le premier déploiement l'a prouvé.
  //
  // Ce bloc avalait l'erreur pour ne pas bloquer le déploiement. Résultat :
  // le seed a échoué après avoir écrit les paramètres de tarification mais
  // avant le premier pays, le build a réussi, et le site est parti en ligne
  // sur une base À MOITIÉ PEUPLÉE — sans destinations, sans départs, avec
  // des fiches en 404. Rien dans l'interface ne le signalait.
  //
  // Un déploiement qui échoue se voit. Une base incohérente en production,
  // non. On échoue donc franchement.
  console.error('[amorçage] Échec du chargement des données de référence.')
  console.error(erreur)
  await db.$disconnect()
  process.exit(1)
}

await db.$disconnect()
