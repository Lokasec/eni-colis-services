-- La regle GRANDE_MARQUE a ete confirmee par la cliente : le cout du
-- transport EST 15 % de la valeur d'achat, et non le plus eleve du poids
-- ou du pourcentage. Le nom de la valeur d'enumeration doit dire la regle,
-- sinon il induira en erreur a la prochaine lecture.
--
-- RENAME VALUE plutot que drop/recreate : les lignes existantes conservent
-- leur reference, aucune donnee n'est touchee.

ALTER TYPE "ModeCalcul" RENAME VALUE 'MAX_POIDS_OU_POURCENTAGE' TO 'POURCENTAGE_VALEUR';
