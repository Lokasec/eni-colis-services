# CAHIER DES CHARGES FONCTIONNEL
## ENI Colis Services — Site vitrine & plateforme de gestion

---

**Client** : ENI Colis Services
**Prestataire** : di-eureka — [www.di-eureka.com](https://www.di-eureka.com)
**Version** : 1.3
**Date** : 25 août 2026
**Statut** : Soumis à validation client

> **Évolutions depuis la v1.2** — Trois modes de réception des colis, dont un **service de réception de commandes en ligne** · **numéro client** unique · distinction **devis / facture** · **paiement au départ ou à l'arrivée** · **double devise** sur les documents émis à l'arrivée · suivi des **créances** · franchise de TVA · élargissement de la cible aux clients résidant en Afrique.

---

## 1. Contexte et modèle d'activité

ENI Colis Services expédie des colis entre la France, l'Afrique subsaharienne et New York. L'entreprise dispose d'un **bureau en France** (collecte) et d'un **magasin à Abidjan** (retrait et encaissement).

Statut : **auto-entrepreneur, en franchise de TVA**.

### 1.1 Les trois modes de réception

C'est la structure fondatrice du projet. Trois façons dont un colis arrive au bureau français, avec des conséquences différentes sur le paiement et sur les documents émis.

| | **A — Commande en ligne** | **B — Dépôt au bureau** | **C — Expédition par transporteur** |
|---|---|---|---|
| Qui apporte le colis | Le marchand (Amazon, Shein…) | Le client lui-même | Le client, via La Poste ou un transporteur |
| Où est le client | **Le plus souvent en Afrique** | En France, à proximité | En France, éloigné |
| Ce qu'il achète | **Une adresse en France** + l'expédition | L'expédition | L'expédition |
| Identification du colis | **Numéro client dans l'adresse** | En direct au comptoir | Numéro de devis collé sur le colis |
| Contenu connu à l'avance | Non — carton scellé du marchand | Oui, ouvert au dépôt | Non — arrive fermé |
| **Paiement** | **À l'arrivée**, au retrait | **Au dépôt** | **Au départ** |
| Document initial | Devis (estimatif) | **Facture** (définitive) | Devis puis facture |

### 1.2 Le mode A : un service à part entière

La plupart des marchands français ne livrent pas en Afrique. ENI Colis Services vend donc **une adresse de livraison en France** à des clients qui résident à Abidjan ou ailleurs : ils commandent en ligne, se font livrer au bureau, et récupèrent leur colis à l'arrivée en payant sur place.

C'est le service le plus différenciant de l'offre, et il implique un élément que les autres modes n'ont pas : **chaque client doit disposer d'un numéro unique**, à insérer dans l'adresse de livraison.

```
Mme Aïcha KONE
Réf. ENI-AK-0042              ← sans cette ligne, le colis est anonyme
[adresse du bureau]
[CP] [Ville]
```

Sans ce numéro, un carton marchand arrivé au bureau est impossible à rattacher à un client — d'autant que le local est partagé avec un autre opérateur du secteur, donc deux flux anonymes convergent au même endroit.

### 1.3 Objectifs

| # | Objectif | Indicateur |
|---|---|---|
| 1 | Présence en ligne professionnelle et identité propre | Site en ligne, contenus originaux |
| 2 | Faire connaître le service d'adresse en France | Inscriptions au service de réception |
| 3 | Afficher les tarifs sans engager la société | Grille consultée, devis demandés |
| 4 | Permettre le chiffrage à distance sur photos | Réponse < 24 h |
| 5 | Suivi autonome d'un colis | Baisse des appels |
| 6 | Piloter devis, factures et encaissements | Zéro créance oubliée |
| 7 | Réduire la charge de communication | Envoi groupé en un clic |
| 8 | Identité distincte de son partenaire co-localisé | Aucun élément visuel ou éditorial commun |

### 1.4 Hors périmètre V1

Paiement en ligne · API WhatsApp automatisée · fret maritime actif · application native · documents douaniers · version anglaise complète.

> **Nuance importante par rapport à la v1.2** : l'espace client était hors périmètre. Le mode A impose désormais **au minimum une inscription** permettant d'attribuer un numéro client et de communiquer l'adresse de livraison. Un espace client complet (historique, suivi de ses colis) reste en V2.

---

## 2. Cibles

Le mode A élargit la cible : **une partie de la clientèle réside en Afrique**, pas en France. Le site doit s'adresser aux deux publics.

| Cible | Où | Attente | Mode principal |
|---|---|---|---|
| Diaspora en France | France | Envoyer à ses proches, prix clair | B |
| Diaspora éloignée du bureau | France | Envoyer sans se déplacer | C |
| **Client résidant en Afrique** | Abidjan, Dakar… | **Acheter sur les sites français** et se faire livrer | **A** |
| Petit professionnel | France ou Afrique | Volumes, régularité, revente | A, B, C |
| Client depuis New York | États-Unis | Envoyer vers Abidjan | B, C |
| Exploitante | France et Abidjan | Saisie rapide, chiffrage mobile, suivi des encaissements | — |

**Exigences transverses** : mobile-first (~80 % du trafic), contrastes renforcés, pages légères (réseaux lents à l'arrivée), français principal, anglais en V2.

---

## 3. Réseau, destinations et tarifs

### 3.1 Structure

Deux points de collecte — la France (bureau) et New York — et un **hub d'éclatement à Abidjan**, où l'entreprise dispose d'un magasin. Cotonou, Conakry, Bamako et Dakar sont réacheminés depuis Abidjan.

**Ce fonctionnement est interne et n'est jamais exposé au client.** Côté public : `EN_TRANSIT`. Côté back-office : `EN_REACHEMINEMENT`.

### 3.2 Destinations

| Pays | Ville | Monnaie locale | Acheminement |
|---|---|---|---|
| Côte d'Ivoire | Abidjan | XOF | Direct — **hub + magasin** |
| Bénin | Cotonou | XOF | Via Abidjan |
| Guinée | Conakry | GNF | Via Abidjan |
| Mali | Bamako | XOF | Via Abidjan |
| Sénégal | Dakar | XOF | Via Abidjan |
| Congo-Brazzaville | Brazzaville | XAF | **Sous-traité** |
| RD Congo | Kinshasa | CDF / USD | **Sous-traité** |
| États-Unis | New York | USD | Direct depuis Abidjan |

Départs **hebdomadaires** sur toutes les destinations.

### 3.3 Grille tarifaire

| Destination | Départ France | Retour vers France |
|---|---|---|
| Abidjan | 15 €/kg | 12 €/kg |
| Cotonou | 15 €/kg | 12 €/kg |
| Conakry | 15 €/kg | 12 €/kg |
| Bamako | 15 €/kg | 12 €/kg |
| Dakar | 12 €/kg | 12 €/kg |
| Brazzaville | 20 €/kg | 20 €/kg |
| Kinshasa | 15 €/kg | 15 €/kg |
| New York ↔ Abidjan | 20 €/kg | 20 €/kg |

**France ↔ États-Unis** : opérée via Abidjan uniquement, **non affichée** (`afficheePubliquement = false`). Mention en FAQ, devis au cas par cas.

### 3.4 Catégories d'articles

| Catégorie | Calcul | Devis préalable |
|---|---|---|
| `STANDARD` | poids × tarif de la liaison | Non |
| `PIECE_DETACHEE` | 20 €/kg — **remplace** le tarif | Non |
| `GRANDE_MARQUE` | `max(poids × tarif, 15 % de la valeur d'achat)` *(à confirmer)* | Oui |
| `ELECTRONIQUE` | À l'unité, non publié | Oui |

Justificatif d'achat obligatoire pour tout article de valeur. Indemnisation plafonnée — voir §7.

---

## 4. Devise et conversion

### 4.1 Principe

**Le site public affiche uniquement des euros.** La double devise n'apparaît que sur les **documents émis à l'arrivée**, pour les clients qui règlent sur place.

### 4.2 Règles de conversion

| Zone | Monnaie | Taux | Traitement |
|---|---|---|---|
| Côte d'Ivoire, Bénin, Mali, Sénégal | XOF | **1 € = 655,957** (parité fixe) | Conversion automatique |
| Congo-Brazzaville | XAF | **1 € = 655,957** (parité fixe) | Conversion automatique |
| Guinée, RD Congo (France → Afrique) | — | — | **Payé en France, en euros** |
| RD Congo → France | USD | Flottant | **Taux saisi en back-office**, figé sur le document |
| New York | USD | Flottant | Taux saisi en back-office |

La parité CFA est fixe depuis 1999 et assortie d'une garantie de convertibilité illimitée : aucun risque de change sur les cinq destinations concernées.

**Règle impérative** : le taux appliqué est **figé au moment de l'émission du document**, jamais recalculé à l'encaissement. Le montant en devise locale est stocké, pas dérivé à l'affichage.

---

## 5. Devis, factures et paiements

### 5.1 Deux documents distincts

| | **Devis** (proforma) | **Facture** |
|---|---|---|
| Nature | Estimatif — le poids réel peut varier | **Définitif** |
| Émis quand | Avant l'acheminement | Au moment du paiement |
| Valeur | Aucune valeur comptable | **Pièce comptable** |
| Numérotation | `DEV-2026-00123` | `FAC-2026-00123` — **séquence continue, sans trou** |
| Mention TVA | « TVA non applicable, art. 293 B du CGI » | Idem, **obligatoire** |

> **Franchise de TVA** : l'entreprise étant en franchise, la mention **« TVA non applicable, art. 293 B du CGI »** doit figurer sur tout devis et toute facture. Aucun montant de TVA ne doit apparaître nulle part — ni sur les documents, ni sur le site.

### 5.2 Parcours par mode

**Mode B — Dépôt au bureau, paiement immédiat**
```
Dépôt → pesée → montant définitif → FACTURE émise → paiement → reçu + code de suivi
```
Pas de devis nécessaire pour un colis ordinaire : le tarif au kilo affiché s'applique.

**Mode C — Expédition par transporteur, paiement au départ**
```
Devis sur photos → validation client → expédition du colis vers le bureau
→ réception et pesée → FACTURE émise (montant ajusté au poids réel) → paiement → départ
```

**Mode A — Commande en ligne, paiement à l'arrivée**
```
Inscription → numéro client → adresse de livraison communiquée
→ colis reçu au bureau et pesé → DEVIS estimatif envoyé au client
→ acheminement → arrivée au magasin d'Abidjan
→ FACTURE définitive émise, en euros et en FCFA
→ paiement sur place → remise du colis
```

### 5.3 Écart entre devis et facture

Le poids constaté peut différer de l'estimation. La facture fait foi. Si l'écart dépasse un seuil paramétrable, le back-office signale l'anomalie pour que l'exploitante prévienne le client avant l'arrivée.

### 5.4 Encaissement

L'exploitante encaisse **elle-même** au magasin d'Abidjan, en FCFA. Le rapatriement des fonds relève de son organisation propre et **ne fait pas partie du périmètre applicatif**. Le système se limite à :

- Enregistrer l'encaissement (montant, devise, date, point de retrait)
- Distinguer les encaissements France et Afrique
- Produire un état des sommes encaissées par période et par lieu

### 5.5 Suivi des créances — module critique

Sur le mode A, l'entreprise **avance le coût du transport** et n'est payée qu'à l'arrivée, parfois plusieurs semaines plus tard.

Le back-office doit comporter une vue **« Colis partis, non payés »** avec :
- Montant dû, en euros et en devise locale
- Ancienneté depuis le départ
- Statut de retrait
- Total des créances en cours

**Garde-fous** :
- Le colis n'est remis **que contre paiement** — à écrire dans les CGS
- Délai de garde par défaut : **30 jours** après mise à disposition
- Au-delà : relance, puis frais de garde `[À COMPLÉTER]`
- Sort d'un colis jamais retiré ni payé : `[À COMPLÉTER — à trancher avec la cliente]`

### 5.6 Statuts de paiement

`NON_DU` · `A_PAYER_DEPART` · `A_PAYER_ARRIVEE` · `PAYE` · `PARTIELLEMENT_PAYE` · `IMPAYE_RELANCE` · `ABANDONNE`

---

## 6. Numéro client et inscription

### 6.1 Format

```
ENI-AK-0042
 │   │   └── séquence automatique, garantit l'unicité
 │   └────── initiales du client — reconnaissance visuelle immédiate
 └────────── préfixe obligatoire (local partagé avec un autre opérateur)
```

Les initiales seules provoquent des collisions : deux clients « AK » rendraient l'identification impossible. La séquence résout ce problème sans changer les habitudes de l'exploitante.

### 6.2 Inscription au service de réception

Formulaire court : nom, prénom, téléphone, e-mail, ville de destination, pays.

À la validation :
- Attribution automatique du numéro client
- Affichage et envoi par e-mail de **l'adresse de livraison complète, prête à copier-coller**
- Rappel des règles : numéro obligatoire dans l'adresse, marchands acceptés, contenus interdits

L'exploitante peut créer, modifier et désactiver un client depuis le back-office.

---

## 7. Site public

### 7.1 Arborescence

```
Accueil
├── Nos destinations  →  fiche par pays
├── Nos services
│     └── Faites-vous livrer chez nous   ← NOUVELLE PAGE (mode A)
├── Tarifs
├── Demander un devis
├── Prochains départs
├── Suivre mon colis
├── FAQ
├── À propos
├── Contact
└── Pages légales
```

### 7.2 Nouvelle page « Faites-vous livrer chez nous »

Destinée aux clients **résidant en Afrique**. Contenu attendu :

- Le problème résolu : la plupart des marchands français ne livrent pas en Afrique
- Le principe : une adresse en France, un numéro client, un colis récupéré à Abidjan
- Les étapes : inscription → numéro → commande en ligne → réception → acheminement → paiement en FCFA au retrait
- Le paiement se fait **à l'arrivée**, en monnaie locale
- Les contenus interdits et les limites
- CTA : « Obtenir mon adresse en France »

### 7.3 Le reste du site

Inchangé par rapport à la v1.2 : tarifs affichés pour les colis ordinaires, devis sur photos pour les cas particuliers, suivi par code, départs hebdomadaires, FAQ balisée `FAQPage`.

**Aucun prix n'est calculé automatiquement côté public.** Aucun témoignage fictif.

---

## 8. Back-office

| Module | Fonctions |
|---|---|
| **Tableau de bord** | Devis en attente · colis reçus non traités · départs à venir · **colis à réacheminer** · **créances en cours** · colis à retirer |
| **Clients** | CRUD, attribution des numéros, historique, colis rattachés |
| **Réceptions** | Colis arrivés au bureau à rattacher à un client (mode A) — file de traitement quotidienne |
| **Devis** | Photos, chiffrage, envoi, relance, conversion en colis |
| **Colis** | CRUD, statuts, recherche, mode de réception, mode de paiement |
| **Factures** | Émission, numérotation continue, PDF, réémission, export comptable |
| **Encaissements** | Saisie, devise, lieu, rapprochement avec les factures |
| **Créances** | Colis partis non payés, ancienneté, relances |
| **Départs** | CRUD, affectation, clôture |
| **Destinations et tarifs** | Pays, villes, liaisons, catégories, **taux de change manuels** |
| **Messagerie** | Campagnes e-mail groupées, liste WhatsApp |
| **Contenus** | Pages destination, FAQ |
| **Utilisateurs** | Comptes et rôles |

**Rôles** : `ADMIN` (tout) · `OPERATEUR` (saisie et consultation, sans accès aux tarifs, paramètres, factures ni exports).

**Ergonomie** : usage debout, sur téléphone. Saisie d'un colis en moins de 60 secondes. Le module Réceptions doit permettre de traiter une pile de cartons rapidement : recherche par numéro client, photo, rattachement, pesée.

---

## 9. Modèle de données

```
Client
 ├─ numeroClient (ENI-XX-0000), nom, prenom, telephone, email
 ├─ paysDestination → Pays, villeDestination → Ville
 ├─ actif, dateInscription
 └─ Colis[]

Pays
 ├─ code ISO, nom, monnaie (XOF | XAF | GNF | CDF | USD | EUR)
 ├─ tauxFixe : décimal | null        ← 655,957 pour la zone CFA
 ├─ tauxManuel : décimal | null      ← saisi pour les devises flottantes
 └─ Ville[] → nom, codeAeroport, villeTransit (interne), PointRetrait[]

Liaison
 ├─ paysOrigine, paysDestination, mode (AERIEN | MARITIME)
 ├─ prixParKg, delaiJoursMin/Max
 ├─ sousTraitee, prixAchat (interne)
 ├─ afficheePubliquement, actif

CategorieArticle
 └─ libelle, modeCalcul, valeur, publie

Colis
 ├─ codeSuivi (ENI-AAAA-NNNNN)
 ├─ client → Client (nullable pour un dépôt ponctuel)
 ├─ modeReception : COMMANDE_EN_LIGNE | DEPOT | EXPEDITION
 ├─ momentPaiement : DEPART | ARRIVEE
 ├─ expediteur, destinataire
 ├─ villeDestination, pointRetrait, depart
 ├─ necessiteReacheminement
 ├─ poidsEstime, poidsReel, dimensions
 ├─ categorie, valeurDeclaree, justificatifFourni
 ├─ statut, statutPaiement
 ├─ devis → Document, facture → Document
 └─ HistoriqueStatut[]

Document                              ← devis ET facture
 ├─ type : DEVIS | FACTURE
 ├─ numero (DEV-AAAA-NNNNN | FAC-AAAA-NNNNN)
 ├─ colis → Colis
 ├─ montantEur
 ├─ devise, tauxApplique, montantDevise    ← figés à l'émission
 ├─ dateEmission, dateValidite
 ├─ mentionFiscale (art. 293 B du CGI)
 └─ pdfUrl

Encaissement
 ├─ document → Document
 ├─ montant, devise, tauxApplique
 ├─ lieu : FRANCE | ABIDJAN | AUTRE
 ├─ dateEncaissement, moyen
 └─ operateur → Utilisateur

Depart
 └─ reference, liaison, dateClotureDepot, dateDepart, dateArriveeEstimee, statut, Colis[]

MessageCampagne · Utilisateur
```

### Décisions structurantes

| Décision | Justification |
|---|---|
| `Document` unique pour devis et facture | Même structure, même rendu PDF, historique cohérent |
| Numérotation des factures **continue et sans trou** | Exigence comptable |
| `tauxApplique` et `montantDevise` **stockés** | Le document doit refléter le taux du jour de son émission |
| `momentPaiement` porté par le colis | Détermine le parcours, les relances et le suivi des créances |
| `modeReception` porté par le colis | Détermine les documents émis et l'identification |
| `Client` distinct de `Expediteur` | Un client du service d'adresse n'est pas forcément l'expéditeur |
| Le mode `MARITIME` existe, désactivé | Activation par paramétrage |
| Photos de devis conservées | Trace en cas de litige |
| Préfixe `ENI-` partout | Local partagé — voir §11 |

---

## 10. Documents PDF

**Devis** — logo, « DEVIS », numéro, date, validité 7 jours, coordonnées, détail de l'envoi, montant en euros, **mention art. 293 B**, mention « estimation sous réserve du poids constaté ».

**Facture** — logo, « FACTURE », numéro de la séquence continue, date, coordonnées, détail, **montant en euros et, si émise à l'arrivée, en devise locale avec le taux appliqué**, mention art. 293 B, mode et date de paiement.

**Reçu de dépôt** — logo, numéro, coordonnées, expéditeur et destinataire, détail, **code de suivi mis en évidence + QR code** vers la page de suivi, mention « conservez ce reçu pour le retrait ».

---

## 11. Cohabitation avec le partenaire co-localisé

Local commercial partagé et relation de sous-traitance sur Brazzaville et Kinshasa.

| Risque | Mesure |
|---|---|
| Confusion de colis, aggravée par les cartons marchands anonymes | Préfixes `ENI-`, **numéro client obligatoire dans l'adresse**, étiquetage différencié, zones de stockage séparées |
| Fusion des fiches Google Business Profile | Complément d'adresse, catégories et téléphones distincts |
| Réputation croisée | Mentions légales, CGS et réclamations séparées |
| Transmission de données au sous-traitant | Canal tracé et journalisé, **contrat art. 28 RGPD** |

Bases, hébergements, domaines et comptes strictement distincts. Aucun accès croisé.

---

## 12. SEO, contenu, stack, conformité

**Contenu** intégralement original — cinq destinations sont communes avec l'opérateur co-localisé, le risque de duplicate content est maximal sur les fiches pays.

**Positionnement** : réseau France–Afrique–New York, avec deux angles propres — la **liaison Abidjan ↔ New York** et le **service d'adresse en France** pour la clientèle africaine.

**Stack** : Next.js App Router, TypeScript strict, Tailwind (tokens), PostgreSQL région Europe, Prisma, Auth.js, Resend, stockage objet Europe, `@react-pdf/renderer`.

**Propriété** : tous les comptes de production au nom d'ENI Colis Services, di-eureka en accès délégué révocable.

**RGPD** : hébergement UE (photos comprises), bases légales documentées, conservation (devis non convertis 12 mois · clients 3 ans après le dernier envoi · **pièces comptables 10 ans**), contrat art. 28 avec le sous-traitant, bandeau cookies conforme.

**Mentions légales** : dénomination, statut d'auto-entrepreneur, SIREN, adresse, directeur de publication, hébergeur, **statut réglementaire de l'activité de transport** `[À COMPLÉTER]`.

**CGS** : objets interdits · articles de valeur et justificatifs · **plafond d'indemnisation** · **remise contre paiement** · délai de garde · colis non retirés · recours à un sous-traitant · envois à distance · réclamations.

---

## 13. Points ouverts

| # | Point | Criticité |
|---|---|---|
| 1 | Plafond d'indemnisation par kilo et par colis | 🔴 Exposition financière |
| 2 | Sort d'un colis jamais retiré ni payé | 🔴 Perte sèche potentielle |
| 3 | Frais de garde au-delà de 30 jours | 🟠 CGS |
| 4 | Seuil d'écart devis/facture déclenchant une alerte | 🟠 Paramétrage |
| 5 | Confirmation de la règle `GRANDE_MARQUE` (`max` ou remplacement pur) | 🟠 Facturation |
| 6 | Points de retrait : adresses, contacts, horaires | 🟠 Pages destination |
| 7 | Délais réels par destination, réacheminement inclus | 🟠 Crédibilité |
| 8 | Statut réglementaire de l'activité de transport | 🟠 Mentions légales |
| 9 | Adresse exacte du bureau français | 🟠 Mode A — indispensable |
| 10 | Marchands acceptés ou refusés pour le mode A | 🟢 FAQ |
| 11 | Version anglaise | 🟢 V2 |

---

## 14. Phasage

| Phase | Contenu | Validation |
|---|---|---|
| 0 | Validation du CDC v1.3 | Client |
| 1 | Identité visuelle ✅ *(livrée)* | ✅ |
| 2 | Maquettes ✅ *(livrées — à compléter : page mode A)* | En cours |
| 3 | Développement du site public | Recette interne |
| 4 | Back-office : clients, réceptions, colis, départs | Recette client |
| 5 | Back-office : devis, factures, encaissements, créances | Recette client |
| 6 | Contenus réels, SEO, performances | Client |
| 7 | Mise en production | Client |
| 8 | Formation et documentation | Client |

---

## Annexe — Hypothèses non activées

| Hypothèse | Condition d'activation |
|---|---|
| Fret maritime | Ouverture du service |
| Paliers tarifaires dégressifs | Politique de remise au volume |
| Liaisons intra-africaines directes | Exploitation réelle |
| France ↔ États-Unis affichée | Ouverture d'une ligne directe |
| Espace client complet | V2 |
| Paiement en ligne | V2 |
| Version anglaise | Développement du marché new-yorkais |

---

## Validation

| Rôle | Nom | Date | Signature |
|---|---|---|---|
| Client — ENI Colis Services | | | |
| Prestataire — di-eureka | | | |

---

*Document produit par **di-eureka** — conception et développement web*
