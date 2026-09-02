import { utilisateurCourant } from '@/lib/autorisation'
import { rendreDevis, rendreFacture } from '@/lib/pdf/rendu'

/**
 * PDF d'un devis ou d'une facture.
 *
 * Le contrôle de rôle est refait ICI. Une route est une porte comme une
 * autre : le middleware protège la navigation, mais l'URL d'un PDF se
 * partage, se met en favori et se retrouve dans un historique. Un
 * OPERATEUR n'a pas accès aux factures (CLAUDE.md §9), et ce n'est pas le
 * masquage d'un bouton qui l'en empêche.
 *
 * `no-store` est délibéré : un document réémis ne doit jamais être servi
 * depuis un cache intermédiaire.
 */
export async function GET(_requete: Request, contexte: { params: Promise<{ numero: string }> }) {
  const utilisateur = await utilisateurCourant()
  if (!utilisateur) return new Response('Non authentifié.', { status: 401 })

  const { numero: brut } = await contexte.params
  const numero = decodeURIComponent(brut).toUpperCase()

  const estFacture = numero.startsWith('FAC-')
  const estDevis = numero.startsWith('DEV-')
  if (!estFacture && !estDevis) {
    return new Response('Numéro de document inconnu.', { status: 400 })
  }

  if (estFacture && utilisateur.role !== 'ADMIN') {
    return new Response('Les factures sont réservées aux administrateurs.', { status: 403 })
  }

  const pdf = estFacture ? await rendreFacture(numero) : await rendreDevis(numero)
  if (!pdf) return new Response('Document introuvable.', { status: 404 })

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      // `inline` : la cliente veut relire le document avant de l'envoyer,
      // pas le télécharger à chaque coup d'œil.
      'Content-Disposition': `inline; filename="${numero}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
