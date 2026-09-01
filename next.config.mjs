import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

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
}

export default withNextIntl(nextConfig)
