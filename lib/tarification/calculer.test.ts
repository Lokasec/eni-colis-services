import { describe, expect, it } from 'vitest'
import { calculerTarif } from './calculer'
import { Decimal } from './types'
import type { CategorieTarifaire, DemandeTarification, LiaisonTarifaire } from './types'

/**
 * Les valeurs ci-dessous reproduisent celles du seed, mais elles sont
 * écrites en dur ICI et seulement ici : le moteur, lui, ne connaît aucun
 * tarif. Si un test échoue après un changement de tarif en base, c'est le
 * test qu'il faut mettre à jour, pas le moteur.
 */

// France → Abidjan : 15 €/kg ; Abidjan → France : 12 €/kg. Deux lignes.
const franceVersAbidjan: LiaisonTarifaire = { prixParKg: '15.00', actif: true }
const abidjanVersFrance: LiaisonTarifaire = { prixParKg: '12.00', actif: true }
const franceVersDakar: LiaisonTarifaire = { prixParKg: '12.00', actif: true }
const franceVersBrazzaville: LiaisonTarifaire = { prixParKg: '20.00', actif: true }

const standard: CategorieTarifaire = {
  code: 'STANDARD',
  libelle: 'Colis ordinaire',
  mode: 'POIDS_X_TARIF_LIAISON',
  valeur: null,
  actif: true,
}
const pieceDetachee: CategorieTarifaire = {
  code: 'PIECE_DETACHEE',
  libelle: 'Pièce détachée',
  mode: 'POIDS_X_TARIF_FIXE',
  valeur: '20.0000',
  actif: true,
}
const grandeMarque: CategorieTarifaire = {
  code: 'GRANDE_MARQUE',
  libelle: 'Article de marque ou de valeur',
  mode: 'MAX_POIDS_OU_POURCENTAGE',
  valeur: '0.1500',
  actif: true,
}
const electronique: CategorieTarifaire = {
  code: 'ELECTRONIQUE',
  libelle: 'Matériel électronique',
  mode: 'SUR_DEVIS',
  valeur: null,
  actif: true,
}

const demande = (p: Partial<DemandeTarification>): DemandeTarification => ({
  poidsKg: '10',
  liaison: franceVersAbidjan,
  categorie: standard,
  ...p,
})

/** Raccourci de lecture : échoue si le calcul n'a pas abouti. */
function montant(resultat: ReturnType<typeof calculerTarif>): string {
  if (resultat.statut !== 'CALCULE') {
    throw new Error(`Calcul attendu, obtenu ${resultat.statut} — ${JSON.stringify(resultat)}`)
  }
  return resultat.montantEur.toFixed(2)
}

describe('STANDARD — poids × tarif de la liaison', () => {
  it("applique le tarif de l'aller", () => {
    // 12,5 kg × 15 €/kg = 187,50 € — le colis ENI-2026-00101 du seed
    expect(montant(calculerTarif(demande({ poidsKg: '12.5' })))).toBe('187.50')
  })

  it('applique le tarif du RETOUR, qui est une autre liaison', () => {
    // Même poids, sens inverse : 12 €/kg et non 15. C'est tout l'enjeu
    // d'une liaison orientée — se tromper de sens facture 25 % de trop.
    expect(montant(calculerTarif(demande({ poidsKg: '12.5', liaison: abidjanVersFrance })))).toBe(
      '150.00',
    )
  })

  it('respecte le tarif propre à chaque destination', () => {
    expect(montant(calculerTarif(demande({ poidsKg: '8', liaison: franceVersDakar })))).toBe(
      '96.00',
    )
    expect(
      montant(calculerTarif(demande({ poidsKg: '9.1', liaison: franceVersBrazzaville }))),
    ).toBe('182.00')
  })

  it('produit un libellé imprimable', () => {
    const resultat = calculerTarif(demande({ poidsKg: '12.5' }))
    expect(resultat.statut).toBe('CALCULE')
    if (resultat.statut === 'CALCULE') {
      expect(resultat.detail).toBe('12,5 kg × 15,00 €/kg')
    }
  })
})

