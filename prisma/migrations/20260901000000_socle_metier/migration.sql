-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATEUR');

-- CreateEnum
CREATE TYPE "Monnaie" AS ENUM ('EUR', 'XOF', 'XAF', 'GNF', 'CDF', 'USD');

-- CreateEnum
CREATE TYPE "ModeTransport" AS ENUM ('AERIEN', 'MARITIME');

-- CreateEnum
CREATE TYPE "ModeReception" AS ENUM ('COMMANDE_EN_LIGNE', 'DEPOT', 'EXPEDITION');

-- CreateEnum
CREATE TYPE "MomentPaiement" AS ENUM ('DEPART', 'ARRIVEE');

-- CreateEnum
CREATE TYPE "StatutColis" AS ENUM ('DEVIS_ACCEPTE', 'RECU', 'EN_PREPARATION', 'EXPEDIE', 'EN_TRANSIT', 'EN_REACHEMINEMENT', 'ARRIVE', 'DISPONIBLE_RETRAIT', 'RETIRE', 'LITIGE');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('NON_DU', 'A_PAYER_DEPART', 'A_PAYER_ARRIVEE', 'PAYE', 'PARTIELLEMENT_PAYE', 'IMPAYE_RELANCE', 'ABANDONNE');

-- CreateEnum
CREATE TYPE "TypeDocument" AS ENUM ('DEVIS', 'FACTURE');

-- CreateEnum
CREATE TYPE "ModeCalcul" AS ENUM ('POIDS_X_TARIF_LIAISON', 'POIDS_X_TARIF_FIXE', 'MAX_POIDS_OU_POURCENTAGE', 'SUR_DEVIS');

-- CreateEnum
CREATE TYPE "StatutDemandeDevis" AS ENUM ('NOUVELLE', 'CHIFFREE', 'ENVOYEE', 'ACCEPTEE', 'REFUSEE', 'EXPIREE', 'CONVERTIE');

-- CreateEnum
CREATE TYPE "StatutDepart" AS ENUM ('PLANIFIE', 'DEPOTS_OUVERTS', 'CLOTURE_DEPOTS', 'COMPLET', 'PARTI', 'ARRIVE');

-- CreateEnum
CREATE TYPE "LieuEncaissement" AS ENUM ('FRANCE', 'ABIDJAN', 'AUTRE');

-- CreateEnum
CREATE TYPE "MoyenPaiement" AS ENUM ('ESPECES', 'VIREMENT', 'MOBILE_MONEY', 'CARTE', 'AUTRE');

-- CreateEnum
CREATE TYPE "ModeRemise" AS ENUM ('DEPOT', 'EXPEDITION');

