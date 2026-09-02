'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useActionState, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { Checkbox } from '@/components/form/checkbox'
import { SelectField } from '@/components/form/select-field'
import { TextField } from '@/components/form/text-field'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  schemaInscription,
  type DonneesInscription,
  type SaisieInscription,
} from '@/lib/validation'
import { inscrire, type BlocAdresse, type EtatInscription } from './actions'

type Ville = { id: string; nom: string; pays: string }

export function FormulaireInscription({ villes }: { villes: Ville[] }) {
  const [etat, soumettre] = useActionState<EtatInscription, FormData>(inscrire, {
    statut: 'initial',
  })
  const [enCours, demarrer] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SaisieInscription, unknown, DonneesInscription>({
    resolver: zodResolver(schemaInscription),
    mode: 'onBlur',
    defaultValues: { consentement: false as never, societe: '' },
  })

  const erreurServeur = etat.statut === 'erreur' ? etat.champs : undefined
  const message = (champ: keyof SaisieInscription) =>
    (errors[champ]?.message as string | undefined) ?? erreurServeur?.[champ]

  if (etat.statut === 'succes') {
    return <Confirmation numeroClient={etat.numeroClient} bloc={etat.bloc} />
  }

  const envoyer = handleSubmit((valeurs) => {
    const donnees = new FormData()
    for (const [cle, valeur] of Object.entries(valeurs)) {
      if (valeur === undefined || valeur === null) continue
      donnees.set(cle, typeof valeur === 'boolean' ? String(valeur) : String(valeur))
    }
    demarrer(() => soumettre(donnees))
  })

  return (
    <Card surface="plain">
      <form onSubmit={envoyer} noValidate>
        {etat.statut === 'erreur' ? (
          <Alert tone="warn" className="mb-6">
            {etat.message}
          </Alert>
        ) : null}

        <div className="grid gap-x-4.5 sm:grid-cols-2">
          <TextField
            id="prenom"
            label="Votre prénom"
            required
            autoComplete="given-name"
            hint="Il compose votre identifiant de livraison."
            error={message('prenom')}
            {...register('prenom')}
          />
          <TextField
            id="nom"
            label="Votre nom"
            required
            autoComplete="family-name"
            error={message('nom')}
            {...register('nom')}
          />
          <TextField
            id="telephone"
            label="Votre téléphone"
            type="tel"
            required
            autoComplete="tel"
            hint="Nous vous joignons aussi sur WhatsApp."
            error={message('telephone')}
            {...register('telephone')}
          />
          <TextField
            id="email"
            label="Votre e-mail"
            type="email"
            required
            autoComplete="email"
            hint="Celui que vous utiliserez chez les marchands."
            error={message('email')}
            {...register('email')}
          />
        </div>

        <SelectField
          id="villeRetraitId"
          label="Où viendrez-vous chercher vos colis ?"
          required
          placeholder="Choisissez votre ville de retrait"
          options={villes.map((v) => ({ value: v.id, label: `${v.nom} — ${v.pays}` }))}
          error={message('villeRetraitId')}
          {...register('villeRetraitId')}
        />

        <Checkbox
          id="consentement"
          required
          error={message('consentement')}
          {...register('consentement')}
        >
          J&apos;accepte que mes informations soient utilisées pour créer mon identifiant et gérer
          mes envois. Voir la{' '}
          <a href="/legal/confidentialite" className="text-orange-text font-semibold">
            politique de confidentialité
          </a>
          .
        </Checkbox>

        {/* Piège à robots */}
        <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
          <label htmlFor="societe-inscription">Société</label>
          <input
            id="societe-inscription"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register('societe')}
          />
        </div>

        <Button type="submit" block disabled={enCours}>
          {enCours ? 'Création en cours…' : 'Obtenir mon adresse'}
        </Button>

        <p className="text-caption text-muted mt-4 text-center">
          Inscription gratuite. Vous ne payez que le transport, au retrait de vos colis.
        </p>
      </form>
    </Card>
  )
}

