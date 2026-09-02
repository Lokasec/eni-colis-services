'use client'

import { useActionState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { estimerColis, type Reponse } from '../../actions-facturation'

type Props = {
  colisId: string
  codeSuivi: string
  modeReception: string
  pese: boolean
  devisExistant: { numero: string; montant: string } | null
  suggestion: { montant: string; detail: string } | null
  refus: string | null
}

/**
 * Devis estimatif d'un colis déjà reçu — le chaînon du mode A.
 *
 * Sur le service d'adresse, ENI avance le transport et n'est payée qu'à
 * l'arrivée. Le client doit connaître le montant AVANT que son colis
 * parte : sinon il découvre la somme au retrait, colis déjà à Abidjan,
 * sans possibilité de refuser. C'est ce que demande CLAUDE.md §5.2.
 *
 * Le panneau n'apparaît que pour un colis commandé en ligne : un dépôt au
 * bureau se facture directement, un devis n'y a pas de sens.
 */
export function PanneauEstimation({
  colisId,
  codeSuivi,
  modeReception,
  pese,
  devisExistant,
  suggestion,
  refus,
}: Props) {
  const [etat, action, enCours] = useActionState<Reponse | null, FormData>(estimerColis, null)

  if (modeReception !== 'COMMANDE_EN_LIGNE') return null

  if (devisExistant) {
    return (
      <section className="border-line rounded-lg border bg-white p-5">
        <h2 className="text-h3 mb-2">Devis estimatif</h2>
        <p className="text-orange-text mb-1 text-[1.35rem] font-extrabold">
          {devisExistant.montant}
        </p>
        <p className="text-caption text-muted">
          {devisExistant.numero} — envoyé au client. La facture définitive est émise à
          l&apos;arrivée.
        </p>
        <div className="mt-3">
          <Button
            href={`/admin/documents/${devisExistant.numero}/pdf`}
            target="_blank"
            rel="noopener"
            variant="outline"
            size="sm"
          >
            Voir le devis en PDF
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="border-line rounded-lg border bg-white p-5">
      <h2 className="text-h3 mb-2">Devis estimatif</h2>
      <p className="text-caption text-muted mb-4">
        Sur une commande en ligne, ENI avance le transport. Le client doit connaître le montant
        <b className="text-navy"> avant le départ</b> du colis.
      </p>

      {etat ? (
        <Alert tone={etat.ok ? 'info' : 'warn'} className="mb-4">
          <b>{etat.message}</b>
          {etat.ok && etat.detail ? (
            <>
              <br />
              {etat.detail}
            </>
          ) : null}
        </Alert>
      ) : null}

      {!pese ? (
        <Alert tone="warn">
          <b>Pesez d&apos;abord le colis.</b> Sans poids constaté, l&apos;estimation ne repose sur
          rien.
        </Alert>
      ) : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="colisId" value={colisId} />

          {refus ? (
            <Alert tone="warn">
              <b>Pas de calcul automatique.</b> {refus}
            </Alert>
          ) : null}

          <div>
            <label htmlFor="montantEur" className="text-caption text-navy mb-1 block font-semibold">
              Montant estimé (€)
            </label>
            <input
              id="montantEur"
              name="montantEur"
              type="text"
              inputMode="decimal"
              required
              defaultValue={suggestion?.montant ?? ''}
              className="border-line-strong text-body text-navy focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 font-bold focus:outline-none"
            />
            {suggestion ? (
              <p className="text-caption text-muted mt-1">
                Suggestion du moteur — modifiable avant envoi.
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="detail" className="text-caption text-navy mb-1 block font-semibold">
              Détail imprimé sur le devis
            </label>
            <input
              id="detail"
              name="detail"
              type="text"
              defaultValue={suggestion?.detail ?? ''}
              className="border-line-strong text-body-sm focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
            />
          </div>

          <Button type="submit" disabled={enCours}>
            {enCours ? 'Émission…' : `Émettre et envoyer pour ${codeSuivi}`}
          </Button>
        </form>
      )}
    </section>
  )
}
