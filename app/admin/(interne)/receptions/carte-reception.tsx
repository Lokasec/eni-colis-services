'use client'

import Image from 'next/image'
import { useActionState, useMemo, useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { rattacherColis, type Reponse } from '../actions-colis'

type ColisEnAttente = {
  id: string
  codeSuivi: string
  contenu: string | null
  photoReceptionUrl: string | null
  poidsReel: string | null
  destination: string
  recuLe: string
  anciennete: number
  note: string | null
}

/**
 * Une carte, une décision.
 *
 * L'opératrice a un carton dans les mains : elle cherche le client, saisit
 * le poids, valide. La recherche filtre sur l'identifiant, le nom de
 * livraison et la ville — parce qu'un client se souvient rarement de son
 * numéro exact, mais toujours de son prénom.
 */
export function CarteReception({
  colis,
  clients,
}: {
  colis: ColisEnAttente
  clients: Array<{ id: string; etiquette: string }>
}) {
  const [etat, action, enCours] = useActionState<Reponse | null, FormData>(rattacherColis, null)
  const [recherche, setRecherche] = useState('')

  const filtres = useMemo(() => {
    const terme = recherche.trim().toLowerCase()
    if (!terme) return clients.slice(0, 40)
    return clients.filter((c) => c.etiquette.toLowerCase().includes(terme)).slice(0, 40)
  }, [clients, recherche])

  if (etat?.ok) {
    return (
      <div className="border-line rounded-lg border bg-white p-5">
        <Alert>{etat.message}</Alert>
      </div>
    )
  }

  return (
    <div className="border-line rounded-lg border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-h3">{colis.codeSuivi}</h2>
          <p className="text-caption text-muted mt-0.5">
            Reçu le {colis.recuLe} · {colis.destination}
          </p>
        </div>
        <Badge tone={colis.anciennete >= 7 ? 'litige' : 'devisNouveau'}>{colis.anciennete} j</Badge>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[132px_1fr]">
        {colis.photoReceptionUrl ? (
          <Image
            src={colis.photoReceptionUrl}
            alt={`Photo du colis ${colis.codeSuivi}`}
            width={264}
            height={198}
            unoptimized
            className="border-line aspect-[4/3] w-full rounded-sm border object-cover"
          />
        ) : (
          <div className="border-line-strong bg-sand text-caption text-muted flex aspect-[4/3] items-center justify-center rounded-sm border-2 border-dashed p-2 text-center">
            Pas de photo
          </div>
        )}

        <div className="text-body-sm text-ink-soft">
          <p>{colis.contenu ?? 'Contenu non décrit.'}</p>
          {colis.note ? <p className="text-caption text-muted mt-1.5">{colis.note}</p> : null}
          <p className="mt-1.5">
            {colis.poidsReel ? (
              <>
                Pesé : <b className="text-navy">{colis.poidsReel} kg</b>
              </>
            ) : (
              <span className="text-orange-text font-semibold">Pas encore pesé</span>
            )}
          </p>
        </div>
      </div>

      <form action={action} className="mt-5">
        <input type="hidden" name="colisId" value={colis.id} />

        {etat && !etat.ok ? (
          <Alert tone="warn" className="mb-4">
            {etat.message}
          </Alert>
        ) : null}

        <label
          htmlFor={`recherche-${colis.id}`}
          className="text-caption text-navy mb-1 block font-semibold"
        >
          Chercher le client
        </label>
        <input
          id={`recherche-${colis.id}`}
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Prénom, identifiant, ville…"
          className="border-line-strong text-body-sm focus:border-orange mb-3 min-h-11 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
        />

        <label
          htmlFor={`client-${colis.id}`}
          className="text-caption text-navy mb-1 block font-semibold"
        >
          Client
        </label>
        <select
          id={`client-${colis.id}`}
          name="clientId"
          required
          size={filtres.length > 4 ? 5 : undefined}
          className="border-line-strong text-body-sm focus:border-orange mb-3 min-h-11 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
        >
          <option value="">Choisir un client</option>
          {filtres.map((client) => (
            <option key={client.id} value={client.id}>
              {client.etiquette}
            </option>
          ))}
        </select>

        <label
          htmlFor={`poids-${colis.id}`}
          className="text-caption text-navy mb-1 block font-semibold"
        >
          Poids réel (kg)
        </label>
        <input
          id={`poids-${colis.id}`}
          name="poidsReel"
          type="text"
          inputMode="decimal"
          defaultValue={colis.poidsReel ?? ''}
          placeholder="12,5"
          className="border-line-strong text-body focus:border-orange mb-4 min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
        />

        <Button type="submit" block disabled={enCours}>
          {enCours ? 'Rattachement…' : 'Rattacher et peser'}
        </Button>
      </form>
    </div>
  )
}
