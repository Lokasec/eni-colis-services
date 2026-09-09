import type { Metadata } from 'next'
import { PageLegale } from '../page-legale'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Traitement des données personnelles chez ENI Colis Services : finalités, durées de conservation, droits des personnes.',
  alternates: { canonical: '/legal/confidentialite' },
  robots: { index: false, follow: true },
}

export default function Page() {
  return (
    <PageLegale
      titre={'Politique de confidentialité'}
      intitule={'Comment vos données sont collectées, utilisées et conservées.'}
      rubriques={[
        {
          titre: 'Responsable de traitement',
          detail: "Identité et coordonnées du responsable, et du délégué s'il existe.",
        },
        {
          titre: 'Données collectées et finalités',
          detail: 'Demandes de devis, inscriptions, suivi de colis, facturation.',
        },
        {
          titre: 'Bases légales',
          detail:
            'Exécution du contrat, obligation légale comptable, consentement pour les photos.',
        },
        {
          titre: 'Durées de conservation',
          detail:
            'Devis non convertis 12 mois · clients 3 ans après le dernier envoi · pièces comptables 10 ans.',
        },
        {
          titre: 'Hébergement des données',
          detail: "Base de données et photos hébergées dans l'Union européenne.",
        },
        {
          titre: 'Sous-traitance',
          // La rubrique reste listée — le juriste doit la traiter, ne
          // serait-ce que pour dire qu'il n'y a pas de sous-traitant. Mais
          // elle ne nomme plus Brazzaville ni Kinshasa : depuis la fermeture
          // du 9 septembre 2026, aucune donnée ne sort de l'Union, et
          // annoncer un transfert qui n'existe pas serait une déclaration
          // fausse sur une page de confidentialité.
          detail:
            "Aucun transfert hors de l'Union européenne à ce jour — les liaisons sous-traitées sont fermées. Rubrique à confirmer par le juriste.",
        },
        {
          titre: 'Vos droits',
          detail: "Accès, rectification, effacement, opposition, et modalités d'exercice.",
        },
      ]}
    />
  )
}
