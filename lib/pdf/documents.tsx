import { Document, Image, Page, Text, View } from '@react-pdf/renderer'
import { Bandeau, Entete, Ligne, Pied, couleurs, styles } from './base'

/**
 * Les trois documents : devis, facture, reçu de dépôt.
 *
 * Chacun reçoit des données DÉJÀ FORMATÉES — chaînes de caractères, pas
 * `Decimal` ni `Date`. Le formatage des montants et des dates appartient à
 * la couche qui connaît la locale ; ces composants ne font que composer.
 * C'est aussi ce qui les rend testables sans base de données.
 */

// ---------------------------------------------------------------------------
// Devis
// ---------------------------------------------------------------------------

export type DonneesDevisPdf = {
  numero: string
  dateEmission: string
  dateValidite: string | null
  montant: string
  detail: string | null
  mentionFiscale: string
  client: { nom: string; email: string; telephone: string }
  envoi: {
    trajet: string
    nature: string
    poids: string
    dimensions: string
    valeurDeclaree: string | null
    modeRemise: string
    description: string
  }
}

export function DevisPdf({ d }: { d: DonneesDevisPdf }) {
  return (
    <Document
      title={`Devis ${d.numero}`}
      author="ENI Colis Services"
      subject={`Devis d'expédition ${d.numero}`}
    >
      <Page size="A4" style={styles.page}>
        <Entete />
        <Bandeau
          type="DEVIS"
          numero={d.numero}
          date={d.dateEmission}
          complement={d.dateValidite ? `Valable jusqu’au ${d.dateValidite}` : undefined}
        />

        <View style={styles.section}>
          <Text style={styles.surTitre}>Demandeur</Text>
          <Text style={{ ...styles.valeur, textAlign: 'left', fontSize: 11 }}>{d.client.nom}</Text>
          <Text style={styles.libelle}>
            {d.client.email} · {d.client.telephone}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.titreSection}>Détail de l’envoi</Text>
          <Ligne libelle="Trajet" valeur={d.envoi.trajet} />
          <Ligne libelle="Nature du colis" valeur={d.envoi.nature} />
          <Ligne libelle="Remise du colis" valeur={d.envoi.modeRemise} />
          <Ligne libelle="Poids estimé" valeur={d.envoi.poids} />
          <Ligne libelle="Dimensions" valeur={d.envoi.dimensions} />
          {d.envoi.valeurDeclaree ? (
            <Ligne libelle="Valeur déclarée" valeur={d.envoi.valeurDeclaree} />
          ) : null}
          <View style={styles.filet} />
          <Text style={styles.libelle}>{d.envoi.description}</Text>
        </View>

        <View style={styles.totalCadre}>
          <View>
            <Text style={styles.totalLibelle}>Montant estimé</Text>
            {d.detail ? (
              <Text style={{ fontSize: 8, color: couleurs['on-navy'], marginTop: 2 }}>
                {d.detail}
              </Text>
            ) : null}
          </View>
          <Text style={styles.totalMontant}>{d.montant}</Text>
        </View>

        <View style={{ ...styles.encart, marginTop: 14 }}>
          <Text style={{ fontWeight: 700, color: couleurs.navy }}>
            Estimation sous réserve du poids constaté.
          </Text>
          <Text style={{ ...styles.mention, marginTop: 3 }}>
            Le montant définitif est arrêté après pesée du colis dans nos locaux, et fait l’objet
            d’une facture. Ce devis n’est pas une pièce comptable.
          </Text>
        </View>

        <View style={{ ...styles.section, marginTop: 14 }}>
          <Text style={styles.mention}>{d.mentionFiscale}</Text>
        </View>

        <Pied mentionFiscale={d.mentionFiscale} />
      </Page>
    </Document>
  )
}

// ---------------------------------------------------------------------------
// Facture
// ---------------------------------------------------------------------------

