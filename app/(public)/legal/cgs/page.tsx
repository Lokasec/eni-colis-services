import type { Metadata } from 'next'
import { PageLegale } from '../page-legale'

export const metadata: Metadata = {
  title: 'Conditions générales de service',
  description:
    "Conditions générales de service d'ENI Colis Services : objets interdits, indemnisation, délais de garde, réclamations.",
  alternates: { canonical: '/legal/cgs' },
  robots: { index: false, follow: true },
}

export default function Page() {
  return (
    <PageLegale
      titre={'Conditions générales de service'}
      intitule={'Les règles qui encadrent nos envois, du dépôt au retrait.'}
      rubriques={[
        {
          titre: 'Objets interdits et restreints',
          detail: 'Liste des contenus refusés en fret aérien et conséquences en cas de découverte.',
        },
        {
          titre: 'Articles de valeur et justificatifs',
          detail:
            "Obligation de justificatif d'achat, responsabilité du client sur l'authenticité.",
        },
        {
          titre: "Plafond d'indemnisation",
          detail: 'Montant par kilo et par colis, et régime particulier des articles de valeur.',
        },
        {
          titre: 'Remise contre paiement',
          detail: "Le colis n'est remis qu'après règlement intégral.",
        },
        {
          titre: 'Délai de garde et frais',
          detail: 'Durée de garde gratuite, frais applicables ensuite et leur plafond.',
        },
        {
          titre: 'Colis non retirés',
          detail: 'Délai au terme duquel un colis est réputé abandonné, et sort de la créance.',
        },
        {
          titre: 'Recours à un sous-traitant',
          detail: 'Destinations sous-traitées et portée de la responsabilité.',
        },
        {
          titre: 'Envois à distance',
          detail: 'Devis préalable obligatoire, écart entre poids annoncé et poids constaté.',
        },
        { titre: 'Réclamations', detail: "Délai et forme d'une réclamation, pièces à fournir." },
      ]}
    />
  )
}
