'use server'

import { revalidatePath } from 'next/cache'
import { exigerAdminAction, exigerConnexionAction } from '@/lib/autorisation'
import { db } from '@/lib/db'
import { adresseInterne, envoyer } from '@/lib/email'
import { convertirDemandeEnColis } from '@/lib/admin/conversion'
import { convertirPourPays } from '@/lib/admin/facturation'
import { prochainNumero, TRANSACTION } from '@/lib/numerotation'
import { site, urlSuivi } from '@/lib/site'

export type Reponse =
  { ok: true; message: string; detail?: string } | { ok: false; message: string }

/** Mention fiscale obligatoire sur tout devis et toute facture. */
const MENTION_293B = 'TVA non applicable, art. 293 B du CGI'

/**
 * Chiffre une demande de devis et émet le document.
 *
 * Le montant proposé par le moteur est prérempli dans le formulaire ; ce
 * qui est enregistré ici est le montant SAISI par la cliente. Elle peut
 * l'ajuster librement — le moteur propose, il n'impose pas (CLAUDE.md §4.3).
 *
 * Chiffrer un devis n'est pas réservé aux administrateurs : un opérateur
 * peut le faire. Émettre une facture, si.
 */
export async function chiffrerDevis(
  _precedent: Reponse | null,
  donnees: FormData,
): Promise<Reponse> {
  const session = await exigerConnexionAction()
  if (!session.ok) return session

  const demandeId = String(donnees.get('demandeId') ?? '')
  const montant = Number(
    String(donnees.get('montantEur') ?? '')
      .replace(',', '.')
      .trim(),
  )
  const detail = String(donnees.get('detail') ?? '').trim()

  if (!demandeId) return { ok: false, message: 'Demande manquante.' }
  if (!Number.isFinite(montant) || montant <= 0) {
    return { ok: false, message: 'Indiquez un montant supérieur à zéro.' }
  }

  const demande = await db.demandeDevis.findUnique({
    where: { id: demandeId },
    select: {
      id: true,
      reference: true,
      nom: true,
      email: true,
      villeArrivee: true,
      paysArrivee: true,
    },
  })
  if (!demande) return { ok: false, message: 'Cette demande n’existe plus.' }

  const validite = new Date()
  validite.setDate(validite.getDate() + 7) // validité de sept jours

  let numero: string
  try {
    numero = await db.$transaction(async (tx) => {
      const reference = await prochainNumero(tx, 'DEVIS')
      await tx.document.create({
        data: {
          type: 'DEVIS',
          numero: reference,
          demandeDevisId: demande.id,
          montantEur: montant.toFixed(2),
          dateValidite: validite,
          detail: detail || null,
          mentionFiscale: MENTION_293B,
        },
      })
      await tx.demandeDevis.update({ where: { id: demande.id }, data: { statut: 'CHIFFREE' } })
      return reference
    }, TRANSACTION)
  } catch (erreur) {
    console.error('[devis] chiffrage impossible :', erreur)
    return { ok: false, message: 'L’enregistrement du devis a échoué.' }
  }

  revalidatePath('/admin/devis')
  revalidatePath('/admin')
  return { ok: true, message: `Devis ${numero} établi.`, detail: numero }
}

/** Envoie le devis au demandeur. */
export async function envoyerDevis(
  _precedent: Reponse | null,
  donnees: FormData,
): Promise<Reponse> {
  const session = await exigerConnexionAction()
  if (!session.ok) return session

  const documentId = String(donnees.get('documentId') ?? '')
  const document = await db.document.findUnique({
    where: { id: documentId },
    select: {
      numero: true,
      montantEur: true,
      dateValidite: true,
      mentionFiscale: true,
      detail: true,
      demandeDevis: { select: { id: true, nom: true, email: true, villeArrivee: true } },
    },
  })
  if (!document?.demandeDevis) return { ok: false, message: 'Devis introuvable.' }

  const montant = `${Number(document.montantEur).toFixed(2).replace('.', ',')} €`
  const echeance = document.dateValidite
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(
        document.dateValidite,
      )
    : 'sept jours'

  await envoyer({
    destinataire: document.demandeDevis.email,
    sujet: `Votre devis ${document.numero} — ${site.name}`,
    texte: `Bonjour ${document.demandeDevis.nom},

Voici le devis pour votre envoi vers ${document.demandeDevis.villeArrivee}.

Devis n° ${document.numero}
Montant : ${montant}
${document.detail ? `Détail : ${document.detail}\n` : ''}Valable jusqu'au ${echeance}.

${document.mentionFiscale}
Estimation sous réserve du poids constaté au dépôt.

Pour accepter ce devis, répondez à ce message ou écrivez-nous sur WhatsApp au ${site.telephone}.

${site.name}
${site.adresse.rue}, ${site.adresse.codePostal} ${site.adresse.ville}`,
  })

  await db.demandeDevis.update({
    where: { id: document.demandeDevis.id },
    data: { statut: 'ENVOYEE' },
  })

  revalidatePath('/admin/devis')
  return { ok: true, message: `Devis ${document.numero} envoyé à ${document.demandeDevis.email}.` }
}

