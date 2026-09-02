import { notFound } from 'next/navigation'
import { PhotoViewer } from '@/components/admin/photo-viewer'
import { Topbar } from '@/components/admin/topbar'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KeyValueList } from '@/components/ui/key-value-list'
import { exigerConnexion } from '@/lib/autorisation'
import { formaterJourLong } from '@/lib/dates'
import { demandeParReference } from '@/lib/donnees-admin'
import { suggererPourDemande } from '@/lib/admin/facturation'
import { site, whatsappLink } from '@/lib/site'
import { PanneauChiffrage } from './panneau'
import { SuiteDuDevis } from './suite'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  return { title: `Devis ${reference}` }
}

export default async function FicheDevis({ params }: { params: Promise<{ reference: string }> }) {
  await exigerConnexion()
  const { reference } = await params
  const demande = await demandeParReference(decodeURIComponent(reference))
  if (!demande) notFound()

  // Suggestion du moteur — modifiable par la cliente avant émission.
  const suggestion = await suggererPourDemande(demande)
  const documentEmis = demande.documents[0] ?? null

  const messageWhatsApp = documentEmis
    ? `Bonjour ${demande.nom}, votre devis ${documentEmis.numero} pour un envoi vers ${demande.villeArrivee} s'élève à ${Number(documentEmis.montantEur).toFixed(2).replace('.', ',')} €, valable 7 jours. ${site.name}`
    : `Bonjour ${demande.nom}, nous avons bien reçu votre demande ${demande.reference}.`

  return (
    <>
      <Topbar
        titre={demande.reference}
        sousTitre={`${demande.nom} · ${demande.villeDepart} → ${demande.villeArrivee}`}
        actions={
          <Button href="/admin/devis" variant="outline" size="sm">
            Retour à la liste
          </Button>
        }
      />

      <div className="grid gap-5 p-4 md:p-6 xl:grid-cols-[1fr_400px]">
        <div className="space-y-5">
          {/* Les photos d'abord : c'est en les regardant que la cliente chiffre. */}
          <section className="border-line rounded-lg border bg-white p-5">
            <h2 className="text-h3 mb-3">Photos du colis</h2>
            <PhotoViewer
              photos={demande.photos.map((photo) => ({
                url: photo.url,
                alt: photo.nomOriginal ?? `Photo ${photo.ordre + 1} du colis`,
              }))}
            />
            <p className="text-caption text-muted mt-3">
              Cliquez sur une photo pour l&apos;agrandir sans quitter la fiche.
            </p>
          </section>

          <KeyValueList
            items={[
              { label: 'Trajet', value: `${demande.villeDepart} → ${demande.villeArrivee}` },
              {
                label: 'Mode de remise',
                value: demande.modeRemise === 'DEPOT' ? 'Dépôt au bureau' : 'Expédition à distance',
              },
              { label: 'Nature', value: demande.categorie?.libelle ?? '—' },
              {
                label: 'Poids estimé',
                value: demande.poidsEstime ? `${String(demande.poidsEstime)} kg` : 'Non indiqué',
              },
              { label: 'Dimensions', value: demande.dimensions ?? '—' },
              {
                label: 'Valeur déclarée',
                value: demande.valeurAchat ? `${String(demande.valeurAchat)} €` : '—',
              },
              { label: 'Reçue le', value: formaterJourLong(demande.creeLe) },
              {
                label: 'Départ souhaité',
                value: demande.departSouhaite ? formaterJourLong(demande.departSouhaite) : '—',
              },
            ]}
          />

          {demande.modeRemise === 'EXPEDITION' ? (
            <Alert tone="warn">
              <b>Envoi à distance.</b> Le devis doit être accepté avant que le colis parte : sans
              pesée sur place, le montant doit être arrêté à l&apos;avance. Le client collera le
              numéro de devis sur le colis.
            </Alert>
          ) : null}

          <section className="border-line rounded-lg border bg-white p-5">
            <h2 className="text-h3 mb-2">Description du client</h2>
            <p className="text-body-sm text-ink-soft">{demande.description}</p>
          </section>

          <section className="border-line rounded-lg border bg-white p-5">
            <h2 className="text-h3 mb-3">Contact</h2>
            <dl className="text-body-sm grid gap-2 sm:grid-cols-3">
              <div>
                <dt className="text-caption text-muted">Nom</dt>
                <dd className="text-navy m-0 font-semibold">{demande.nom}</dd>
              </div>
              <div>
                <dt className="text-caption text-muted">E-mail</dt>
                <dd className="m-0">{demande.email}</dd>
              </div>
              <div>
                <dt className="text-caption text-muted">Téléphone</dt>
                <dd className="m-0">{demande.telephone}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <a
                href={whatsappLink(messageWhatsApp)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-whatsapp text-navy text-body-sm rounded-pill inline-flex min-h-11 items-center px-5 font-semibold no-underline"
              >
                Répondre sur WhatsApp
              </a>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          {documentEmis ? (
            <section className="border-line rounded-lg border bg-white p-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-h3">Devis émis</h2>
                <Badge tone="devisChiffre">{documentEmis.numero}</Badge>
              </div>
              <p className="text-orange-text text-[1.6rem] font-extrabold">
                {Number(documentEmis.montantEur).toFixed(2).replace('.', ',')} €
              </p>
              {documentEmis.detail ? (
                <p className="text-caption text-ink-soft mt-1">{documentEmis.detail}</p>
              ) : null}
              <div className="mt-3">
                <Button
                  href={`/admin/documents/${documentEmis.numero}/pdf`}
                  target="_blank"
                  rel="noopener"
                  variant="outline"
                  size="sm"
                >
                  Voir le devis en PDF
                </Button>
              </div>
              <p className="text-caption text-muted mt-2">
                {documentEmis.mentionFiscale}
                <br />
                Valable jusqu&apos;au{' '}
                {documentEmis.dateValidite ? formaterJourLong(documentEmis.dateValidite) : '—'}.
              </p>
            </section>
          ) : null}

          <PanneauChiffrage
            demandeId={demande.id}
            documentId={documentEmis?.id ?? null}
            suggestion={
              suggestion.statut === 'CALCULE'
                ? { montant: suggestion.montantEur.toFixed(2), detail: suggestion.detail }
                : null
            }
            refus={
              suggestion.statut === 'CALCULE'
                ? null
                : suggestion.statut === 'SUR_DEVIS'
                  ? suggestion.motif
                  : suggestion.motif
            }
            montantExistant={documentEmis ? Number(documentEmis.montantEur).toFixed(2) : ''}
          />

          <SuiteDuDevis
            demandeId={demande.id}
            statut={demande.statut}
            devisEmis={documentEmis !== null}
            colis={demande.colis[0] ?? null}
          />
        </div>
      </div>
    </>
  )
}
