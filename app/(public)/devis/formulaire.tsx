'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useActionState, useEffect, useMemo, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { Checkbox } from '@/components/form/checkbox'
import { PhotoUpload, type PhotoChoisie } from '@/components/form/photo-upload'
import { RadioCards } from '@/components/form/radio-cards'
import { SelectField } from '@/components/form/select-field'
import { TextField } from '@/components/form/text-field'
import { TextareaField } from '@/components/form/textarea-field'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { OptionsTrajet } from '@/lib/donnees-publiques'
import { schemaDevis, type DonneesDevis, type SaisieDevis } from '@/lib/validation'
import { envoyerDemandeDevis, type EtatDevis } from './actions'

/**
 * Formulaire de demande de devis.
 *
 * Trois comportements conditionnels, repris de docs/maquette/devis.html :
 *  - l'électronique affiche un avertissement ;
 *  - l'article de valeur fait apparaître le champ valeur et la mention du
 *    justificatif ;
 *  - l'expédition à distance affiche les consignes de marquage.
 *
 * AUCUN PRIX n'est affiché ni calculé sur cette page (CLAUDE.md §1.3).
 *
 * La validation Zod s'exécute ici pour le confort de saisie, et de nouveau
 * côté serveur dans la Server Action — c'est celle-là qui protège.
 */
