import { Font, Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
import { join } from 'node:path'
import { brandColors, brandLogoPaths, brandLogoViewBox } from '@/design/tokens.generated'
import { site } from '@/lib/site'

/**
 * Socle commun aux trois documents : devis, facture, reçu de dépôt.
 *
 * Deux principes tenus ici, et une seule fois :
 *
 *  1. AUCUNE COULEUR EN DUR. Les teintes viennent de design/tokens.json,
 *     via `design/tokens.generated.ts`. Un PDF qui dériverait de la charte
 *     serait un document officiel hors charte — le pire endroit pour ça.
 *  2. AUCUN CALCUL. Ces composants ne font que METTRE EN FORME ce que la
 *     base contient déjà. Le taux de change, les montants, le poids
 *     facturé et son explication sont lus, jamais recalculés : c'est ce
 *     qui garantit qu'un document réimprimé six mois plus tard affiche le
 *     même montant qu'à son émission (CLAUDE.md §5.3).
 */

// ---------------------------------------------------------------------------
// Typographie
// ---------------------------------------------------------------------------

/**
 * Montserrat, en TTF, servie depuis nos propres fichiers.
 *
 * next/font distribue du woff2, que @react-pdf/renderer ne sait pas lire.
 * Les fichiers sont donc vendorisés dans public/fonts/ — police libre
 * (SIL Open Font License), déjà utilisée par le site. Les enregistrer par
 * CHEMIN DISQUE et non par URL est délibéré : un PDF ne doit pas dépendre
 * d'un appel réseau au moment où la cliente clique sur « imprimer ».
 */
let policesEnregistrees = false

export function enregistrerPolices(): void {
  if (policesEnregistrees) return

  const dossier = join(process.cwd(), 'public', 'fonts')
  Font.register({
    family: 'Montserrat',
    fonts: [
      { src: join(dossier, 'Montserrat-Regular.ttf'), fontWeight: 400 },
      { src: join(dossier, 'Montserrat-SemiBold.ttf'), fontWeight: 600 },
      { src: join(dossier, 'Montserrat-Bold.ttf'), fontWeight: 700 },
      { src: join(dossier, 'Montserrat-ExtraBold.ttf'), fontWeight: 800 },
    ],
  })

  // Sans cela, un mot long — une adresse, un nom composé — déborde de sa
  // colonne au lieu de se couper.
  Font.registerHyphenationCallback((mot) => [mot])

  policesEnregistrees = true
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

export const couleurs = brandColors

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Montserrat',
    fontSize: 9,
    color: couleurs.ink,
    backgroundColor: couleurs.white,
    paddingTop: 36,
    paddingBottom: 56,
    paddingHorizontal: 40,
    lineHeight: 1.5,
  },

  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  coordonnees: { fontSize: 8, color: couleurs['ink-soft'], textAlign: 'right', lineHeight: 1.6 },

  typeDocument: {
    fontFamily: 'Montserrat',
    fontWeight: 800,
    fontSize: 20,
    color: couleurs.navy,
    letterSpacing: 1.5,
  },
  numero: {
    fontFamily: 'Montserrat',
    fontWeight: 700,
    fontSize: 12,
    color: couleurs['orange-text'],
  },

  bandeau: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 2,
    borderBottomColor: couleurs.orange,
    paddingBottom: 8,
  },

  surTitre: {
    fontFamily: 'Montserrat',
    fontWeight: 600,
    fontSize: 7,
    letterSpacing: 1.2,
    color: couleurs.muted,
    textTransform: 'uppercase',
    marginBottom: 3,
  },

  section: { marginTop: 18 },
  titreSection: {
    fontFamily: 'Montserrat',
    fontWeight: 700,
    fontSize: 10,
    color: couleurs.navy,
    marginBottom: 7,
  },

  encart: {
    backgroundColor: couleurs.sand,
    borderLeftWidth: 3,
    borderLeftColor: couleurs.orange,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },

  colonnes: { flexDirection: 'row', gap: 24 },
  colonne: { flex: 1 },

  ligne: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  libelle: { color: couleurs['ink-soft'] },
  valeur: { fontFamily: 'Montserrat', fontWeight: 600, color: couleurs.navy, textAlign: 'right' },

  filet: { borderBottomWidth: 1, borderBottomColor: couleurs.line, marginVertical: 9 },

  totalCadre: {
    marginTop: 14,
    backgroundColor: couleurs.navy,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLibelle: {
    fontFamily: 'Montserrat',
    fontWeight: 600,
    fontSize: 9,
    color: couleurs['on-navy'],
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  totalMontant: { fontFamily: 'Montserrat', fontWeight: 800, fontSize: 18, color: couleurs.white },
  totalDevise: {
    fontFamily: 'Montserrat',
    fontWeight: 600,
    fontSize: 10,
    color: couleurs.white,
    textAlign: 'right',
  },

  mention: { fontSize: 8, color: couleurs['ink-soft'] },

  pied: {
    position: 'absolute',
    bottom: 26,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: couleurs.line,
    paddingTop: 8,
    fontSize: 7,
    color: couleurs.muted,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

// ---------------------------------------------------------------------------
// Fragments
// ---------------------------------------------------------------------------

/**
 * Logo, redessiné à partir des tracés extraits du SVG par `npm run brand`.
 * Le rapport d'aspect vient de la viewBox : le logo n'est jamais déformé.
 */
export function Logo({ largeur = 132 }: { largeur?: number }) {
  const [, , l, h] = brandLogoViewBox.split(/[\s,]+/).map(Number)
  const ratio = l && h ? h / l : 0.44

  return (
    <Svg width={largeur} height={largeur * ratio} viewBox={brandLogoViewBox}>
      {brandLogoPaths.map((trace, index) => (
        <Path key={index} d={trace.d} fill={trace.fill} />
      ))}
    </Svg>
  )
}

/** En-tête : logo à gauche, coordonnées de l'entreprise à droite. */
export function Entete() {
  return (
    <View style={styles.entete}>
      <Logo />
      <View style={styles.coordonnees}>
        <Text>{site.name}</Text>
        <Text>{site.adresse.rue}</Text>
        <Text>
          {site.adresse.codePostal} {site.adresse.ville}, {site.adresse.pays}
        </Text>
        <Text>{site.telephone}</Text>
      </View>
    </View>
  )
}

/** Bandeau : nature du document, numéro, date. */
export function Bandeau({
  type,
  numero,
  date,
  complement,
}: {
  type: string
  numero: string
  date: string
  complement?: string
}) {
  return (
    <View style={styles.bandeau}>
      <View>
        <Text style={styles.typeDocument}>{type}</Text>
        <Text style={styles.numero}>{numero}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.surTitre}>Émis le</Text>
        <Text style={styles.valeur}>{date}</Text>
        {complement ? <Text style={{ ...styles.mention, marginTop: 3 }}>{complement}</Text> : null}
      </View>
    </View>
  )
}

/** Une ligne libellé / valeur. */
export function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <View style={styles.ligne}>
      <Text style={styles.libelle}>{libelle}</Text>
      <Text style={styles.valeur}>{valeur}</Text>
    </View>
  )
}

/**
 * Pied de page — la mention fiscale y est OBLIGATOIRE.
 *
 * Elle est passée en paramètre plutôt qu'écrite ici : c'est la mention
 * STOCKÉE sur le document qui fait foi. Si la cliente sortait un jour de
 * la franchise, les anciens documents doivent continuer à porter la leur.
 */
export function Pied({ mentionFiscale }: { mentionFiscale: string }) {
  return (
    <View style={styles.pied} fixed>
      <Text>{mentionFiscale}</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          totalPages > 1 ? `Page ${pageNumber} / ${totalPages}` : ''
        }
      />
    </View>
  )
}
