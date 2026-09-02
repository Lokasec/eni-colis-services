import { utilisateurCourant } from '@/lib/autorisation'
import { rendreRecu } from '@/lib/pdf/rendu'

/**
 * Reçu de dépôt d'un colis, en PDF.
 *
 * Accessible à un OPERATEUR : c'est lui qui reçoit les colis au comptoir
 * et remet le reçu au client. Contrairement à la facture, ce document ne
 * porte aucun montant tant que le colis n'est pas réglé.
 */
export async function GET(_requete: Request, contexte: { params: Promise<{ code: string }> }) {
  const utilisateur = await utilisateurCourant()
  if (!utilisateur) return new Response('Non authentifié.', { status: 401 })

  const { code: brut } = await contexte.params
  const code = decodeURIComponent(brut).toUpperCase()

  let pdf: Buffer | null
  try {
    pdf = await rendreRecu(code)
  } catch (erreur) {
    // Le seul échec attendu ici est le garde-fou sur l'URL de suivi. Son
    // message est destiné à l'exploitante : il dit quoi corriger.
    console.error('[recu] génération impossible :', erreur)
    const motif = erreur instanceof Error ? erreur.message : 'Erreur inconnue.'
    return new Response(motif, { status: 503 })
  }
  if (!pdf) return new Response('Colis introuvable.', { status: 404 })

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="recu-${code}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
