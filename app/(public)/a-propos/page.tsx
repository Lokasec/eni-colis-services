import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { CtaBand } from '@/components/ui/cta-band'
import { ImageFrame } from '@/components/ui/image-frame'
import { PageHeader } from '@/components/ui/page-header'
import { Section } from '@/components/ui/section'
import { Todo } from '@/components/ui/todo'

export const metadata: Metadata = {
  title: 'À propos',
  description:
    'ENI Colis Services expédie des colis entre la France, l’Afrique et New York. Notre méthode : voir avant de chiffrer, grouper pour faire baisser le coût.',
  alternates: { canonical: '/a-propos' },
}

export default function APropos() {
  return (
    <>
      <PageHeader
        crumb={[{ href: '/', label: 'Accueil' }, { label: 'À propos' }]}
        eyebrow="Qui nous sommes"
        titre="ENI Colis Services"
        lede="Nous expédions des colis entre la France, l’Afrique et New York. Notre métier tient en une promesse simple : vous dire ce que ça coûte, tenir ce prix, et acheminer votre colis à bon port."
      />

      <Section tone="white">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:gap-12">
          <div className="max-w-[70ch]">
            <div className="border-line bg-sand rounded-lg border p-6">
              <p className="text-body-sm text-ink-soft">
                <Todo /> Histoire de l&apos;entreprise, parcours de la fondatrice, année de
                création, ancrage local. Ce texte doit venir de la cliente : il n&apos;est pas
                inventé.
              </p>
            </div>

            <h2 className="text-h2 mt-10">Comment nous travaillons</h2>
            <div className="mt-6 flex flex-col gap-6">
              {[
                {
                  titre: 'Nous voyons avant de chiffrer.',
                  texte:
                    'Pas d’estimation approximative qui double au comptoir. Vous nous envoyez des photos, nous vous donnons un prix ferme.',
                },
                {
                  titre: 'Nous groupons pour faire baisser le coût.',
                  texte:
                    'Le groupage aérien consiste à rassembler les colis de plusieurs clients sur un même envoi. C’est ce qui rend le fret aérien accessible.',
                },
                {
                  titre: 'Nous allons plus loin que la plupart.',
                  texte:
                    'Sept pays d’Afrique de l’Ouest et centrale, plus la liaison entre Abidjan et New York — une desserte que peu d’opérateurs proposent.',
                },
              ].map((point) => (
                <div key={point.titre} className="border-orange border-l-4 pl-5">
                  <h3 className="text-h3">{point.titre}</h3>
                  <p className="text-body text-ink-soft mt-1.5">{point.texte}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <ImageFrame fichier="bureau-rouen.jpg" alt="Le bureau de Rouen" ratio="card" />
            <ImageFrame fichier="magasin-abidjan.jpg" alt="Le magasin d’Abidjan" ratio="card" />
          </div>
        </div>
      </Section>

      <Section tone="sand">
        <CtaBand
          titre="Un colis à envoyer ?"
          texte="Photographiez-le, dites-nous où il va. Vous aurez votre prix sous 24 heures."
          actions={
            <>
              <Button href="/devis" variant="onNavy">
                Demander un devis
              </Button>
              <Button href="/destinations" variant="ghostNavy">
                Voir nos destinations
              </Button>
            </>
          }
        />
      </Section>
    </>
  )
}
