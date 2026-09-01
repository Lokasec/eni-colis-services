import Image from 'next/image'
import { cn } from '@/lib/cn'

/**
 * Emplacement d'image (.ph de la maquette).
 *
 * Tant que la photo n'est pas fournie, le cadre affiche le nom de fichier
 * attendu. Les vraies photos seront déposées dans public/images/ avec
 * exactement ces noms, sans aucune modification de code
 * (voir docs/guide-images.md).
 *
 * `fichier` est le nom attendu, `disponible` indique si la photo est là.
 * Au lot 5, des placeholders SVG seront générés aux bons ratios.
 */
const ratios = {
  hero: 'aspect-[21/9]',
  wide: 'aspect-video',
  card: 'aspect-[4/3]',
  square: 'aspect-square',
} as const

export function ImageFrame({
  fichier,
  alt,
  ratio = 'wide',
  disponible = false,
  priority = false,
  sizes = '100vw',
  className,
}: {
  fichier: string
  alt: string
  ratio?: keyof typeof ratios
  disponible?: boolean
  priority?: boolean
  sizes?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'bg-sand-deep relative block overflow-hidden rounded-lg',
        ratios[ratio],
        className,
      )}
    >
      {disponible ? (
        <Image
          src={`/images/${fichier}`}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-lg p-4 text-center',
            'border-line-strong border-2 border-dashed',
            'bg-[repeating-linear-gradient(45deg,transparent,transparent_12px,var(--color-sand-deep)_12px,var(--color-sand-deep)_24px)]',
            'text-muted font-mono text-xs font-semibold',
          )}
        >
          {fichier}
        </span>
      )}
    </div>
  )
}