/**
 * Écran de confirmation : le bloc d'adresse complet, prêt à copier.
 *
 * C'est l'écran le plus important du mode A. Le client va le recopier dans
 * les champs de livraison d'un site marchand : chaque ligne est donc
 * copiable séparément, et le bloc entier d'un seul geste.
 */
function Confirmation({ numeroClient, bloc }: { numeroClient: string; bloc: BlocAdresse }) {
  const [copie, setCopie] = useState<string | null>(null)

  const lignes: Array<[string, string]> = [
    ['Nom', bloc.nom],
    ['Prénom', bloc.prenom],
    ['Adresse', bloc.adresse],
    ['Code postal', bloc.codePostal],
    ['Ville', bloc.ville],
    ['Département', bloc.departement],
    ['Téléphone', bloc.telephone],
    ['E-mail', bloc.email],
  ]

  const copier = async (valeur: string, etiquette: string) => {
    try {
      await navigator.clipboard.writeText(valeur)
      setCopie(etiquette)
      setTimeout(() => setCopie(null), 2000)
    } catch {
      setCopie(null)
    }
  }

  return (
    <Card surface="plain">
      <h2 className="text-h2">Votre adresse est prête</h2>
      <p className="text-body text-ink-soft mt-4">
        Votre identifiant client est <strong className="text-navy">{numeroClient}</strong>. Voici
        l&apos;adresse exacte à saisir dans vos commandes, sur n&apos;importe quel site marchand
        français. Nous vous l&apos;avons aussi envoyée par e-mail.
      </p>

      <div className="border-line bg-sand mt-6 overflow-hidden rounded-md border">
        <dl className="m-0">
          {lignes.map(([etiquette, valeur]) => (
            <div
              key={etiquette}
              className="border-line flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
            >
              <dt className="text-caption text-muted w-28 flex-none">{etiquette}</dt>
              <dd
                className={`text-body-sm m-0 flex-1 font-mono ${
                  etiquette === 'Nom'
                    ? 'bg-sand-deep text-navy rounded-sm px-2 font-bold'
                    : 'text-navy'
                }`}
              >
                {valeur}
              </dd>
              <button
                type="button"
                onClick={() => void copier(valeur, etiquette)}
                className="text-caption text-orange-text hover:bg-sand-deep flex min-h-11 flex-none items-center rounded-sm px-2.5 font-semibold"
              >
                {copie === etiquette ? 'Copié' : 'Copier'}
              </button>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-4">
        <Button
          onClick={() => void copier(lignes.map(([e, v]) => `${e} : ${v}`).join('\n'), 'tout')}
          variant="outline"
          size="sm"
        >
          {copie === 'tout' ? 'Adresse copiée' : 'Copier toute l’adresse'}
        </Button>
      </div>

      <Alert className="mt-7">
        <b>Le champ « Nom » est votre identifiant.</b> C&apos;est lui qui nous permet de savoir à
        qui appartient le carton. Un colis arrivé sans ce marquage est un carton anonyme parmi
        d&apos;autres — et notre local est partagé.
      </Alert>

      <Alert className="mt-4">
        <b>Le téléphone indiqué est le nôtre, pas le vôtre.</b> C&apos;est normal : c&apos;est nous
        qui recevons le colis, donc c&apos;est nous que le livreur doit pouvoir joindre. En
        revanche, indiquez bien votre propre adresse e-mail : vous suivrez ainsi votre livraison
        jusqu&apos;à notre bureau.
      </Alert>

      <div className="mt-7 flex flex-wrap gap-3">
        <Button href="/recevoir" variant="outline" size="sm">
          Comment ça marche
        </Button>
        <Button href="/tarifs" variant="outline" size="sm">
          Voir les tarifs
        </Button>
      </div>
    </Card>
  )
}