export type DonneesFacturePdf = {
  numero: string
  dateEmission: string
  montant: string
  /** Renseigné seulement si la facture est émise à l'arrivée. */
  devise: { montant: string; code: string; taux: string } | null
  detail: string | null
  mentionFiscale: string
  colis: {
    codeSuivi: string
    destinataire: string
    destination: string
    poids: string
    nature: string
  } | null
  reglement: { date: string; moyen: string; lieu: string } | null
}

export function FacturePdf({ f }: { f: DonneesFacturePdf }) {
  return (
    <Document
      title={`Facture ${f.numero}`}
      author="ENI Colis Services"
      subject={`Facture ${f.numero}`}
    >
      <Page size="A4" style={styles.page}>
        <Entete />
        <Bandeau type="FACTURE" numero={f.numero} date={f.dateEmission} />

        {f.colis ? (
          <>
            <View style={styles.section}>
              <Text style={styles.surTitre}>Destinataire</Text>
              <Text style={{ ...styles.valeur, textAlign: 'left', fontSize: 11 }}>
                {f.colis.destinataire}
              </Text>
              <Text style={styles.libelle}>{f.colis.destination}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.titreSection}>Prestation</Text>
              <Ligne libelle="Colis" valeur={f.colis.codeSuivi} />
              <Ligne libelle="Nature" valeur={f.colis.nature} />
              <Ligne libelle="Poids facturé" valeur={f.colis.poids} />
              {f.detail ? <Ligne libelle="Détail du calcul" valeur={f.detail} /> : null}
            </View>
          </>
        ) : null}

        <View style={styles.totalCadre}>
          <Text style={styles.totalLibelle}>Total à payer</Text>
          <View>
            <Text style={styles.totalMontant}>{f.montant}</Text>
            {f.devise ? (
              <Text style={styles.totalDevise}>
                {f.devise.montant} {f.devise.code}
              </Text>
            ) : null}
          </View>
        </View>

        {f.devise ? (
          // Le taux figure sur le document : c'est CE taux qui a été appliqué,
          // et il ne bougera pas d'ici l'encaissement (CLAUDE.md §5.3).
          <Text style={{ ...styles.mention, marginTop: 5, textAlign: 'right' }}>
            Taux appliqué : 1 EUR = {f.devise.taux} {f.devise.code}, figé à l’émission.
          </Text>
        ) : null}

        <View style={styles.section}>
          {f.reglement ? (
            <View style={styles.encart}>
              <Text style={{ fontWeight: 700, color: couleurs.navy }}>
                Réglée le {f.reglement.date}
              </Text>
              <Text style={{ ...styles.mention, marginTop: 2 }}>
                {f.reglement.moyen} · {f.reglement.lieu}
              </Text>
            </View>
          ) : (
            <View style={styles.encart}>
              <Text style={{ fontWeight: 700, color: couleurs.navy }}>
                En attente de règlement.
              </Text>
              <Text style={{ ...styles.mention, marginTop: 2 }}>
                Le colis est remis contre paiement.
              </Text>
            </View>
          )}
        </View>

        <View style={{ ...styles.section, marginTop: 14 }}>
          <Text style={styles.mention}>{f.mentionFiscale}</Text>
        </View>

        <Pied mentionFiscale={f.mentionFiscale} />
      </Page>
    </Document>
  )
}

// ---------------------------------------------------------------------------
// Reçu de dépôt
// ---------------------------------------------------------------------------

export type DonneesRecuPdf = {
  codeSuivi: string
  date: string
  /** Data URI PNG du QR code vers la page de suivi. */
  qrCode: string
  urlSuivi: string
  expediteur: { nom: string; telephone: string } | null
  destinataire: { nom: string; telephone: string; destination: string; pointRetrait: string }
  envoi: { nature: string; poids: string; dimensions: string; contenu: string }
  facture: { numero: string; montant: string } | null
  mentionFiscale: string
}

