import type { DefaultSession } from 'next-auth'

/** Le rôle voyage dans la session et dans le jeton. */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'ADMIN' | 'OPERATEUR'
    } & DefaultSession['user']
  }

  interface User {
    role?: 'ADMIN' | 'OPERATEUR'
    nom?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'ADMIN' | 'OPERATEUR'
    nom?: string
  }
}
