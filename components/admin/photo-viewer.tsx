'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Modal } from './modal'

/**
 * Visionneuse des photos d'un devis.
 *
 * La cliente chiffre en regardant l'article : les vignettes s'ouvrent en
 * grand format, sans quitter la fiche.
 */
export type PhotoDevis = { url: string; alt: string }

export function PhotoViewer({ photos }: { photos: PhotoDevis[] }) {
  const [ouverte, setOuverte] = useState<PhotoDevis | null>(null)

  if (photos.length === 0) {
    return <p className="text-body-sm text-muted">Aucune photo jointe à cette demande.</p>
  }

  return (
    <>
      <ul className="grid list-none grid-cols-3 gap-2.5 p-0">
        {photos.map((photo) => (
          <li key={photo.url}>
            <button
              type="button"
              onClick={() => setOuverte(photo)}
              className="border-line block w-full overflow-hidden rounded-sm border p-0"
              aria-label={`Agrandir : ${photo.alt}`}
            >
              <Image
                src={photo.url}
                alt={photo.alt}
                width={320}
                height={240}
                className="aspect-[4/3] w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      <Modal
        ouvert={ouverte !== null}
        onClose={() => setOuverte(null)}
        titre={ouverte?.alt ?? 'Photo'}
        large
      >
        {ouverte ? (
          <Image
            src={ouverte.url}
            alt={ouverte.alt}
            width={1200}
            height={900}
            className="h-auto w-full rounded-md"
          />
        ) : null}
      </Modal>
    </>
  )
}
