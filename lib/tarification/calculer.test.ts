import { describe, expect, it } from 'vitest'
import { calculerTarif } from './calculer'
import { Decimal } from './types'
import type {
  CategorieTarifaire,
  DemandeTarification,
  LiaisonTarifaire,
  ParametresPoids,
} from './types'

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

// Règles confirmées par la cliente : kilo supérieur, minimum 1 kg,
// poids volumétrique au diviseur 5000.
const parametres: ParametresPoids = {
  pasArrondiPoidsKg: '1.000',
  poidsMinimumFactureKg: '1.000',
  diviseurVolumetrique: 5000,
  appliquerPoidsVolumetrique: true,
}

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
  mode: 'POURCENTAGE_VALEUR',
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
  parametres,
  ...p,
})

/** Raccourci de lecture : échoue si le calcul n'a pas abouti. */
function montant(resultat: ReturnType<typeof calculerTarif>): string {
  if (resultat.statut !== 'CALCULE') {
    throw new Error(`Calcul attendu, obtenu ${resultat.statut} — ${JSON.stringify(resultat)}`)
  }
  return resultat.montantEur.toFixed(2)
}

function detail(resultat: ReturnType<typeof calculerTarif>): string {
  if (resultat.statut !== 'CALCULE') throw new Error('calcul attendu')
  return resultat.detail
}

describe('Poids facturé — arrondi au kilo supérieur, minimum 1 kg', () => {
  it('arrondit au kilo supérieur', () => {
    // 12,5 kg pesés → 13 kg facturés → 13 × 15 = 195 €
    expect(montant(calculerTarif(demande({ poidsKg: '12.5' })))).toBe('195.00')
    // 5,05 kg → 6 kg : il n'y a pas de tolérance
    expect(montant(calculerTarif(demande({ poidsKg: '5.05' })))).toBe('90.00')
  })

  it('laisse un poids déjà entier inchangé', () => {
    expect(montant(calculerTarif(demande({ poidsKg: '8', liaison: franceVersDakar })))).toBe(
      '96.00',
    )
  })

  it('facture 1 kg minimum', () => {
    // 50 g → 1 kg → 15 €
    expect(montant(calculerTarif(demande({ poidsKg: '0.05' })))).toBe('15.00')
  })

  it('explique l’arrondi sur le document', () => {
    // Un client qui lit « 13 kg » sur une facture pour un colis pesé à
    // 12,5 kg doit comprendre sans téléphoner.
    expect(detail(calculerTarif(demande({ poidsKg: '12.5' })))).toBe(
      '13 kg (12,5 kg arrondis au kilo supérieur) × 15,00 €/kg',
    )
    expect(detail(calculerTarif(demande({ poidsKg: '0.05' })))).toBe(
      '1 kg (minimum facturé 1 kg) × 15,00 €/kg',
    )
    expect(detail(calculerTarif(demande({ poidsKg: '8' })))).toBe('8 kg × 15,00 €/kg')
  })

  it('respecte un paramétrage différent, sans changer de code', () => {
    // Si la cliente demandait une tolérance aux 100 g, ce serait ce
    // paramètre-là qui changerait — pas le moteur.
    const auxCentGrammes: ParametresPoids = { ...parametres, pasArrondiPoidsKg: '0.100' }
    expect(montant(calculerTarif(demande({ poidsKg: '5.05', parametres: auxCentGrammes })))).toBe(
      '76.50',
    ) // 5,1 kg × 15
  })
})

describe('Poids volumétrique', () => {
  const carton = { longueurCm: 60, largeurCm: 40, hauteurCm: 50 } // 24 kg volumétriques

  it('retient le volume quand il dépasse le poids réel', () => {
    // 60 × 40 × 50 = 120 000 cm³ ÷ 5000 = 24 kg, pour 4 kg réels.
    // Une couette occupe la place de vingt kilos.
    const resultat = calculerTarif(demande({ poidsKg: '4', dimensions: carton }))
    expect(montant(resultat)).toBe('360.00') // 24 × 15
    expect(detail(resultat)).toContain('poids volumétrique 24 kg')
  })

  it('garde le poids réel quand il est le plus élevé', () => {
    const resultat = calculerTarif(demande({ poidsKg: '30', dimensions: carton }))
    expect(montant(resultat)).toBe('450.00') // 30 × 15
    expect(detail(resultat)).toBe('30 kg × 15,00 €/kg')
  })

  it('permet de chiffrer sur les seules dimensions, sans pesée', () => {
    // Le colis n'est pas encore arrivé : le devis se fait sur les
    // dimensions saisies au formulaire.
    expect(montant(calculerTarif(demande({ poidsKg: null, dimensions: carton })))).toBe('360.00')
  })

  it('se désactive par paramètre', () => {
    const sansVolume: ParametresPoids = { ...parametres, appliquerPoidsVolumetrique: false }
    expect(
      montant(calculerTarif(demande({ poidsKg: '4', dimensions: carton, parametres: sansVolume }))),
    ).toBe('60.00') // 4 × 15, le volume est ignoré
  })

  it('ignore des dimensions inexploitables', () => {
    expect(
      montant(
        calculerTarif(
          demande({ poidsKg: '4', dimensions: { longueurCm: 0, largeurCm: 40, hauteurCm: 50 } }),
        ),
      ),
    ).toBe('60.00')
  })
})

