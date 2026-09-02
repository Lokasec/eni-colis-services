-- Parametres de tarification, ligne unique.
--
-- Regles confirmees par la cliente le 2 septembre 2026 :
--   - le poids facture est arrondi au KILO SUPERIEUR ;
--   - le poids minimum facture est de 1 kg (un colis de 50 g compte pour 1 kg) ;
--   - le poids volumetrique est calcule et compare au poids reel.
--
-- Ces valeurs vivent en base pour que la cliente puisse les ajuster depuis
-- le back-office, sans redeploiement.

-- CreateTable
CREATE TABLE "ParametresTarification" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "pasArrondiPoidsKg" DECIMAL(6,3) NOT NULL DEFAULT 1.000,
    "poidsMinimumFactureKg" DECIMAL(6,3) NOT NULL DEFAULT 1.000,
    "diviseurVolumetrique" INTEGER DEFAULT 5000,
    "appliquerPoidsVolumetrique" BOOLEAN NOT NULL DEFAULT true,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParametresTarification_pkey" PRIMARY KEY ("id")
);

