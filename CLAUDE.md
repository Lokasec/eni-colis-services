# CLAUDE.md — Brief projet ENI Colis Services

> **Claude Code : lis ce fichier en entier avant toute action**, établis un plan de tâches, attends validation, puis construis de façon incrémentale. Ce fichier est la mémoire permanente du projet.

**Version 2.0** — aligné sur le CDC v1.3

---

## ⚑ Ressources en place

| Ressource | Emplacement |
|---|---|
| Cahier des charges complet | `docs/CDC-v1.3.md` |
| Contenus rédactionnels (pages) | `docs/contenus-pages.md` |
| Contenus rédactionnels (destinations) | `docs/contenus-destinations.md` |
| Maquette HTML validée par la cliente | `docs/maquette/` |
| Design tokens | `design/tokens.json` |
| Logos et favicons | `public/brand/` |
| Guide images | `docs/guide-images.md` |

**Les textes sont écrits et validés. Ne les réinvente pas, ne les reformule pas.** La maquette fait foi pour la mise en page.

---

## 0. Ton rôle et ta méthode

Tu es un **ingénieur full-stack senior doublé d'un designer produit**. Tu construis l'application de production d'**ENI Colis Services**, phase 1.

1. **Lis tout ce brief**, puis dresse un plan de tâches avant de coder.
2. Travaille **par lots** (voir `DEMARRER.md`), en t'arrêtant pour validation entre chacun.
3. **Ne pose que les questions bloquantes.** Pour le reste, applique les défauts définis ici et note tes hypothèses dans le README.
4. À chaque étape : le projet **build sans erreur**, `lint` et `typecheck` passent, tu lances l'app pour vérifier le rendu.
5. **Barre de qualité non négociable** : beauté, simplicité, ergonomie, mobile-first, performance, accessibilité. Un rendu « générique IA » est un échec.
6. **Commits fréquents et explicites** : `feat(devis): formulaire + upload photos`.

---

## 1. Contexte métier

ENI Colis Services expédie des colis entre la France, l'Afrique subsaharienne et New York. **Ce n'est pas un e-commerce.**

- **Bureau en France** : 67 rue Saint-Julien, 76100 Rouen — collecte et réception
- **Magasin à Abidjan** : Angré, face à l'immeuble Konor 2 — retrait et encaissement
- Statut : **auto-entrepreneur, en franchise de TVA**
- Téléphone / WhatsApp : +33 6 52 70 70 14

### 1.1 Les trois modes de réception — structure fondatrice

| | **A — Commande en ligne** | **B — Dépôt au bureau** | **C — Expédition par transporteur** |
|---|---|---|---|
| Qui apporte le colis | Le marchand (Amazon, Shein…) | Le client | Le client, via La Poste ou autre |
| Où est le client | **Souvent en Afrique** | En France, à proximité | En France, éloigné |
| Identification | **Identifiant dans le champ Nom** | En direct au comptoir | Numéro de devis collé sur le colis |
| Contenu connu | Non, carton scellé | Oui, ouvert au dépôt | Non, arrive fermé |
| **Paiement** | **À l'arrivée** | **Au dépôt** | **Au départ** |
| Document initial | Devis estimatif | **Facture** directe | Devis puis facture |

### 1.2 Le mode A : service d'adresse en France

La plupart des marchands français ne livrent pas en Afrique. ENI vend **une adresse de livraison en France**. Le client s'inscrit, reçoit un identifiant, l'utilise dans ses commandes.

**Format d'adresse imposé par la cliente — ne pas le modifier :**

```
Nom        : Eni Aïcha 42        ← « Eni » + prénom + numéro séquentiel
Prénom     : colis service
Adresse    : 67 rue Saint-Julien
Code postal: 76100
Ville      : Rouen
Département: Seine-Maritime
Téléphone  : +33 6 52 70 70 14   ← celui d'ENI, pas du client
E-mail     : celui du client
```

Le champ `Nom` est l'identifiant. Le numéro séquentiel évite la collision entre deux clients de même prénom. En base, l'identifiant complet est `ENI-XX-0000` (initiales + séquence) ; **la partie affichée au client reste « Eni Prénom NN »**.

