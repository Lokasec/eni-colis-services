import type { MetadataRoute } from 'next'

import { renseignee } from '@/lib/env'
import { site } from '@/lib/site'

const base = site.url

/**
 * robots.txt.
 *
 * Le site n'est pas encore ouvert : l'indexation reste bloquée jusqu'à la
 * recette du lot 10. Le back-office, le styleguide et la page de suivi
 * resteront exclus même après ouverture — le suivi contient des données de
 * colis et n'a aucune raison d'être exploré.
 */
export default function robots(): MetadataRoute.Robots {
  const ouvertAuPublic = renseignee(process.env.NEXT_PUBLIC_INDEXATION) === 'active'

  return {
    rules: ouvertAuPublic
      ? { userAgent: '*', allow: '/', disallow: ['/admin', '/styleguide', '/suivi'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: `${base}/sitemap.xml`,
  }
}
