import Link from 'next/link'
import type { ReactNode } from 'react'
import { Container } from './container'
import { Eyebrow } from './eyebrow'

/**
 * Tête de page intérieure (.phead) : fil d'Ariane, sur-titre, H1, chapô.
 * Fond sable — c'est la respiration qui ouvre chaque page intérieure.
 */
export function PageHeader({
  crumb,
  eyebrow,
  titre,
  lede,
}: {
  crumb?: Array<{ href?: string; label: string }>
  eyebrow?: ReactNode
  titre: ReactNode
  lede?: ReactNode
}) {
  return (
    <section data-tone="sand" className="border-line bg-sand border-b py-11 md:py-14">
      <Container>
        {crumb && crumb.length > 0 ? (
          <nav aria-label="Fil d'Ariane" className="mb-3.5">
            <ol className="text-caption text-muted flex list-none flex-wrap gap-1.5 p-0">
              {crumb.map((item, i) => (
                <li key={item.label} className="flex items-center gap-1.5">
                  {item.href ? (
                    // `py-1` porte la cible a 24 px de haut : minimum exige
                    // par WCAG 2.2 (2.5.8). Le texte reste a sa taille, seule
                    // la zone cliquable grandit.
                    <Link
                      href={item.href}
                      className="text-muted hover:text-orange-text inline-flex items-center py-1 no-underline"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{item.label}</span>
                  )}
                  {i < crumb.length - 1 ? <span aria-hidden>·</span> : null}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
        <h1 className="text-h1">{titre}</h1>
        {lede ? <p className="text-body-lg text-ink-soft mt-4 max-w-[660px]">{lede}</p> : null}
      </Container>
    </section>
  )
}
