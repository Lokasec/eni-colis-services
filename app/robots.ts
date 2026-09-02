import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/**
 * robots.txt.
 *
 * Le site n'est pas encore ouvert : l'indexation reste bloquée jusqu'à la
 * recette du lot 10. Le back-office, le styleguide et la page de suivi
 * resteront exclus même après ouverture — le suivi contient des données de
 * colis et n'a aucune raison d'être exploré.
 */
export default function robots(): MetadataRoute.Robots {
  const ouvertAuPublic = process.env.NEXT_PUBLIC_INDEXATION === 'active'

  return {
    rules: ouvertAuPublic
      ? { userAgent: '*', allow: '/', disallow: ['/admin', '/styleguide', '/suivi'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: `${base}/sitemap.xml`,
  }
}
