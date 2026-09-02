import { site } from '@/lib/site'

/**
 * Données structurées schema.org.
 *
 * Deux règles tenues ici :
 *
 *  1. **Rien qui ne soit vrai.** Pas d'horaires inventés, pas de note
 *     moyenne, pas d'avis. Google sanctionne le balisage qui ne
 *     correspond pas au contenu visible, et la cliente n'a pas encore
 *     communiqué ses horaires — ils sont donc absents, pas approximés.
 *  2. **Aucun prix dans `Organization` ni `LocalBusiness`.** Les tarifs
 *     appartiennent aux fiches destination, qui les lisent en base.
 */

const adressePostale = {
  '@type': 'PostalAddress',
  streetAddress: site.adresse.rue,
  postalCode: site.adresse.codePostal,
  addressLocality: site.adresse.ville,
  addressCountry: 'FR',
} as const

/**
 * Identité de l'entreprise + établissement de Rouen.
 *
 * `LocalBusiness` porte l'adresse et le téléphone : c'est ce qui alimente
 * la fiche de connaissance et les résultats locaux. Le magasin d'Abidjan
 * n'y figure pas — un second `LocalBusiness` demanderait une adresse
 * complète et des coordonnées que nous n'avons pas.
 */
export function DonneesOrganisation() {
  const donnees = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${site.url}/#organisation`,
        name: site.name,
        url: site.url,
        logo: `${site.url}/brand/logo-horizontal_couleur.svg`,
        description: site.baseline,
        telephone: site.telephone,
        address: adressePostale,
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${site.url}/#bureau-rouen`,
        name: `${site.name} — bureau de Rouen`,
        parentOrganization: { '@id': `${site.url}/#organisation` },
        url: site.url,
        telephone: site.telephone,
        address: adressePostale,
        // Horaires volontairement absents : non communiqués par la
        // cliente. Un horaire faux fait déplacer quelqu'un pour rien.
        currenciesAccepted: 'EUR',
        areaServed: [
          "Côte d'Ivoire",
          'Bénin',
          'Guinée',
          'Mali',
          'Sénégal',
          'Congo-Brazzaville',
          'RD Congo',
          'États-Unis',
        ],
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(donnees) }}
    />
  )
}

/**
 * Service d'expédition vers une destination.
 *
 * Le prix vient de la base, jamais d'une constante : c'est la même valeur
 * que celle affichée sur la page. Un balisage qui annoncerait un prix
 * différent de la page serait sanctionné, et surtout mensonger.
 */
export function DonneesService({
  destination,
  pays,
  prixParKg,
  slug,
}: {
  destination: string
  pays: string
  prixParKg: number
  slug: string
}) {
  const donnees = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Expédition de colis',
    name: `Envoi de colis vers ${destination}`,
    description: `Expédition de colis de la France vers ${destination}, ${pays}. Départs hebdomadaires, retrait sur place.`,
    provider: { '@id': `${site.url}/#organisation` },
    areaServed: { '@type': 'Country', name: pays },
    url: `${site.url}/destinations/${slug}`,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: prixParKg,
      // L'unité est essentielle : sans elle, Google lit « 15 € le colis ».
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: prixParKg,
        priceCurrency: 'EUR',
        unitCode: 'KGM',
        unitText: 'kilogramme',
      },
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(donnees) }}
    />
  )
}