describe('STANDARD — poids × tarif de la liaison', () => {
  it('applique le tarif du RETOUR, qui est une autre liaison', () => {
    // Même colis, sens inverse : 12 €/kg et non 15. C'est tout l'enjeu
    // d'une liaison orientée — se tromper de sens facture 25 % de trop.
    expect(montant(calculerTarif(demande({ poidsKg: '12.5' })))).toBe('195.00')
    expect(montant(calculerTarif(demande({ poidsKg: '12.5', liaison: abidjanVersFrance })))).toBe(
      '156.00',
    )
  })

  it('respecte le tarif propre à chaque destination', () => {
    // 9,1 kg → 10 kg facturés
    expect(
      montant(calculerTarif(demande({ poidsKg: '9.1', liaison: franceVersBrazzaville }))),
    ).toBe('200.00')
  })
})

describe('PIECE_DETACHEE — 20 €/kg dans tous les sens', () => {
  it('ignore le prix de la liaison, à l’aller comme au retour', () => {
    // Confirmé par la cliente : 20 €/kg aller-retour, toutes destinations.
    for (const liaison of [franceVersAbidjan, abidjanVersFrance, franceVersDakar]) {
      expect(
        montant(calculerTarif(demande({ poidsKg: '15', categorie: pieceDetachee, liaison }))),
      ).toBe('300.00')
    }
  })

  it('subit le même arrondi de poids', () => {
    // 14,2 kg → 15 kg × 20 €
    expect(montant(calculerTarif(demande({ poidsKg: '14.2', categorie: pieceDetachee })))).toBe(
      '300.00',
    )
  })

  it('exige tout de même une liaison : on ne tarife pas un trajet non desservi', () => {
    expect(calculerTarif(demande({ categorie: pieceDetachee, liaison: null }))).toMatchObject({
      statut: 'REFUSE',
      code: 'LIAISON_INTROUVABLE',
    })
  })

  it('refuse si la catégorie ne porte pas de tarif en base', () => {
    expect(calculerTarif(demande({ categorie: { ...pieceDetachee, valeur: null } }))).toMatchObject(
      {
        statut: 'REFUSE',
        code: 'PARAMETRE_CATEGORIE_MANQUANT',
      },
    )
  })
})

describe('GRANDE_MARQUE — le coût du transport EST un pourcentage de la valeur', () => {
  it('facture le pourcentage de la valeur d’achat', () => {
    expect(
      montant(
        calculerTarif(demande({ poidsKg: '4.5', valeurAchat: '620', categorie: grandeMarque })),
      ),
    ).toBe('93.00')
  })

  it('ignore complètement le poids', () => {
    // Un article de 40 kg et un de 0,5 kg de même valeur coûtent le même prix.
    for (const poidsKg of ['40', '0.5']) {
      expect(
        montant(calculerTarif(demande({ poidsKg, valeurAchat: '620', categorie: grandeMarque }))),
      ).toBe('93.00')
    }
  })

  it('ignore aussi le tarif de la liaison', () => {
    for (const liaison of [franceVersAbidjan, abidjanVersFrance]) {
      expect(
        montant(calculerTarif(demande({ valeurAchat: '620', categorie: grandeMarque, liaison }))),
      ).toBe('93.00')
    }
  })

  it('se chiffre SANS poids : un devis sur photos est possible', () => {
    expect(
      montant(
        calculerTarif(demande({ poidsKg: null, valeurAchat: '620', categorie: grandeMarque })),
      ),
    ).toBe('93.00')
  })

  it('refuse sans valeur d’achat déclarée', () => {
    expect(calculerTarif(demande({ categorie: grandeMarque }))).toMatchObject({
      statut: 'REFUSE',
      code: 'VALEUR_ACHAT_MANQUANTE',
    })
  })

  it('refuse une valeur d’achat nulle ou négative', () => {
    for (const valeurAchat of ['0', '-100']) {
      expect(calculerTarif(demande({ valeurAchat, categorie: grandeMarque }))).toMatchObject({
        statut: 'REFUSE',
        code: 'VALEUR_ACHAT_INVALIDE',
      })
    }
  })

  it('exige tout de même une liaison desservie', () => {
    expect(
      calculerTarif(demande({ valeurAchat: '620', categorie: grandeMarque, liaison: null })),
    ).toMatchObject({ statut: 'REFUSE', code: 'LIAISON_INTROUVABLE' })
  })

  it('produit un libellé imprimable', () => {
    expect(detail(calculerTarif(demande({ valeurAchat: '620', categorie: grandeMarque })))).toBe(
      'Article de marque ou de valeur — 15 % de 620,00 €',
    )
  })
})

