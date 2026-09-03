import type { Metadata } from 'next'
import Link from 'next/link'
import { Accordion, AccordionItem } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Section } from '@/components/ui/section'
import { Todo } from '@/components/ui/todo'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Questions fréquentes',
  description:
    'Tarifs, objets interdits en fret aérien, articles de valeur, délais, retrait du colis : les réponses aux questions les plus courantes.',
  alternates: { canonical: '/faq' },
}

type Question = { question: string; reponse: React.ReactNode }

const groupes: Array<{ titre: string; questions: Question[] }> = [
  {
    titre: 'Avant l’envoi',
    questions: [
      {
        question: 'Comment obtenir un prix ?',
        reponse: (
          <p>
            Remplissez le formulaire de devis avec une à trois photos de votre colis. Nous vous
            répondons sous 24 heures avec un montant ferme, valable sept jours.
          </p>
        ),
      },
      {
        question: 'Pourquoi n’y a-t-il pas de calculateur en ligne ?',
        reponse: (
          <p>
            Parce qu&apos;un prix juste dépend de plus de choses que le poids : l&apos;encombrement,
            la nature du contenu, le conditionnement nécessaire. Nous préférons voir votre colis et
            vous annoncer un prix que nous tiendrons, plutôt qu&apos;une estimation qui changerait
            au comptoir.
          </p>
        ),
      },
      {
        question: 'Dois-je fermer mon colis avant de venir ?',
        reponse: (
          <p>
            Non. Présentez-vous avec un colis <strong>ouvert</strong> : nous devons voir le contenu
            au moment du dépôt. C&apos;est une obligation en fret aérien.
          </p>
        ),
      },
      {
        question: 'Puis-je envoyer depuis n’importe quelle ville ?',
        reponse: (
          <p>
            Oui. Deux possibilités : vous déposez votre colis à notre bureau, ou vous nous
            l&apos;expédiez par le transporteur de votre choix. Dans le second cas, un devis
            préalable est obligatoire — nous ne pouvons pas peser votre colis à distance.
          </p>
        ),
      },
      {
        question: 'Comment expédier mon colis si je suis loin ?',
        reponse: (
          <p>
            Demandez d&apos;abord un devis avec photos. Une fois le montant validé, envoyez-nous le
            colis avec votre numéro de devis collé bien visible dessus. Nous le contrôlons à
            réception, vous recevez votre code de suivi, et il part au départ suivant. Les frais
            d&apos;acheminement jusqu&apos;à notre bureau sont à votre charge.
          </p>
        ),
      },
      {
        question: 'Où se trouve votre bureau ?',
        reponse: (
          <p>
            67 rue Saint-Julien, 76100 Rouen. Ouvert de {site.horaires.plage} — jours
            d&apos;ouverture : <Todo />
          </p>
        ),
      },
      {
        question: 'Combien de temps mon devis reste-t-il valable ?',
        reponse: (
          <p>
            Sept jours à compter de son envoi. Au-delà, faites une nouvelle demande — les tarifs
            peuvent avoir évolué.
          </p>
        ),
      },
    ],
  },
  {
    titre: 'Ce que l’on peut envoyer',
    questions: [
      {
        question: 'Qu’est-ce qui est interdit en fret aérien ?',
        reponse: (
          <>
            <p>
              Sont strictement refusés : batteries lithium non conformes ou expédiées seules,
              aérosols et bombes de peinture, liquides inflammables, gaz sous pression, produits
              périssables, contrefaçons, espèces animales et végétales protégées, armes et
              munitions, stupéfiants, argent liquide.
            </p>
            <p>
              Cette liste n&apos;est pas exhaustive. En cas de doute, posez-nous la question avant
              de vous déplacer.
            </p>
          </>
        ),
      },
      {
        question: 'Puis-je envoyer de la nourriture ?',
        reponse: (
          <p>
            Les denrées non périssables et emballées d&apos;origine sont acceptées. Les produits
            frais, surgelés ou faits maison sont refusés.
          </p>
        ),
      },
      {
        question: 'Puis-je envoyer un téléphone ou un ordinateur ?',
        reponse: (
          <p>
            Oui, à condition que la batterie reste dans l&apos;appareil. Une batterie expédiée seule
            est refusée. La tarification de l&apos;électronique se fait à l&apos;unité :
            contactez-nous.
          </p>
        ),
      },
      {
        question: 'Que se passe-t-il si mon colis contient un article interdit ?',
        reponse: (
          <p>
            Il est refusé au dépôt. Si l&apos;article n&apos;est découvert qu&apos;après, il peut
            être saisi par les autorités douanières, sans indemnisation.
          </p>
        ),
      },
    ],
  },
  {
    titre: 'Articles de valeur',
    questions: [
      {
        question: 'Comment sont tarifés les articles de marque ?',
        reponse: (
          <p>
            15 % de la valeur d&apos;achat. Le poids n&apos;entre pas dans ce calcul : un article
            lourd et un article léger de même valeur coûtent le même prix.
          </p>
        ),
      },
      {
        question: 'Un justificatif est-il obligatoire ?',
        reponse: (
          <p>
            Oui, sans exception. Facture ou preuve d&apos;achat pour tout article déclaré de valeur.
            C&apos;est ce qui nous permet de calculer le tarif et de traiter une éventuelle
            réclamation.
          </p>
        ),
      },
      {
        question: 'Suis-je assuré si le colis se perd ?',
        reponse: (
          <p>
            La majoration appliquée aux articles de valeur correspond aux précautions de manutention
            et de traçabilité renforcées. Elle ne constitue pas une assurance. En cas de perte ou
            d&apos;avarie, l&apos;indemnisation est plafonnée : <Todo /> Pour une couverture
            supérieure, souscrivez une assurance auprès d&apos;un assureur.
          </p>
        ),
      },
    ],
  },
  {
    titre: 'Pendant le transport',
    questions: [
      {
        question: 'Combien de temps dure l’acheminement ?',
        reponse: (
          <p>
            Le délai varie selon la destination. Il est indiqué sur chaque fiche destination et
            rappelé dans votre devis. <Todo />
          </p>
        ),
      },
      {
        question: 'Comment suivre mon colis ?',
        reponse: (
          <p>
            Avec le code figurant sur votre reçu, sur la page{' '}
            <Link href="/suivi" className="text-orange-text font-semibold">
              Suivi
            </Link>
            . Vous recevez aussi un e-mail à chaque changement d&apos;étape.
          </p>
        ),
      },
      {
        question: 'Mon colis n’a pas bougé depuis plusieurs jours, est-ce normal ?',
        reponse: (
          <p>
            Le groupage implique des temps d&apos;attente : votre colis peut rester quelques jours
            avant le départ, le temps que le chargement soit complet. Si le délai annoncé est
            dépassé, contactez-nous.
          </p>
        ),
      },
    ],
  },
  {
    titre: 'Retrait du colis',
    questions: [
      {
        question: 'Qui peut retirer le colis ?',
        reponse: (
          <p>
            Le destinataire indiqué au dépôt, sur présentation d&apos;une pièce d&apos;identité et
            du code de suivi.
          </p>
        ),
      },
      {
        question: 'Le destinataire est-il prévenu ?',
        reponse: (
          <p>
            Oui, par e-mail et par WhatsApp dès que le colis est disponible au point de retrait.
          </p>
        ),
      },
      {
        question: 'Combien de temps le colis reste-t-il au point de retrait ?',
        reponse: (
          <p>
            <Todo />
          </p>
        ),
      },
      {
        question: 'Livrez-vous à domicile ?',
        reponse: (
          <p>
            Non. Les colis sont mis à disposition dans un point de retrait, dans la ville de
            destination.
          </p>
        ),
      },
    ],
  },
]