export function RecuPdf({ r }: { r: DonneesRecuPdf }) {
  return (
    <Document
      title={`Reçu de dépôt ${r.codeSuivi}`}
      author="ENI Colis Services"
      subject={`Reçu de dépôt du colis ${r.codeSuivi}`}
    >
      <Page size="A4" style={styles.page}>
        <Entete />
        <Bandeau type="REÇU DE DÉPÔT" numero={r.codeSuivi} date={r.date} />

        {/*
          Le code de suivi et son QR code passent AVANT le détail. C'est ce
          que le client cherche sur ce papier, et souvent la seule chose.
        */}
        <View
          style={{
            marginTop: 18,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: couleurs.sand,
            borderWidth: 1,
            borderColor: couleurs.line,
            padding: 16,
            gap: 18,
          }}
        >
          {/*
            `Image` vient de @react-pdf/renderer, pas du DOM : il n'accepte
            pas d'attribut alt, et l'accessibilité d'un PDF passe par ses
            balises de structure, que la bibliothèque n'expose pas. La règle
            jsx-a11y ne fait pas la différence — faux positif.
          */}
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={r.qrCode} style={{ width: 104, height: 104 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.surTitre}>Votre code de suivi</Text>
            <Text
              style={{
                fontFamily: 'Montserrat',
                fontWeight: 800,
                fontSize: 22,
                color: couleurs.navy,
                letterSpacing: 1,
              }}
            >
              {r.codeSuivi}
            </Text>
            <Text style={{ ...styles.mention, marginTop: 6 }}>
              Scannez le code, ou saisissez ce numéro sur {r.urlSuivi}
            </Text>
          </View>
        </View>

        <View style={{ ...styles.section, ...styles.colonnes }}>
          <View style={styles.colonne}>
            <Text style={styles.titreSection}>Expéditeur</Text>
            {r.expediteur ? (
              <>
                <Text style={styles.valeur}>{r.expediteur.nom}</Text>
                <Text style={styles.libelle}>{r.expediteur.telephone}</Text>
              </>
            ) : (
              <Text style={styles.libelle}>Non renseigné</Text>
            )}
          </View>
          <View style={styles.colonne}>
            <Text style={styles.titreSection}>Destinataire</Text>
            <Text style={styles.valeur}>{r.destinataire.nom}</Text>
            <Text style={styles.libelle}>{r.destinataire.telephone}</Text>
            <Text style={styles.libelle}>{r.destinataire.destination}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.titreSection}>Colis</Text>
          <Ligne libelle="Nature" valeur={r.envoi.nature} />
          <Ligne libelle="Poids" valeur={r.envoi.poids} />
          <Ligne libelle="Dimensions" valeur={r.envoi.dimensions} />
          <Ligne libelle="Point de retrait" valeur={r.destinataire.pointRetrait} />
          <View style={styles.filet} />
          <Text style={styles.libelle}>{r.envoi.contenu}</Text>
        </View>

        {r.facture ? (
          <View style={styles.totalCadre}>
            <View>
              <Text style={styles.totalLibelle}>Réglé</Text>
              <Text style={{ fontSize: 8, color: couleurs['on-navy'], marginTop: 2 }}>
                Facture {r.facture.numero}
              </Text>
            </View>
            <Text style={styles.totalMontant}>{r.facture.montant}</Text>
          </View>
        ) : null}

        <View style={{ ...styles.encart, marginTop: 16 }}>
          <Text style={{ fontWeight: 700, color: couleurs.navy }}>
            Conservez ce reçu pour le retrait.
          </Text>
          <Text style={{ ...styles.mention, marginTop: 3 }}>
            Le colis est remis au destinataire sur présentation de ce reçu et d’une pièce
            d’identité.
          </Text>
        </View>

        <Pied mentionFiscale={r.mentionFiscale} />
      </Page>
    </Document>
  )
}
