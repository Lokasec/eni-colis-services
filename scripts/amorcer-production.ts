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

// Sur Vercel, les variables sont déjà dans l'environnement. En local, il
// faut lire `.env` — sans quoi ce script ne serait testable qu'en
// production, c'est-à-dire jamais avant qu'il soit trop tard.
try {
  process.loadEnvFile('.env')
} catch {
  /* pas de .env : on prend l'environnement tel quel */
}

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

if (!connectionString) {
  console.error('[amorçage] DATABASE_URL absent — impossible de vérifier la base.')
  process.exit(1)
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

try {
  const [pays, colis, documents] = await Promise.all([
    db.pays.count(),
    db.colis.count(),
    db.document.count(),
  ])

  if (pays > 0) {
    console.log(
      `[amorçage] Base déjà peuplée — ${pays} pays, ${colis} colis, ${documents} documents. ` +
        'Aucune écriture.',
    )
  } else {
    console.log('[amorçage] Base vide : chargement des données de référence…')
    execSync('npx prisma db seed', { stdio: 'inherit' })
    console.log('[amorçage] Terminé.')
  }
} catch (erreur) {
  // Un échec d'amorçage ne doit PAS faire échouer le déploiement : le code
  // déployé est bon, c'est la donnée qui manque. Mieux vaut un site en
  // ligne avec une base vide, et le message ci-dessous dans les journaux,
  // qu'un déploiement bloqué.
  console.error('[amorçage] Échec — la base restera en l’état :', erreur)
}

await db.$disconnect()
