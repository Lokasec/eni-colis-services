import type { Metadata } from 'next'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Eyebrow } from '@/components/ui/eyebrow'
import { KeyValueList } from '@/components/ui/key-value-list'
import { PageHeader } from '@/components/ui/page-header'
import { Section } from '@/components/ui/section'
import { Timeline, type TimelineItem } from '@/components/ui/timeline'
import { Todo } from '@/components/ui/todo'
import { formaterJourEtHeure, formaterJourLong } from '@/lib/dates'
import { suivreColis } from '@/lib/donnees-publiques'
import { statutsColis, type StatutColis } from '@/lib/statuts'

export const metadata: Metadata = {
  title: 'Suivre mon colis',
  description:
    'Saisissez le code de votre reçu de dépôt pour connaître l’état de votre colis et son point de retrait.',
  alternates: { canonical: '/suivi' },
}

/** Les étapes visibles du client, dans l'ordre. EN_REACHEMINEMENT n'y figure pas. */
const ETAPES: StatutColis[] = [
  'RECU',
  'EN_PREPARATION',
  'EXPEDIE',
  'EN_TRANSIT',
  'ARRIVE',
  'DISPONIBLE_RETRAIT',
  'RETIRE',
]

export default async function Suivi({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  const recherche = code?.trim() ?? ''
  const colis = recherche ? await suivreColis(recherche) : null

  // La frise combine les étapes déjà franchies et celles à venir.
  const frise: TimelineItem[] = colis
    ? (() => {
        const franchies = new Map(colis.historique.map((h) => [h.statut, h.survenuLe]))
        const rang = ETAPES.indexOf(colis.statut as StatutColis)
        return ETAPES.map((etape, index): TimelineItem => {
          const date = franchies.get(etape)
          if (index < rang) {
            return {
              titre: statutsColis[etape].label,
              detail: date ? formaterJourEtHeure(date) : undefined,
              etat: 'fait',
            }
          }
          if (index === rang) {
            return {
              titre: statutsColis[etape].label,
              detail: date ? `Depuis le ${formaterJourLong(date)}` : undefined,
              etat: 'encours',
            }
          }
          return { titre: statutsColis[etape].label, detail: 'À venir', etat: 'avenir' }
        })
      })()
    : []

  return (
    <>
      <PageHeader
        crumb={[{ href: '/', label: 'Accueil' }, { label: 'Suivi' }]}
        eyebrow="Où est mon colis"
        titre="Suivre mon colis"
        lede="Saisissez le code figurant sur votre reçu de dépôt. Il commence par ENI."
      />

      <Section tone="white" containerClassName="max-w-[780px]">
        <Card surface="plain">
          {/* Formulaire en GET : pas de JavaScript nécessaire, et le résultat
              se partage par simple copie de l'URL. */}
          <form method="get" className="flex flex-wrap items-start gap-3">
            <div className="mb-0 min-w-[240px] flex-1">
              <label htmlFor="code" className="text-body-sm text-navy mb-1.5 block font-semibold">
                Code de suivi
              </label>
              <input
                id="code"
                name="code"
                type="text"
                defaultValue={recherche}
                placeholder="ENI-2026-00123"
                autoComplete="off"
                spellCheck={false}
                aria-describedby="code-aide"
                className="border-line-strong text-body text-ink duration-base ease-brand placeholder:text-placeholder focus:border-orange min-h-13 w-full rounded-md border-2 bg-white px-4 py-3.5 uppercase transition-colors focus:outline-none"
              />
              <span id="code-aide" className="text-caption text-muted mt-1 block">
                Format : ENI-2026-00123
              </span>
            </div>
            <Button type="submit" className="mt-[31px]">
              Rechercher
            </Button>
          </form>
        </Card>

        {recherche && !colis ? (
          <Card className="mt-6">
            <h2 className="text-h3">Aucun colis ne correspond à ce code</h2>
            <p className="text-body-sm text-ink-soft mt-2">
              Vérifiez la saisie : le code figure en haut de votre reçu de dépôt et commence par
              ENI. En cas de doute, contactez-nous.
            </p>
            <div className="mt-5">
              <Button href="/contact" variant="outline" size="sm">
                Nous contacter
              </Button>
            </div>
          </Card>
        ) : null}

        {colis ? (
          <Card surface="plain" className="mt-6">
            <Eyebrow className="mb-2">Colis {colis.codeSuivi}</Eyebrow>
            <h2 className="text-h2">
              {colis.libelleStatut} — {colis.destination}
            </h2>

            <KeyValueList
              className="mt-6 mb-7"
              items={[
                { label: 'Destination', value: `${colis.destination}, ${colis.pays}` },
                { label: 'Destinataire', value: colis.destinataire },
                {
                  label: 'Départ',
                  value: colis.dateDepart ? formaterJourLong(colis.dateDepart) : 'Pas encore parti',
                },
                {
                  label: 'Arrivée',
                  value: colis.dateArrivee ? formaterJourLong(colis.dateArrivee) : <Todo />,
                },
              ]}
            />

            <h3 className="text-h3 mb-4.5">Historique</h3>
            <Timeline items={frise} />

            <Alert className="mt-7">
              <b>Point de retrait —</b>{' '}
              {colis.pointRetrait?.adresse ? (
                <>
                  {colis.pointRetrait.nom}, {colis.pointRetrait.adresse}.
                </>
              ) : (
                <>
                  {colis.pointRetrait?.nom ?? 'à préciser'} <Todo />.
                </>
              )}{' '}
              Votre destinataire sera prévenu par e-mail et WhatsApp dès que le colis sera
              disponible. Une pièce d&apos;identité et le code de suivi seront demandés au retrait.
            </Alert>
          </Card>
        ) : null}

        <div className="mt-11 max-w-[70ch]">
          <h2 className="text-h2">Vous ne trouvez pas votre colis ?</h2>
          <p className="text-body text-ink-soft mt-4">
            Vérifiez la saisie : le code figure en haut de votre reçu de dépôt et commence par{' '}
            <strong className="text-navy">ENI</strong>. Si le doute persiste, contactez-nous — nous
            retrouverons votre envoi avec votre nom et votre numéro de téléphone.
          </p>
          <p className="text-body text-ink-soft mt-4">
            Le groupage implique des temps d&apos;attente : votre colis peut rester quelques jours
            avant le départ, le temps que le chargement soit complet. Si le délai annoncé est
            dépassé, écrivez-nous.
          </p>
        </div>
      </Section>
    </>
  )
}