describe('PIECE_DETACHEE — le tarif fixe REMPLACE celui de la liaison', () => {
  it('ignore le prix de la liaison, à l’aller comme au retour', () => {
    // 15 kg × 20 €/kg = 300 €, quelle que soit la destination.
    expect(montant(calculerTarif(demande({ poidsKg: '15', categorie: pieceDetachee })))).toBe(
      '300.00',
    )
    expect(
      montant(
        calculerTarif(
          demande({ poidsKg: '15', categorie: pieceDetachee, liaison: abidjanVersFrance }),
        ),
      ),
    ).toBe('300.00')
    expect(
      montant(
        calculerTarif(
          demande({ poidsKg: '15', categorie: pieceDetachee, liaison: franceVersDakar }),
        ),
      ),
    ).toBe('300.00')
  })

  it('exige tout de même une liaison : on ne tarife pas un trajet non desservi', () => {
    const resultat = calculerTarif(demande({ categorie: pieceDetachee, liaison: null }))
    expect(resultat).toMatchObject({ statut: 'REFUSE', code: 'LIAISON_INTROUVABLE' })
  })

  it('refuse si la catégorie ne porte pas de tarif en base', () => {
    const resultat = calculerTarif(demande({ categorie: { ...pieceDetachee, valeur: null } }))
    expect(resultat).toMatchObject({ statut: 'REFUSE', code: 'PARAMETRE_CATEGORIE_MANQUANT' })
  })
})

describe('GRANDE_MARQUE — le plus élevé du poids ou du pourcentage', () => {
  it('retient le POIDS quand il l’emporte', () => {
    // 40 kg × 15 = 600 € contre 15 % de 620 € = 93 €
    expect(
      montant(
        calculerTarif(demande({ poidsKg: '40', valeurAchat: '620', categorie: grandeMarque })),
      ),
    ).toBe('600.00')
  })

  it('retient le POURCENTAGE quand il l’emporte', () => {
    // 4,5 kg × 12 = 54 € contre 15 % de 620 € = 93 € → 93 €
    expect(
      montant(
        calculerTarif(
          demande({
            poidsKg: '4.5',
            valeurAchat: '620',
            categorie: grandeMarque,
            liaison: franceVersDakar,
          }),
        ),
      ),
    ).toBe('93.00')
  })

  it('retient le poids en cas d’égalité stricte', () => {
    // 10 kg × 15 = 150 € ; 15 % de 1000 € = 150 €. Les deux se valent :
    // la comparaison est un « strictement supérieur », le poids reste.
    expect(
      montant(
        calculerTarif(demande({ poidsKg: '10', valeurAchat: '1000', categorie: grandeMarque })),
      ),
    ).toBe('150.00')
  })

  it('refuse sans valeur d’achat déclarée', () => {
    const resultat = calculerTarif(demande({ poidsKg: '4.5', categorie: grandeMarque }))
    expect(resultat).toMatchObject({ statut: 'REFUSE', code: 'VALEUR_ACHAT_MANQUANTE' })
  })

  it('montre les deux branches du calcul dans le libellé', () => {
    const resultat = calculerTarif(
      demande({
        poidsKg: '4.5',
        valeurAchat: '620',
        categorie: grandeMarque,
        liaison: franceVersDakar,
      }),
    )
    if (resultat.statut !== 'CALCULE') throw new Error('calcul attendu')
    expect(resultat.detail).toContain('4,5 kg × 12,00 €/kg = 54,00 €')
    expect(resultat.detail).toContain('15 % de 620,00 € = 93,00 €')
  })

  it('affiche les deux branches meme quand le poids l’emporte', () => {
    const resultat = calculerTarif(
      demande({ poidsKg: '40', valeurAchat: '620', categorie: grandeMarque }),
    )
    if (resultat.statut !== 'CALCULE') throw new Error('calcul attendu')
    expect(resultat.detail).toContain('40 kg × 15,00 €/kg = 600,00 €')
    expect(resultat.detail).toContain('15 % de 620,00 € = 93,00 €')
  })
})

describe('ELECTRONIQUE — aucun calcul', () => {
  it('renvoie « sur devis », y compris avec un poids connu', () => {
    const resultat = calculerTarif(demande({ poidsKg: '14', categorie: electronique }))
    expect(resultat.statut).toBe('SUR_DEVIS')
  })

  it('ne dépend même pas de la liaison', () => {
    const resultat = calculerTarif(demande({ categorie: electronique, liaison: null }))
    expect(resultat.statut).toBe('SUR_DEVIS')
  })
})

