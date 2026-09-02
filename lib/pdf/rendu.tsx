import { renderToBuffer } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { formaterJourLong } from '@/lib/dates'
import { db } from '@/lib/db'
import { urlSuivi } from '@/lib/site'
import { enregistrerPolices, couleurs } from './base'
import { DevisPdf, FacturePdf, RecuPdf } from './documents'

/**
 * Génération des PDF depuis la base.
 *
 * Règle qui commande tout ce fichier : **rien n'est recalculé**. Les
 * montants, le taux de change, le poids facturé et son explication sont
 * lus tels qu'ils ont été figés à l'émission (CLAUDE.md §5.3). Un devis
 * réimprimé six mois plus tard doit afficher exactement ce que le client a
 * reçu — sinon le document ne prouve rien.
 *
 * Le moteur de tarification n'est donc PAS importé ici, et ne doit jamais
 * l'être : il produit des suggestions, pas des pièces.
 */

const MOYENS: Record<string, string> = {
  ESPECES: 'Espèces',
  VIREMENT: 'Virement',
  MOBILE_MONEY: 'Mobile money',
  CARTE: 'Carte bancaire',
  AUTRE: 'Autre moyen',
}
const LIEUX: Record<string, string> = {
  FRANCE: 'Bureau de Rouen',
  ABIDJAN: 'Magasin d’Abidjan',
  AUTRE: 'Autre lieu',
}
const MODES_REMISE: Record<string, string> = {
  DEPOT: 'Dépôt au bureau de Rouen',
  EXPEDITION: 'Expédition par le client',
}

/** « 1 234,50 € ». L'espace insécable évite une coupure avant le symbole. */
function euros(valeur: unknown): string {
  return `${Number(valeur).toFixed(2).replace('.', ',')} €`
}

/** Montant en devise locale, arrondi au franc entier comme au comptoir. */
function devise(valeur: unknown, code: string): string {
  return `${Math.round(Number(valeur)).toLocaleString('fr-FR').replace(/ /g, ' ')} ${code}`
}

function kilos(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return 'Non pesé'
  return `${String(valeur)
    .replace(/\.?0+$/, '')
    .replace('.', ',')} kg`
}

/**
 * QR code vers la page de suivi.
 *
 * Rendu en navy sur blanc plutôt qu'en noir : c'est un document de marque,
 * et le contraste reste très au-dessus de ce qu'exige un lecteur. Marge de
 * 1 module — en dessous, beaucoup de téléphones ne décodent plus.
 */
async function qrSuivi(code: string): Promise<{ image: string; url: string }> {
  const url = urlSuivi(code)

  // GARDE-FOU. Un QR code imprimé ne se corrige pas : le reçu est déjà
  // entre les mains du client. Si NEXT_PUBLIC_SITE_URL n'est pas renseigné
  // en production, `site.url` retombe sur localhost et chaque reçu part
  // avec un lien mort. Mieux vaut refuser d'imprimer.
  if (process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/.test(url)) {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL n’est pas renseigné : le QR code du reçu pointerait vers localhost. ' +
        'Renseignez la variable avant d’imprimer des reçus.',
    )
  }

  const image = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 8,
    color: { dark: couleurs.navy, light: couleurs.white },
  })
  return { image, url }
}

// ---------------------------------------------------------------------------

/** PDF d'un devis, à partir de son numéro. `null` si le document n'existe pas. */
export async function rendreDevis(numero: string): Promise<Buffer | null> {
  const doc = await db.document.findUnique({
    where: { numero },
    include: { demandeDevis: { include: { categorie: true } } },
  })
  if (!doc || doc.type !== 'DEVIS') return null

  const d = doc.demandeDevis
  enregistrerPolices()

  return renderToBuffer(
    <DevisPdf
      d={{
        numero: doc.numero,
        dateEmission: formaterJourLong(doc.dateEmission),
        dateValidite: doc.dateValidite ? formaterJourLong(doc.dateValidite) : null,
        montant: euros(doc.montantEur),
        detail: doc.detail,
        mentionFiscale: doc.mentionFiscale,
        client: {
          nom: d?.nom ?? '—',
          email: d?.email ?? '—',
          telephone: d?.telephone ?? '—',
        },
        envoi: {
          trajet: d ? `${d.villeDepart} → ${d.villeArrivee}` : '—',
          nature: d?.categorie?.libelle ?? 'Colis ordinaire',
          poids: d?.poidsEstime ? `${kilos(d.poidsEstime)} (estimé)` : 'Non communiqué',
          dimensions: d?.dimensions ?? 'Non communiquées',
          valeurDeclaree: d?.valeurAchat ? euros(d.valeurAchat) : null,
          modeRemise: d ? (MODES_REMISE[d.modeRemise] ?? d.modeRemise) : '—',
          description: d?.description ?? '',
        },
      }}
    />,
  )
}