/**
 * Émet une facture pour un colis.
 *
 * Deux points non négociables :
 *  - la numérotation est CONTINUE ET SANS TROU. Le compteur est incrémenté
 *    dans la même transaction que la création : deux émissions simultanées
 *    ne peuvent pas obtenir le même numéro, et un échec n'en consomme pas.
 *  - si la facture est émise À L'ARRIVÉE, le taux de change est FIGÉ ici et
 *    le montant en devise STOCKÉ. Il ne sera jamais recalculé, notamment
 *    pas à l'encaissement.
 *
 * Réservée aux administrateurs.
 */
export async function emettreFacture(
  _precedent: Reponse | null,
  donnees: FormData,
): Promise<Reponse> {
  const session = await exigerAdminAction()
  if (!session.ok) return session

  const colisId = String(donnees.get('colisId') ?? '')
  const montant = Number(
    String(donnees.get('montantEur') ?? '')
      .replace(',', '.')
      .trim(),
  )
  const detail = String(donnees.get('detail') ?? '').trim()
  const doubleDevise =
    donnees.get('doubleDevise') === 'on' || donnees.get('doubleDevise') === 'true'

  if (!colisId) return { ok: false, message: 'Colis manquant.' }
  if (!Number.isFinite(montant) || montant <= 0) {
    return { ok: false, message: 'Indiquez un montant supérieur à zéro.' }
  }

  const colis = await db.colis.findUnique({
    where: { id: colisId },
    select: {
      id: true,
      codeSuivi: true,
      momentPaiement: true,
      villeArrivee: { select: { pays: { select: { codeIso: true, nom: true, monnaie: true } } } },
    },
  })
  if (!colis) return { ok: false, message: 'Ce colis n’existe plus.' }

  // La double devise n'a de sens que sur une facture émise à l'arrivée.
  let devise: 'EUR' | 'XOF' | 'XAF' | 'GNF' | 'CDF' | 'USD' = 'EUR'
  let taux: string | null = null
  let montantDevise: string | null = null

  if (doubleDevise) {
    const conversion = await convertirPourPays(montant, colis.villeArrivee.pays.codeIso)
    if (conversion.statut === 'TAUX_MANQUANT') {
      return {
        ok: false,
        message: `${conversion.motif} Saisissez-le dans Tarifs avant d’émettre cette facture.`,
      }
    }
    if (conversion.statut === 'CONVERTI') {
      devise = conversion.devise
      taux = conversion.taux.toString()
      montantDevise = conversion.montant.toFixed(2)
    }
  }

  let numero: string
  try {
    numero = await db.$transaction(async (tx) => {
      const reference = await prochainNumero(tx, 'FACTURE')
      await tx.document.create({
        data: {
          type: 'FACTURE',
          numero: reference,
          colisId: colis.id,
          montantEur: montant.toFixed(2),
          devise,
          tauxApplique: taux,
          montantDevise,
          detail: detail || null,
          mentionFiscale: MENTION_293B,
        },
      })
      return reference
    }, TRANSACTION)
  } catch (erreur) {
    console.error('[facture] émission impossible :', erreur)
    return { ok: false, message: 'L’émission de la facture a échoué.' }
  }

  revalidatePath('/admin/factures')
  revalidatePath('/admin/creances')
  revalidatePath('/admin')
  return {
    ok: true,
    message: `Facture ${numero} émise${montantDevise ? ` — ${montant.toFixed(2)} € / ${montantDevise} ${devise}` : ''}.`,
    detail: numero,
  }
}

