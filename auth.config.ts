import type { NextAuthConfig } from 'next-auth'

/**
 * Configuration d'authentification COMPATIBLE EDGE.
 *
 * Le middleware s'exécute sur le runtime Edge, où Prisma ne peut pas
 * tourner. Ce fichier ne contient donc aucun accès à la base : seulement
 * les pages, la stratégie de session et les rappels qui manipulent le
 * jeton. La vérification des identifiants vit dans auth.ts, côté Node.
 *
 * La session est un JWT : le rôle y voyage, ce qui permet au middleware de
 * décider sans interroger la base à chaque requête.
 */
export const authConfig = {
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: { strategy: 'jwt', maxAge: 12 * 60 * 60 },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role
        token.nom = (user as { nom?: string }).nom
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ''
        session.user.role = (token.role as 'ADMIN' | 'OPERATEUR') ?? 'OPERATEUR'
        session.user.name = (token.nom as string) ?? session.user.name
      }
      return session
    },
  },
} satisfies NextAuthConfig
