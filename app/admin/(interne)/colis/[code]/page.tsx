import { notFound } from 'next/navigation'
import { Topbar } from '@/components/admin/topbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KeyValueList } from '@/components/ui/key-value-list'
import { Timeline, type TimelineItem } from '@/components/ui/timeline'
import { Todo } from '@/components/ui/todo'
import { exigerConnexion } from '@/lib/autorisation'
import { formaterJourEtHeure, formaterJourLong } from '@/lib/dates'
import { colisParCode, departsOuverts } from '@/lib/donnees-admin'
import { statutsColis, statutsPaiement, type StatutColis, type StatutPaiement } from '@/lib/statuts'
import { PanneauExploitation } from './panneau'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return { title: `Colis ${code}` }
}

export default async function FicheColis({ params }: { params: Promise<{ code: string }> }) {
  await exigerConnexion()
  const { code } = await params
  const colis = await colisParCode(decodeURIComponent(code))
  if (!colis) notFound()

  const departs = await departsOuverts()

  const frise: TimelineItem[] = colis.historique.map((ligne, index) => ({
    titre: statutsColis[ligne.statut as StatutColis].label,
    detail: [formaterJourEtHeure(ligne.survenuLe), ligne.auteur?.nom, ligne.commentaire]
      .filter(Boolean)
      .join(' · '),
    etat: index === 0 ? 'encours' : 'fait',
  }))

  return (
    <>
      <Topbar
        titre={colis.codeSuivi}
        sousTitre={`${colis.villeArrivee.nom}, ${colis.villeArrivee.pays.nom}`}
        actions={
          <Button href="/admin/colis" variant="outline" size="sm">
            Retour à la liste
          </Button>
        }
      />

      <div className="grid gap-5 p-4 md:p-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone={statutsColis[colis.statut as StatutColis].tone}>
              {statutsColis[colis.statut as StatutColis].label}
            </Badge>
            <Badge tone={statutsPaiement[colis.statutPaiement as StatutPaiement].tone}>
              {statutsPaiement[colis.statutPaiement as StatutPaiement].label}
            </Badge>
            {colis.necessiteReacheminement ? (
              <Badge tone="enTransit">Réacheminement nécessaire</Badge>
            ) : null}
          </div>

          <KeyValueList
            items={[
              {
                label: 'Client',
                value: colis.client
                  ? `${colis.client.nomLivraison} (${colis.client.numeroClient})`
                  : 'Non rattaché',
              },
              { label: 'Destinataire', value: colis.destinataireNom },
              { label: 'Expéditeur', value: colis.expediteurNom ?? '—' },
              {
                label: 'Poids réel',
                value: colis.poidsReel ? `${String(colis.poidsReel)} kg` : 'Non pesé',
                emphasis: colis.poidsReel !== null,
              },
              { label: 'Dimensions', value: colis.dimensions ?? '—' },
              { label: 'Catégorie', value: colis.categorie?.libelle ?? '—' },
              {
                label: 'Valeur déclarée',
                value: colis.valeurDeclaree
                  ? `${String(colis.valeurDeclaree)} € ${colis.justificatifFourni ? '(justifiée)' : '(sans justificatif)'}`
                  : '—',
              },
              { label: 'Départ affecté', value: colis.depart?.reference ?? 'Aucun' },
              {
                label: 'Point de retrait',
                value: colis.pointRetrait?.adresse ?? colis.pointRetrait?.nom ?? <Todo />,
              },
              {
                label: 'Parti le',
                value: colis.dateDepartEffectif ? formaterJourLong(colis.dateDepartEffectif) : '—',
              },
            ]}
          />

          {/* Champ INTERNE : le hub n'apparaît jamais côté public, mais
              l'exploitation en a besoin pour préparer le second segment. */}
          {colis.villeArrivee.villeTransit ? (
            <div className="bg-notice text-navy text-body-sm rounded-md px-4 py-3">
              <b>Acheminement interne :</b> ce colis transite par{' '}
              {colis.villeArrivee.villeTransit.nom} avant {colis.villeArrivee.nom}. Le client voit «
              En transit », sans détail de parcours.
            </div>
          ) : null}

          {colis.contenu ? (
            <div className="border-line rounded-lg border bg-white p-5">
              <h2 className="text-h3">Contenu déclaré</h2>
              <p className="text-body-sm text-ink-soft mt-2">{colis.contenu}</p>
            </div>
          ) : null}

          <div className="border-line rounded-lg border bg-white p-5">
            <h2 className="text-h3 mb-4">Historique</h2>
            <Timeline items={frise} />
            <p className="text-caption text-muted mt-4">
              L&apos;historique est en ajout seul : aucune ligne n&apos;est modifiée ni supprimée.
            </p>
          </div>
        </div>

        <PanneauExploitation
          colisId={colis.id}
          statut={colis.statut as StatutColis}
          departId={colis.depart?.id ?? ''}
          poidsReel={colis.poidsReel ? String(colis.poidsReel) : ''}
          departs={departs.map((d) => ({
            id: d.id,
            etiquette: `${d.reference} — ${d.liaison.paysDestination.nom}, ${formaterJourLong(d.dateDepart)}`,
          }))}
        />
      </div>
    </>
  )
}
