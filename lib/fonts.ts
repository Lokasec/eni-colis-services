import { Montserrat } from 'next/font/google'

/**
 * Montserrat auto-hébergée par next/font : les fichiers sont téléchargés au
 * build et servis depuis notre domaine. Aucun appel à Google au runtime,
 * et le fallback ajusté (`size-adjust`) supprime le décalage de mise en page.
 *
 * Graisses utilisées — voir design/tokens.json §font.family :
 *   800 display / H1 / H2 · 700 H3 / nav · 600 sur-titres / boutons · 500 / 400 corps
 */
export const montserrat = Montserrat({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
  fallback: ['Arial', 'Helvetica', 'sans-serif'],
})
