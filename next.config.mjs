import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const enDeveloppement = process.env.NODE_ENV !== 'production'

/**
 * Politique de sécurité du contenu.
 *
 * HONNÊTETÉ SUR SA PORTÉE : `script-src` contient `'unsafe-inline'`, parce
 * que Next injecte ses propres scripts d'amorçage en ligne et que les
 * données structurées JSON-LD sont écrites dans la page. Une CSP qui
 * autorise l'inline ne bloque donc PAS une injection de script. Ce n'est
 * pas la protection principale — la validation Zod côté serveur et
 * l'échappement de React le sont.
 *
 * Ce qu'elle bloque réellement, et qui vaut la peine :
 *
 *  - `connect-src 'self'` — un script injecté ne peut PAS exfiltrer de
 *    données vers un domaine tiers. C'est la protection la plus utile ici,
 *    l'application manipulant des coordonnées et des montants.
 *  - `base-uri 'self'` — empêche le détournement de toutes les URL
 *    relatives de la page par une balise `<base>` injectée.
 *  - `form-action 'self'` — un formulaire ne peut pas être redirigé vers
 *    un serveur étranger.
 *  - `frame-ancestors 'none'` — pas de mise en cadre, donc pas de
 *    détournement de clic sur le back-office.
 *  - `object-src 'none'` — plus aucun greffon.
 *
 * `img-src` accepte `data:` et `blob:` : les photos de devis sont
 * compressées dans le navigateur et prévisualisées en blob avant envoi.
 */
const csp = [
  "default-src 'self'",
  // 'unsafe-eval' seulement en développement : le rechargement à chaud en
  // a besoin. Il n'a rien à faire en production.
  `script-src 'self' 'unsafe-inline'${enDeveloppement ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  // UNIQUEMENT en production. Cette directive réécrit toute requête http://
  // en https:// — y compris vers localhost, que le serveur de développement
  // ne sait pas servir. Constaté en recette : les appels fetch du
  // back-office tombaient en ERR_SSL_PROTOCOL_ERROR, sans rapport visible
  // avec la CSP. En production, tout passe déjà par HTTPS et la directive
  // ferme la porte à une ressource oubliée en clair.
  ...(enDeveloppement ? [] : ['upgrade-insecure-requests']),
].join('; ')

/**
 * En-têtes de sécurité (CLAUDE.md §13).
 *
 * `Permissions-Policy` autorise la caméra sur notre propre origine : le
 * formulaire de devis utilise `capture="environment"` pour photographier
 * un colis depuis un téléphone. La couper casserait la fonction la plus
 * utilisée du site.
 */
const enTetesSecurite = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Les photos sont servies depuis /public. Formats modernes automatiques.
    formats: ['image/webp'],
  },
  eslint: {
    dirs: ['app', 'components', 'lib', 'i18n', 'scripts'],
  },
  async headers() {
    return [{ source: '/:chemin*', headers: enTetesSecurite }]
  },
}

export default withNextIntl(nextConfig)