> **File des colis non identifiés** : un client oubliera son numéro. Le back-office doit permettre d'enregistrer un colis reçu sans client rattaché (avec photo) et de le rattacher manuellement plus tard. Sans cette file, un carton anonyme n'existe nulle part et se perd — d'autant que le local est partagé avec un autre opérateur.

### 1.3 Ce qui est formellement interdit

- **Aucun calcul de prix automatique côté public.** Ni calculateur, ni estimation « indicative ».
- **Le devis n'est pas un passage obligé.** Un colis ordinaire déposé au bureau relève du tarif au kilo affiché. Le devis est requis pour : cas particulier (électronique, article de valeur, colis encombrant), envoi à distance, ou doute du client. Toute interface qui impose le devis à tous est une erreur de cadrage.
- **Pas de panier, pas de paiement en ligne.**
- **Aucun montant de TVA nulle part** — franchise, voir §5.
- **Aucun témoignage fictif**, même en donnée de démonstration visible.
- **Aucun contenu repris d'un autre site du secteur** : cinq destinations sont communes avec l'opérateur co-localisé, le risque de duplicate content est maximal.

---

## 2. Stack technique — décidée, non négociable

- **Next.js 14+ App Router + TypeScript strict**
- **Tailwind CSS**, tokens issus de `design/tokens.json`
- **Prisma + PostgreSQL** (SQLite en dev). Prod : **Neon, région Europe**
- **next-intl** — FR par défaut, prêt pour EN
- **React Hook Form + Zod** — validation serveur systématique
- **next/font** — Montserrat auto-hébergée, pas de FOUT
- **Upload photos** : stockage objet **région Europe**, compression côté navigateur
- **Resend** pour les e-mails transactionnels
- **Auth.js** credentials, middleware sur `/admin`, rôles `ADMIN` et `OPERATEUR`
- **@react-pdf/renderer** — devis, factures, reçus
- **WhatsApp** : liens `wa.me` pré-remplis (API Business = phase 2)
- Déploiement : **Vercel**. Fournir `.env.example` et un README.

Ne pas ajouter de dépendance sans la justifier.

---

## 3. Charte graphique

> **Source unique : `design/tokens.json`.** Régénérer avec `npm run brand`. **Jamais de couleur en dur dans un composant.**

| Token | Hex | Usage |
|---|---|---|
| `navy` | `#0C335E` | Titres, en-tête, footer. **Pas la dominante des fonds.** |
| `orange` | `#F18321` | **Accent assumé** : CTA, sur-titres, prix, chiffres |
| `white` | `#FFFFFF` | **Dominante du site** |
| `sand` | `#FDF3E7` | Sections en respiration, une sur deux |
| `sand-deep` | `#F8E7D2` | Encarts, surbrillance |
| `line` | `#E6D9C8` | Filets — accordés au sable, **pas de gris froid** |
| `ink` / `ink-soft` / `muted` | `#111` / `#4A4A4A` / `#8A7B6A` | Textes |

**Typographie** : Montserrat — 800 (display, H1, H2), 700 (H3, nav), 600 (sur-titres, boutons), 500/400 (corps).

### Différenciation — impérative

Un autre opérateur du secteur partage le local commercial. Son identité : navy + bleu + orange sur **fonds bleutés froids**, en Sora + Inter.

| | Opérateur co-localisé | **ENI** |
|---|---|---|
| Dominante | Navy, fonds froids | **Blanc, sable en respiration** |
| Orange | Accent rare | **Présence forte** |
| Typographie | Sora + Inter | **Montserrat** |

**Ne jamais dériver vers des fonds gris ou bleutés.**

### Interdits de design

Dégradés criards · animations gratuites · **glassmorphism** · cartes violettes · emojis décoratifs (les drapeaux pays restent autorisés, ils sont fonctionnels) · gris froid en fond de section.

### Logos — `public/brand/`

`logo-horizontal_couleur.svg` (en-tête, PDF) · `logo-horizontal_fond-sombre.svg` (footer, sidebar admin) · `logo-vertical_couleur.svg` · `symbole_couleur.svg` (avatar, < 24 px). Favicons fournis. `theme-color` : `#0C335E`.

Ne jamais déformer, pivoter, recolorer, ombrer le logo, ni le poser en couleur sur fond orange.

---

## 4. Règles métier critiques

### 4.1 Le transit par Abidjan est invisible pour le client