/**
 * Saisit un encaissement et solde la facture si le total est atteint.
 *
 * Le taux appliqué est RECOPIÉ du document, jamais recalculé : c'est ce qui
 * garantit qu'un client paie le montant qu'on lui a annoncé, même si la
 * parité a changé entre-temps.
 */
export async function saisirEncaissement(
  _precedent: Reponse | null,
  donnees: FormData,
): Promise<Reponse> {
  const session = await exigerAdminAction()
  if (!session.ok) return session

  const documentId = String(donnees.get('documentId') ?? '')
  const montant = Number(
    String(donnees.get('montant') ?? '')
      .replace(',', '.')
      .trim(),
  )
  const lieu = String(donnees.get('lieu') ?? 'FRANCE')
  const moyen = String(donnees.get('moyen') ?? 'ESPECES')
  const reference = String(donnees.get('reference') ?? '').trim() || null

  if (!documentId) return { ok: false, message: 'Facture manquante.' }
  if (!Number.isFinite(montant) || montant <= 0) {
    return { ok: false, message: 'Indiquez un montant supérieur à zéro.' }
  }

  const document = await db.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      numero: true,
      montantEur: true,
      devise: true,
      tauxApplique: true,
      montantDevise: true,
      colisId: true,
      encaissements: { select: { montant: true, devise: true } },
    },
  })
  if (!document) return { ok: false, message: 'Cette facture n’existe plus.' }

  // La facture est due dans sa devise d'émission : c'est elle qui sert de
  // référence pour savoir si le solde est atteint.
  const duTotal =
    document.devise === 'EUR'
      ? Number(document.montantEur)
      : Number(document.montantDevise ?? document.montantEur)

  const dejaRegle = document.encaissements.reduce((total, e) => total + Number(e.montant), 0)
  const apres = dejaRegle + montant

  try {
    await db.$transaction(async (tx) => {
      await tx.encaissement.create({
        data: {
          documentId: document.id,
          montant: montant.toFixed(2),
          devise: document.devise,
          // Recopié du document, jamais recalculé.
          tauxApplique: document.tauxApplique,
          lieu: lieu as never,
          moyen: moyen as never,
          operateurId: session.utilisateur.id,
          reference,
        },
      })

      const solde = apres + 0.005 >= duTotal
      await tx.document.update({
        where: { id: document.id },
        data: solde ? { dateReglement: new Date() } : {},
      })

      if (document.colisId) {
        await tx.colis.update({
          where: { id: document.colisId },
          data: { statutPaiement: solde ? 'PAYE' : 'PARTIELLEMENT_PAYE' },
        })
      }
    }, TRANSACTION)
  } catch (erreur) {
    console.error('[encaissement] saisie impossible :', erreur)
    return { ok: false, message: 'La saisie de l’encaissement a échoué.' }
  }

  revalidatePath('/admin/encaissements')
  revalidatePath('/admin/creances')
  revalidatePath('/admin/factures')
  revalidatePath('/admin')

  const reste = Math.max(0, duTotal - apres)
  return {
    ok: true,
    message:
      reste < 0.005
        ? `Encaissement enregistré. Facture ${document.numero} soldée.`
        : `Encaissement enregistré. Reste dû : ${reste.toFixed(2)} ${document.devise}.`,
  }
}

