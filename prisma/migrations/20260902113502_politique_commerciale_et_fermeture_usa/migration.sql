-- AlterTable
ALTER TABLE "ParametresTarification" ADD COLUMN     "delaiAbandonJours" INTEGER NOT NULL DEFAULT 120,
ADD COLUMN     "delaiGardeGratuiteJours" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "fraisGardeParJourEur" DECIMAL(10,2) NOT NULL DEFAULT 1.00,
ADD COLUMN     "indemniserValeurDeclareeSiJustifiee" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "plafondIndemnisationParColisEur" DECIMAL(10,2) NOT NULL DEFAULT 400.00,
ADD COLUMN     "plafondIndemnisationParKgEur" DECIMAL(10,2) NOT NULL DEFAULT 20.00,
ADD COLUMN     "plafonnerFraisGardeAuTransport" BOOLEAN NOT NULL DEFAULT true;
