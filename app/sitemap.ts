import type { MetadataRoute } from 'next'
import { destinationsPubliques } from '@/lib/donnees-publiques'
import { site } from '@/lib/site'

const base = site.url

/**
 * Plan du site.
 *
 * Les fiches destination sont dérivées des liaisons PUBLIÉES : la liaison
 * France ↔ USA, non publiée, ne peut donc pas s'y glisser. Les pages
 * légales en sont exclues tant qu'elles ne sont pas rédigées.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: Array<{ url: string; priorite: number; frequence: 'daily' | 'weekly' | 'monthly' }> =
    [
      { url: '/', priorite: 1, frequence: 'weekly' },
      { url: '/destinations', priorite: 0.9, frequence: 'weekly' },
      { url: '/tarifs', priorite: 0.9, frequence: 'weekly' },
      { url: '/devis', priorite: 0.9, frequence: 'monthly' },
      { url: '/recevoir', priorite: 0.8, frequence: 'monthly' },
      { url: '/inscription', priorite: 0.8, frequence: 'monthly' },
      { url: '/services', priorite: 0.7, frequence: 'monthly' },
      { url: '/departs', priorite: 0.7, frequence: 'daily' },
      { url: '/suivi', priorite: 0.6, frequence: 'monthly' },
      { url: '/faq', priorite: 0.6, frequence: 'monthly' },
      { url: '/a-propos', priorite: 0.5, frequence: 'monthly' },
      { url: '/contact', priorite: 0.5, frequence: 'monthly' },
    ]

  const destinations = await destinationsPubliques()
  const maintenant = new Date()

  return [
    ...pages.map((page) => ({
      url: `${base}${page.url}`,
      lastModified: maintenant,
      changeFrequency: page.frequence,
      priority: page.priorite,
    })),
    ...destinations.map((destination) => ({
      url: `${base}/destinations/${destination.slug}`,
      lastModified: maintenant,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