Cotonou, Conakry, Bamako et Dakar transitent par Abidjan avant réacheminement.

- Public : statut `EN_TRANSIT`, aucun détail
- Admin : statut `EN_REACHEMINEMENT`, interne
- **Ne jamais exposer `villeTransit` dans une réponse d'API publique** — le vérifier explicitement dans les sélections Prisma

### 4.2 Tarifs par liaison

| Destination | Départ France | Retour |
|---|---|---|
| Abidjan · Cotonou · Conakry · Bamako | 15 €/kg | 12 €/kg |
| Dakar | 12 €/kg | 12 €/kg |
| Brazzaville | 20 €/kg | 20 €/kg |
| Kinshasa | 15 €/kg | 15 €/kg |
| New York ↔ Abidjan | 20 €/kg | 20 €/kg |

Départs **hebdomadaires** partout. **France ↔ USA** : opérée via Abidjan, `afficheePubliquement = false`.

Valeurs de **seed uniquement** — jamais en dur dans la logique.

> **`GRANDE_MARQUE` — confirmé par la cliente (1ᵉʳ septembre 2026)** : le coût du transport **est** 15 % de la valeur d'achat. Ce n'est pas un plancher, ce n'est pas comparé au poids. Un article de 40 kg valant 620 € est facturé 93 €, comme un article de 500 g de même valeur. Le poids n'est donc pas exigé pour chiffrer cette catégorie, ce qui permet d'établir un devis sur photos avant réception.

### 4.3 Catégories d'articles

| Catégorie | Calcul | Devis |
|---|---|---|
| `STANDARD` | poids × tarif liaison | Non |
| `PIECE_DETACHEE` | 20 €/kg — **remplace** le tarif | Non |
| `GRANDE_MARQUE` | **15 % de la valeur d'achat** — le poids n'intervient pas | Oui |
| `ELECTRONIQUE` | À l'unité, non publié | Oui |

Moteur dans `lib/tarification/`, **testé unitairement**, appelé **uniquement** depuis le back-office comme suggestion modifiable.

### 4.4 Points de retrait

| Ville | Adresse |
|---|---|
| Abidjan | Angré, face à l'immeuble Konor 2 — sur Yango : « Eni Colis Service Cocody » |
| Cotonou | Gbégamey |
| Conakry | Dabondy |
| Bamako | Bamako centre — nous contacter |
| Dakar **et Thiès** | Deux points — nous contacter |
| New York | 2738 Hone Ave, Bronx, NY 10469 |
| Brazzaville · Kinshasa | `[À COMPLÉTER]` — sous-traités |

Le Sénégal a **deux villes de retrait**. Le modèle `Pays → Villes[] → PointRetrait[]` doit le supporter nativement.

---

## 5. Devis, factures, paiements

### 5.1 Deux documents distincts

| | Devis (proforma) | Facture |
|---|---|---|
| Nature | Estimatif | **Définitif** |
| Numérotation | `DEV-2026-00123` | `FAC-2026-00123` — **séquence continue, sans trou** |
| Valeur | Aucune valeur comptable | **Pièce comptable** |

**Franchise de TVA** : la mention **« TVA non applicable, art. 293 B du CGI »** est **obligatoire** sur tout devis et toute facture. Aucun montant de TVA nulle part.

### 5.2 Parcours

**Mode B** — dépôt → pesée → **facture** → paiement → reçu + code de suivi
**Mode C** — devis → validation → réception et pesée → **facture** ajustée → paiement → départ
**Mode A** — inscription → identifiant → colis reçu et pesé → **devis** → acheminement → arrivée → **facture en euros et FCFA** → paiement → remise

### 5.3 Devises

| Zone | Taux |
|---|---|
| Côte d'Ivoire, Bénin, Mali, Sénégal (XOF) · Congo-Brazzaville (XAF) | **1 € = 655,957** — parité fixe, conversion automatique |
| Guinée, RD Congo (France → Afrique) | Payé en France, en euros |
| RD Congo → France, New York | USD — **taux saisi en back-office** |

**Le site public affiche uniquement des euros.** La double devise n'apparaît que sur les documents émis à l'arrivée.

**Règle impérative** : le taux est **figé à l'émission du document**, jamais recalculé à l'encaissement. `montantDevise` est stocké, pas dérivé.