describe('Refus', () => {
  it('liaison introuvable', () => {
    expect(calculerTarif(demande({ liaison: null }))).toMatchObject({
      statut: 'REFUSE',
      code: 'LIAISON_INTROUVABLE',
    })
  })

  it('liaison désactivée', () => {
    expect(calculerTarif(demande({ liaison: { prixParKg: '15.00', actif: false } }))).toMatchObject(
      { statut: 'REFUSE', code: 'LIAISON_INACTIVE' },
    )
  })

  it('catégorie désactivée', () => {
    expect(calculerTarif(demande({ categorie: { ...standard, actif: false } }))).toMatchObject({
      statut: 'REFUSE',
      code: 'CATEGORIE_INACTIVE',
    })
  })

  it('poids absent', () => {
    expect(calculerTarif(demande({ poidsKg: null }))).toMatchObject({
      statut: 'REFUSE',
      code: 'POIDS_MANQUANT',
    })
  })

  it('poids nul ou négatif', () => {
    expect(calculerTarif(demande({ poidsKg: '0' }))).toMatchObject({
      statut: 'REFUSE',
      code: 'POIDS_INVALIDE',
    })
    expect(calculerTarif(demande({ poidsKg: '-3' }))).toMatchObject({
      statut: 'REFUSE',
      code: 'POIDS_INVALIDE',
    })
  })

  it('poids NaN ou infini — ce que renvoie un parseFloat rate', () => {
    // Number('') vaut 0, parseFloat('abc') vaut NaN : deux valeurs qu'un
    // formulaire mal valide peut faire remonter jusqu'ici.
    expect(calculerTarif(demande({ poidsKg: Number.NaN }))).toMatchObject({
      statut: 'REFUSE',
      code: 'POIDS_INVALIDE',
    })
    expect(calculerTarif(demande({ poidsKg: Number.POSITIVE_INFINITY }))).toMatchObject({
      statut: 'REFUSE',
      code: 'POIDS_INVALIDE',
    })
  })

  it('tarif de liaison nul ou negatif', () => {
    // Une liaison active a 0 euro/kg facturerait 0 euro sans que personne
    // ne s'en apercoive. On refuse plutot que d'emettre une facture vide.
    expect(calculerTarif(demande({ liaison: { prixParKg: '0.00', actif: true } }))).toMatchObject({
      statut: 'REFUSE',
      code: 'TARIF_INVALIDE',
    })
    expect(calculerTarif(demande({ liaison: { prixParKg: '-5', actif: true } }))).toMatchObject({
      statut: 'REFUSE',
      code: 'TARIF_INVALIDE',
    })
  })

  it('tarif fixe de categorie nul', () => {
    expect(calculerTarif(demande({ categorie: { ...pieceDetachee, valeur: '0' } }))).toMatchObject({
      statut: 'REFUSE',
      code: 'TARIF_INVALIDE',
    })
  })

  it('poids illisible', () => {
    expect(calculerTarif(demande({ poidsKg: 'douze kilos' }))).toMatchObject({
      statut: 'REFUSE',
      code: 'POIDS_INVALIDE',
    })
  })
})

describe('Exactitude décimale — là où se logent les erreurs de facturation', () => {
  it('arrondit au centime supérieur sur une demi-unité', () => {
    // 1,005 kg × 3 €/kg = 3,015 € → 3,02 €.
    // En virgule flottante, 1.005 * 3 vaut 3.0149999999999997 et l'arrondi
    // donnerait 3,01 € : un centime perdu à chaque colis.
    expect(1.005 * 3).toBeLessThan(3.015) // le piège, constaté
    expect(
      montant(
        calculerTarif(demande({ poidsKg: '1.005', liaison: { prixParKg: '3.00', actif: true } })),
      ),
    ).toBe('3.02')
  })

  it('gère un poids à trois décimales', () => {
    // 12,345 kg × 15 €/kg = 185,175 € → 185,18 €.
    // Ici la virgule flottante tombe juste : tous les calculs ne dérivent
    // pas, c'est bien pourquoi le problème passe inaperçu si longtemps.
    expect(montant(calculerTarif(demande({ poidsKg: '12.345' })))).toBe('185.18')
  })

  it('additionne sans dérive sur une série de colis', () => {
    // Le vrai risque n'est pas un colis mais un cumul : trois lignes à
    // 0,1 + 0,2 + 0,3 valent 0,6 exactement, ce que le float ne garantit pas.
    expect(0.1 + 0.2).not.toBe(0.3) // le piège, constaté
    const lignes = ['0.1', '0.2', '0.3'].map((p) =>
      calculerTarif(demande({ poidsKg: p, liaison: { prixParKg: '10.00', actif: true } })),
    )
    const total = lignes.reduce((somme, ligne) => {
      if (ligne.statut !== 'CALCULE') throw new Error('calcul attendu')
      return somme.plus(ligne.montantEur)
    }, new Decimal(0))
    expect(total.toFixed(2)).toBe('6.00')
  })

  it('reste exact sur de très grands poids', () => {
    expect(montant(calculerTarif(demande({ poidsKg: '999.999' })))).toBe('14999.99')
  })

  it('accepte indifféremment une chaîne ou un nombre', () => {
    expect(montant(calculerTarif(demande({ poidsKg: 12.5 })))).toBe('187.50')
    expect(montant(calculerTarif(demande({ poidsKg: '12.5' })))).toBe('187.50')
  })
})