/** Met à jour le taux de change manuel d'un pays à devise flottante. */
export async function majTauxChange(
  _precedent: Reponse | null,
  donnees: FormData,
): Promise<Reponse> {
  const session = await exigerAdminAction()
  if (!session.ok) return session

  const paysId = String(donnees.get('paysId') ?? '')
  const taux = Number(
    String(donnees.get('tauxManuel') ?? '')
      .replace(',', '.')
      .trim(),
  )

  if (!paysId) return { ok: false, message: 'Pays manquant.' }
  if (!Number.isFinite(taux) || taux <= 0) {
    return { ok: false, message: 'Indiquez un taux supérieur à zéro.' }
  }

  const pays = await db.pays.findUnique({
    where: { id: paysId },
    select: { nom: true, tauxFixe: true },
  })
  if (!pays) return { ok: false, message: 'Ce pays n’existe plus.' }
  if (pays.tauxFixe) {
    return {
      ok: false,
      message: `${pays.nom} est en parité fixe : son taux ne se saisit pas à la main.`,
    }
  }

  await db.pays.update({
    where: { id: paysId },
    data: { tauxManuel: taux.toString(), tauxManuelMajLe: new Date() },
  })

  revalidatePath('/admin/tarifs')
  return {
    ok: true,
    message: `Taux mis à jour pour ${pays.nom}. Les documents déjà émis conservent leur taux figé.`,
  }
}

/** Envoie une relance sur une créance. */
export async function relancerCreance(
  _precedent: Reponse | null,
  donnees: FormData,
): Promise<Reponse> {
  const session = await exigerAdminAction()
  if (!session.ok) return session

  const documentId = String(donnees.get('documentId') ?? '')
  const document = await db.document.findUnique({
    where: { id: documentId },
    select: {
      numero: true,
      montantEur: true,
      devise: true,
      montantDevise: true,
      colis: {
        select: {
          id: true,
          codeSuivi: true,
          destinataireNom: true,
          client: { select: { email: true, prenom: true } },
          pointRetrait: { select: { nom: true, adresse: true } },
        },
      },
    },
  })
  if (!document?.colis) return { ok: false, message: 'Créance introuvable.' }

  const destinataire = document.colis.client?.email
  if (!destinataire) {
    return {
      ok: false,
      message: 'Ce colis n’est rattaché à aucun client : aucune adresse pour la relance.',
    }
  }

  const montant =
    document.devise === 'EUR'
      ? `${Number(document.montantEur).toFixed(2).replace('.', ',')} €`
      : `${Number(document.montantEur).toFixed(2).replace('.', ',')} € (${document.montantDevise} ${document.devise})`

  await envoyer({
    destinataire,
    sujet: `Votre colis ${document.colis.codeSuivi} vous attend — ${site.name}`,
    texte: `Bonjour ${document.colis.client?.prenom ?? ''},

Votre colis ${document.colis.codeSuivi} est disponible au retrait.

Montant à régler : ${montant}
Point de retrait : ${document.colis.pointRetrait?.adresse ?? document.colis.pointRetrait?.nom ?? 'nous contacter'}

Le colis est remis contre paiement. Munissez-vous d'une pièce d'identité et de votre code de suivi.

${site.name}
${site.telephone}`,
  })

  await db.colis.update({
    where: { id: document.colis.id },
    data: { statutPaiement: 'IMPAYE_RELANCE' },
  })

  revalidatePath('/admin/creances')
  return { ok: true, message: `Relance envoyée à ${destinataire}.` }
}

/** Alerte interne quand une demande de devis reste sans réponse. */
export async function signalerDevisEnRetard(reference: string, jours: number) {
  await envoyer({
    destinataire: adresseInterne,
    sujet: `[Relance interne] Devis ${reference} sans réponse depuis ${jours} jours`,
    texte: `La demande ${reference} attend un chiffrage depuis ${jours} jours.`,
  })
}

// ===========================================================================
// Réponse du client, puis conversion en colis
// ===========================================================================

/**
 * Enregistre la réponse du client à un devis envoyé.
 *
 * C'est une saisie manuelle : le client répond par téléphone, par WhatsApp
 * ou par e-mail. Il n'y a pas d'acceptation en ligne — ce serait un
 * engagement contractuel, hors périmètre de la phase 1.
 */
