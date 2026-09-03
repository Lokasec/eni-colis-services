import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { brandColors } from '@/design/tokens.generated'
import { renseignee } from '@/lib/env'
import { montserrat } from '@/lib/fonts'
import { site } from '@/lib/site'
import './globals.css'

const siteUrl = site.url

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ENI Colis Services',
    template: '%s — ENI Colis Services',
  },
  description:
    "Envoi de colis entre la France, l'Afrique subsaharienne et New York. Tarifs au kilo affichés, dépôt à Rouen, retrait à Abidjan.",
  applicationName: 'ENI Colis Services',
  manifest: '/brand/site.webmanifest',
  icons: {
    icon: [
      { url: '/brand/favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/brand/favicon.ico',
    apple: '/brand/apple-touch-icon-180x180.png',
  },
  /**
   * Indexation FERMÉE par défaut, ouverte par une seule variable.
   *
   * `NEXT_PUBLIC_INDEXATION=active` est l'interrupteur de mise en ligne —
   * la même que celle que lit robots.ts, pour qu'un `robots.txt` permissif
   * et des balises `noindex` ne puissent pas se contredire.
   *
   * Tant que les mentions légales et les CGS portent des `[À COMPLÉTER]`,
   * cette variable doit rester absente : un site indexé avec des pages
   * légales vides est pire qu'un site non indexé.
   */
  robots:
    renseignee(process.env.NEXT_PUBLIC_INDEXATION) === 'active'
      ? { index: true, follow: true }
      : { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: brandColors.navy,
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className={montserrat.variable}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
