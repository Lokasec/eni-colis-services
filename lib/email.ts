import { Resend } from 'resend'
import { brandColors } from '@/design/tokens.generated'
import { site } from '@/lib/site'

/**
 * E-mails transactionnels.
 *
 * En l'absence de clé Resend — c'est le cas en développement — les envois
 * sont JOURNALISÉS au lieu d'être expédiés, et la fonction renvoie un
 * succès. C'est délibéré : un formulaire ne doit pas échouer parce que la
 * messagerie n'est pas configurée. La demande est enregistrée en base, ce
 * qui est l'essentiel ; l'e-mail n'est qu'une notification.
 *
 * Les envois se font en « fire and forget » depuis les Server Actions : on
 * ne fait jamais attendre l'utilisateur derrière un service tiers.
 */

const cle = process.env.RESEND_API_KEY
const resend = cle ? new Resend(cle) : null

const expediteur = process.env.EMAIL_FROM ?? 'noreply@enicolisservices.com'
const interne = process.env.EMAIL_INTERNAL ?? 'contact@enicolisservices.com'

export type Courriel = {
  destinataire: string
  sujet: string
  /** Corps en texte brut. Le HTML en est dérivé. */
  texte: string
  /** Bouton d'action facultatif, rendu sous le corps. */
  action?: { libelle: string; url: string }
}

export async function envoyer({ destinataire, sujet, texte, action }: Courriel): Promise<boolean> {
  if (!resend) {
    console.info(
      `[email] Resend non configuré — courriel non expédié.\n  À : ${destinataire}\n  Sujet : ${sujet}\n${texte}`,
    )
    return true
  }

  try {
    const { error } = await resend.emails.send({
      from: `${site.name} <${expediteur}>`,
      to: destinataire,
      subject: sujet,
      text: texteComplet(texte, action),
      html: enHtml(texte, action),
    })
    if (error) {
      console.error('[email] envoi refusé par Resend :', error)
      return false
    }
    return true
  } catch (erreur) {
    console.error('[email] envoi impossible :', erreur)
    return false
  }
}

/**
 * Envoi à plusieurs destinataires, un message par personne.
 *
 * Un seul e-mail en copie cachée serait plus rapide, mais exposerait la
 * liste au premier « répondre à tous » mal réglé, et ferait basculer le
 * message en indésirable chez la plupart des fournisseurs. Un envoi par
 * destinataire, donc — le volume est de l'ordre de la dizaine par départ.
 *
 * Renvoie le nombre d'envois RÉELLEMENT acceptés : c'est ce chiffre qui
 * est journalisé, pas le nombre de destinataires visés.
 */
export async function envoyerEnLot(
  destinataires: readonly string[],
  message: Omit<Courriel, 'destinataire'>,
): Promise<{ envoyes: number; echecs: string[] }> {
  const uniques = [...new Set(destinataires.map((e) => e.trim().toLowerCase()).filter(Boolean))]
  const echecs: string[] = []
  let envoyes = 0

  for (const destinataire of uniques) {
    const ok = await envoyer({ ...message, destinataire })
    if (ok) envoyes += 1
    else echecs.push(destinataire)
  }

  return { envoyes, echecs }
}

/** Adresse interne de l'exploitante, pour les alertes. */
export const adresseInterne = interne

// ---------------------------------------------------------------------------
// Gabarit
// ---------------------------------------------------------------------------

/**
 * Gabarit HTML des e-mails.
 *
 * Écrit en tableaux et en styles en ligne, à dessein : les clients de
 * messagerie — Outlook en tête — ignorent les feuilles de style et une
 * bonne part de la mise en page moderne. Aucune image non plus : un
 * logo distant est bloqué par défaut chez beaucoup de destinataires, et
 * l'en-tête apparaîtrait vide. Le nom composé en blanc sur navy tient ce
 * rôle sans dépendre de rien.
 *
 * Les couleurs viennent des tokens : un e-mail est un support de marque.
 */
function enHtml(texte: string, action?: Courriel['action']): string {
  const paragraphes = texte
    .trim()
    .split(/\n{2,}/)
    .map((bloc) => `<p style="margin:0 0 14px">${echapper(bloc).replace(/\n/g, '<br>')}</p>`)
    .join('')

  const bouton = action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0">
         <tr><td style="background:${brandColors.orange};border-radius:999px">
           <a href="${echapper(action.url)}"
              style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:${brandColors.navy};text-decoration:none">
             ${echapper(action.libelle)}
           </a>
         </td></tr>
       </table>`
    : ''

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:${brandColors.sand}">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${brandColors.sand};padding:24px 12px">
<tr><td align="center">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:${brandColors.white};border:1px solid ${brandColors.line}">
    <tr><td style="background:${brandColors.navy};padding:20px 28px">
      <span style="font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:bold;letter-spacing:1px;color:${brandColors.white}">ENI COLIS SERVICES</span><br>
      <span style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${brandColors.sand}">France · Afrique · New York</span>
    </td></tr>
    <tr><td style="padding:28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${brandColors.ink}">
      ${paragraphes}${bouton}
    </td></tr>
    <tr><td style="border-top:1px solid ${brandColors.line};padding:16px 28px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:${brandColors.muted}">
      ${site.adresse.rue}, ${site.adresse.codePostal} ${site.adresse.ville} · ${site.telephone}<br>
      Ce message vous est adressé au sujet d’un envoi que vous nous avez confié.
    </td></tr>
  </table>
</td></tr></table>
</body></html>`
}

/** Version texte : le bouton devient une URL lisible. */
function texteComplet(texte: string, action?: Courriel['action']): string {
  if (!action) return texte
  return `${texte}\n\n${action.libelle} : ${action.url}`
}

function echapper(texte: string): string {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
