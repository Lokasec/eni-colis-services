import type { Metadata } from 'next'
import Link from 'next/link'
import { Accordion, AccordionItem } from '@/components/ui/accordion'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CtaBand } from '@/components/ui/cta-band'
import { PageHeader } from '@/components/ui/page-header'
import { Section } from '@/components/ui/section'
import { SectionHeading } from '@/components/ui/section-heading'
import { Stepper } from '@/components/ui/stepper'
import { Todo } from '@/components/ui/todo'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Faites-vous livrer chez nous',
  description:
    'La plupart des marchands français ne livrent pas en Afrique. Obtenez une adresse de livraison en France, commandez, et récupérez votre colis chez nous. Paiement au retrait, en monnaie locale.',
  alternates: { canonical: '/recevoir' },
}

export default function Recevoir() {
  return (
    <>
      <PageHeader
        crumb={[{ href: '/', label: 'Accueil' }, { label: 'Recevoir mes achats' }]}
        eyebrow="Vous vivez en Afrique"
        titre="Faites-vous livrer chez nous"
        lede="La plupart des marchands français ne livrent pas en Afrique. Nous vous donnons une adresse de livraison en France : vous commandez, on reçoit, on achemine, vous récupérez votre colis et vous payez sur place."
      />

      {/* Le problème et la solution, face à face */}
      <Section tone="white">
        <div className="grid gap-4.5 lg:grid-cols-2">
          <article className="border-line border-t-line-strong rounded-lg border border-t-[5px] bg-[var(--surface-card)] p-6 md:p-8">
            <span className="rounded-pill bg-sand-deep text-muted mb-3.5 inline-block px-3 py-1.5 text-[0.6875rem] font-bold tracking-[0.08em] uppercase">
              Le problème
            </span>
            <h2 className="text-navy mb-3 text-[1.375rem] font-extrabold">
              « Ne livre pas dans votre pays »
            </h2>
            <p className="text-body-sm text-ink-soft">
              Vous trouvez ce que vous cherchez sur un site français, vous remplissez votre panier,
              et au moment de valider la livraison votre pays n&apos;apparaît pas dans la liste. Ou
              alors les frais annoncés dépassent le prix de l&apos;article.
            </p>
          </article>

          <article className="border-line border-t-orange rounded-lg border border-t-[5px] bg-[var(--surface-card)] p-6 md:p-8">
            <span className="rounded-pill bg-sand-deep text-orange-text mb-3.5 inline-block px-3 py-1.5 text-[0.6875rem] font-bold tracking-[0.08em] uppercase">
              La solution
            </span>
            <h2 className="text-navy mb-3 text-[1.375rem] font-extrabold">Une adresse en France</h2>
            <p className="text-body-sm text-ink-soft mb-5">
              Vous vous inscrivez, nous vous attribuons un numéro client et une adresse de livraison
              en France. Vous l&apos;utilisez comme adresse de livraison sur n&apos;importe quel
              site marchand.
            </p>
            <Button href="/inscription" size="sm">
              Obtenir mon adresse
            </Button>
          </article>
        </div>
      </Section>

      {/* Le parcours */}
      <Section tone="sand">
        <SectionHeading eyebrow="Le parcours" title="Comment ça marche" className="mb-9" />
        <Stepper
          steps={[
            {
              titre: 'Je m’inscris',
              texte:
                'Deux minutes. Vous recevez votre numéro client et l’adresse complète à utiliser pour vos livraisons.',
            },
            {
              titre: 'Je commande',
              texte:
                'Sur le site de votre choix. Vous indiquez notre adresse comme adresse de livraison, avec votre numéro client sur la ligne du dessous.',
            },
            {
              titre: 'Nous recevons',
              texte:
                'Nous identifions votre colis grâce à votre numéro, nous le pesons et nous vous envoyons un devis estimatif.',
            },
            {
              titre: 'Je récupère et je paie',
              texte:
                'Le colis part au prochain départ hebdomadaire. Vous le retirez à notre magasin et vous réglez sur place, en monnaie locale.',
            },
          ]}
        />
      </Section>

      {/* L'adresse */}
      <Section tone="white">
        <SectionHeading
          eyebrow="Votre adresse"
          title="À quoi elle ressemble"
          lede="Une fois inscrit, voici le format exact à saisir dans les champs de livraison de vos commandes."
          className="mb-9"
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card surface="plain">
            <span className="text-muted mb-3 block text-xs font-bold tracking-[0.09em] uppercase">
              Exemple
            </span>
            <div className="border-line bg-sand text-caption text-navy rounded-md border px-5 py-4.5 font-mono leading-[1.9]">
              <span className="text-muted">Nom :</span>{' '}
              <b className="bg-sand-deep rounded-sm px-1.5 py-0.5">Eni Aïcha 42</b>
              <br />
              <span className="text-muted">Prénom :</span> colis service
              <br />
              <span className="text-muted">Adresse :</span> {site.adresse.rue}
              <br />
              <span className="text-muted">Code postal :</span> {site.adresse.codePostal}
              <br />
              <span className="text-muted">Ville :</span> {site.adresse.ville}
              <br />
              <span className="text-muted">Département :</span> Seine-Maritime
              <br />
              <span className="text-muted">Téléphone :</span> {site.telephone}
              <br />
              <span className="text-muted">E-mail :</span> le vôtre
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <div className="border-line bg-sand rounded-lg border p-5">
              <h3 className="text-h3 mb-2">Le champ « Nom » est votre identifiant</h3>
              <p className="text-body-sm text-ink-soft">
                C&apos;est lui qui nous permet de savoir à qui appartient le carton. Saisissez « Eni
                » suivi de votre prénom et de votre numéro de client — celui que nous vous
                attribuons à l&apos;inscription. Un colis arrivé sans ce marquage est un carton
                anonyme parmi d&apos;autres.
              </p>
            </div>
            <div className="border-line bg-sand rounded-lg border p-5">
              <h3 className="text-h3 mb-2">Le téléphone est le nôtre, pas le vôtre</h3>
              <p className="text-body-sm text-ink-soft">
                C&apos;est normal : c&apos;est nous qui recevons le colis, donc c&apos;est nous que
                le livreur doit pouvoir joindre. En revanche, indiquez bien votre propre adresse
                e-mail : vous recevrez ainsi les notifications du marchand et pourrez suivre votre
                livraison jusqu&apos;à notre bureau.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Le paiement */}
      <Section tone="sand">
        <SectionHeading
          eyebrow="Le paiement"
          title="Vous payez au retrait, en monnaie locale"
          className="mb-7"
        />
        <div className="text-body text-ink-soft max-w-[70ch] space-y-4">
          <p>
            Contrairement à un envoi classique, vous ne payez rien au moment de la commande ni au
            départ. Le règlement se fait <strong className="text-navy">à l&apos;arrivée</strong>,
            quand vous venez chercher votre colis à notre magasin.
          </p>
          <p>
            Vous recevez d&apos;abord un devis estimatif dès que votre colis arrive chez nous,
            calculé sur son poids réel. À l&apos;arrivée, une facture définitive vous est remise,
            indiquant le montant en euros et son équivalent en monnaie locale.
          </p>
          <p>
            Pour les pays de la zone franc CFA, la conversion se fait au taux officiel fixe de{' '}
            <strong className="text-navy">1 € = 655,957 FCFA</strong> : le montant ne bouge pas
            entre l&apos;émission du devis et le paiement.
          </p>
        </div>
        <Alert tone="warn" className="mt-6">
          <b>Le colis est remis contre paiement.</b> Nous vous conseillons de venir le retirer
          rapidement : passé 30 jours, des frais de garde peuvent s&apos;appliquer.
        </Alert>
      </Section>

      {/* Bon à savoir */}
      <Section tone="white">
        <SectionHeading eyebrow="Bon à savoir" title="Avant de commander" className="mb-7" />
        <Accordion>
          <AccordionItem question="Sur quels sites puis-je commander ?">
            <p>
              Sur tout marchand qui livre en France : vêtements, chaussures, électronique,
              cosmétiques, pièces détachées, puériculture. <Todo /> Liste des marchands
              éventuellement refusés.
            </p>
          </AccordionItem>
          <AccordionItem question="Combien coûte le service ?">
            <p>
              Vous payez le tarif au kilo de votre destination, comme pour tout envoi. La réception
              et le stockage temporaire de votre colis ne sont pas facturés en supplément. Les frais
              de livraison du marchand jusqu&apos;à notre adresse restent à votre charge : ils sont
              réglés au moment de votre commande, directement sur le site.
            </p>
          </AccordionItem>
          <AccordionItem question="Et si je commande plusieurs articles ?">
            <p>
              Nous pouvons regrouper plusieurs colis reçus pour un même client sur un seul envoi.
              C&apos;est souvent plus avantageux : un seul acheminement, un seul retrait.
              Signalez-nous que d&apos;autres commandes sont en route.
            </p>
          </AccordionItem>
          <AccordionItem question="Que se passe-t-il si mon colis contient un article interdit ?">
            <p>
              Les articles interdits en fret aérien ne peuvent pas être acheminés : batteries
              lithium seules, aérosols, liquides inflammables, produits périssables, contrefaçons.
              Nous vous prévenons et l&apos;article reste à votre disposition à notre bureau.
              Vérifiez le contenu de votre commande avant de la passer — consultez la liste complète
              en{' '}
              <Link href="/faq" className="text-orange-text font-semibold">
                FAQ
              </Link>
              .
            </p>
          </AccordionItem>
          <AccordionItem question="Puis-je suivre mon colis ?">
            <p>
              Oui. Dès que votre colis est enregistré chez nous, vous recevez un code de suivi
              commençant par ENI. Vous suivez son acheminement sur la page{' '}
              <Link href="/suivi" className="text-orange-text font-semibold">
                Suivi
              </Link>{' '}
              et vous êtes prévenu par e-mail et WhatsApp dès qu&apos;il est disponible au retrait.
            </p>
          </AccordionItem>
        </Accordion>
      </Section>

      <Section tone="sand">
        <CtaBand
          titre="Obtenez votre adresse en France"
          texte="Inscription en deux minutes. Vous recevez immédiatement votre numéro client et l’adresse à utiliser pour vos commandes."
          actions={
            <>
              <Button href="/inscription" variant="onNavy">
                M&apos;inscrire gratuitement
              </Button>
              <Button href="/tarifs" variant="ghostNavy">
                Voir les tarifs
              </Button>
            </>
          }
        />
      </Section>
    </>
  )
}
