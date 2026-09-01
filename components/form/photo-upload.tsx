'use client'

import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

const TAILLE_MAX = 5 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif']

export type PhotoChoisie = { id: string; fichier: File; apercu: string }

/**
 * Sélection de 1 à 3 photos, pensée pour le téléphone.
 *
 * `capture="environment"` ouvre directement l'appareil photo arrière sur
 * mobile — la cliente et ses clients photographient le colis sur place.
 *
 * TODO (lot 6) : compression côté navigateur avant envoi
 * (browser-image-compression), puis dépôt sur le stockage objet en
 * région Europe. Ici, le composant se limite à la sélection et à
 * l'aperçu ; aucun octet ne quitte le navigateur.
 */
export function PhotoUpload({
  name = 'photos',
  max = 3,
  label = 'Photos du colis',
  hint = '1 à 3 photos. JPEG, PNG ou HEIC, 5 Mo maximum par photo.',
  onChange,
}: {
  name?: string
  max?: number
  label?: string
  hint?: string
  onChange?: (photos: PhotoChoisie[]) => void
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<PhotoChoisie[]>([])
  const [erreur, setErreur] = useState<string | null>(null)

  // Libère les URL d'objet quand le composant est démonté.
  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.apercu))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const majPhotos = (suivantes: PhotoChoisie[]) => {
    setPhotos(suivantes)
    onChange?.(suivantes)
  }

  const ajouter = (fichiers: FileList | null) => {
    if (!fichiers || fichiers.length === 0) return
    setErreur(null)
    const acceptees: PhotoChoisie[] = []

    for (const fichier of Array.from(fichiers)) {
      if (photos.length + acceptees.length >= max) {
        setErreur(`Vous pouvez joindre ${max} photos au maximum.`)
        break
      }
      if (fichier.size > TAILLE_MAX) {
        setErreur('Cette photo dépasse 5 Mo. Reprenez-la ou choisissez-en une autre.')
        continue
      }
      if (fichier.type && !TYPES.includes(fichier.type)) {
        setErreur('Format non accepté. Utilisez une photo JPEG, PNG ou HEIC.')
        continue
      }
      acceptees.push({
        id: `${fichier.name}-${fichier.lastModified}-${fichier.size}`,
        fichier,
        apercu: URL.createObjectURL(fichier),
      })
    }

    if (acceptees.length > 0) majPhotos([...photos, ...acceptees])
    if (inputRef.current) inputRef.current.value = ''
  }

  const retirer = (id: string) => {
    const cible = photos.find((photo) => photo.id === id)
    if (cible) URL.revokeObjectURL(cible.apercu)
    majPhotos(photos.filter((photo) => photo.id !== id))
  }

  const complet = photos.length >= max

  return (
    <div className="mb-5">
      <span className="text-body-sm text-navy mb-1.5 block font-semibold">{label}</span>

      <label
        htmlFor={inputId}
        className={cn(
          'border-line-strong bg-sand block rounded-md border-2 border-dashed px-5 py-7.5 text-center',
          complet ? 'cursor-not-allowed opacity-60' : 'hover:border-orange cursor-pointer',
        )}
      >
        <b className="text-navy mb-1 block">
          {complet ? 'Trois photos, c’est complet' : 'Prendre ou choisir une photo'}
        </b>
        <span className="text-ink-soft block text-[0.875rem]">{hint}</span>
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif"
          capture="environment"
          multiple={max > 1}
          disabled={complet}
          onChange={(event) => ajouter(event.currentTarget.files)}
          className="sr-only"
          aria-describedby={erreur ? `${inputId}-error` : undefined}
        />
      </label>

      {erreur ? (
        <span
          id={`${inputId}-error`}
          role="alert"
          className="text-caption text-error mt-1 block font-semibold"
        >
          {erreur}
        </span>
      ) : null}

      {photos.length > 0 ? (
        <ul className="mt-3.5 grid list-none grid-cols-3 gap-2.5 p-0">
          {photos.map((photo) => (
            <li key={photo.id} className="relative">
              <Image
                src={photo.apercu}
                alt={`Aperçu de ${photo.fichier.name}`}
                width={200}
                height={150}
                unoptimized
                className="border-line aspect-[4/3] w-full rounded-sm border object-cover"
              />
              <button
                type="button"
                onClick={() => retirer(photo.id)}
                className="bg-navy text-on-navy absolute top-1 right-1 flex size-7 min-h-0 items-center justify-center rounded-full"
                aria-label={`Retirer ${photo.fichier.name}`}
              >
                <span aria-hidden>×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
