# DÉMARRER — ENI Colis Services

Guide de lancement du développement avec Claude Code.
*di-eureka — [www.di-eureka.com](https://www.di-eureka.com)*

---

## Avant la première session

1. Créer un dépôt Git vide et y copier le contenu de ce kit
2. Ouvrir Claude Code à la racine du dépôt
3. Vérifier que `CLAUDE.md` est bien à la racine — il est lu à chaque session

**Ce que contient le kit**

```
CLAUDE.md                       ← brief permanent, lu à chaque session
DEMARRER.md                     ← ce fichier
design/tokens.json              ← source unique du design system
docs/
  CDC-v1.3.md                   ← cahier des charges complet
  contenus-pages.md             ← textes validés, pages transverses
  contenus-destinations.md      ← textes validés, 8 fiches pays
  guide-images.md               ← nommage et préparation des visuels
  maquette/                     ← maquette HTML validée par la cliente
public/brand/                   ← logos et favicons
```

---

## Les trois règles

**Un lot par session.** Ne jamais enchaîner deux lots dans le même contexte : quand le contexte se remplit, la qualité chute et l'agent réinvente des règles déjà posées.

**Valider avant de continuer.** Chaque lot a un critère de fin. Tant qu'il n'est pas atteint, ne pas passer au suivant.

**Commit à chaque fin de lot.** Un point de retour propre vaut mieux qu'un `git reset` douloureux.

> **Si une règle métier manque, l'ajouter à `CLAUDE.md`** — pas seulement au prompt du moment, sinon elle sera perdue à la session suivante.

---

## Lot 1 — Bootstrap et infrastructure

```
Initialise le projet ENI Colis Services selon CLAUDE.md.

- Next.js 14+ App Router, TypeScript strict
- Tailwind configuré, tokens générés depuis design/tokens.json
- scripts/build-brand.mjs : génère les variables CSS et la config Tailwind
  depuis tokens.json (commande npm run brand)
- Montserrat auto-hébergée via next/font, poids 400/500/600/700/800
- Logos et favicons depuis public/brand/
- Prisma + SQLite en dev
- ESLint, Prettier, .env.example documenté, .gitignore correct
- README : installation, commandes, structure, hypothèses

Aucune page métier, aucun modèle de données pour l'instant.
Termine par un npm run build qui passe.
```

**Critère de fin** : `npm run dev` démarre · `npm run build` passe · `npm run brand` génère les variables CSS.

---

## Lot 2 — Design-system

```
Crée les composants réutilisables, en suivant la maquette docs/maquette/
qui a été validée par la cliente.

Primitives : Button (variants primary, outline, onNavy, ghostNavy, whatsapp),
Container, Section, Eyebrow, SectionHeading, Card, Badge (8 variants de statut),
CountryChip, DepartRow, Stepper, CtaBand, Header (sticky + burger), Footer,
WhatsAppFloat, Accordion, DataTable, KeyValueList, Timeline.

Formulaires : TextField, SelectField, TextareaField, RadioCards, PhotoUpload, Checkbox.

Admin : Sidebar, Topbar, StatCard, Modal, Toast, StatusSelect, PhotoViewer.

Règles :
- Aucune couleur en dur, tout passe par les tokens
- Mobile-first, cibles tactiles >= 44px
- Boutons orange : texte navy (contraste AA)
- Crée une page /styleguide listant tous les composants

Montre-moi le rendu avant de continuer.
```

**Critère de fin** : `/styleguide` s'affiche, cohérent avec la maquette. **C'est le moment de corriger l'ADN visuel** — pas après avoir construit quinze pages dessus.

---

## Lot 3 — Modèle de données

```
Implémente le schéma Prisma complet d'après docs/CDC-v1.3.md §9.

Points de vigilance :
- Liaison est ORIENTÉE : paysOrigine → paysDestination. L'inverse est une autre ligne.
- Ville.villeTransit auto-référent, nullable, INTERNE (hub d'éclatement)
- Liaison.afficheePubliquement contrôle la visibilité publique
- Document unique pour DEVIS et FACTURE (champ type)
- tauxApplique et montantDevise STOCKÉS, jamais recalculés
- Colis.modeReception (COMMANDE_EN_LIGNE | DEPOT | EXPEDITION)
- Colis.momentPaiement (DEPART | ARRIVEE)
- Client distinct de Expediteur
- HistoriqueStatut append-only

Puis prisma/seed.ts :
- 8 pays, leurs villes — SÉNÉGAL AVEC DAKAR ET THIÈS
- Les liaisons et tarifs de CLAUDE.md §4.2
- Les 4 catégories d'articles
- France ↔ USA en afficheePubliquement: false
- Points de retrait de CLAUDE.md §4.4
- ~6 clients avec identifiants, ~4 départs hebdomadaires,
  ~8 colis à statuts et modes de réception variés, ~4 devis, ~3 factures
  dont une payée à l'arrivée en FCFA

Aucun faux témoignage, aucun nom de client réel.
```

**Critère de fin** : `prisma migrate dev` et `db seed` passent, données visibles dans Prisma Studio.

---

## Lot 4 — Moteur de tarification

**Le lot à ne pas bâcler.** Une erreur ici se traduit en euros perdus sur chaque colis, sans que personne s'en aperçoive avant des semaines.

```
Implémente lib/tarification/.

Règles (CLAUDE.md §4.3) :
- STANDARD : poids × prixParKg de la liaison
- PIECE_DETACHEE : poids × 20 € — REMPLACE le tarif de la liaison
- GRANDE_MARQUE : max(poids × tarif liaison, 15 % de la valeur d'achat)
- ELECTRONIQUE : pas de calcul, retourne un statut "sur devis"

Conversion de devise :
- Zone CFA (XOF, XAF) : taux fixe 655,957, automatique
- Autres : taux saisi en base, jamais deviné
- Le taux est FIGÉ à l'émission du document

Aucune valeur en dur : tout vient de la base.

Tests unitaires couvrant :
- Chaque catégorie, à l'aller et au retour
- GRANDE_MARQUE : cas où le poids l'emporte, cas où les 15 % l'emportent
- Conversion CFA et conversion à taux manuel
- Liaison inexistante ou inactive

Cette fonction ne doit être appelée par aucun code côté public.
```

**Critère de fin** : tous les tests passent. **Relis les cas de test toi-même** — c'est là que se logent les erreurs de facturation.

---

## Lot 5 — Site public

À découper en deux sessions si le contexte se remplit.

```
Construis le site public en suivant docs/maquette/ et les textes de
docs/contenus-pages.md et docs/contenus-destinations.md.

Pages : /, /destinations, /destinations/[slug], /recevoir, /inscription,
/services, /tarifs, /devis, /departs, /suivi, /faq, /a-propos, /contact, /legal/*

Règles :
- Les textes sont VALIDÉS. Ne les réinvente pas, ne les reformule pas.
- /destinations, /departs et /suivi lisent la vraie base
- Ne jamais exposer villeTransit — vérifie-le dans les sélections Prisma
- France ↔ USA absente des listes, sélecteurs et sitemap
- Placeholders SVG aux bons ratios pour les images manquantes (voir guide-images.md)
- Données structurées Schema.org, title et meta uniques par page
- Bloc témoignages masqué (aucun avis réel fourni)

Laisse des TODO explicites pour les contenus non fournis.
N'invente aucun contenu légal.
```

**Critère de fin** : navigation complète sur mobile · aucune couleur hors tokens · Lighthouse mobile > 90 · vérifier dans le HTML rendu qu'aucun `villeTransit` ne fuit.

---

## Lot 6 — Formulaires

```
Implémente les deux formulaires interactifs.

/devis — champs et comportement conditionnel : voir docs/maquette/devis.html
- Sélecteurs pays → ville en cascade, alimentés par les liaisons publiques
- Mode de remise (dépôt / expédition) : l'expédition affiche les consignes de marquage
- Nature du colis : électronique → avertissement ; article de valeur → champ valeur + justificatif
- Upload 1 à 3 photos, capture="environment", compression navigateur,
  JPEG/PNG/HEIC, 5 Mo max, stockage région Europe
- Aucun prix affiché ni calculé sur cette page

/inscription — voir docs/maquette/inscription.html
- Attribution automatique de l'identifiant (format « Eni Prénom NN », ENI-XX-0000 en base)
- Affichage du bloc d'adresse complet, prêt à copier
- Envoi par e-mail

Les deux : validation Zod côté serveur indépendamment du client,
honeypot, rate-limit, Server Actions, e-mails via Resend.
```

**Critère de fin** : soumission réussie **depuis un téléphone réel**, photo prise en direct, e-mails reçus.

---

## Lot 7 — Back-office : socle et exploitation

```
Auth.js credentials, rôles ADMIN et OPERATEUR, middleware sur /admin/**.
Vérification du rôle CÔTÉ SERVEUR sur chaque action, pas seulement masquage.

Modules de cette session :
- Tableau de bord (CLAUDE.md §9)
- Clients : CRUD, identifiants, historique
- Réceptions : file des colis reçus non rattachés, avec photo, rattachement manuel
- Colis : CRUD, statuts, recherche, changement en masse
- Départs : CRUD, affectation, clôture
- Réacheminement : colis au hub en attente du second segment

Ergonomie : usage debout, sur téléphone, colis dans les mains.
Saisie d'un colis en moins de 60 secondes.
```

**Critère de fin** : tester avec un compte `OPERATEUR` et vérifier que les modules restreints sont **réellement inaccessibles**, pas seulement masqués.

---

## Lot 8 — Back-office : facturation

```
Modules financiers.

- Devis : photos en grand, chiffrage (calcul proposé comme SUGGESTION modifiable,
  jamais imposée), envoi e-mail + lien WhatsApp, conversion en colis
- Factures : émission, numérotation CONTINUE SANS TROU, PDF, réémission, export
- Encaissements : montant, devise, lieu (France / Abidjan), rapprochement
- Créances : colis partis non payés, ancienneté, total, relances
- Taux de change manuels pour les devises flottantes

Mention obligatoire sur tout devis et toute facture :
« TVA non applicable, art. 293 B du CGI »
Aucun montant de TVA nulle part.
```

**Critère de fin** : émettre une facture à l'arrivée en EUR et FCFA, saisir l'encaissement, vérifier que la créance se solde.

---

## Lot 9 — PDF et notifications

```
- Devis PDF, facture PDF, reçu de dépôt PDF (CLAUDE.md §11)
- Le reçu porte le code de suivi en évidence + un QR code vers /suivi?code=...
- E-mails transactionnels via Resend (CDC §10)
- Messagerie de départ : envoi groupé aux expéditeurs d'un départ,
  liste WhatsApp cliquable avec messages pré-remplis, modèles éditables, historique
```

---

## Lot 10 — Recette

```
- SEO : sitemap, robots.txt, données structurées, métadonnées
- Performance : Lighthouse mobile > 90, LCP < 2,5 s
- Accessibilité : navigation clavier, contrastes, focus visible
- Sécurité : secrets, protection des routes, fuites de données
- Bandeau cookies
- Parcours bout-en-bout de CLAUDE.md §17
- Checklist finale complète
```

---

## Ordre de priorité si le temps manque

| Priorité | Lots | Raison |
|---|---|---|
| 🔴 Indispensable | 1 à 8 | Sans facturation ni créances, l'outil ne sert pas son métier |
| 🟠 Important | 9 | Les PDF peuvent être manuels au démarrage |
| 🟢 Confort | 10 | À faire avant la mise en ligne réelle |

---

## Erreurs fréquentes à surveiller

| Symptôme | Cause probable |
|---|---|
| Une couleur en dur apparaît | Le token manquait — l'ajouter à `tokens.json`, ne pas contourner |
| Claude Code propose un calculateur public | Rappeler `CLAUDE.md` §1.3 |
| Le devis devient obligatoire partout | Rappeler la distinction des trois modes |
| Un tarif est écrit dans le code | Tout vient de la base |
| Les textes sont reformulés | Ils sont validés — rappeler `docs/contenus-*.md` |
| La qualité baisse en fin de session | Contexte plein : fin de lot, nouvelle session |
| Une règle métier est inventée | Elle manquait dans `CLAUDE.md` — l'y ajouter |

---

*di-eureka — [www.di-eureka.com](https://www.di-eureka.com)*
