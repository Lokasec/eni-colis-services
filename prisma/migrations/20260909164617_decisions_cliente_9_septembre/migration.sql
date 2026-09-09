-- Décisions de la cliente du 9 septembre 2026.
--
-- Cette migration ne se contente PAS de changer des valeurs par défaut :
-- elle met aussi à jour les lignes déjà écrites. C'est indispensable, et
-- ce n'est pas théorique. `ALTER COLUMN … SET DEFAULT` ne s'applique
-- qu'aux insertions futures ; la base de production contient déjà sa
-- ligne ParametresTarification et ses huit pays, écrits à l'amorçage du
-- 3 septembre. Sans les UPDATE ci-dessous, le déploiement serait passé
-- au vert et le site en ligne aurait continué d'annoncer 3 €/jour, la
-- vente aux enchères, et deux destinations que la cliente a fermées.
--
-- Les UPDATE sont INCONDITIONNELS. Ce sont des décisions explicites, pas
-- des valeurs par défaut à respecter si quelqu'un les a modifiées depuis.

-- 1. Frais de garde : 3 € → 5 € par jour.
ALTER TABLE "ParametresTarification" ALTER COLUMN "fraisGardeParJourEur" SET DEFAULT 5.00;

-- 2. Colis non retiré au 21e jour : vente aux enchères → destruction.
ALTER TABLE "ParametresTarification" ALTER COLUMN "sortColisNonRetire" SET DEFAULT 'DESTRUCTION';

UPDATE "ParametresTarification"
SET "fraisGardeParJourEur" = 5.00,
    "sortColisNonRetire"   = 'DESTRUCTION',
    "modifieLe"            = NOW();

-- 3. Brazzaville et Kinshasa fermées.
--
-- Rien n'est supprimé. Les pays, les villes, les points de retrait, les
-- liaisons et leur historique restent en base — le colis ENI-2026-00107,
-- parti vers Brazzaville et facturé 200 €, doit continuer d'exister dans
-- la comptabilité. C'est le traitement déjà retenu pour France ↔ USA le
-- 2 septembre : on ferme, on ne détruit pas.
--
-- Les DEUX niveaux sont nécessaires. Les liaisons commandent les pages
-- destination, les départs et le sélecteur du devis ; `Pays.actif`
-- commande le sélecteur de ville de retrait à l'inscription, qui ne
-- regarde pas les liaisons. Fermer l'un sans l'autre laisse une porte
-- ouverte.
UPDATE "Pays"
SET "actif" = false, "modifieLe" = NOW()
WHERE "codeIso" IN ('CG', 'CD');

UPDATE "Liaison"
SET "actif" = false, "afficheePubliquement" = false, "modifieLe" = NOW()
WHERE "paysOrigineId"     IN (SELECT "id" FROM "Pays" WHERE "codeIso" IN ('CG', 'CD'))
   OR "paysDestinationId" IN (SELECT "id" FROM "Pays" WHERE "codeIso" IN ('CG', 'CD'));
