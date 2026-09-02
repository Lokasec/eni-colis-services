import { utilisateurCourant } from '@/lib/autorisation'
import { db } from '@/lib/db'

/**
 * Export comptable des factures, au format CSV.
 *
 * Le contrôle de rôle est refait ICI : une route est une porte comme une
 * autre, et l'export est explicitement réservé aux administrateurs
 * (CLAUDE.md §9). Renvoyer 403 plutôt que rediriger : c'est un
 * téléchargement, pas une page.
 *
 * Séparateur point-virgule et BOM UTF-8 : c'est ce qu'attend un tableur
 * en configuration française, sans quoi les accents et les colonnes
 * s'affichent de travers.
 */
export async function GET() {
  const utilisateur = await utilisateurCourant()
  if (!utilisateur) return new Response('Non authentifié.', { status: 401 })
  if (utilisateur.role !== 'ADMIN') {
    return new Response('Export réservé aux administrateurs.', { status: 403 })
  }

  const factures = await db.document.findMany({
    where: { type: 'FACTURE' },
    select: {
      numero: true,
      dateEmission: true,
      dateReglement: true,
      montantEur: true,
      devise: true,
      tauxApplique: true,
      montantDevise: true,
      mentionFiscale: true,
      detail: true,
      colis: { select: { codeSuivi: true, destinataireNom: true } },
      encaissements: {
        select: { montant: true, devise: true, lieu: true, dateEncaissement: true },
      },
    },
    orderBy: { numero: 'asc' },
  })

  const jour = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : '')
  const nombre = (valeur: unknown) =>
    valeur === null || valeur === undefined ? '' : String(valeur).replace('.', ',')

  const colonnes = [
    'Numero',
    'Date emission',
    'Code colis',
    'Destinataire',
    'Detail',
    'Montant EUR',
    'Devise',
    'Taux applique',
    'Montant devise',
    'Date reglement',
    'Encaisse',
    'Lieu encaissement',
    'Mention fiscale',
  ]

  const lignes = factures.map((f) => {
    const encaisse = f.encaissements.reduce((total, e) => total + Number(e.montant), 0)
    return [
      f.numero,
      jour(f.dateEmission),
      f.colis?.codeSuivi ?? '',
      f.colis?.destinataireNom ?? '',
      f.detail ?? '',
      nombre(f.montantEur),
      f.devise,
      nombre(f.tauxApplique),
      nombre(f.montantDevise),
      jour(f.dateReglement),
      encaisse > 0 ? nombre(encaisse.toFixed(2)) : '',
      f.encaissements[0]?.lieu ?? '',
      f.mentionFiscale,
    ]
  })

  const echapper = (valeur: string) =>
    /[";\n]/.test(valeur) ? `"${valeur.replace(/"/g, '""')}"` : valeur

  const csv =
    '﻿' +
    [colonnes, ...lignes]
      .map((ligne) => ligne.map((c) => echapper(String(c))).join(';'))
      .join('\r\n')

  const horodatage = new Date().toISOString().slice(0, 10)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="factures-eni-${horodatage}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
