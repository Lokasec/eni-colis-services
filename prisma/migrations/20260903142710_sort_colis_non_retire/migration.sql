-- AlterTable
ALTER TABLE "ParametresTarification" ADD COLUMN     "sortColisNonRetire" TEXT NOT NULL DEFAULT 'VENTE_AUX_ENCHERES',
ALTER COLUMN "delaiAbandonJours" SET DEFAULT 21,
ALTER COLUMN "delaiGardeGratuiteJours" SET DEFAULT 7,
ALTER COLUMN "fraisGardeParJourEur" SET DEFAULT 3.00,
ALTER COLUMN "plafonnerFraisGardeAuTransport" SET DEFAULT false;
