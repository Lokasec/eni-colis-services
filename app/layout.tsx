import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { brandColors } from '@/design/tokens.generated'
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
  // Le site n'est pas encore ouvert : on n'indexe rien avant le lot 10.
  robots: { index: false, follow: false },
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
