import { getRequestConfig } from 'next-intl/server'

/**
 * next-intl sans routage de locale : les URL publiques restent celles du CDC
 * (/devis, /destinations…), sans préfixe de langue.
 *
 * Le français est la seule locale active. L'anglais est prévu en phase 2 :
 * il suffira d'ajouter messages/en.json et de basculer sur le routage
 * `next-intl/routing`, sans toucher aux composants.
 */
export const defaultLocale = 'fr' as const
export const locales = ['fr'] as const
export type Locale = (typeof locales)[number]

export default getRequestConfig(async () => {
  const locale: Locale = defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Europe/Paris',
    now: new Date(),
  }
})
