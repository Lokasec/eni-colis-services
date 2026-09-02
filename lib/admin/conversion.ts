import { db } from '@/lib/db'
import { prochainNumero, TRANSACTION } from '@/lib/numerotation'

/**
 * Conversion d'un devis accepté en colis.
 *
 * Le cœur de l'opération vit ICI, et non dans la Server Action, pour une
 * raison pratique : une Server Action ne s'exécute que dans une requête
 * Next.js, donc elle ne se vérifie qu'à travers un navigateur. Ce module
 * s'appelle depuis un script, contre la vraie base.
 *
 * L'action garde ce qu'elle seule peut faire : le contrôle de session,
 * l'e-mail au client et l'invalidation des caches.
 */

export type ResultatConversion =
  | { statut: 'CREE'; codeSuivi: string; reacheminement: boolean }
  | { statut: 'DEJA_CONVERTIE'; codeSuivi: string }
  | { statut: 'REFUS'; motif: string }

export type DemandeAConvertir = {
  reference: string
  nom: string
  email: string
  villeArrivee: string
  modeRemise: 'DEPOT' | 'EXPEDITION'
}

/**
 * Crée le colis correspondant à une demande acceptée.
 *
 * Trois décisions y sont prises, qui ne se voient pas à l'écran :
 *
 *  1. Le code de suivi sort de la MÊME séquence transactionnelle que les
 *     autres numéros. Deux conversions simultanées ne peuvent pas produire
 *     le même code : l'incrément pose un verrou de ligne.
 *  2. `necessiteReacheminement` se déduit de la ville d'arrivée. Cotonou,
 *     Conakry, Bamako, Dakar et Thiès passent par Abidjan. C'est INTERNE :
 *     le client verra `EN_TRANSIT`, jamais l'escale (CLAUDE.md §4.1).
 *  3. Le devis émis est rattaché au colis. Sans ce lien, la facture
 *     ultérieure ne se rapprocherait pas de son estimation et le module
 *     Créances perdrait la trace du document d'origine.
 *
 * Idempotent à l'usage : une demande déjà convertie renvoie son colis au
 * lieu d'en créer un second.
 */
export async function convertirDemandeEnColis(
  demandeId: string,
  auteurId: string,
): Promise<ResultatConversion & { demande?: DemandeAConvertir }> {
  const demande = await db.demandeDevis.findUnique({
    where: { id: demandeId },
    select: {
      id: true,
      reference: true,
      statut: true,
      nom: true,
      email: true,
      telephone: true,
      paysArrivee: true,
      villeArrivee: true,
      modeRemise: true,
      categorieId: true,
      poidsEstime: true,
      dimensions: true,
      valeurAchat: true,
      description: true,
      colis: { select: { codeSuivi: true } },
      documents: {
        where: { type: 'DEVIS' },
        select: { id: true, numero: true },
        orderBy: { dateEmission: 'desc' },
        take: 1,
      },
    },
  })
  if (!demande) return { statut: 'REFUS', motif: 'Cette demande n’existe plus.' }

  const resume: DemandeAConvertir = {
    reference: demande.reference,
    nom: demande.nom,
    email: demande.email,
    villeArrivee: demande.villeArrivee,
    modeRemise: demande.modeRemise,
  }

  const dejaConverti = demande.colis[0]
  if (dejaConverti) {
    return { statut: 'DEJA_CONVERTIE', codeSuivi: dejaConverti.codeSuivi, demande: resume }
  }
  if (demande.statut !== 'ACCEPTEE') {
    return {
      statut: 'REFUS',
      motif: 'Marquez d’abord le devis accepté par le client.',
      demande: resume,
    }
  }

  // La ville d'arrivée est enregistrée par son NOM, validé à la soumission
  // contre une liaison réellement publiée. On la retrouve pour obtenir sa
  // clé, son point de retrait et — surtout — son éventuelle escale.
  const ville = await db.ville.findFirst({
    where: {
      nom: demande.villeArrivee,
      actif: true,
      pays: { nom: demande.paysArrivee, actif: true },
    },
    select: {
      id: true,
      villeTransitId: true,
      pointsRetrait: { where: { actif: true }, select: { id: true }, take: 1 },
    },
  })
  if (!ville) {
    return {
      statut: 'REFUS',
      motif: `« ${demande.villeArrivee} » n’est plus une destination active. Rouvrez-la dans Destinations avant de convertir.`,
      demande: resume,
    }
  }

  const devis = demande.documents[0] ?? null
  const reacheminement = ville.villeTransitId !== null

  const codeSuivi = await db.$transaction(async (tx) => {
    const code = await prochainNumero(tx, 'COLIS')

    const colis = await tx.colis.create({
      data: {
        codeSuivi: code,
        demandeDevisId: demande.id,
        // Mode B : le client dépose. Mode C : il expédie. Dans les deux
        // cas le paiement se fait au départ (CLAUDE.md §1.1).
        modeReception: demande.modeRemise === 'DEPOT' ? 'DEPOT' : 'EXPEDITION',
        momentPaiement: 'DEPART',
        destinataireNom: demande.nom,
        destinataireTelephone: demande.telephone,
        destinataireEmail: demande.email,
        villeArriveeId: ville.id,
        pointRetraitId: ville.pointsRetrait[0]?.id ?? null,
        necessiteReacheminement: reacheminement,
        categorieId: demande.categorieId,
        poidsEstime: demande.poidsEstime,
        dimensions: demande.dimensions,
        valeurDeclaree: demande.valeurAchat,
        contenu: demande.description,
        statut: 'DEVIS_ACCEPTE',
        statutPaiement: 'A_PAYER_DEPART',
      },
      select: { id: true, codeSuivi: true },
    })

    if (devis) {
      await tx.document.update({ where: { id: devis.id }, data: { colisId: colis.id } })
    }

    await tx.historiqueStatut.create({
      data: {
        colisId: colis.id,
        statut: 'DEVIS_ACCEPTE',
        auteurId,
        commentaire: devis
          ? `Converti depuis ${demande.reference} · devis ${devis.numero}`
          : `Converti depuis ${demande.reference}`,
      },
    })

    await tx.demandeDevis.update({ where: { id: demande.id }, data: { statut: 'CONVERTIE' } })

    return colis.codeSuivi
  }, TRANSACTION)

  return { statut: 'CREE', codeSuivi, reacheminement, demande: resume }
}
