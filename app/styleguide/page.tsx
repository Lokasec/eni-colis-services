import type { Metadata } from 'next'
import { PhotoUpload } from '@/components/form/photo-upload'
import { Checkbox } from '@/components/form/checkbox'
import { SelectField } from '@/components/form/select-field'
import { TextField } from '@/components/form/text-field'
import { TextareaField } from '@/components/form/textarea-field'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { WhatsAppFloat } from '@/components/layout/whatsapp-float'
import { Sidebar } from '@/components/admin/sidebar'
import { StatCard } from '@/components/admin/stat-card'
import { Topbar } from '@/components/admin/topbar'
import { Accordion, AccordionItem } from '@/components/ui/accordion'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CountryChip } from '@/components/ui/country-chip'
import { CtaBand } from '@/components/ui/cta-band'
import { DataTable, Td } from '@/components/ui/data-table'
import { DepartBoard, DepartRow } from '@/components/ui/depart-row'
import { ImageFrame } from '@/components/ui/image-frame'
import { KeyValueList } from '@/components/ui/key-value-list'
import { PageHeader } from '@/components/ui/page-header'
import { Section } from '@/components/ui/section'
import { SectionHeading } from '@/components/ui/section-heading'
import { Stepper } from '@/components/ui/stepper'
import { Timeline } from '@/components/ui/timeline'
import { brandColors, brandTypeScale } from '@/design/tokens.generated'
import { DemoModal, DemoRadioCards, DemoStatusSelect, DemoToast } from './demos'

export const metadata: Metadata = {
  title: 'Styleguide',
  robots: { index: false, follow: false },
}

/** Titre de rubrique du styleguide — hors charte publique, outil interne. */
function Bloc({
  titre,
  note,
  children,
}: {
  titre: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-line border-t pt-8 pb-10">
      <h2 className="text-h3 text-navy">{titre}</h2>
      {note ? <p className="text-body-sm text-ink-soft mt-1 mb-5 max-w-[70ch]">{note}</p> : null}
      <div className={note ? '' : 'mt-5'}>{children}</div>
    </section>
  )
}

