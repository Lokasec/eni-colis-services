'use client'

import { useActionState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { convertirEnColis, statuerDevis, type Reponse } from '../../actions-facturation'

type Props = {
  demandeId: string
  statut: string
  devisEmis: boolean
  colis: { codeSuivi: string; statut: string } | null
}

/**
 * La suite du devis : réponse du client, puis passage à l'exploitation.
 *
 * Le devis n'est pas un aboutissement, c'est une étape. Tant que cette
 * suite n'existait pas, un devis accepté restait dans la liste des devis
 * et le colis devait être ressaisi à la main — avec le risque de ne pas
 * le ressaisir du tout.
 *
 * Les deux étapes sont séparées à dessein. Marquer « accepté » enregistre
 * la réponse du client ; créer le colis engage un code de suivi et un
 * e-mail au client. On ne déclenche pas le second par inadvertance en
 * faisant le premier.
 */
export function SuiteDuDevis({ demandeId, statut, devisEmis, colis }: Props) {
  const [reponseStatut, actionStatut, statutEnCours] = useActionState<Reponse | null, FormData>(
    statuerDevis,
    null,
  )
  const [reponseColis, actionColis, colisEnCours] = useActionState<Reponse | null, FormData>(
    convertirEnColis,
    null,
  )

  // Converti : plus rien à décider ici, on renvoie vers le colis.
  if (colis) {
    return (
      <section className="border-line rounded-lg border bg-white p-5">
        <h2 className="text-h3 mb-3">Colis créé</h2>
        <p className="text-orange-text mb-1 text-[1.35rem] font-extrabold">{colis.codeSuivi}</p>
        <p className="text-caption text-muted mb-4">
          Le code de suivi a été envoyé au client. La suite se passe dans la fiche du colis.
        </p>
        <Button href={`/admin/colis/${colis.codeSuivi}`} variant="outline" size="sm">
          Ouvrir la fiche du colis
        </Button>
      </section>
    )
  }

  if (!devisEmis) {
    return (
      <section className="border-line rounded-lg border bg-white p-5">
        <h2 className="text-h3 mb-2">Suite du devis</h2>
        <p className="text-body-sm text-ink-soft">
          Chiffrez et envoyez le devis avant d&apos;enregistrer la réponse du client.
        </p>
      </section>
    )
  }

  return (
    <section className="border-line rounded-lg border bg-white p-5">
      <h2 className="text-h3 mb-3">Réponse du client</h2>

      {reponseStatut ? (
        <Alert tone={reponseStatut.ok ? 'info' : 'warn'} className="mb-4">
          {reponseStatut.message}
        </Alert>
      ) : null}
      {reponseColis ? (
        <Alert tone={reponseColis.ok ? 'info' : 'warn'} className="mb-4">
          <b>{reponseColis.message}</b>
          {reponseColis.ok && reponseColis.detail ? (
            <>
              <br />
              {reponseColis.detail}
            </>
          ) : null}
        </Alert>
      ) : null}

      {statut === 'ACCEPTEE' ? (
        <>
          <p className="text-body-sm text-ink-soft mb-4">
            Devis accepté. La création du colis attribue un <b>code de suivi</b> et l&apos;envoie au
            client par e-mail.
          </p>
          <form action={actionColis}>
            <input type="hidden" name="demandeId" value={demandeId} />
            <Button type="submit" disabled={colisEnCours}>
              {colisEnCours ? 'Création…' : 'Créer le colis'}
            </Button>
          </form>
        </>
      ) : statut === 'REFUSEE' ? (
        <>
          <p className="text-body-sm text-ink-soft mb-4">
            Devis marqué refusé. Si le client revient sur sa décision, réenregistrez son accord.
          </p>
          <form action={actionStatut}>
            <input type="hidden" name="demandeId" value={demandeId} />
            <input type="hidden" name="reponse" value="ACCEPTEE" />
            <Button type="submit" variant="outline" size="sm" disabled={statutEnCours}>
              Finalement accepté
            </Button>
          </form>
        </>
      ) : (
        <>
          <p className="text-body-sm text-ink-soft mb-4">
            Le client répond par téléphone, WhatsApp ou e-mail. Enregistrez sa réponse ici.
          </p>
          <div className="flex flex-wrap gap-3">
            <form action={actionStatut}>
              <input type="hidden" name="demandeId" value={demandeId} />
              <input type="hidden" name="reponse" value="ACCEPTEE" />
              <Button type="submit" disabled={statutEnCours}>
                {statutEnCours ? 'Enregistrement…' : 'Devis accepté'}
              </Button>
            </form>
            <form action={actionStatut}>
              <input type="hidden" name="demandeId" value={demandeId} />
              <input type="hidden" name="reponse" value="REFUSEE" />
              <Button type="submit" variant="outline" disabled={statutEnCours}>
                Refusé
              </Button>
            </form>
          </div>
        </>
      )}
    </section>
  )
}