export default function Faq() {
  // Données structurées FAQPage — le texte reprend celui affiché, sans le
  // balisage, et sans les mentions [À COMPLÉTER].
  const donneesStructurees = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: groupes.flatMap((groupe) =>
      groupe.questions
        // Une réponse encore incomplète n'a rien à faire dans un résultat
        // de recherche : seules les questions résumées sont publiées.
        .filter((q) => resumerReponse(q.question) !== '')
        .map((q) => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: { '@type': 'Answer', text: resumerReponse(q.question) },
        })),
    ),
  }

  return (
    <>
      <PageHeader
        crumb={[{ href: '/', label: 'Accueil' }, { label: 'FAQ' }]}
        eyebrow="Vos questions"
        titre="Questions fréquentes"
      />

      <Section tone="white" containerClassName="max-w-[820px]">
        <div className="flex flex-col gap-9">
          {groupes.map((groupe) => (
            <div key={groupe.titre}>
              <h2 className="text-h2 mb-4">{groupe.titre}</h2>
              <Accordion>
                {groupe.questions.map((q) => (
                  <AccordionItem key={q.question} question={q.question}>
                    {q.reponse}
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="border-line bg-sand mt-11 rounded-lg border p-6">
          <h2 className="text-h3">Une question qui n&apos;est pas ici ?</h2>
          <p className="text-body-sm text-ink-soft mt-2">
            Écrivez-nous, nous répondons vite. Pour obtenir un prix, passez plutôt par le formulaire
            de devis : les photos nous permettent de vous répondre bien plus vite.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href="/devis" size="sm">
              Demander un devis
            </Button>
            <Button href="/contact" variant="outline" size="sm">
              Nous contacter
            </Button>
          </div>
        </div>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees) }}
      />
    </>
  )
}

/**
 * Version texte des réponses pour les données structurées.
 * Écrite à part : le balisage JSX n'est pas sérialisable, et une réponse
 * contenant « À COMPLÉTER » n'a rien à faire dans un résultat Google.
 */
function resumerReponse(question: string): string {
  const resumes: Record<string, string> = {
    'Comment obtenir un prix ?':
      'Remplissez le formulaire de devis avec une à trois photos de votre colis. Nous répondons sous 24 heures avec un montant ferme, valable sept jours.',
    'Pourquoi n’y a-t-il pas de calculateur en ligne ?':
      "Un prix juste dépend de plus de choses que le poids : l'encombrement, la nature du contenu, le conditionnement nécessaire. Nous préférons voir le colis et annoncer un prix que nous tiendrons.",
    'Dois-je fermer mon colis avant de venir ?':
      'Non. Présentez-vous avec un colis ouvert : nous devons voir le contenu au moment du dépôt. C’est une obligation en fret aérien.',
    'Puis-je envoyer depuis n’importe quelle ville ?':
      'Oui. Vous déposez au bureau, ou vous nous expédiez le colis par le transporteur de votre choix. Dans ce second cas, un devis préalable est obligatoire.',
    'Comment expédier mon colis si je suis loin ?':
      'Demandez d’abord un devis avec photos, puis envoyez-nous le colis avec le numéro de devis collé dessus. Les frais d’acheminement jusqu’à notre bureau sont à votre charge.',
    'Combien de temps mon devis reste-t-il valable ?': 'Sept jours à compter de son envoi.',
    'Qu’est-ce qui est interdit en fret aérien ?':
      'Batteries lithium non conformes ou seules, aérosols, liquides inflammables, gaz sous pression, produits périssables, contrefaçons, espèces protégées, armes, stupéfiants, argent liquide. Liste non exhaustive.',
    'Puis-je envoyer de la nourriture ?':
      'Les denrées non périssables et emballées d’origine sont acceptées. Les produits frais, surgelés ou faits maison sont refusés.',
    'Puis-je envoyer un téléphone ou un ordinateur ?':
      'Oui, à condition que la batterie reste dans l’appareil. La tarification de l’électronique se fait à l’unité.',
    'Que se passe-t-il si mon colis contient un article interdit ?':
      'Il est refusé au dépôt. Découvert plus tard, il peut être saisi par les autorités douanières, sans indemnisation.',
    'Comment sont tarifés les articles de marque ?':
      '15 % de la valeur d’achat. Le poids n’entre pas dans ce calcul.',
    'Un justificatif est-il obligatoire ?':
      'Oui, sans exception : facture ou preuve d’achat pour tout article déclaré de valeur.',
    'Comment suivre mon colis ?':
      'Avec le code figurant sur votre reçu, sur la page Suivi. Vous recevez aussi un e-mail à chaque changement d’étape.',
    'Mon colis n’a pas bougé depuis plusieurs jours, est-ce normal ?':
      'Le groupage implique des temps d’attente, le temps que le chargement soit complet. Si le délai annoncé est dépassé, contactez-nous.',
    'Qui peut retirer le colis ?':
      'Le destinataire indiqué au dépôt, sur présentation d’une pièce d’identité et du code de suivi.',
    'Le destinataire est-il prévenu ?':
      'Oui, par e-mail et par WhatsApp dès que le colis est disponible au point de retrait.',
    'Livrez-vous à domicile ?':
      'Non. Les colis sont mis à disposition dans un point de retrait, dans la ville de destination.',
  }
  return resumes[question] ?? ''
}
