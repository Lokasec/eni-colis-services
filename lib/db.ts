import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@/lib/generated/prisma/client'

/**
 * Client Prisma unique.
 *
 * Prisma 7 exige un adaptateur de pilote. En développement, SQLite ;
 * en production, l'adaptateur PostgreSQL sera branché ici au moment
 * du déploiement (Neon, région Europe — voir DEPLOIEMENT.md §3).
 *
 * Le singleton évite l'épuisement du pool de connexions lors des
 * rechargements à chaud de Next.js.
 */
const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
    }),
  })

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
