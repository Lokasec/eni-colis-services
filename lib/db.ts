import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/lib/generated/prisma/client'
import { renseignee } from '@/lib/env'

/**
 * Client Prisma unique.
 *
 * PostgreSQL en développement comme en production : les migrations Prisma
 * sont propres à un moteur, et tester sur autre chose que ce qui tourne en
 * production est un risque qu'on ne prend pas sur un module de facturation.
 *
 * Production : Neon, RÉGION EUROPE (contrainte RGPD — voir DEPLOIEMENT.md).
 *
 * Le singleton évite l'épuisement du pool de connexions lors des
 * rechargements à chaud de Next.js.
 */
const createPrismaClient = () => {
  const connectionString = renseignee(process.env.DATABASE_URL)
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL est absent. Copiez .env.example en .env et renseignez la chaîne de connexion PostgreSQL.',
    )
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
