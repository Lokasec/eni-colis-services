'use client'

import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

const TAILLE_MAX = 5 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif']

/** Cible de compression : suffisant pour chiffrer, léger à téléverser. */
const COMPRESSION = { maxSizeMB: 1.2, maxWidthOrHeight: 1600, useWebWorker: true }

export type PhotoChoisie = { id: string; fichier: File; apercu: string; compressee: boolean }

/**
 * Sélection de 1 à 3 photos, pensée pour le téléphone.
 *
 * `capture="environment"` ouvre directement l'appareil photo arrière sur
 * mobile — la cliente et ses clients photographient le colis sur place.
 *
 * Les photos sont COMPRESSÉES dans le navigateur avant l'envoi. Ce n'est
 * pas un détail de confort : une photo de 4 Mo sortie d'un téléphone met
 * plusieurs secondes à partir sur une connexion africaine, et le formulaire
 * est justement conçu pour être rempli depuis un mobile.
 *
 * La compression peut échouer sur un HEIC que le navigateur ne sait pas
 * décoder : on garde alors le fichier d'origine, la limite des 5 Mo
 * s'applique de toute façon côté serveur.
 */
export function PhotoUpload({
  name = 'photos',
  max = 3,
  label = 'Photos du colis',
  hint = '1 à 3 photos. Prenez-les directement avec votre téléphone.',
  erreur,
  onChange,
}: {
  name?: string
  max?: number
  label?: string
  hint?: string
  erreur?: string
  onChange?: (photos: PhotoChoisie[]) => void
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<PhotoChoisie[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [traitement, setTraitement] = useState(false)

  const photosRef = useRef(photos)
  photosRef.current = photos

  // Libère les URL d'objet quand le composant est démonté.
  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.apercu))
    }
  }, [])

  const majPhotos = (suivantes: PhotoChoisie[]) => {
    setPhotos(suivantes)
    onChange?.(suivantes)
  }

  const ajouter = async (fichiers: FileList | null) => {
    if (!fichiers || fichiers.length === 0) return
    setMessage(null)
    setTraitement(true)

    const acceptees: PhotoChoisie[] = []
    let refus: string | null = null

    for (const fichier of Array.from(fichiers)) {
      if (photos.length + acceptees.length >= max) {
        refus = `Vous pouvez joindre ${max} photos au maximum.`
        break
      }
      if (fichier.type && !TYPES.includes(fichier.type)) {
        refus = 'Format non accepté. Utilisez une photo JPEG, PNG ou HEIC.'
        continue
      }

      const { fichier: retenu, compressee } = await compresser(fichier)

      if (retenu.size > TAILLE_MAX) {
        refus = 'Cette photo dépasse 5 Mo. Reprenez-la ou choisissez-en une autre.'
        continue
      }

      acceptees.push({
        id: `${fichier.name}-${fichier.lastModified}-${fichier.size}`,
        fichier: retenu,
        apercu: URL.createObjectURL(retenu),
        compressee,
      })
    }

    setTraitement(false)
    if (refus) setMessage(refus)
    if (acceptees.length > 0) majPhotos([...photos, ...acceptees])
    if (inputRef.current) inputRef.current.value = ''
  }

  const retirer = (id: string) => {
    const cible = photos.find((photo) => photo.id === id)
    if (cible) URL.revokeObjectURL(cible.apercu)
    majPhotos(photos.filter((photo) => photo.id !== id))
  }

  const complet = photos.length >= max
  const aSignaler = erreur ?? message

  return (
    <div className="mb-5">
      <span className="text-body-sm text-navy mb-1.5 block font-semibold">{label}</span>

      <label
        htmlFor={inputId}
        className={cn(
          'border-line-strong bg-sand block rounded-md border-2 border-dashed px-5 py-7.5 text-center',
          complet || traitement
            ? 'cursor-not-allowed opacity-60'
            : 'hover:border-orange cursor-pointer',
        )}
      >
        <b className="text-navy mb-1 block">
          {traitement
            ? 'Préparation des photos…'
            : complet
              ? `${max} photos, c’est complet`
              : 'Prendre ou choisir une photo'}
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
          disabled={complet || traitement}
          onChange={(event) => void ajouter(event.currentTarget.files)}
          className="sr-only"
          aria-describedby={aSignaler ? `${inputId}-erreur` : undefined}
        />
      </label>

      {aSignaler ? (
        <span
          id={`${inputId}-erreur`}
          role="alert"
          className="text-caption text-error mt-1 block font-semibold"
        >
          {aSignaler}
        </span>
      ) : null}

      {photos.length > 0 ? (
        <>
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
          <p className="text-caption text-muted mt-2">
            {photos.length} photo{photos.length > 1 ? 's' : ''} ·{' '}
            {formaterTaille(photos.reduce((total, p) => total + p.fichier.size, 0))}
            {photos.some((p) => p.compressee) ? ' après compression' : ''}
          </p>
        </>
      ) : null}
    </div>
  )
}

/** Compresse dans le navigateur ; rend le fichier d'origine en cas d'échec. */
async function compresser(fichier: File): Promise<{ fichier: File; compressee: boolean }> {
  try {
    const { default: compresserImage } = await import('browser-image-compression')
    const reduit = await compresserImage(fichier, COMPRESSION)
    // Une « compression » qui alourdit le fichier n'en est pas une.
    if (reduit.size >= fichier.size) return { fichier, compressee: false }
    // La bibliothèque rend parfois un Blob anonyme : on lui redonne le nom
    // d'origine, que la cliente retrouvera dans le back-office.
    const nomme = new File([reduit], fichier.name, {
      type: reduit.type || fichier.type,
      lastModified: fichier.lastModified,
    })
    return { fichier: nomme, compressee: true }
  } catch {
    return { fichier, compressee: false }
  }
}

function formaterTaille(octets: number): string {
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`.replace('.', ',')
}