export async function statuerDevis(
  _precedent: Reponse | null,
  donnees: FormData,
): Promise<Reponse> {
  const session = await exigerConnexionAction()
  if (!session.ok) return session

  const demandeId = String(donnees.get('demandeId') ?? '')
  const reponse = String(donnees.get('reponse') ?? '')
  if (reponse !== 'ACCEPTEE' && reponse !== 'REFUSEE') {
    return { ok: false, message: 'Réponse inconnue.' }
  }

  const demande = await db.demandeDevis.findUnique({
    where: { id: demandeId },
    select: { statut: true, reference: true },
  })
  if (!demande) return { ok: false, message: 'Cette demande n’existe plus.' }
  if (demande.statut === 'CONVERTIE') {
    return { ok: false, message: 'Ce devis est déjà converti en colis.' }
  }

  await db.demandeDevis.update({ where: { id: demandeId }, data: { statut: reponse } })

  revalidatePath('/admin/devis')
  return {
    ok: true,
    message:
      reponse === 'ACCEPTEE'
        ? `Devis ${demande.reference} accepté. Vous pouvez créer le colis.`
        : `Devis ${demande.reference} marqué refusé.`,
  }
}

/**
 * Convertit un devis ACCEPTÉ en colis, avec son code de suivi.
 *
 * C'est le passage du commercial à l'exploitation, et il porte trois
 * décisions qui ne se voient pas :
 *
 *  1. Le code de suivi est tiré de la MÊME séquence transactionnelle que
 *     les autres numéros : deux conversions simultanées ne peuvent pas
 *     produire le même code.
 *  2. `necessiteReacheminement` est déduit de la ville d'arrivée. Cotonou,
 *     Conakry, Bamako, Dakar et Thiès passent par Abidjan. C'est INTERNE :
 *     le client verra `EN_TRANSIT`, jamais l'escale (CLAUDE.md §4.1).
 *  3. Le devis émis est rattaché au colis. Sans ce lien, la facture
 *     ultérieure ne pourrait pas être rapprochée de son estimation, et le
 *     module Créances perdrait la trace du document d'origine.
 *
 * L'opération est idempotente à l'usage : une demande déjà convertie
 * renvoie le colis existant au lieu d'en créer un second.
 */
export async function convertirEnColis(
  _precedent: Reponse | null,
  donnees: FormData,
): Promise<Reponse> {
  const session = await exigerConnexionAction()
  if (!session.ok) return session

  const demandeId = String(donnees.get('demandeId') ?? '')
  if (!demandeId) return { ok: false, message: 'Demande manquante.' }

  let resultat: Awaited<ReturnType<typeof convertirDemandeEnColis>>
  try {
    resultat = await convertirDemandeEnColis(demandeId, session.utilisateur.id)
  } catch (erreur) {
    console.error('[devis] conversion impossible :', erreur)
    return { ok: false, message: 'La conversion a échoué. Réessayez.' }
  }

  if (resultat.statut === 'REFUS') return { ok: false, message: resultat.motif }
  if (resultat.statut === 'DEJA_CONVERTIE') {
    return {
      ok: true,
      message: 'Cette demande est déjà convertie.',
      detail: `Colis ${resultat.codeSuivi}.`,
    }
  }

  const { codeSuivi } = resultat
  const demande = resultat.demande

  if (demande) {
    await envoyer({
      destinataire: demande.email,
      sujet: `Votre colis ${codeSuivi} — ${site.name}`,
      texte: [
        `Bonjour ${demande.nom},`,
        '',
        `Votre devis ${demande.reference} est accepté, et votre envoi vers ${demande.villeArrivee} est enregistré.`,
        '',
        `Code de suivi : ${codeSuivi}`,
        '',
        demande.modeRemise === 'EXPEDITION'
          ? `Collez le numéro ${demande.reference} de façon lisible sur le colis avant de l’expédier à notre bureau de Rouen.`
          : 'Présentez ce code lors du dépôt au bureau de Rouen.',
        '',
        site.name,
        site.telephone,
      ].join('\n'),
      action: { libelle: 'Suivre mon colis', url: urlSuivi(codeSuivi) },
    })
  }

  revalidatePath('/admin/devis')
  revalidatePath('/admin/colis')
  revalidatePath('/admin')
  return {
    ok: true,
    message: `Colis créé : ${codeSuivi}.`,
    detail: demande ? `Le code de suivi a été envoyé à ${demande.email}.` : undefined,
  }
}

