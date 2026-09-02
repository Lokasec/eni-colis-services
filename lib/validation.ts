import { z } from 'zod'

/**
 * Schémas de validation, partagés entre le navigateur et le serveur.
 *
 * Le même schéma sert des deux côtés, mais le serveur le rejoue TOUJOURS de
 * façon indépendante : la validation côté client est un confort de saisie,
 * jamais une protection. Un formulaire peut être contourné, une Server
 * Action non (CLAUDE.md §7.1).
 */

const texte = (min: number, max: number, champ: string) =>
  z
    .string()
    .trim()
    .min(min, `${champ} est obligatoire.`)
    .max(max, `${champ} ne doit pas dépasser ${max} caractères.`)

/** Téléphone international, tolérant sur les espaces et les séparateurs. */
const telephone = z
  .string()
  .trim()
  .min(6, 'Indiquez un numéro de téléphone.')
  .max(30, 'Ce numéro est trop long.')
  .regex(/^[+()\d\s.-]+$/, 'Ce numéro contient des caractères inattendus.')

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Indiquez votre adresse e-mail.')
  .max(180, 'Cette adresse est trop longue.')
  .email('Cette adresse e-mail ne semble pas valide.')

/**
 * Piège à robots : un champ invisible que seul un automate remplit.
 * S'il contient quoi que ce soit, la soumission est ignorée en silence —
 * on ne dit pas au robot qu'il a été repéré.
 */
export const honeypot = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (typeof v === 'string' ? v : ''))
  .refine((v) => v === '', 'Champ réservé.')

/**
 * Nombre optionnel saisi au clavier : « 12,5 » comme « 12.5 ».
 *
 * `null` est explicitement accepté : un champ laissé vide remonte `null`
 * depuis React Hook Form, et non la chaîne vide. Ne pas le prévoir faisait
 * échouer la validation sur des champs pourtant facultatifs.
 */
const nombreOptionnel = (max: number, champ: string) =>
  z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || v === '') return undefined
      const normalise = typeof v === 'string' ? v.replace(',', '.').trim() : v
      const nombre = Number(normalise)
      return Number.isFinite(nombre) ? nombre : Number.NaN
    })
    .refine((v) => v === undefined || (!Number.isNaN(v) && v > 0), {
      message: `${champ} doit être un nombre positif.`,
    })
    .refine((v) => v === undefined || v <= max, {
      message: `${champ} dépasse la valeur attendue.`,
    })

export const NATURES = ['STANDARD', 'PIECE_DETACHEE', 'ELECTRONIQUE', 'GRANDE_MARQUE'] as const
export const MODES_REMISE = ['DEPOT', 'EXPEDITION'] as const

export const schemaDevis = z
  .object({
    // Trajet
    paysDepart: texte(2, 80, 'Le pays de départ'),
    villeDepart: texte(2, 80, 'La ville de départ'),
    paysArrivee: texte(2, 80, "Le pays d'arrivée"),
    villeArrivee: texte(2, 80, "La ville d'arrivée"),
    modeRemise: z.enum(MODES_REMISE, { message: 'Choisissez un mode de remise.' }),

    // Contenu
    nature: z.enum(NATURES, { message: 'Choisissez la nature du colis.' }),
    poidsEstime: nombreOptionnel(2000, 'Le poids'),
    longueurCm: nombreOptionnel(500, 'La longueur'),
    largeurCm: nombreOptionnel(500, 'La largeur'),
    hauteurCm: nombreOptionnel(500, 'La hauteur'),
    valeurAchat: nombreOptionnel(1_000_000, "La valeur d'achat"),
    description: texte(10, 2000, 'La description'),
    // Même remarque : un champ date vide remonte `null`.
    departSouhaite: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => {
        const valeur = typeof v === 'string' ? v.trim() : ''
        return valeur === '' ? undefined : valeur
      }),

    // Demandeur
    nom: texte(2, 120, 'Votre nom'),
    telephone,
    email,

    consentement: z.literal(true, {
      message: 'Votre accord est nécessaire pour traiter la demande.',
    }),
    // Piège à robots
    societe: honeypot,
  })
  .refine((data) => data.nature !== 'GRANDE_MARQUE' || data.valeurAchat !== undefined, {
    path: ['valeurAchat'],
    message: "Un article de valeur se chiffre sur sa valeur d'achat : elle est obligatoire.",
  })
  .refine(
    // Sans pesée possible à distance, il faut au moins une indication de
    // taille pour pouvoir chiffrer.
    (data) =>
      data.nature === 'ELECTRONIQUE' ||
      data.poidsEstime !== undefined ||
      (data.longueurCm !== undefined &&
        data.largeurCm !== undefined &&
        data.hauteurCm !== undefined),
    {
      path: ['poidsEstime'],
      message: 'Indiquez un poids approximatif, ou les trois dimensions du colis.',
    },
  )

/**
 * Le schéma TRANSFORME ses entrées : « 12,5 » saisi au clavier devient le
 * nombre 12.5. Entrée et sortie ont donc des types différents, et React
 * Hook Form a besoin des deux.
 */
export type SaisieDevis = z.input<typeof schemaDevis>
export type DonneesDevis = z.output<typeof schemaDevis>

export const schemaInscription = z.object({
  prenom: texte(2, 60, 'Votre prénom'),
  nom: texte(2, 60, 'Votre nom'),
  telephone,
  email,
  villeRetraitId: z.string().trim().min(1, 'Choisissez votre ville de retrait.'),
  consentement: z.literal(true, {
    message: 'Votre accord est nécessaire pour créer votre identifiant.',
  }),
  societe: honeypot,
})

export type SaisieInscription = z.input<typeof schemaInscription>
export type DonneesInscription = z.output<typeof schemaInscription>

/** Métadonnées d'une photo déjà déposée sur le stockage objet. */
export const schemaPhoto = z.object({
  url: z.string().url(),
  nomOriginal: z.string().max(255).optional(),
  tailleOctets: z.number().int().positive().max(10_000_000).optional(),
})

export const schemaPhotos = z
  .array(schemaPhoto)
  .max(3, 'Trois photos au maximum.')
  .optional()
  .default([])
