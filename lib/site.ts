/**
 * Constantes d'identité et de navigation.
 *
 * Les coordonnées viennent du CDC §1. La navigation reproduit celle de
 * docs/maquette/ (qui fait foi pour la mise en page) : « Recevoir mes
 * achats » y figure, car le mode A est le service que la cliente met
 * en avant.
 *
 * Les listes de destinations affichées publiquement seront lues en base
 * au lot 5 ; celles qui figurent ici ne servent qu'au pied de page et au
 * styleguide.
 */

export const site = {
  name: 'ENI Colis Services',
  /**
   * Adresse canonique du site. Elle sert aux métadonnées, au plan du site
   * ET aux liens de suivi glissés dans les e-mails : un lien vers
   * `localhost` dans un e-mail parti en production serait invisible ici et
   * inutilisable pour le destinataire. Une seule source, donc.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  baseline: "Envoi de colis entre la France, l'Afrique et New York.",
  adresse: {
    rue: '67 rue Saint-Julien',
    codePostal: '76100',
    ville: 'Rouen',
    pays: 'France',
  },
  telephone: '+33 6 52 70 70 14',
  // Format international sans « + » ni espace, pour les liens wa.me
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? '33652707014',
  concepteur: { nom: 'di-eureka', url: 'https://www.di-eureka.com' },
} as const

/** Message pré-rempli du bouton WhatsApp — docs/contenus-pages.md §10 */
export const whatsappMessage = 'Bonjour, je souhaite des informations sur un envoi.'

/**
 * URL publique de suivi d'un colis.
 *
 * C'est elle qu'encode le QR code du reçu de dépôt. Elle est ici, et
 * testée, pour une raison précise : un QR imprimé ne se corrige pas. S'il
 * pointait vers `localhost` — le repli de `site.url` quand
 * NEXT_PUBLIC_SITE_URL manque — le défaut ne se verrait qu'une fois les
 * reçus entre les mains des clients.
 */
export function urlSuivi(codeSuivi: string): string {
  return `${site.url}/suivi?code=${encodeURIComponent(codeSuivi)}`
}

export function whatsappLink(message: string = whatsappMessage): string {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`
}

export type NavLink = { href: string; label: string }

export const navPrincipale: NavLink[] = [
  { href: '/destinations', label: 'Destinations' },
  { href: '/recevoir', label: 'Recevoir mes achats' },
  { href: '/services', label: 'Services' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/departs', label: 'Départs' },
  { href: '/suivi', label: 'Suivi' },
  { href: '/contact', label: 'Contact' },
]

export const navInformations: NavLink[] = [
  { href: '/recevoir', label: 'Recevoir mes achats' },
  { href: '/services', label: 'Nos services' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/departs', label: 'Prochains départs' },
  { href: '/suivi', label: 'Suivre un colis' },
  { href: '/faq', label: 'FAQ' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/contact', label: 'Contact' },
]

export const navLegal: NavLink[] = [
  { href: '/legal/mentions', label: 'Mentions légales' },
  { href: '/legal/confidentialite', label: 'Confidentialité' },
  { href: '/legal/cgs', label: 'Conditions générales' },
  { href: '/legal/cookies', label: 'Cookies' },
]