### 5.4 Créances — module critique

Sur le mode A, l'entreprise **avance le transport** et n'est payée qu'à l'arrivée.

Vue **« Colis partis, non payés »** : montant dû (EUR et devise locale), ancienneté depuis le départ, statut de retrait, total des créances.

Garde-fous : remise **contre paiement uniquement** · délai de garde par défaut **30 jours** · au-delà, relance puis frais `[À COMPLÉTER]` · sort d'un colis jamais retiré `[À COMPLÉTER]`.

**Statuts de paiement** : `NON_DU` · `A_PAYER_DEPART` · `A_PAYER_ARRIVEE` · `PAYE` · `PARTIELLEMENT_PAYE` · `IMPAYE_RELANCE` · `ABANDONNE`

---

## 6. Arborescence

**Public** — `/` · `/destinations` · `/destinations/[slug]` · `/recevoir` · `/inscription` · `/services` · `/tarifs` · `/devis` · `/departs` · `/suivi` · `/faq` · `/a-propos` · `/contact` · `/legal/*`

**Admin** — `/admin` · `/admin/clients` · `/admin/receptions` · `/admin/devis` · `/admin/colis` · `/admin/factures` · `/admin/encaissements` · `/admin/creances` · `/admin/departs` · `/admin/reacheminement` · `/admin/destinations` · `/admin/tarifs` · `/admin/messagerie` · `/admin/parametres` · `/admin/login`

---

## 7. Formulaires

### 7.1 Devis

Pays et ville de départ · pays et ville d'arrivée · **mode de remise** (dépôt / expédition) · nature du colis (standard, pièce détachée, électronique, article de valeur) · poids estimé · dimensions · valeur d'achat (si article de valeur) · description · **1 à 3 photos** · nom, téléphone, e-mail · départ souhaité · consentement.

**Comportement conditionnel** (voir la maquette `docs/maquette/devis.html`) : l'électronique affiche un avertissement ; l'article de valeur fait apparaître le champ valeur et la mention du justificatif ; l'expédition affiche les consignes de marquage.

**Upload** : `capture="environment"` sur mobile, compression côté navigateur, JPEG/PNG/HEIC, 5 Mo max, stockage région Europe.

**Sécurité** : Zod côté serveur indépendamment du client, honeypot, rate-limit.

### 7.2 Inscription au service de réception

Prénom, nom, téléphone, e-mail, pays et ville de retrait, consentement.

À la validation : attribution de l'identifiant, **affichage du bloc d'adresse complet prêt à copier**, envoi par e-mail. Voir `docs/maquette/inscription.html`.

---

## 8. Suivi public

Code `ENI-AAAA-NNNNN`. Affiche statut, historique en frise, point de retrait.

**Ne jamais afficher** : adresse complète, valeur déclarée, contenu détaillé, téléphone. **Prénom et initiale du nom du destinataire uniquement.**

`EN_REACHEMINEMENT` est mappé en `EN_TRANSIT` côté public. Rate-limit sur la recherche.

**Statuts** : `DEVIS_ACCEPTE` · `RECU` · `EN_PREPARATION` · `EXPEDIE` · `EN_TRANSIT` · `EN_REACHEMINEMENT` *(interne)* · `ARRIVE` · `DISPONIBLE_RETRAIT` · `RETIRE` · `LITIGE`

---

## 9. Back-office

| Module | Fonctions |
|---|---|
| **Tableau de bord** | Devis en attente · **colis reçus non rattachés** · départs à venir · **colis à réacheminer** · **créances** · colis à retirer |
| **Clients** | CRUD, identifiants, historique |
| **Réceptions** | File des colis arrivés au bureau à rattacher — traitement quotidien |
| **Devis** | Photos en grand, chiffrage, envoi, relance, conversion |
| **Colis** | CRUD, statuts, recherche, mode de réception, mode de paiement |
| **Factures** | Émission, numérotation continue, PDF, export comptable |
| **Encaissements** | Saisie, devise, lieu (France / Abidjan), rapprochement |
| **Créances** | Colis partis non payés, ancienneté, relances |
| **Départs** | CRUD, affectation, clôture |
| **Réacheminement** | Colis au hub en attente du second segment |
| **Destinations et tarifs** | Pays, villes, liaisons, catégories, **taux de change manuels** |
| **Messagerie** | Campagnes e-mail, liste WhatsApp |
| **Utilisateurs · Paramètres** | Comptes, rôles, coordonnées |