/**
 * Devis estimatif sur un colis DÉJÀ REÇU — le mode A.
 *
 * C'est le chaînon qui manquait au parcours du service d'adresse
 * (CLAUDE.md §5.2) : « colis reçu et pesé → DEVIS → acheminement →
 * arrivée → facture ». Jusqu'ici un devis ne pouvait naître que d'une
 * demande en ligne ; un carton arrivé du marchand n'avait aucun moyen
 * d'être chiffré avant son départ.
 *
 * L'enjeu n'est pas cosmétique. Sur le mode A, ENI AVANCE le transport et
 * n'est payée qu'à l'arrivée. Le client doit connaître le montant avant
 * que le colis parte — sinon il découvre la somme au retrait, avec le
 * colis déjà à Abidjan et aucun moyen de refuser.
 *
 * Le devis est un ESTIMATIF : il ne consomme pas la séquence des factures
 * et ne vaut pas pièce comptable. Il porte quand même la mention 293 B,
 * comme l'exige le brief pour tout devis.
 */
export async function estimerColis(
  _precedent: Reponse | null,
  donnees: FormData,
): Promise<Reponse> {
  const session = await exigerConnexionAction()
  if (!session.ok) return session

  const colisId = String(donnees.get('colisId') ?? '')
  const montant = Number(
    String(donnees.get('montantEur') ?? '')
      .replace(',', '.')
      .trim(),
  )
  const detail = String(donnees.get('detail') ?? '').trim()

  if (!colisId) return { ok: false, message: 'Colis manquant.' }
  if (!Number.isFinite(montant) || montant <= 0) {
    return { ok: false, message: 'Indiquez un montant supérieur à zéro.' }
  }

  const colis = await db.colis.findUnique({
    where: { id: colisId },
    select: {
      id: true,
      codeSuivi: true,
      destinataireNom: true,
      destinataireEmail: true,
      villeArrivee: { select: { nom: true } },
      client: { select: { prenom: true, email: true } },
      documents: { where: { type: 'DEVIS' }, select: { numero: true } },
    },
  })
  if (!colis) return { ok: false, message: 'Ce colis n’existe plus.' }
  if (colis.documents.length > 0) {
    return {
      ok: false,
      message: `Ce colis a déjà un devis estimatif (${colis.documents[0]!.numero}).`,
    }
  }

  const validite = new Date()
  validite.setDate(validite.getDate() + 7)

  let numero: string
  try {
    numero = await db.$transaction(async (tx) => {
      const reference = await prochainNumero(tx, 'DEVIS')
      await tx.document.create({
        data: {
          type: 'DEVIS',
          numero: reference,
          colisId: colis.id,
          montantEur: String(montant),
          devise: 'EUR',
          detail: detail || null,
          dateValidite: validite,
          mentionFiscale: MENTION_293B,
        },
      })
      return reference
    }, TRANSACTION)
  } catch (erreur) {
    console.error('[colis] estimation impossible :', erreur)
    return { ok: false, message: 'L’émission du devis a échoué. Réessayez.' }
  }

  const destinataire = colis.client?.email ?? colis.destinataireEmail
  if (destinataire) {
    await envoyer({
      destinataire,
      sujet: `Estimation pour votre colis ${colis.codeSuivi} — ${site.name}`,
      texte: [
        `Bonjour ${colis.client?.prenom ?? colis.destinataireNom},`,
        '',
        `Nous avons reçu et pesé votre colis ${colis.codeSuivi}, à destination de ${colis.villeArrivee.nom}.`,
        '',
        `Estimation : ${montant.toFixed(2).replace('.', ',')} €${detail ? ` — ${detail}` : ''}`,
        `Devis ${numero}, valable 7 jours.`,
        '',
        'Ce montant est réglé au retrait du colis, sur place. Le montant définitif figure sur la facture émise à l’arrivée.',
        '',
        MENTION_293B,
        '',
        site.name,
        site.telephone,
      ].join('\n'),
      action: { libelle: 'Suivre mon colis', url: urlSuivi(colis.codeSuivi) },
    })
  }

  revalidatePath('/admin/colis')
  revalidatePath('/admin/receptions')
  return {
    ok: true,
    message: `Devis ${numero} émis pour ${colis.codeSuivi}.`,
    detail: destinataire
      ? `Estimation envoyée à ${destinataire}.`
      : 'Aucune adresse e-mail : prévenez le client par WhatsApp.',
  }
}
