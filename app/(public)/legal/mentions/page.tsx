import type { Metadata } from 'next'
import { site } from '@/lib/site'
import { PageLegale } from '../page-legale'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description:
    "Mentions légales d'ENI Colis Services : éditeur, hébergeur, directeur de publication.",
  alternates: { canonical: '/legal/mentions' },
  robots: { index: false, follow: true },
}

export default function Page() {
  return (
    <PageLegale
      titre={'Mentions légales'}
      intitule={'Éditeur du site, hébergement et responsabilité de publication.'}
      rubriques={[
        {
          titre: 'Dénomination et statut',
          detail: "Raison sociale exacte et statut d'auto-entrepreneur.",
          // Communiqué le 9 septembre 2026. Le SIREN suffit à l'article
          // 6 III de la LCEN ; la raison sociale exacte manque encore.
          valeur: `SIREN ${site.editeur.siren}`,
        },
        {
          titre: 'Adresse du siège',
          detail: '67 rue Saint-Julien, 76100 Rouen — à confirmer comme adresse de siège.',
        },
        {
          titre: 'Directeur de la publication',
          detail: 'Qualité du responsable de la publication à préciser.',
          valeur: site.editeur.directeurPublication,
        },
        { titre: 'Hébergeur', detail: "Nom, adresse et téléphone de l'hébergeur du site." },
        {
          titre: "Statut réglementaire de l'activité de transport",
          detail: 'Mention exigée pour une activité de commissionnaire ou de transporteur.',
        },
      ]}
    />
  )
}
