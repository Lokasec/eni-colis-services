import { defineConfig, env } from 'prisma/config'

// Le CLI Prisma ne charge plus `.env` automatiquement en version 7.
// `loadEnvFile` est natif à Node : aucune dépendance supplémentaire.
try {
  process.loadEnvFile('.env')
} catch {
  // Pas de .env local (CI, production) : les variables viennent de l'environnement.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
})