-- CreateTable
CREATE TABLE "Pays" (
    "id" TEXT NOT NULL,
    "codeIso" CHAR(2) NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "drapeau" TEXT,
    "monnaie" "Monnaie" NOT NULL,
    "tauxFixe" DECIMAL(14,6),
    "tauxManuel" DECIMAL(14,6),
    "tauxManuelMajLe" TIMESTAMP(3),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ville" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "paysId" TEXT NOT NULL,
    "codeAeroport" CHAR(3),
    "villeTransitId" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ville_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointRetrait" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "villeId" TEXT NOT NULL,
    "adresse" TEXT,
    "telephone" TEXT,
    "horaires" TEXT,
    "reperage" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PointRetrait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Liaison" (
    "id" TEXT NOT NULL,
    "paysOrigineId" TEXT NOT NULL,
    "paysDestinationId" TEXT NOT NULL,
    "mode" "ModeTransport" NOT NULL DEFAULT 'AERIEN',
    "prixParKg" DECIMAL(10,2) NOT NULL,
    "delaiJoursMin" INTEGER,
    "delaiJoursMax" INTEGER,
    "sousTraitee" BOOLEAN NOT NULL DEFAULT false,
    "prixAchat" DECIMAL(10,2),
    "afficheePubliquement" BOOLEAN NOT NULL DEFAULT true,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Liaison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategorieArticle" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "mode" "ModeCalcul" NOT NULL,
    "valeur" DECIMAL(10,4),
    "publie" BOOLEAN NOT NULL DEFAULT true,
    "devisRequis" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategorieArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "numeroClient" TEXT NOT NULL,
    "nomLivraison" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "paysDestinationId" TEXT,
    "villeDestinationId" TEXT,
    "consentementLe" TIMESTAMP(3) NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dateInscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERATEUR',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "derniereConnexion" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandeDevis" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "paysDepart" TEXT NOT NULL,
    "villeDepart" TEXT NOT NULL,
    "paysArrivee" TEXT NOT NULL,
    "villeArrivee" TEXT NOT NULL,
    "modeRemise" "ModeRemise" NOT NULL,
    "categorieId" TEXT,
    "poidsEstime" DECIMAL(8,3),
    "dimensions" TEXT,
    "valeurAchat" DECIMAL(12,2),
    "description" TEXT NOT NULL,
    "departSouhaite" TIMESTAMP(3),
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "statut" "StatutDemandeDevis" NOT NULL DEFAULT 'NOUVELLE',
    "consentementLe" TIMESTAMP(3) NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemandeDevis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoDevis" (
    "id" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "nomOriginal" TEXT,
    "tailleOctets" INTEGER,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoDevis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Depart" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "liaisonId" TEXT NOT NULL,
    "dateClotureDepot" TIMESTAMP(3) NOT NULL,
    "dateDepart" TIMESTAMP(3) NOT NULL,
    "dateArriveeEstimee" TIMESTAMP(3),
    "statut" "StatutDepart" NOT NULL DEFAULT 'PLANIFIE',
    "notes" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Depart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Colis" (
    "id" TEXT NOT NULL,
    "codeSuivi" TEXT NOT NULL,
    "clientId" TEXT,
    "modeReception" "ModeReception" NOT NULL,
    "momentPaiement" "MomentPaiement" NOT NULL,
    "photoReceptionUrl" TEXT,
    "expediteurNom" TEXT,
    "expediteurTelephone" TEXT,
    "expediteurEmail" TEXT,
    "destinataireNom" TEXT NOT NULL,
    "destinataireTelephone" TEXT,
    "destinataireEmail" TEXT,
    "villeArriveeId" TEXT NOT NULL,
    "pointRetraitId" TEXT,
    "departId" TEXT,
    "necessiteReacheminement" BOOLEAN NOT NULL DEFAULT false,
    "poidsEstime" DECIMAL(8,3),
    "poidsReel" DECIMAL(8,3),
    "dimensions" TEXT,
    "categorieId" TEXT,
    "valeurDeclaree" DECIMAL(12,2),
    "justificatifFourni" BOOLEAN NOT NULL DEFAULT false,
    "contenu" TEXT,
    "statut" "StatutColis" NOT NULL DEFAULT 'RECU',
    "statutPaiement" "StatutPaiement" NOT NULL DEFAULT 'NON_DU',
    "demandeDevisId" TEXT,
    "dateDepartEffectif" TIMESTAMP(3),
    "dateArrivee" TIMESTAMP(3),
    "dateDisponible" TIMESTAMP(3),
    "dateRetrait" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Colis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoriqueStatut" (
    "id" TEXT NOT NULL,
    "colisId" TEXT NOT NULL,
    "statut" "StatutColis" NOT NULL,
    "commentaire" TEXT,
    "auteurId" TEXT,
    "survenuLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoriqueStatut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "type" "TypeDocument" NOT NULL,
    "numero" TEXT NOT NULL,
    "colisId" TEXT,
    "demandeDevisId" TEXT,
    "montantEur" DECIMAL(12,2) NOT NULL,
    "devise" "Monnaie" NOT NULL DEFAULT 'EUR',
    "tauxApplique" DECIMAL(14,6),
    "montantDevise" DECIMAL(14,2),
    "dateEmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateValidite" TIMESTAMP(3),
    "dateReglement" TIMESTAMP(3),
    "mentionFiscale" TEXT NOT NULL DEFAULT 'TVA non applicable, art. 293 B du CGI',
    "detail" TEXT,
    "pdfUrl" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Encaissement" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "montant" DECIMAL(14,2) NOT NULL,
    "devise" "Monnaie" NOT NULL,
    "tauxApplique" DECIMAL(14,6),
    "lieu" "LieuEncaissement" NOT NULL,
    "moyen" "MoyenPaiement" NOT NULL,
    "operateurId" TEXT,
    "dateEncaissement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "notes" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Encaissement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SequenceDocument" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "dernierNumero" INTEGER NOT NULL DEFAULT 0,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SequenceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageCampagne" (
    "id" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "corps" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "cible" TEXT NOT NULL,
    "departId" TEXT,
    "nbDestinataires" INTEGER NOT NULL DEFAULT 0,
    "envoyeeLe" TIMESTAMP(3),
    "auteurEmail" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageCampagne_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pays_codeIso_key" ON "Pays"("codeIso");

-- CreateIndex
CREATE UNIQUE INDEX "Pays_slug_key" ON "Pays"("slug");

-- CreateIndex
CREATE INDEX "Pays_actif_idx" ON "Pays"("actif");

-- CreateIndex
CREATE UNIQUE INDEX "Ville_slug_key" ON "Ville"("slug");

-- CreateIndex
CREATE INDEX "Ville_paysId_actif_idx" ON "Ville"("paysId", "actif");

-- CreateIndex
CREATE UNIQUE INDEX "Ville_paysId_nom_key" ON "Ville"("paysId", "nom");

-- CreateIndex
CREATE INDEX "PointRetrait_villeId_actif_idx" ON "PointRetrait"("villeId", "actif");

-- CreateIndex
CREATE INDEX "Liaison_afficheePubliquement_actif_idx" ON "Liaison"("afficheePubliquement", "actif");

-- CreateIndex
CREATE UNIQUE INDEX "Liaison_paysOrigineId_paysDestinationId_mode_key" ON "Liaison"("paysOrigineId", "paysDestinationId", "mode");

-- CreateIndex
CREATE UNIQUE INDEX "CategorieArticle_code_key" ON "CategorieArticle"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Client_numeroClient_key" ON "Client"("numeroClient");

-- CreateIndex
CREATE UNIQUE INDEX "Client_nomLivraison_key" ON "Client"("nomLivraison");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Client_actif_idx" ON "Client"("actif");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DemandeDevis_reference_key" ON "DemandeDevis"("reference");

-- CreateIndex
CREATE INDEX "DemandeDevis_statut_creeLe_idx" ON "DemandeDevis"("statut", "creeLe");

-- CreateIndex
CREATE INDEX "DemandeDevis_email_idx" ON "DemandeDevis"("email");

-- CreateIndex
CREATE INDEX "PhotoDevis_demandeId_idx" ON "PhotoDevis"("demandeId");

-- CreateIndex
CREATE UNIQUE INDEX "Depart_reference_key" ON "Depart"("reference");

-- CreateIndex
CREATE INDEX "Depart_statut_dateDepart_idx" ON "Depart"("statut", "dateDepart");

-- CreateIndex
CREATE INDEX "Depart_dateDepart_idx" ON "Depart"("dateDepart");

-- CreateIndex
CREATE UNIQUE INDEX "Colis_codeSuivi_key" ON "Colis"("codeSuivi");

-- CreateIndex
CREATE INDEX "Colis_statut_idx" ON "Colis"("statut");

-- CreateIndex
CREATE INDEX "Colis_statutPaiement_idx" ON "Colis"("statutPaiement");

-- CreateIndex
CREATE INDEX "Colis_clientId_idx" ON "Colis"("clientId");

-- CreateIndex
CREATE INDEX "Colis_departId_idx" ON "Colis"("departId");

-- CreateIndex
CREATE INDEX "Colis_modeReception_clientId_idx" ON "Colis"("modeReception", "clientId");

-- CreateIndex
CREATE INDEX "Colis_necessiteReacheminement_statut_idx" ON "Colis"("necessiteReacheminement", "statut");

-- CreateIndex
CREATE INDEX "HistoriqueStatut_colisId_survenuLe_idx" ON "HistoriqueStatut"("colisId", "survenuLe");

-- CreateIndex
CREATE UNIQUE INDEX "Document_numero_key" ON "Document"("numero");

-- CreateIndex
CREATE INDEX "Document_type_dateEmission_idx" ON "Document"("type", "dateEmission");

-- CreateIndex
CREATE INDEX "Document_colisId_idx" ON "Document"("colisId");

-- CreateIndex
CREATE INDEX "Encaissement_documentId_idx" ON "Encaissement"("documentId");

-- CreateIndex
CREATE INDEX "Encaissement_dateEncaissement_idx" ON "Encaissement"("dateEncaissement");

-- CreateIndex
CREATE UNIQUE INDEX "SequenceDocument_type_annee_key" ON "SequenceDocument"("type", "annee");

-- CreateIndex
CREATE INDEX "MessageCampagne_creeLe_idx" ON "MessageCampagne"("creeLe");

-- AddForeignKey
ALTER TABLE "Ville" ADD CONSTRAINT "Ville_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "Pays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ville" ADD CONSTRAINT "Ville_villeTransitId_fkey" FOREIGN KEY ("villeTransitId") REFERENCES "Ville"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointRetrait" ADD CONSTRAINT "PointRetrait_villeId_fkey" FOREIGN KEY ("villeId") REFERENCES "Ville"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liaison" ADD CONSTRAINT "Liaison_paysOrigineId_fkey" FOREIGN KEY ("paysOrigineId") REFERENCES "Pays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liaison" ADD CONSTRAINT "Liaison_paysDestinationId_fkey" FOREIGN KEY ("paysDestinationId") REFERENCES "Pays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_paysDestinationId_fkey" FOREIGN KEY ("paysDestinationId") REFERENCES "Pays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_villeDestinationId_fkey" FOREIGN KEY ("villeDestinationId") REFERENCES "Ville"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeDevis" ADD CONSTRAINT "DemandeDevis_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "CategorieArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoDevis" ADD CONSTRAINT "PhotoDevis_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "DemandeDevis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Depart" ADD CONSTRAINT "Depart_liaisonId_fkey" FOREIGN KEY ("liaisonId") REFERENCES "Liaison"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_villeArriveeId_fkey" FOREIGN KEY ("villeArriveeId") REFERENCES "Ville"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_pointRetraitId_fkey" FOREIGN KEY ("pointRetraitId") REFERENCES "PointRetrait"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_departId_fkey" FOREIGN KEY ("departId") REFERENCES "Depart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "CategorieArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_demandeDevisId_fkey" FOREIGN KEY ("demandeDevisId") REFERENCES "DemandeDevis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriqueStatut" ADD CONSTRAINT "HistoriqueStatut_colisId_fkey" FOREIGN KEY ("colisId") REFERENCES "Colis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriqueStatut" ADD CONSTRAINT "HistoriqueStatut_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_colisId_fkey" FOREIGN KEY ("colisId") REFERENCES "Colis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_demandeDevisId_fkey" FOREIGN KEY ("demandeDevisId") REFERENCES "DemandeDevis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encaissement" ADD CONSTRAINT "Encaissement_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encaissement" ADD CONSTRAINT "Encaissement_operateurId_fkey" FOREIGN KEY ("operateurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

