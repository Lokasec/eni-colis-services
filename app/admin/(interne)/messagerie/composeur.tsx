'use client'

import { useActionState, useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { envoyerCampagne, type Reponse } from './actions'

export type DepartMessagerie = {
  id: string
  etiquette: string
  destination: string
  dateDepart: string
  colis: {
    codeSuivi: string
    nom: string
    email: string | null
    telephone: string | null
  }[]
}

/**
 * Trois modèles, pour les trois moments où l'on écrit à un destinataire.
 *
 * Ils sont ÉDITABLES : ce sont des points de départ, pas des formulaires
 * verrouillés. `{{nom}}` et `{{code}}` sont remplacés par colis, pour que
 * chacun reçoive son propre code de suivi.
 */
const MODELES = [
  {
    cle: 'depart',
    libelle: 'Le colis est parti',
    sujet: 'Votre colis a quitté la France',
    corps:
      'Bonjour {{nom}},\n\n' +
      'Votre colis {{code}} a quitté notre bureau de Rouen et est en route vers sa destination.\n\n' +
      'Nous vous préviendrons dès qu’il sera disponible au retrait.',
  },
  {
    cle: 'arrivee',
    libelle: 'Le colis est arrivé',
    sujet: 'Votre colis est arrivé',
    corps:
      'Bonjour {{nom}},\n\n' +
      'Votre colis {{code}} est arrivé et vous attend à notre point de retrait.\n\n' +
      'Munissez-vous d’une pièce d’identité. Le colis est remis contre paiement.',
  },
  {
    cle: 'rappel',
    libelle: 'Rappel de retrait',
    sujet: 'Votre colis vous attend toujours',
    corps:
      'Bonjour {{nom}},\n\n' +
      'Votre colis {{code}} est disponible depuis plusieurs jours à notre point de retrait.\n\n' +
      'Passé le délai de garde gratuite, des frais de garde s’appliquent. ' +
      'Contactez-nous si vous ne pouvez pas venir le chercher vous-même.',
  },
] as const

/** Message WhatsApp pré-rempli, un par destinataire. */
function lienWhatsApp(telephone: string, corps: string, nom: string, code: string): string {
  const numero = telephone.replace(/[^0-9]/g, '')
  const message = corps.replaceAll('{{nom}}', nom).replaceAll('{{code}}', code)
  return `https://wa.me/${numero}?text=${encodeURIComponent(message)}`
}

export function Composeur({ departs }: { departs: DepartMessagerie[] }) {
  const [etat, action, enCours] = useActionState<Reponse | null, FormData>(envoyerCampagne, null)
  const [departId, setDepartId] = useState(departs[0]?.id ?? '')
  const [sujet, setSujet] = useState<string>(MODELES[0].sujet)
  const [corps, setCorps] = useState<string>(MODELES[0].corps)

  const depart = departs.find((d) => d.id === departId)
  const avecEmail = depart?.colis.filter((c) => c.email) ?? []
  const avecTelephone = depart?.colis.filter((c) => c.telephone) ?? []
  const sansContact = depart?.colis.filter((c) => !c.email && !c.telephone) ?? []

  return (
    <div className="space-y-5">
      <section className="border-line rounded-lg border bg-white p-5">
        <h2 className="text-h3 mb-4">Écrire aux destinataires d’un départ</h2>

        {etat ? (
          <Alert tone={etat.ok ? 'info' : 'warn'} className="mb-4">
            <b>{etat.message}</b>
            {etat.ok && etat.detail ? (
              <>
                <br />
                {etat.detail}
              </>
            ) : null}
          </Alert>
        ) : null}

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="departId" className="text-caption text-navy mb-1 block font-semibold">
              Départ
            </label>
            <select
              id="departId"
              name="departId"
              required
              value={departId}
              onChange={(e) => setDepartId(e.target.value)}
              className="border-line-strong text-body-sm focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
            >
              {departs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.etiquette}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-caption text-navy mb-2 block font-semibold">Modèle</span>
            <div className="flex flex-wrap gap-2">
              {MODELES.map((m) => (
                <button
                  key={m.cle}
                  type="button"
                  onClick={() => {
                    setSujet(m.sujet)
                    setCorps(m.corps)
                  }}
                  className={`text-caption min-h-11 rounded-md border px-3 font-semibold ${
                    sujet === m.sujet
                      ? 'border-orange bg-sand text-navy'
                      : 'border-line text-ink-soft hover:bg-sand bg-white'
                  }`}
                >
                  {m.libelle}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="sujet" className="text-caption text-navy mb-1 block font-semibold">
              Objet
            </label>
            <input
              id="sujet"
              name="sujet"
              type="text"
              required
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              className="border-line-strong text-body-sm focus:border-orange min-h-12 w-full rounded-md border-2 bg-white px-3 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="corps" className="text-caption text-navy mb-1 block font-semibold">
              Message
            </label>
            <textarea
              id="corps"
              name="corps"
              required
              rows={8}
              value={corps}
              onChange={(e) => setCorps(e.target.value)}
              className="border-line-strong text-body-sm focus:border-orange w-full rounded-md border-2 bg-white p-3 focus:outline-none"
            />
            <p className="text-caption text-muted mt-1">
              <code className="text-navy">{'{{nom}}'}</code> et{' '}
              <code className="text-navy">{'{{code}}'}</code> sont remplacés pour chaque
              destinataire. Le lien de suivi est ajouté automatiquement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" disabled={enCours || avecEmail.length === 0}>
              {enCours
                ? 'Envoi en cours…'
                : `Envoyer à ${avecEmail.length} destinataire${avecEmail.length > 1 ? 's' : ''}`}
            </Button>
            {sansContact.length > 0 ? (
              <span className="text-caption text-orange-text font-semibold">
                {sansContact.length} colis sans e-mail ni téléphone
              </span>
            ) : null}
          </div>
        </form>
      </section>

      {/*
        WhatsApp reste manuel en phase 1 : l'API Business est hors périmètre.
        Un lien par destinataire, avec le message déjà écrit — c'est ce qui
        se rapproche le plus d'un envoi groupé sans compte professionnel.
      */}
      <section className="border-line rounded-lg border bg-white p-5">
        <h2 className="text-h3 mb-1">Liste WhatsApp</h2>
        <p className="text-caption text-muted mb-4">
          Un lien par destinataire, avec le message déjà rédigé. À ouvrir un par un — l&apos;envoi
          automatique demande un compte WhatsApp Business, prévu après la phase 1.
        </p>

        {avecTelephone.length === 0 ? (
          <p className="text-body-sm text-ink-soft">
            Aucun destinataire de ce départ n&apos;a de numéro enregistré.
          </p>
        ) : (
          <ul className="grid list-none gap-2 p-0 sm:grid-cols-2">
            {avecTelephone.map((c) => (
              <li key={c.codeSuivi}>
                <a
                  href={lienWhatsApp(c.telephone!, corps, c.nom, c.codeSuivi)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-line hover:bg-sand flex min-h-13 items-center justify-between gap-3 rounded-md border bg-white px-4 no-underline"
                >
                  <span>
                    <span className="text-navy block font-semibold">{c.nom}</span>
                    <span className="text-caption text-muted">
                      {c.codeSuivi} · {c.telephone}
                    </span>
                  </span>
                  <span className="bg-whatsapp text-navy text-caption rounded-pill px-3 py-1 font-bold">
                    WhatsApp
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
