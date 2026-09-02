import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from './auth.config'

/**
 * Middleware de protection du back-office.
 *
 * Il ferme la porte d'entrée : sans session, toute URL sous /admin renvoie
 * vers la page de connexion, en mémorisant la destination demandée.
 *
 * ⚠️ Ce n'est PAS la protection des rôles. Le middleware bloque
 * l'anonyme ; c'est `exigerAdmin()` dans chaque page et chaque action
 * serveur qui décide de ce qu'un OPERATEUR a le droit de faire
 * (CLAUDE.md §9). Un contrôle unique ici serait contournable par une
 * Server Action appelée directement.
 */
const { auth } = NextAuth(authConfig)

export default auth((requete) => {
  const { pathname } = requete.nextUrl
  const estAdmin = pathname.startsWith('/admin')
  const estConnexion = pathname === '/admin/login'

  if (!estAdmin) return NextResponse.next()

  // Déjà connecté : la page de connexion n'a plus lieu d'être.
  if (estConnexion) {
    if (requete.auth) return NextResponse.redirect(new URL('/admin', requete.nextUrl))
    return NextResponse.next()
  }

  if (!requete.auth) {
    const connexion = new URL('/admin/login', requete.nextUrl)
    connexion.searchParams.set('suite', pathname)
    return NextResponse.redirect(connexion)
  }

  return NextResponse.next()
})

export const config = {
  // On évite les fichiers statiques et les routes d'authentification.
  matcher: ['/admin/:path*'],
}
