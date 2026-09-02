import { Resend } from 'resend'
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
}

export async function envoyer({ destinataire, sujet, texte }: Courriel): Promise<boolean> {
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
      text: texte,
      html: enHtml(texte),
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

/** Adresse interne de l'exploitante, pour les alertes. */
export const adresseInterne = interne

/**
 * Conversion minimale du texte en HTML : paragraphes et retours à la ligne.
 * Pas de gabarit graphique — les e-mails mis en forme arrivent au lot 9.
 */
function enHtml(texte: string): string {
  const paragraphes = texte
    .trim()
    .split(/\n{2,}/)
    .map((bloc) => `<p style="margin:0 0 16px">${echapper(bloc).replace(/\n/g, '<br>')}</p>`)
    .join('')

  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#111111">${paragraphes}</div>`
}

function echapper(texte: string): string {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