`OPERATEUR` n'accède ni aux tarifs, ni aux paramètres, ni aux factures, ni aux exports. **Vérification côté serveur, pas seulement masquage.**

**Ergonomie** : usage debout, sur téléphone, avec des colis dans les mains. Saisie d'un colis en moins de 60 secondes. Le module Réceptions doit permettre de traiter une pile de cartons vite : recherche par identifiant, photo, rattachement, pesée.

---

## 10. Modèle de données

Détail complet dans `docs/CDC-v1.3.md` §9. Points de vigilance :

- `Liaison` est **orientée** — l'inverse est une autre ligne, avec son propre prix
- `Ville.villeTransit` auto-référent, nullable, **interne**
- `Liaison.afficheePubliquement` contrôle la visibilité publique
- `Document` unique pour devis **et** facture (`type`)
- `tauxApplique` et `montantDevise` **stockés**, jamais recalculés
- `Colis.modeReception` et `Colis.momentPaiement` déterminent le parcours
- `Client` distinct de `Expediteur`
- `HistoriqueStatut` **append-only**
- Photos de devis conservées — trace en cas de litige
- Mode `MARITIME` présent, désactivé

---

## 11. Documents PDF

**Devis** — numéro, validité 7 jours, détail, montant EUR, **mention art. 293 B**, mention « sous réserve du poids constaté ».

**Facture** — numéro de séquence continue, détail, montant EUR **et devise locale avec le taux appliqué** si émise à l'arrivée, **mention art. 293 B**, mode et date de paiement.

**Reçu de dépôt** — expéditeur et destinataire, détail, **code de suivi + QR code** vers `/suivi?code=…`, mention « conservez ce reçu pour le retrait ».

---

## 12. Images

Emplacements définis dans la maquette. Fichiers attendus dans `public/images/` :

`destination-{abidjan,cotonou,conakry,bamako,dakar,brazzaville,kinshasa,new-york}.jpg` (16/9) · `activite-depot.jpg` · `activite-depart.jpg` · `activite-reception.jpg` · `magasin-abidjan.jpg` · `bureau-rouen.jpg`

**Crée des placeholders SVG aux bons ratios** pour chaque emplacement manquant. Les vraies photos seront déposées avec les mêmes noms, sans modification de code. `next/image`, conversion WebP automatique, lazy-loading.

---

## 13. Transverses

**i18n** : tout le texte via next-intl (FR), prêt pour EN.

**SEO** : `metadata` par page, Open Graph, `sitemap.xml`, `robots.txt`, données structurées `Organization` / `LocalBusiness` / `FAQPage` / `Service`, `title` et `meta description` **uniques et rédigés à la main**.

**RGPD** : hébergement **UE** (base et photos), consentement, minimisation, conservation (devis non convertis 12 mois · clients 3 ans · **comptable 10 ans**), purge, droits d'accès et d'effacement, bandeau cookies sans traceur.

**Sécurité** : validation serveur systématique, mots de passe hachés, en-têtes de sécurité, rate-limit sur les formulaires publics, honeypot, aucun secret dans le code.

**Performance** : Lighthouse mobile **> 90**, LCP < 2,5 s. Les destinataires consultent depuis des réseaux lents.

**Accessibilité** : WCAG AA, contrastes vérifiés, navigation clavier, `:focus-visible`, `prefers-reduced-motion`, `alt` partout.

> **Contraste** : le blanc sur `#F18321` ne passe pas AA en petit corps. Sur les boutons orange, utiliser le **texte navy**, ou du blanc en gras à partir de 18 px.

---

## 14. Cohabitation avec le partenaire co-localisé

Local partagé, et sous-traitance sur Brazzaville et Kinshasa.

- Préfixes `ENI-` obligatoires partout
- **Identifiant client obligatoire** dans l'adresse de livraison (mode A)
- Bases, hébergements, domaines, comptes strictement distincts — aucun accès croisé
- Transmission au sous-traitant **tracée et journalisée** — contrat art. 28 RGPD
- Mention du recours à un sous-traitant dans les CGS

---

## 15. Hors périmètre phase 1

