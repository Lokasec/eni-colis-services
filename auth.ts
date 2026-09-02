import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'
import { db } from './lib/db'
import { verifier } from './lib/mot-de-passe'

/**
 * Authentification du back-office — Auth.js, fournisseur « identifiants ».
 *
 * Deux précautions dans `authorize` :
 *
 *  - un compte inconnu et un mot de passe erroné donnent la MÊME réponse,
 *    et prennent le même temps. Sans cela, un attaquant distingue les
 *    adresses connues des inconnues au chronomètre.
 *  - un compte désactivé est refusé comme un compte inexistant.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Adresse e-mail', type: 'email' },
        motDePasse: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(identifiants) {
        const email = String(identifiants?.email ?? '')
          .trim()
          .toLowerCase()
        const motDePasse = String(identifiants?.motDePasse ?? '')
        if (!email || !motDePasse) return null

        const utilisateur = await db.utilisateur.findUnique({
          where: { email },
          select: { id: true, email: true, nom: true, role: true, motDePasse: true, actif: true },
        })

        // Empreinte factice : on hache quand même quand le compte n'existe
        // pas, pour que la réponse prenne le même temps.
        const empreinte =
          utilisateur?.motDePasse ??
          'scrypt$16384$8$1$00000000000000000000000000000000$' + '0'.repeat(128)

        const correspond = await verifier(motDePasse, empreinte)
        if (!utilisateur || !utilisateur.actif || !correspond) return null

        await db.utilisateur.update({
          where: { id: utilisateur.id },
          data: { derniereConnexion: new Date() },
        })

        return {
          id: utilisateur.id,
          email: utilisateur.email,
          name: utilisateur.nom,
          nom: utilisateur.nom,
          role: utilisateur.role,
        }
      },
    }),
  ],
})
