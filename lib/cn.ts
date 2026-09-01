import { extendTailwindMerge } from 'tailwind-merge'
import { brandTypeScale } from '@/design/tokens.generated'

type ClassValue = string | false | null | undefined

/** camelCase -> kebab-case, identique à la transformation de scripts/build-brand.mjs */
const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

/**
 * Noms de notre échelle typographique : display, h1, h2, h3, eyebrow,
 * body-lg, body, body-sm, caption, button.
 *
 * Sans cette déclaration, tailwind-merge ne peut pas savoir que
 * `text-button` est une TAILLE et `text-navy` une COULEUR : il les range
 * dans le même groupe et supprime la première. Un bouton perdait ainsi
 * son texte navy et retombait sur la couleur héritée — au détriment du
 * contraste, précisément ce que la charte impose de garantir.
 *
 * La liste est dérivée des tokens : ajouter un niveau dans
 * design/tokens.json suffit, rien à maintenir ici.
 */
const taillesDeTexte = Object.keys(brandTypeScale).map(kebab)

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: taillesDeTexte }],
    },
  },
})

/**
 * Compose des classes Tailwind en résolvant les conflits.
 *
 * L'ordre source ne détermine pas la priorité en CSS : sans `twMerge`,
 * une classe passée par un appelant (`className="px-8"`) ne l'emporterait
 * pas de façon fiable sur celle du composant.
 */
export function cn(...classes: ClassValue[]): string {
  return twMerge(classes.filter(Boolean).join(' '))
}