Paiement en ligne · API WhatsApp Business · espace client complet (historique, suivi personnel) · fret maritime actif · version EN complète · SMS · documents douaniers · application native.

L'inscription au service de réception **est** dans le périmètre : elle est nécessaire au mode A.

---

## 16. Placeholders à laisser explicites

Délais réels par destination · **plafond d'indemnisation** · sort d'un colis jamais retiré · frais de garde · points de retrait de Brazzaville et Kinshasa · horaires du bureau · statut réglementaire de l'activité · mentions légales et CGS (juriste) · vrais avis clients · photos.

**Liste-les tous dans le README.**

**Seed réaliste** : 8 pays et leurs villes (Sénégal avec Dakar **et** Thiès), les liaisons de §4.2, les 4 catégories, France ↔ USA en `afficheePubliquement: false`, ~6 clients avec identifiants, ~4 départs hebdomadaires, ~8 colis à des statuts et modes de réception différents, ~4 devis, ~3 factures dont une payée à l'arrivée en FCFA. **Aucun faux témoignage, aucun nom de client réel.**

---

## 17. Définition de « terminé »

- `npm run build`, `lint`, `typecheck` passent · migrations et seed fournis
- README complet : installation, `.env.example`, scripts, hypothèses, liste des `[À COMPLÉTER]`
- **Parcours bout-en-bout vérifiés** :
  1. Un visiteur remplit `/devis` avec 2 photos depuis un mobile → alerte reçue
  2. L'admin ouvre le devis, voit les photos, chiffre → le demandeur reçoit le devis
  3. Devis accepté → **code de suivi** → **reçu PDF avec QR code** → e-mail
  4. Le client saisit son code sur `/suivi` → bon statut, aucune donnée sensible
  5. Un client s'inscrit sur `/inscription` → identifiant attribué → bloc d'adresse affiché
  6. L'admin enregistre un colis reçu (mode A), le rattache, le pèse → **devis estimatif** envoyé
  7. Le colis arrive → **facture en EUR et FCFA** → encaissement saisi → créance soldée
  8. L'admin crée un départ → il apparaît sur `/departs` → changement de statut → e-mail

### Checklist finale

- [ ] **Aucun calculateur de prix côté public**, sous aucune forme
- [ ] **Le devis n'est jamais présenté comme obligatoire** pour un colis ordinaire déposé au bureau
- [ ] **`villeTransit` n'apparaît dans aucune réponse publique** (vérifié dans le HTML rendu)
- [ ] **France ↔ USA absente** des destinations, sélecteurs et sitemap
- [ ] `/destinations`, `/departs`, `/suivi` lisent la **vraie base**
- [ ] Moteur de tarification **testé unitairement**, jamais appelé côté public
- [ ] Aucun tarif, destination ou règle de catégorie **en dur**
- [ ] **Mention « TVA non applicable, art. 293 B du CGI »** sur devis et factures
- [ ] **Numérotation des factures continue, sans trou**
- [ ] Taux de change **figé à l'émission**, `montantDevise` stocké
- [ ] **File des colis non identifiés** fonctionnelle
- [ ] Vue **créances** avec ancienneté et total
- [ ] Upload photo depuis un **téléphone réel**, avec compression
- [ ] Code `ENI-AAAA-NNNNN` + **reçu PDF avec QR code**
- [ ] Rôle `OPERATEUR` réellement restreint **côté serveur**
- [ ] Suivi public : prénom + initiale seulement
- [ ] Back-office utilisable sur mobile, debout
- [ ] Sénégal : **deux villes de retrait** (Dakar et Thiès)
- [ ] **Aucune couleur en dur** hors tokens
- [ ] Boutons orange : **texte navy** (contraste AA)
- [ ] **Aucun faux témoignage**, bloc masqué
- [ ] RGPD : hébergement UE base **et** photos, purge prévue
- [ ] Lighthouse mobile > 90 · responsive impeccable
- [ ] Crédit « Conçu par di-eureka » en pied de page
- [ ] README avec la liste des `[À COMPLÉTER]`

---

## 18. Commandes

```bash
npm run dev              # développement
npm run build            # build de production
npm run brand            # régénère les tokens de design
npx prisma migrate dev   # migration + client
npx prisma db seed       # données de développement
npm run test             # tests unitaires (tarification)
```
