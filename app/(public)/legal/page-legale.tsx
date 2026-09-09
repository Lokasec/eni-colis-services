import type { ReactNode } from 'react'
import { Alert } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/page-header'
import { Section } from '@/components/ui/section'
import { Todo } from '@/components/ui/todo'

/**
 * Gabarit commun des pages légales.
 *
 * AUCUN contenu juridique n'est rédigé ici. Mentions légales, politique de
 * confidentialité et conditions générales doivent être écrites ou validées
 * par un juriste (CLAUDE.md §16) : inventer un texte de loi crédible serait
 * pire que de laisser la page vide, parce que personne ne le relirait.
 *
 * Chaque page liste donc les rubriques attendues, marquées à compléter.
 *
 * Une rubrique peut porter une `valeur` : c'est une information FACTUELLE
 * communiquée par la cliente — un SIREN, un nom de directeur de publication.
 * Elle s'affiche telle quelle et perd sa marque « à compléter ». Ce n'est
 * pas de la rédaction juridique, c'est une donnée d'identité : la distinction
 * compte, et c'est pourquoi l'avertissement en tête de page reste affiché
 * tant que le texte lui-même n'a pas été validé.
 */
export type RubriqueLegale = {
  titre: string
  /** Ce qui reste attendu. Reste affiché même quand `valeur` est renseignée. */
  detail: string
  /** Information déjà connue, affichée sans marque « à compléter ». */
  valeur?: string
}

export function PageLegale({
  titre,
  intitule,
  rubriques,
  complement,
}: {
  titre: string
  intitule: string
  rubriques: RubriqueLegale[]
  complement?: ReactNode
}) {
  return (
    <>
      <PageHeader
        crumb={[{ href: '/', label: 'Accueil' }, { label: titre }]}
        eyebrow="Informations légales"
        titre={titre}
        lede={intitule}
      />

      <Section tone="white" containerClassName="max-w-[760px]">
        <Alert tone="warn">
          <b>Page en attente de rédaction juridique.</b> Le contenu de cette page doit être rédigé
          ou validé par un juriste avant la mise en ligne. Les rubriques attendues sont listées
          ci-dessous.
        </Alert>

        <dl className="mt-8 flex flex-col gap-6">
          {rubriques.map((rubrique) => (
            <div key={rubrique.titre} className="border-line-strong border-l-4 pl-5">
              <dt className="text-h3">{rubrique.titre}</dt>
              {rubrique.valeur ? (
                <dd className="m-0 mt-1.5">
                  <span className="text-navy block font-extrabold">{rubrique.valeur}</span>
                  <span className="text-body-sm text-ink-soft mt-1 block">
                    {rubrique.detail} <Todo />
                  </span>
                </dd>
              ) : (
                <dd className="text-body-sm text-ink-soft m-0 mt-1.5">
                  {rubrique.detail} <Todo />
                </dd>
              )}
            </div>
          ))}
        </dl>

        {complement ? <div className="mt-9">{complement}</div> : null}
      </Section>
    </>
  )
}
