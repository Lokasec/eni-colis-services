import { defineConfig, env } from 'prisma/config'

// Le CLI Prisma ne charge plus `.env` automatiquement en version 7.
// `loadEnvFile` est natif à Node : aucune dépendance supplémentaire.
try {
  process.loadEnvFile('.env')
} catch {
  // Pas de .env local (CI, production) : les variables viennent de l'environnement.
}

/**
 * URL utilisée par le CLI — migrations et seed.
 *
 * Neon expose DEUX chaînes : `DATABASE_URL` passe par pgbouncer,
 * `DATABASE_URL_UNPOOLED` attaque la base directement.
 *
 * Le pooling est le bon choix à l'exécution — des fonctions serverless
 * ouvrent et ferment des connexions sans arrêt. Mais **les migrations ne
 * passent pas par pgbouncer** : en mode transaction, il ne garantit pas
 * qu'une session reste la même d'une requête à l'autre, et Prisma s'appuie
 * sur des verrous consultatifs de session pour ne pas appliquer deux fois
 * la même migration. Une migration lancée à travers le pool échoue, ou
 * pire, s'applique à moitié.
 *
 * En local, la variable n'existe pas et on retombe sur `DATABASE_URL`.
 */
const urlCli = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: urlCli ?? env('DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
})