describe('ELECTRONIQUE — aucun calcul', () => {
  it('renvoie « sur devis », y compris avec un poids connu', () => {
    expect(calculerTarif(demande({ poidsKg: '14', categorie: electronique })).statut).toBe(
      'SUR_DEVIS',
    )
  })

  it('ne dépend même pas de la liaison', () => {
    expect(calculerTarif(demande({ categorie: electronique, liaison: null })).statut).toBe(
      'SUR_DEVIS',
    )
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
      {
        statut: 'REFUSE',
        code: 'LIAISON_INACTIVE',
      },
    )
  })

  it('catégorie désactivée', () => {
    expect(calculerTarif(demande({ categorie: { ...standard, actif: false } }))).toMatchObject({
      statut: 'REFUSE',
      code: 'CATEGORIE_INACTIVE',
    })
  })

  it('ni poids ni dimensions', () => {
    expect(calculerTarif(demande({ poidsKg: null }))).toMatchObject({
      statut: 'REFUSE',
      code: 'POIDS_INDETERMINE',
    })
  })

  it('poids nul, négatif ou illisible', () => {
    for (const poidsKg of ['0', '-3', 'douze kilos', Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(calculerTarif(demande({ poidsKg }))).toMatchObject({
        statut: 'REFUSE',
        code: 'POIDS_INVALIDE',
      })
    }
  })

  it('tarif de liaison nul ou négatif', () => {
    // Une liaison active à 0 €/kg facturerait 0 € sans que personne ne
    // s'en aperçoive. On refuse plutôt que d'émettre une facture vide.
    for (const prixParKg of ['0.00', '-5']) {
      expect(calculerTarif(demande({ liaison: { prixParKg, actif: true } }))).toMatchObject({
        statut: 'REFUSE',
        code: 'TARIF_INVALIDE',
      })
    }
  })

  it('tarif fixe de catégorie nul', () => {
    expect(calculerTarif(demande({ categorie: { ...pieceDetachee, valeur: '0' } }))).toMatchObject({
      statut: 'REFUSE',
      code: 'TARIF_INVALIDE',
    })
  })
})

describe('Exactitude décimale — là où se logent les erreurs de facturation', () => {
  it('arrondit au centime supérieur sur une demi-unité', () => {
    // 3 kg × 1,005 €/kg = 3,015 € → 3,02 €.
    // En virgule flottante, 3 × 1.005 vaut 3.0149999999999997 et l'arrondi
    // donnerait 3,01 € : un centime perdu à chaque colis.
    expect(3 * 1.005).toBeLessThan(3.015) // le piège, constaté
    expect(
      montant(
        calculerTarif(demande({ poidsKg: '3', liaison: { prixParKg: '1.005', actif: true } })),
      ),
    ).toBe('3.02')
  })

  it('reste exact sur un pourcentage de valeur', () => {
    // 15 % de 333,33 € = 49,9995 € → 50,00 €
    expect(
      montant(calculerTarif(demande({ valeurAchat: '333.33', categorie: grandeMarque }))),
    ).toBe('50.00')
  })

  it('additionne sans dérive sur une série de colis', () => {
    expect(0.1 + 0.2).not.toBe(0.3) // le piège, constaté
    const tarif: LiaisonTarifaire = { prixParKg: '0.10', actif: true }
    const total = ['1', '2', '3']
      .map((poidsKg) => calculerTarif(demande({ poidsKg, liaison: tarif })))
      .reduce((somme, ligne) => {
        if (ligne.statut !== 'CALCULE') throw new Error('calcul attendu')
        return somme.plus(ligne.montantEur)
      }, new Decimal(0))
    expect(total.toFixed(2)).toBe('0.60')
  })

  it('reste exact sur de très grands poids', () => {
    // 999,001 kg → 1000 kg × 15 €
    expect(montant(calculerTarif(demande({ poidsKg: '999.001' })))).toBe('15000.00')
  })
})