/** PDF d'une facture, à partir de son numéro. */
export async function rendreFacture(numero: string): Promise<Buffer | null> {
  const doc = await db.document.findUnique({
    where: { numero },
    include: {
      colis: {
        include: {
          categorie: true,
          villeArrivee: { select: { nom: true, pays: { select: { nom: true } } } },
        },
      },
      encaissements: { orderBy: { dateEncaissement: 'asc' }, take: 1 },
    },
  })
  if (!doc || doc.type !== 'FACTURE') return null

  const colis = doc.colis
  const encaissement = doc.encaissements[0]
  enregistrerPolices()

  return renderToBuffer(
    <FacturePdf
      f={{
        numero: doc.numero,
        dateEmission: formaterJourLong(doc.dateEmission),
        montant: euros(doc.montantEur),
        // Renseigné seulement si la facture porte une devise locale — donc
        // si elle a été émise à l'arrivée.
        devise:
          doc.devise !== 'EUR' && doc.montantDevise !== null && doc.tauxApplique !== null
            ? {
                montant: devise(doc.montantDevise, doc.devise),
                code: doc.devise,
                taux: String(doc.tauxApplique).replace('.', ','),
              }
            : null,
        detail: doc.detail,
        mentionFiscale: doc.mentionFiscale,
        colis: colis
          ? {
              codeSuivi: colis.codeSuivi,
              destinataire: colis.destinataireNom,
              destination: `${colis.villeArrivee.nom}, ${colis.villeArrivee.pays.nom}`,
              poids: kilos(colis.poidsReel ?? colis.poidsEstime),
              nature: colis.categorie?.libelle ?? 'Colis ordinaire',
            }
          : null,
        reglement:
          doc.dateReglement && encaissement
            ? {
                date: formaterJourLong(doc.dateReglement),
                moyen: MOYENS[encaissement.moyen] ?? encaissement.moyen,
                lieu: LIEUX[encaissement.lieu] ?? encaissement.lieu,
              }
            : null,
      }}
    />,
  )
}

/** Reçu de dépôt d'un colis, à partir de son code de suivi. */
export async function rendreRecu(codeSuivi: string): Promise<Buffer | null> {
  const colis = await db.colis.findUnique({
    where: { codeSuivi },
    include: {
      categorie: true,
      pointRetrait: { select: { nom: true, adresse: true } },
      villeArrivee: { select: { nom: true, pays: { select: { nom: true } } } },
      documents: {
        where: { type: 'FACTURE' },
        orderBy: { dateEmission: 'desc' },
        take: 1,
      },
    },
  })
  if (!colis) return null

  const facture = colis.documents[0] ?? null
  const qr = await qrSuivi(colis.codeSuivi)
  enregistrerPolices()

  const pointRetrait = colis.pointRetrait
    ? [colis.pointRetrait.nom, colis.pointRetrait.adresse].filter(Boolean).join(' — ')
    : 'À préciser'

  return renderToBuffer(
    <RecuPdf
      r={{
        codeSuivi: colis.codeSuivi,
        date: formaterJourLong(colis.creeLe),
        qrCode: qr.image,
        urlSuivi: qr.url.replace(/^https?:\/\//, ''),
        expediteur: colis.expediteurNom
          ? { nom: colis.expediteurNom, telephone: colis.expediteurTelephone ?? '—' }
          : null,
        destinataire: {
          nom: colis.destinataireNom,
          telephone: colis.destinataireTelephone ?? '—',
          destination: `${colis.villeArrivee.nom}, ${colis.villeArrivee.pays.nom}`,
          pointRetrait,
        },
        envoi: {
          nature: colis.categorie?.libelle ?? 'Colis ordinaire',
          poids: kilos(colis.poidsReel ?? colis.poidsEstime),
          dimensions: colis.dimensions ?? 'Non mesurées',
          contenu: colis.contenu ?? '',
        },
        facture:
          facture && facture.dateReglement
            ? { numero: facture.numero, montant: euros(facture.montantEur) }
            : null,
        // Un reçu n'est pas une pièce comptable, mais il porte la même
        // mention : c'est le seul papier que certains clients gardent.
        mentionFiscale: facture?.mentionFiscale ?? 'TVA non applicable, art. 293 B du CGI',
      }}
    />,
  )
}
