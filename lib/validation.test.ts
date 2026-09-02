import { describe, expect, it } from 'vitest'
import { schemaDevis, schemaInscription } from './validation'

/**
 * Ces tests portent sur la barrière SERVEUR.
 *
 * Le formulaire du navigateur peut être contourné : c'est ce schéma, rejoué
 * dans la Server Action, qui décide ce qui entre en base.
 */

const devisValide = {
  paysDepart: 'FR',
  villeDepart: 'Rouen',
  paysArrivee: 'BJ',
  villeArrivee: 'Cotonou',
  modeRemise: 'DEPOT',
  nature: 'STANDARD',
  poidsEstime: '12,5',
  description: 'Deux cartons de vêtements et de produits d’hygiène.',
  nom: 'Awa Sylla',
  telephone: '+33 6 00 11 22 33',
  email: 'Awa.Sylla@Exemple.test',
  consentement: true,
  societe: '',
}

describe('Devis — champs facultatifs', () => {
  it('accepte des champs vides remontés en null', () => {
    // React Hook Form renvoie `null` pour un champ jamais rempli, et non la
    // chaîne vide. Le schéma doit l'accepter, sans quoi un formulaire
    // parfaitement valide est refusé — c'est arrivé.
    const resultat = schemaDevis.safeParse({
      ...devisValide,
      longueurCm: null,
      largeurCm: null,
      hauteurCm: null,
      departSouhaite: null,
      valeurAchat: null,
    })
    expect(resultat.success).toBe(true)
  })

  it('accepte la virgule décimale du clavier français', () => {
    const resultat = schemaDevis.safeParse({ ...devisValide, poidsEstime: '12,5' })
    expect(resultat.success && resultat.data.poidsEstime).toBe(12.5)
  })

  it('refuse un poids négatif ou illisible', () => {
    for (const poidsEstime of ['-3', '0', 'douze']) {
      expect(schemaDevis.safeParse({ ...devisValide, poidsEstime }).success).toBe(false)
    }
  })

  it('normalise l’adresse e-mail en minuscules', () => {
    const resultat = schemaDevis.safeParse(devisValide)
    expect(resultat.success && resultat.data.email).toBe('awa.sylla@exemple.test')
  })
})

describe('Devis — règles conditionnelles', () => {
  it('exige la valeur d’achat pour un article de marque', () => {
    const sans = schemaDevis.safeParse({ ...devisValide, nature: 'GRANDE_MARQUE' })
    expect(sans.success).toBe(false)
    if (!sans.success) {
      expect(sans.error.issues.some((i) => i.path[0] === 'valeurAchat')).toBe(true)
    }

    const avec = schemaDevis.safeParse({
      ...devisValide,
      nature: 'GRANDE_MARQUE',
      valeurAchat: '620',
    })
    expect(avec.success).toBe(true)
  })

  it('exige un poids OU les trois dimensions', () => {
    const rien = schemaDevis.safeParse({ ...devisValide, poidsEstime: null })
    expect(rien.success).toBe(false)

    const dimensions = schemaDevis.safeParse({
      ...devisValide,
      poidsEstime: null,
      longueurCm: '60',
      largeurCm: '40',
      hauteurCm: '50',
    })
    expect(dimensions.success).toBe(true)
  })

  it('dispense l’électronique de poids : elle se chiffre à l’unité', () => {
    const resultat = schemaDevis.safeParse({
      ...devisValide,
      nature: 'ELECTRONIQUE',
      poidsEstime: null,
    })
    expect(resultat.success).toBe(true)
  })

  it('refuse une demande sans consentement', () => {
    expect(schemaDevis.safeParse({ ...devisValide, consentement: false }).success).toBe(false)
  })

  it('refuse une description trop courte pour être exploitable', () => {
    expect(schemaDevis.safeParse({ ...devisValide, description: 'colis' }).success).toBe(false)
  })
})

describe('Piège à robots', () => {
  it('laisse passer un champ vide ou absent', () => {
    expect(schemaDevis.safeParse({ ...devisValide, societe: '' }).success).toBe(true)
    expect(schemaDevis.safeParse({ ...devisValide, societe: null }).success).toBe(true)
    const { societe: _, ...sansChamp } = devisValide
    expect(schemaDevis.safeParse(sansChamp).success).toBe(true)
  })

  it('refuse un champ rempli — seul un automate le remplit', () => {
    expect(schemaDevis.safeParse({ ...devisValide, societe: 'Acme' }).success).toBe(false)
  })
})

describe('Inscription', () => {
  const valide = {
    prenom: 'Awa',
    nom: 'Sylla',
    telephone: '+225 07 11 22 33',
    email: 'awa@exemple.test',
    villeRetraitId: 'cly123',
    consentement: true,
    societe: '',
  }

  it('accepte une inscription complète', () => {
    expect(schemaInscription.safeParse(valide).success).toBe(true)
  })

  it('exige une ville de retrait', () => {
    expect(schemaInscription.safeParse({ ...valide, villeRetraitId: '' }).success).toBe(false)
  })

  it('refuse un e-mail mal formé', () => {
    expect(schemaInscription.safeParse({ ...valide, email: 'awa@' }).success).toBe(false)
  })

  it('refuse un téléphone contenant des lettres', () => {
    expect(schemaInscription.safeParse({ ...valide, telephone: 'appelez-moi' }).success).toBe(false)
  })

  it('refuse une inscription sans consentement', () => {
    expect(schemaInscription.safeParse({ ...valide, consentement: false }).success).toBe(false)
  })
})
