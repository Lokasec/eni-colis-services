import type { Metadata } from 'next'
import { PageLegale } from '../page-legale'

export const metadata: Metadata = {
  title: 'Gestion des cookies',
  description:
    "ENI Colis Services n'utilise que les cookies nécessaires au fonctionnement du site. Aucun traceur publicitaire.",
  alternates: { canonical: '/legal/cookies' },
  robots: { index: false, follow: true },
}

export default function Page() {
  return (
    <PageLegale
      titre={'Gestion des cookies'}
      intitule={'Ce que nous déposons sur votre navigateur, et pourquoi.'}
      rubriques={[
        {
          titre: 'Cookies strictement nécessaires',
          detail: 'Cookies de session et de sécurité, indispensables au fonctionnement du site.',
        },
        {
          titre: 'Absence de traceur',
          detail:
            "Aucun cookie publicitaire, aucun traceur tiers, aucune mesure d'audience externe.",
        },
        { titre: 'Durée de conservation', detail: 'Durée de vie de chaque cookie déposé.' },
        {
          titre: 'Comment les refuser',
          detail: 'Réglages du navigateur et conséquences sur le fonctionnement du site.',
        },
      ]}
    />
  )
}