export default function StyleguidePage() {
  const couleurs = Object.entries(brandColors)

  return (
    <>
      <Header />

      <PageHeader
        crumb={[{ href: '/', label: 'Accueil' }, { label: 'Styleguide' }]}
        eyebrow="Outil interne"
        titre="Design system"
        lede="Tous les composants réutilisables du site public et du back-office. Cette page n’est pas destinée aux visiteurs : elle sert à valider l’ADN visuel avant de construire les pages."
      />

      <Section tone="white" containerClassName="max-w-page">
        <Bloc
          titre="Couleurs"
          note="Générées depuis design/tokens.json par npm run brand. La palette par défaut de Tailwind est neutralisée : aucune autre couleur n’existe dans le projet."
        >
          <ul className="grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-3 lg:grid-cols-5">
            {couleurs.map(([nom, valeur]) => (
              <li key={nom}>
                <span
                  className="border-line block h-16 rounded-md border"
                  style={{ backgroundColor: valeur }}
                  aria-hidden
                />
                <span className="text-caption text-navy mt-1.5 block font-semibold">{nom}</span>
                <span className="text-muted block font-mono text-xs">{valeur}</span>
              </li>
            ))}
          </ul>
        </Bloc>

        <Bloc
          titre="Typographie"
          note="Montserrat auto-hébergée. Les tailles sont fluides (clamp) : elles s’adaptent sans point de rupture."
        >
          <div className="space-y-4">
            <p className="text-display">Display — De 12 à 20 € le kilo</p>
            <p className="text-h1">H1 — Envoyez vos colis</p>
            <p className="text-h2">H2 — Deux situations, deux façons de faire</p>
            <p className="text-h3">H3 — Colis et cartons familiaux</p>
            <p className="text-eyebrow text-orange-text uppercase">
              Eyebrow — France · Afrique · New York
            </p>
            <p className="text-body-lg text-ink-soft">
              Body large — Le tarif au kilo de votre destination s’applique.
            </p>
            <p className="text-body text-ink">Body — texte courant du site.</p>
            <p className="text-body-sm text-ink-soft">Body small — texte secondaire.</p>
            <p className="text-caption text-muted">Caption — mentions et légendes.</p>
          </div>
          <p className="text-caption text-muted mt-5">
            {Object.keys(brandTypeScale).length} niveaux définis dans les tokens.
          </p>
        </Bloc>

        <Bloc
          titre="Boutons"
          note="Les boutons orange portent du texte NAVY, y compris au survol : le blanc sur #F18321 est à 2,62, très en dessous du seuil AA de 4,5. Hauteur minimale 52 px (44 px en taille sm)."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button>Demander un devis</Button>
            <Button variant="outline">Voir les tarifs</Button>
            <Button variant="whatsapp">Écrire sur WhatsApp</Button>
            <Button size="sm">Taille sm</Button>
            <Button disabled>Désactivé</Button>
          </div>
          <div data-tone="navy" className="bg-navy mt-5 rounded-lg p-6">
            <p className="text-caption mb-3 text-white/70">Sur fond navy :</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="onNavy">Voir les tarifs</Button>
              <Button variant="ghostNavy">Demander un devis</Button>
            </div>
          </div>
          <div className="mt-5 max-w-sm">
            <Button block>Pleine largeur (block)</Button>
          </div>
        </Bloc>

        <Bloc
          titre="Cartes et alternance des surfaces"
          note="Règle encodée une seule fois : sur fond blanc les cartes passent en sable, sur fond sable en blanc. Aucun composant n’a à savoir sur quel fond il est posé."
        >
          <Card>
            <p className="text-body-sm text-ink-soft">
              Cette carte est dans une section <b>blanche</b> : elle s’affiche en sable.
            </p>
          </Card>
          <Card surface="plain" className="mt-4">
            <p className="text-body-sm text-ink-soft">
              Carte <code>surface=&quot;plain&quot;</code> : blanche quoi qu’il arrive
              (formulaires).
            </p>
          </Card>
        </Bloc>

        <Bloc
          titre="Pastilles de statut"
          note="Les huit variantes des tokens. Toutes vérifiées à 4,5 ou plus sur leur fond."
        >
          <div className="flex flex-wrap gap-2">
            <Badge tone="devisNouveau">Devis à chiffrer</Badge>
            <Badge tone="devisChiffre">Devis envoyé</Badge>
            <Badge tone="enTransit">En transit</Badge>
            <Badge tone="arrive">Arrivé</Badge>
            <Badge tone="disponible">Disponible au retrait</Badge>
            <Badge tone="retire">Retiré</Badge>
            <Badge tone="litige">Litige</Badge>
            <Badge tone="complet">Départ complet</Badge>
          </div>
        </Bloc>

        <Bloc titre="Encarts">
          <Alert className="mb-4">
            <b>Point de retrait —</b> votre destinataire sera prévenu dès que le colis sera
            disponible. Une pièce d’identité sera demandée au retrait.
          </Alert>
          <Alert tone="warn">
            <b>Déposez en avance.</b> Un colis déposé après la clôture part au départ suivant.
          </Alert>
        </Bloc>

        <Bloc
          titre="Frise de suivi"
          note="Utilisée sur /suivi. L’étape en cours porte aria-current."
        >
          <Timeline
            items={[
              { titre: 'Reçu au bureau', detail: '14 août 2026 · 11h20', etat: 'fait' },
              { titre: 'En préparation', detail: '16 août 2026 · 09h05', etat: 'fait' },
              { titre: 'Expédié', detail: '18 août 2026 · 07h40', etat: 'fait' },
              { titre: 'En transit', detail: 'Depuis le 18 août 2026', etat: 'encours' },
              { titre: 'Arrivé à destination', detail: 'À venir', etat: 'avenir' },
              { titre: 'Disponible au retrait', detail: 'À venir', etat: 'avenir' },
            ]}
          />
        </Bloc>

        <Bloc titre="Liste de définitions">
          <KeyValueList
            items={[
              { label: 'Destination', value: 'Cotonou, Bénin' },
              { label: 'Destinataire', value: 'Aminata D.' },
              { label: 'Départ', value: '18 août 2026' },
              { label: 'Montant', value: '187,50 €', emphasis: true },
            ]}
          />
        </Bloc>

        <Bloc
          titre="Tableau"
          note="Défilement horizontal encapsulé : la page ne déborde jamais sur téléphone."
        >
          <DataTable
            caption="Exemple de calendrier de départs"
            head={['Destination', 'Départ', 'Clôture', 'Tarif', 'Statut']}
          >
            <tr>
              <Td className="text-navy font-bold">Abidjan</Td>
              <Td>jeu. 28 août</Td>
              <Td className="text-navy font-bold">26 août</Td>
              <Td className="text-orange-text font-extrabold whitespace-nowrap">15 €/kg</Td>
              <Td>
                <Badge tone="enTransit">Clôture proche</Badge>
              </Td>
            </tr>
            <tr>
              <Td className="text-navy font-bold">Dakar</Td>
              <Td>ven. 29 août</Td>
              <Td className="text-navy font-bold">27 août</Td>
              <Td className="text-orange-text font-extrabold whitespace-nowrap">12 €/kg</Td>
              <Td>
                <Badge tone="disponible">Places disponibles</Badge>
              </Td>
            </tr>
          </DataTable>
        </Bloc>

        <Bloc
          titre="Accordéon"
          note="details/summary natifs : clavier et sans-JavaScript d’office."
        >
          <Accordion>
            <AccordionItem
              question="Dois-je demander un devis pour un colis ordinaire ?"
              defaultOpen
            >
              <p>
                Non. Pour un colis ordinaire déposé au bureau, le tarif au kilo de votre destination
                s’applique : vous n’avez qu’à venir le déposer.
              </p>
            </AccordionItem>
            <AccordionItem question="Quand le devis est-il nécessaire ?">
              <p>
                Pour le matériel électronique, les articles de valeur, les colis encombrants, ou si
                vous nous expédiez votre colis à distance.
              </p>
            </AccordionItem>
          </Accordion>
        </Bloc>
      </Section>

      <Section tone="sand">
        <SectionHeading
          eyebrow="Section sable"
          title="La respiration, une section sur deux"
          lede="Les cartes s’inversent automatiquement : blanches sur ce fond."
          className="mb-8"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CountryChip
            href="/destinations/abidjan"
            flag="🇨🇮"
            ville="Abidjan"
            pays="Côte d’Ivoire"
            prixParKg={15}
          />
          <CountryChip
            href="/destinations/dakar"
            flag="🇸🇳"
            ville="Dakar"
            pays="Sénégal"
            prixParKg={12}
          />
          <CountryChip
            href="/destinations/brazzaville"
            flag="🇨🇬"
            ville="Brazzaville"
            pays="Congo"
            prixParKg={20}
          />
          <CountryChip
            href="/destinations/new-york"
            flag="🇺🇸"
            ville="New York"
            pays="depuis Abidjan"
            prixParKg={20}
            featured
          />
        </div>

        <div className="mt-10">
          <Stepper
            steps={[
              { titre: 'Vous préparez', texte: 'Emballez solidement, pesez si vous pouvez.' },
              {
                titre: 'Vous déposez',
                texte: 'Au bureau de Rouen, ou vous nous expédiez le colis.',
              },
              { titre: 'Nous expédions', texte: 'Départ hebdomadaire vers votre destination.' },
              {
                titre: 'On retire',
                texte: 'Votre destinataire récupère le colis au point de retrait.',
              },
            ]}
          />
        </div>
      </Section>

      <Section tone="white">
        <Bloc
          titre="Tableau d’embarquement"
          note="La signature visuelle de l’accueil, et l’un des rares blocs navy pleine largeur autorisés."
        >
          <div className="max-w-xl">
            <DepartBoard
              live="Mis à jour en direct"
              footer={
                <>
                  <p className="text-caption text-white/60">
                    Un colis déposé après la clôture part au départ suivant.
                  </p>
                  <a
                    href="/departs"
                    className="text-body-sm text-orange inline-flex min-h-11 items-center font-semibold no-underline"
                  >
                    Tous les départs →
                  </a>
                </>
              }
            >
              <DepartRow
                destination="Abidjan"
                meta="Départ jeu. 28 août · dépôts jusqu’au 26"
                prixParKg={15}
                statut={<Badge tone="enTransit">Clôture proche</Badge>}
              />
              <DepartRow
                destination="Dakar"
                meta="Départ ven. 29 août · dépôts jusqu’au 27"
                prixParKg={12}
                statut={<Badge tone="disponible">Places disponibles</Badge>}
              />
            </DepartBoard>
          </div>
        </Bloc>

        <Bloc
          titre="Emplacements d’images"
          note="Tant que la photo n’est pas fournie, le cadre affiche le nom de fichier attendu. Les vraies photos seront déposées dans public/images/ avec ces noms, sans modification de code."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageFrame fichier="destination-abidjan.jpg" alt="Abidjan" ratio="wide" />
            <ImageFrame fichier="magasin-abidjan.jpg" alt="Le magasin d’Abidjan" ratio="card" />
          </div>
        </Bloc>

        <Bloc
          titre="Formulaires"
          note="Champs à 52 px de haut, focus orange net, erreurs reliées par aria-describedby."
        >
          <Card surface="plain" className="max-w-2xl">
            <div className="grid gap-x-4.5 sm:grid-cols-2">
              <TextField id="sg-nom" label="Nom et prénom" required placeholder="Aminata Diallo" />
              <TextField
                id="sg-tel"
                label="Téléphone"
                type="tel"
                required
                hint="Nous vous joignons par WhatsApp de préférence."
                placeholder="+33 6 12 34 56 78"
              />
            </div>
            <SelectField
              id="sg-dest"
              label="Ville d’arrivée"
              required
              placeholder="Choisissez une ville"
              options={[
                { value: 'abidjan', label: 'Abidjan' },
                { value: 'dakar', label: 'Dakar' },
                { value: 'thies', label: 'Thiès' },
              ]}
            />
            <TextField
              id="sg-poids"
              label="Poids estimé"
              type="number"
              error="Indiquez un poids, même approximatif."
              hint="En kilogrammes."
            />
            <TextareaField
              id="sg-desc"
              label="Description du contenu"
              hint="Plus vous êtes précis, plus le chiffrage est juste."
            />
            <DemoRadioCards />
            <PhotoUpload />
            <Checkbox id="sg-rgpd" required>
              J’accepte que mes données soient utilisées pour traiter ma demande.
            </Checkbox>
            <Button block>Envoyer ma demande</Button>
          </Card>
        </Bloc>
      </Section>

      <Section tone="sand">
        <SectionHeading eyebrow="Back-office" title="Composants d’exploitation" className="mb-8" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Colis non rattachés"
            valeur={7}
            detail="À traiter aujourd’hui"
            alerte
            href="/admin/receptions"
          />
          <StatCard
            label="Devis en attente"
            valeur={4}
            detail="Le plus ancien : 2 jours"
            href="/admin/devis"
          />
          <StatCard
            label="Créances"
            valeur="1 240 €"
            detail="6 colis partis non payés"
            alerte
            href="/admin/creances"
          />
          <StatCard
            label="Départs à venir"
            valeur={3}
            detail="Prochain : jeudi"
            href="/admin/departs"
          />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="overflow-hidden rounded-lg">
            <Sidebar role="OPERATEUR" />
            <p className="text-caption text-muted bg-white p-3">
              Rôle OPERATEUR : tarifs, factures, encaissements, créances et paramètres sont absents.
              Le masquage n’est qu’un confort — la vérification a lieu côté serveur.
            </p>
          </div>
          <div className="border-line overflow-hidden rounded-lg border bg-white">
            <Topbar
              titre="Colis ENI-2026-00123"
              sousTitre="Reçu le 14 août · mode commande en ligne"
              actions={<Button size="sm">Peser et enregistrer</Button>}
            />
            <div className="space-y-5 p-5">
              <DemoStatusSelect />
              <div className="flex flex-wrap gap-3">
                <DemoModal />
                <DemoToast />
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="white">
        <CtaBand
          titre="Un colis à envoyer ?"
          texte="Colis ordinaire : le tarif de votre destination s’applique, venez le déposer. Cas particulier : envoyez-nous des photos, réponse sous 24 heures."
          actions={
            <>
              <Button href="/tarifs" variant="onNavy">
                Voir les tarifs
              </Button>
              <Button href="/devis" variant="ghostNavy">
                Demander un devis
              </Button>
            </>
          }
        />
      </Section>

      <Footer
        destinations={[
          { href: '/destinations/abidjan', label: 'Abidjan' },
          { href: '/destinations/dakar', label: 'Dakar' },
          { href: '/destinations/new-york', label: 'New York' },
        ]}
      />
      <WhatsAppFloat />
    </>
  )
}