export function FormulaireDevis({ options }: { options: OptionsTrajet }) {
  const [etat, soumettre] = useActionState<EtatDevis, FormData>(envoyerDemandeDevis, {
    statut: 'initial',
  })
  const [enCours, demarrer] = useTransition()
  const [photos, setPhotos] = useState<PhotoChoisie[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SaisieDevis, unknown, DonneesDevis>({
    resolver: zodResolver(schemaDevis),
    mode: 'onBlur',
    defaultValues: {
      paysDepart: 'FR',
      modeRemise: 'DEPOT',
      nature: 'STANDARD',
      consentement: false as never,
      societe: '',
    },
  })

  const paysDepart = watch('paysDepart')
  const paysArrivee = watch('paysArrivee')
  const nature = watch('nature')
  const modeRemise = watch('modeRemise')

  // Cascade : les destinations proposées dépendent du pays de départ, et
  // seules les liaisons publiées existent dans `options`.
  const paysOrigine = useMemo(
    () => options.pays.filter((p) => options.liaisons.some((l) => l.origine === p.codeIso)),
    [options],
  )
  const paysDestination = useMemo(
    () =>
      options.pays.filter((p) =>
        options.liaisons.some((l) => l.origine === paysDepart && l.destination === p.codeIso),
      ),
    [options, paysDepart],
  )
  const villesDepart = options.pays.find((p) => p.codeIso === paysDepart)?.villes ?? []
  const villesArrivee = options.pays.find((p) => p.codeIso === paysArrivee)?.villes ?? []

  // Quand le pays change, la ville retenue doit redevenir cohérente.
  useEffect(() => {
    setValue('villeDepart', villesDepart[0] ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paysDepart])
  useEffect(() => {
    setValue('villeArrivee', villesArrivee[0] ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paysArrivee])

  const erreurServeur = etat.statut === 'erreur' ? etat.champs : undefined
  const message = (champ: keyof SaisieDevis | 'photos') =>
    (errors[champ as keyof SaisieDevis]?.message as string | undefined) ?? erreurServeur?.[champ]

  if (etat.statut === 'succes') {
    return (
      <Card surface="plain">
        <h2 className="text-h2">Demande envoyée</h2>
        <p className="text-body text-ink-soft mt-4">
          Nous avons bien reçu votre demande, enregistrée sous la référence{' '}
          <strong className="text-navy">{etat.reference}</strong>. Vous recevrez votre devis sous 24
          heures par e-mail, et par WhatsApp si vous nous avez laissé votre numéro.
        </p>
        <p className="text-body text-ink-soft mt-4">
          Une question en attendant ? Écrivez-nous sur WhatsApp.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/departs" variant="outline" size="sm">
            Voir les prochains départs
          </Button>
          <Button href="/" variant="outline" size="sm">
            Retour à l&apos;accueil
          </Button>
        </div>
      </Card>
    )
  }

  const envoyer = handleSubmit((valeurs) => {
    const donnees = new FormData()
    for (const [cle, valeur] of Object.entries(valeurs)) {
      if (valeur === undefined || valeur === null) continue
      donnees.set(cle, typeof valeur === 'boolean' ? String(valeur) : String(valeur))
    }
    for (const photo of photos) donnees.append('photos', photo.fichier)
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

        {/* ---------------------------------------------------------- */}
        <fieldset className="mb-2 border-0 p-0">
          <legend className="text-caption text-orange-text mb-4 p-0 font-bold tracking-[0.1em] uppercase">
            Le trajet
          </legend>
          <div className="grid gap-x-4.5 sm:grid-cols-2">
            <SelectField
              id="paysDepart"
              label="D’où part le colis ?"
              required
              options={paysOrigine.map((p) => ({ value: p.codeIso, label: p.nom }))}
              error={message('paysDepart')}
              {...register('paysDepart')}
            />
            <SelectField
              id="villeDepart"
              label="Ville de dépôt"
              required
              options={villesDepart.map((v) => ({ value: v, label: v }))}
              error={message('villeDepart')}
              {...register('villeDepart')}
            />
            <SelectField
              id="paysArrivee"
              label="Où va le colis ?"
              required
              placeholder="Choisissez un pays"
              options={paysDestination.map((p) => ({ value: p.codeIso, label: p.nom }))}
              error={message('paysArrivee')}
              {...register('paysArrivee')}
            />
            <SelectField
              id="villeArrivee"
              label="Ville de destination"
              required
              options={villesArrivee.map((v) => ({ value: v, label: v }))}
              error={message('villeArrivee')}
              {...register('villeArrivee')}
            />
          </div>
        </fieldset>

        <hr className="bg-line my-7 h-px border-0" />

        {/* ---------------------------------------------------------- */}
        <RadioCards
          name="modeRemise"
          legend="Comment nous remettez-vous le colis ?"
          defaultValue="DEPOT"
          error={message('modeRemise')}
          onChange={(valeur) => setValue('modeRemise', valeur as SaisieDevis['modeRemise'])}
          options={[
            {
              value: 'DEPOT',
              titre: 'Je dépose au bureau',
              description: 'À Rouen, avec le colis ouvert. Pesée sur place.',
            },
            {
              value: 'EXPEDITION',
              titre: 'Je vous l’expédie',
              description: 'Par le transporteur de mon choix, à mes frais.',
            },
          ]}
        />
        <input type="hidden" {...register('modeRemise')} />

        {modeRemise === 'EXPEDITION' ? (
          <Alert className="mb-6">
            <b>Consignes de marquage.</b> Une fois votre devis validé, collez le{' '}
            <strong>numéro de devis bien visible</strong> sur le colis : c&apos;est ce qui nous
            permet de l&apos;identifier à l&apos;arrivée. Les frais d&apos;acheminement jusqu&apos;à
            notre bureau restent à votre charge. Sans pesée possible à distance, le devis est
            obligatoire pour ce mode d&apos;envoi.
          </Alert>
        ) : null}

        <hr className="bg-line my-7 h-px border-0" />

        {/* ---------------------------------------------------------- */}
        <RadioCards
          name="nature"
          legend="Que contient le colis ?"
          defaultValue="STANDARD"
          error={message('nature')}
          onChange={(valeur) => setValue('nature', valeur as SaisieDevis['nature'])}
          options={[
            {
              value: 'STANDARD',
              titre: 'Colis standard',
              description: 'Vêtements, hygiène, denrées non périssables, effets personnels.',
            },
            {
              value: 'PIECE_DETACHEE',
              titre: 'Pièces détachées',
              description: 'Automobile, mécanique, outillage.',
            },
            {
              value: 'ELECTRONIQUE',
              titre: 'Matériel électronique',
              description: 'Téléphone, ordinateur, téléviseur, électroménager.',
            },
            {
              value: 'GRANDE_MARQUE',
              titre: 'Articles de valeur',
              description: 'Articles de marque, biens de valeur.',
            },
          ]}
        />
        <input type="hidden" {...register('nature')} />

        {nature === 'ELECTRONIQUE' ? (
          <Alert tone="warn" className="mb-6">
            <b>Le matériel électronique se tarife à l’unité.</b> Nous devons voir l&apos;appareil
            avant de chiffrer : joignez des photos nettes, nous revenons vers vous sous 24 heures.
            La batterie doit rester dans l&apos;appareil — une batterie lithium expédiée seule est
            refusée en fret aérien, sans exception.
          </Alert>
        ) : null}

        {nature === 'GRANDE_MARQUE' ? (
          <Alert className="mb-6">
            <b>Justificatif d’achat obligatoire.</b> Facture ou preuve d&apos;achat, sans exception
            : c&apos;est ce qui permet d&apos;établir le tarif et de traiter une éventuelle
            réclamation. Vous restez responsable de l&apos;authenticité et de la provenance des
            articles confiés.
          </Alert>
        ) : null}

        <div className="grid gap-x-4.5 sm:grid-cols-2">
          <TextField
            id="poidsEstime"
            label="Poids approximatif (kg)"
            type="text"
            inputMode="decimal"
            hint="Une estimation suffit, nous pèserons au dépôt."
            placeholder="12,5"
            error={message('poidsEstime')}
            {...register('poidsEstime')}
          />
          {nature === 'GRANDE_MARQUE' ? (
            <TextField
              id="valeurAchat"
              label="Valeur d’achat (€)"
              type="text"
              inputMode="decimal"
              required
              hint="Justificatif obligatoire au dépôt."
              placeholder="620"
              error={message('valeurAchat')}
              {...register('valeurAchat')}
            />
          ) : null}
        </div>

        <fieldset className="mb-5 border-0 p-0">
          <legend className="text-body-sm text-navy mb-1.5 block p-0 font-semibold">
            Dimensions du colis (cm)
          </legend>
          <div className="grid grid-cols-3 gap-x-3.5">
            <TextField
              id="longueurCm"
              label="Longueur"
              type="text"
              inputMode="numeric"
              placeholder="60"
              error={message('longueurCm')}
              {...register('longueurCm')}
            />
            <TextField
              id="largeurCm"
              label="Largeur"
              type="text"
              inputMode="numeric"
              placeholder="40"
              error={message('largeurCm')}
              {...register('largeurCm')}
            />
            <TextField
              id="hauteurCm"
              label="Hauteur"
              type="text"
              inputMode="numeric"
              placeholder="50"
              error={message('hauteurCm')}
              {...register('hauteurCm')}
            />
          </div>
          <span className="text-caption text-muted -mt-3 block">
            Utile pour les colis volumineux : un carton léger mais encombrant occupe la place de
            plusieurs colis compacts.
          </span>
        </fieldset>

        <TextareaField
          id="description"
          label="Décrivez le contenu"
          required
          hint="Soyez précis : cela nous évite de vous rappeler."
          error={message('description')}
          {...register('description')}
        />

        <PhotoUpload erreur={message('photos')} onChange={setPhotos} />

        <hr className="bg-line my-7 h-px border-0" />

        {/* ---------------------------------------------------------- */}
        <fieldset className="mb-2 border-0 p-0">
          <legend className="text-caption text-orange-text mb-4 p-0 font-bold tracking-[0.1em] uppercase">
            Vous contacter
          </legend>
          <div className="grid gap-x-4.5 sm:grid-cols-2">
            <TextField
              id="nom"
              label="Votre nom"
              required
              autoComplete="name"
              error={message('nom')}
              {...register('nom')}
            />
            <TextField
              id="telephone"
              label="Votre téléphone"
              type="tel"
              required
              autoComplete="tel"
              hint="Nous vous répondons aussi sur WhatsApp."
              error={message('telephone')}
              {...register('telephone')}
            />
            <TextField
              id="email"
              label="Votre e-mail"
              type="email"
              required
              autoComplete="email"
              error={message('email')}
              {...register('email')}
            />
            <TextField
              id="departSouhaite"
              label="Départ souhaité"
              type="date"
              hint="Facultatif."
              error={message('departSouhaite')}
              {...register('departSouhaite')}
            />
          </div>
        </fieldset>

        <Checkbox
          id="consentement"
          required
          error={message('consentement')}
          {...register('consentement')}
        >
          En envoyant cette demande, j&apos;accepte que mes informations soient utilisées pour
          établir mon devis et me recontacter. Voir la{' '}
          <a href="/legal/confidentialite" className="text-orange-text font-semibold">
            politique de confidentialité
          </a>
          .
        </Checkbox>

        {/* Piège à robots : invisible, hors du parcours au clavier. */}
        <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
          <label htmlFor="societe">Société</label>
          <input
            id="societe"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register('societe')}
          />
        </div>

        <Button type="submit" block disabled={enCours}>
          {enCours ? 'Envoi en cours…' : 'Envoyer ma demande'}
        </Button>

        <p className="text-caption text-muted mt-4 text-center">
          Aucun prix n&apos;est calculé sur cette page : nous examinons votre colis avant de vous
          annoncer un montant.
        </p>
      </form>
    </Card>
  )
}
