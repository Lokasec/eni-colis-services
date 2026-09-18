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
  // DEUX VERSIONS ONT ÉTÉ FAUSSES ICI. La troisième tient compte des deux.
  //
  // v1 — « si un pays existe, ne rien faire ». Le seed avait échoué APRÈS
  // la France et avant la Côte d'Ivoire : une seule ligne suffisait à faire
  // passer la base pour peuplée, et le site restait sans destinations. Une
  // base à moitié chargée ressemblait à une base pleine.
  //
  // v2 — « si aucune donnée d'exploitation, (re)charger ». Pire encore, et
  // constaté le 18 septembre 2026 : après la purge des données de
  // démonstration avant remise à la cliente, la base était LÉGITIMEMENT
  // vide de colis, de documents et de clients. Le déploiement suivant a
  // donc relancé le seed — qui commence par `deleteMany()` sur toutes les
  // tables — et a ressuscité les six clients inventés, les huit colis et
  // les trois fausses factures. La purge était annulée dans la minute.
  //
  // Le même piège attendait la cliente à son premier jour d'exploitation :
  // zéro colis, zéro client, c'est l'état NORMAL d'une entreprise qui
  // démarre. Chaque déploiement lui aurait effacé sa base.
  //
  // v3 — ON N'AMORCE QUE SI LA DONNÉE DE RÉFÉRENCE MANQUE. Elle est le
  // seul indicateur fiable d'une base jamais amorcée : le seed la crée
  // toujours, et rien dans l'exploitation ne la supprime. Une base vide de
  // colis mais pourvue de ses pays, de ses tarifs et de ses catégories est
  // une base PRÊTE, pas une base neuve.
  const [colis, documents, clients, pays, categories, liaisons, parametres] = await Promise.all([
    db.colis.count(),
    db.document.count(),
    db.client.count(),
    db.pays.count(),
    db.categorieArticle.count(),
    db.liaison.count(),
    db.parametresTarification.count(),
  ])

  const donneesReelles = colis + documents + clients
  const referenceComplete = pays > 0 && categories > 0 && liaisons > 0 && parametres > 0

  if (donneesReelles > 0) {
    console.log(
      `[amorçage] ${colis} colis, ${documents} documents, ${clients} clients en base. ` +
        'Aucune écriture — le seed effacerait des données réelles.',
    )
  } else if (referenceComplete) {
    console.log(
      `[amorçage] Aucune donnée d'exploitation, mais la référence est complète ` +
        `(${pays} pays, ${liaisons} liaisons, ${categories} catégories, tarification renseignée). ` +
        'Base prête, pas base neuve : aucune écriture.',
    )
  } else {
    console.log(
      `[amorçage] Référence incomplète (${pays} pays, ${liaisons} liaisons, ` +
        `${categories} catégories, ${parametres} ligne(s) de tarification) et aucune donnée ` +
        "d'exploitation : chargement des données de référence…",
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
