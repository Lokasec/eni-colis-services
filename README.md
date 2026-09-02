# ENI Colis Services

Site public et back-office d'exploitation d'**ENI Colis Services** — envoi de colis entre la France, l'Afrique subsaharienne et New York.

Le brief permanent est dans [`CLAUDE.md`](CLAUDE.md), le cahier des charges dans [`docs/CDC-v1.3.md`](docs/CDC-v1.3.md), la maquette validée dans [`docs/maquette/`](docs/maquette/).

> **État d'avancement : lot 8 — facturation.** Site public, formulaires, exploitation et facturation sont en place. Restent les PDF et la messagerie (lot 9), puis la recette (lot 10). Voir [`DEMARRER.md`](DEMARRER.md).

---

## Installation

```bash
npm install
cp .env.example .env
docker compose up -d
npx prisma migrate deploy
npm run db:seed
npm run dev
```

L'application démarre sur <http://localhost:3000>.

Prérequis : **Node.js 20 ou plus** (développé sous Node 24) et un **PostgreSQL**.

### Base de données

**PostgreSQL en développement comme en production.** Le brief prévoyait SQLite en développement ; nous ne l'avons pas suivi, pour une raison précise : les migrations Prisma sont propres à un moteur. Une migration générée sur SQLite n'est pas promouvable vers le Neon de production, ce qui obligerait à maintenir un second schéma divergent et à ne jamais tester les migrations qui tournent réellement en production. Sur un module de facturation, l'écart se paie en euros. SQLite refuse par ailleurs `@db.Decimal`, donc toute déclaration de précision sur les montants.

Deux façons d'avoir PostgreSQL en local :

- **Docker** — `docker compose up -d` démarre PostgreSQL 17 sur le port **5433** (5433 et non 5432, pour ne pas entrer en conflit avec une installation existante). La chaîne de connexion correspondante est déjà dans `.env.example`.
- **Sans Docker** — créer une branche de développement sur [Neon](https://neon.tech) en **région Europe** et coller son URL dans `.env`. C'est aussi ce qui servira en production.

> **Encodage** : la base doit être en **UTF8**. Sur un poste à locale Windows, `initdb` peut créer une base en WIN1252, qui rejette les drapeaux emoji des pays et fait échouer le seed. Le `docker-compose.yml` force l'encodage ; sur Neon, UTF8 est le défaut.

## Moteur de tarification

`lib/tarification/` calcule le prix d'un envoi. Trois propriétés le définissent :

1. **Il est pur.** Il ne lit pas la base : le back-office lui passe la liaison et la catégorie déjà chargées. Aucun effet de bord, donc testable exhaustivement.
2. **Il ne contient aucun tarif.** Le prix au kilo vient de la liaison, le tarif de remplacement et le pourcentage viennent de la catégorie. Changer un tarif se fait en base.
3. **Il est interdit côté public.** Le site n'affiche aucun prix calculé, sous aucune forme (`CLAUDE.md` §1.3). Les tarifs au kilo affichés sont lus tels quels en base.

Ce qu'il renvoie est une **suggestion modifiable**, jamais un prix imposé : la cliente examine l'article avant de chiffrer.

```bash
npm run test
```

59 tests couvrent les quatre catégories à l'aller et au retour, l'arrondi du poids au kilo supérieur, la tolérance de 100 g et sa frontière stricte, le minimum de 1 kg, le poids volumétrique, `GRANDE_MARQUE` sans poids et sans influence de la liaison, la conversion en zone CFA et à taux saisi, le refus de convertir sans taux, et huit motifs de refus. `isolement.test.ts` échoue si un fichier du site public importe le moteur — vérifié en injectant volontairement une violation.

Le **poids facturé** est arrondi au kilo supérieur avec une **tolérance de 100 g** sur l'excédent, un minimum de 1 kg, et comparé au poids volumétrique `(L × l × h) ÷ 5000` — quatre règles paramétrées dans `ParametresTarification`, ajustables depuis le back-office sans redéploiement.

| Pesé      | Facturé | Pourquoi                                                               |
| --------- | ------- | ---------------------------------------------------------------------- |
| 0,050 kg  | 1 kg    | Minimum facturé — il l'emporte sur la tolérance                        |
| 4,050 kg  | 4 kg    | 50 g d'excédent, sous la tolérance                                     |
| 4,100 kg  | 5 kg    | 100 g pile : la comparaison est **stricte**, la tolérance ne joue plus |
| 12,500 kg | 13 kg   | Kilo supérieur                                                         |

Le document remis l'explique **dans les deux sens** : « 13 kg (12,5 kg arrondis au kilo supérieur) » comme « 4 kg (4,05 kg pesés, tolérance de 0,1 kg) ». Un arrondi favorable au client ressemble à une erreur s'il n'est pas justifié.

Les montants transitent en `Decimal` exact, jamais en `number` : `1,005 × 3` vaut `3,015` et s'arrondit à `3,02 €`, là où la virgule flottante donnerait `3,01 €`.

## Back-office

Accès sur `/admin`. Comptes de démonstration créés par le seed :

| Rôle        | Adresse              | Mot de passe                  |
| ----------- | -------------------- | ----------------------------- |
| `ADMIN`     | `admin@eni.test`     | valeur de `SEED_MOT_DE_PASSE` |
| `OPERATEUR` | `operateur@eni.test` | idem                          |

**À changer avant toute mise en ligne.**

### Deux barrières, pas une

1. **Le middleware** ferme la porte : sans session, toute URL sous `/admin` renvoie vers la connexion en mémorisant la destination.
2. **`exigerAdmin()` en tête de chaque page et de chaque action réservée** décide de ce qu'un opérateur a le droit de faire.

Masquer une entrée de menu ne protège rien : l'URL reste tapable et la Server Action reste appelable. Vérifié : un compte `OPERATEUR` reçoit une redirection sur les six rubriques réservées — créances, factures, encaissements, tarifs, destinations, paramètres — **même en tapant l'URL directement**.

Les mots de passe sont hachés par **`scrypt`**, de la bibliothèque standard de Node : pas de dépendance native à compiler au déploiement, ni de portage JavaScript plus lent. Les paramètres voyagent avec l'empreinte, pour pouvoir les durcir sans invalider les mots de passe existants.

### Facturation

**Devis** — le moteur de tarification propose un montant, la cliente le modifie librement. Un bouton remet la suggestion. Pour l'électronique, le moteur refuse explicitement de chiffrer plutôt que d'inventer un chiffre : la tarification se fait à l'unité, après examen.

**Factures** — la numérotation est **continue et sans trou** : le compteur est incrémenté dans la même transaction que la facture, donc deux émissions simultanées ne peuvent pas obtenir le même numéro et un échec n'en consomme pas. La page signale visiblement tout trou dans la séquence.

**Double devise** — proposée sur les colis payés à l'arrivée. Le taux du jour est **figé sur la facture** et le montant en devise stocké. Modifier un taux dans Tarifs n'affecte que les factures à venir : un client règle toujours le montant qu'on lui a annoncé.

**Créances** — factures émises et non soldées, avec le total dû, l'ancienneté depuis le **départ effectif** (pas depuis l'émission) et une relance par e-mail.

Le moteur de tarification est appelé depuis `lib/admin/facturation.ts`. Le chemin fait partie de la protection : `isolement.test.ts` n'autorise son import que depuis `app/admin`, `app/api/admin`, `lib/tarification` et `lib/admin`.

### Ergonomie

L'outil est utilisé debout, sur téléphone, un colis dans les mains. La navigation s'efface derrière un bouton sur petit écran, les cibles de saisie font au moins 44 px, et chaque geste — peser, changer de statut, affecter à un départ — a son propre formulaire.

Tout changement de statut écrit une ligne dans `HistoriqueStatut`, qui est en **ajout seul** : c'est la trace d'exploitation et la preuve en cas de litige.

## Formulaires publics

`/devis` et `/inscription` reposent sur des Server Actions. Quatre protections, dans cet ordre :

1. **Piège à robots** — un champ invisible que seul un automate remplit.
2. **Limitation de débit** — 5 demandes de devis et 3 inscriptions par heure et par adresse. L'implémentation est **en mémoire** : elle protège d'un envoi répété, mais le compteur n'est pas partagé entre instances serverless. Voir le commentaire en tête de `lib/rate-limit.ts` pour le remplacement par un magasin partagé si le volume l'exige.
3. **Validation Zod rejouée côté serveur**, indépendamment du navigateur.
4. **Vérification du trajet** — le couple pays/ville soumis doit correspondre à une liaison réellement publiée. Sans ce contrôle, un formulaire falsifié pourrait enregistrer une demande France ↔ USA.

Les photos sont **compressées dans le navigateur** avant l'envoi (1 600 px, ~1 Mo), puis leur type et leur taille sont revérifiés côté serveur. En production elles vont sur Vercel Blob, **région Europe** ; en développement, dans `public/uploads/`, ignoré par Git.

Sans `RESEND_API_KEY`, les e-mails sont **journalisés au lieu d'être expédiés** et le formulaire aboutit quand même : une demande enregistrée en base ne doit pas échouer parce que la messagerie n'est pas configurée.

### Vérifier les données

```bash
npm run db:verify
```

`prisma/verifier-seed.ts` interroge la base et contrôle 21 invariants métier — ceux qui ne se verraient pas à l'écran s'ils cassaient : fuite du hub de transit dans une sélection publique, liaison France ↔ USA rendue visible, trou dans la numérotation des factures, taux de change recalculé au lieu d'être figé, file des colis non rattachés, mention de l'article 293 B. À relancer après chaque migration.

---

## Commandes

| Commande             | Rôle                                                          |
| -------------------- | ------------------------------------------------------------- |
| `npm run dev`        | Serveur de développement (régénère les tokens au passage)     |
| `npm run build`      | Build de production (régénère les tokens au passage)          |
| `npm run start`      | Sert le build de production                                   |
| `npm run brand`      | Régénère les tokens de design depuis `design/tokens.json`     |
| `npm run lint`       | ESLint (CLI directe : `next lint` disparaît en Next.js 16)    |
| `npm run typecheck`  | `tsc --noEmit`                                                |
| `npm run format`     | Prettier en écriture · `npm run format:check` en vérification |
| `npm run test`       | Tests unitaires (Vitest)                                      |
| `npm run db:migrate` | `prisma migrate dev`                                          |
| `npm run db:seed`    | Données de développement                                      |
| `npm run db:studio`  | Prisma Studio                                                 |

---

## Structure

```
app/                  routes App Router
  globals.css         base + import des tokens générés
  styles/tokens.css   GÉNÉRÉ — ne pas éditer
content/destinations.ts  textes validés des 8 fiches pays
components/           design system
  ui/                 primitives publiques (Button, Section, Card, Badge…)
  layout/             Header, Footer, WhatsAppFloat
  form/               champs de saisie et upload photo
  admin/              Sidebar, Topbar, StatCard, Modal, Toast…
design/
  tokens.json         SOURCE UNIQUE du design system
  tokens.generated.ts GÉNÉRÉ — mêmes valeurs, pour le JS (PDF, e-mails)
docs/                 CDC, contenus rédactionnels validés, maquette HTML
app/(public)/         site public — 14 pages
app/sitemap.ts        plan du site, dérivé des liaisons publiées
i18n/request.ts       configuration next-intl
lib/                  logique métier
  donnees-publiques.ts requêtes du site public, à sélections explicites
  tarification/       moteur de calcul — back-office uniquement
  db.ts               client Prisma (singleton + adaptateur de pilote)
  generated/          GÉNÉRÉ — client Prisma, hors Git
messages/fr.json      libellés d'interface
prisma.config.ts      configuration du CLI Prisma (URL, migrations, seed)
prisma/
  schema.prisma       modèle de données
  migrations/         migrations SQL versionnées
  seed.ts             données de développement
  verifier-seed.ts    contrôle des invariants métier
public/brand/         logos et favicons
public/images/        photos — voir docs/guide-images.md
scripts/build-brand.mjs  générateur de tokens
```

---

## Design system — la chaîne des tokens

`design/tokens.json` est la **source unique**. `npm run brand` en dérive deux fichiers :

- `app/styles/tokens.css` — un bloc `@theme` Tailwind v4 : chaque token devient à la fois une variable CSS (`var(--color-orange)`) et un utilitaire (`bg-orange`, `text-h1`, `rounded-lg`, `shadow-md`).
- `design/tokens.generated.ts` — les mêmes valeurs typées, pour le code qui ne passe pas par Tailwind (rendu PDF, gabarits d'e-mail).

Ces deux fichiers sont générés automatiquement avant `dev` et `build`. **Ne jamais les éditer à la main**, et **ne jamais écrire une couleur en dur dans un composant** : si un token manque, il s'ajoute à `tokens.json`.

Garde-fou : la palette par défaut de Tailwind est **neutralisée** (`--color-*: initial`). `bg-slate-100` ou `text-blue-600` ne produisent plus rien — seuls les tokens de la marque existent.

### Règle de fond (arbitrage cliente)

Blanc dominant · sable en respiration une section sur deux · sur fond blanc les cartes passent en sable, sur fond sable en blanc · le navy reste au texte, à l'en-tête, au footer et aux blocs pleine largeur (tableau des départs, bloc expédition, bande CTA).

### Corrections d'accessibilité apportées aux tokens

L'audit de contraste de tout le nuancier a révélé cinq paires sous le seuil WCAG AA. La règle du projet étant d'amender la source plutôt que de contourner dans un composant, `design/tokens.json` a été corrigé :

| Token                          | Avant     | Après     | Contraste             |
| ------------------------------ | --------- | --------- | --------------------- |
| `status.enTransit.fg`          | `#B8860B` | `#8E6708` | 2,88 → 4,54           |
| `status.devisNouveau.fg`       | `#B26A15` | `#9E5E11` | 3,86 → 4,71           |
| `status.retire.fg`             | `#7A6E60` | `#71655A` | 4,19 → 4,77           |
| `text.muted`                   | `#8A7B6A` | `#786A5B` | 3,74 → 4,77 sur sable |
| **nouveau** `brand.orangeText` | —         | `#B05A0A` | 5,08 sur blanc        |

Deux combinaisons restent volontairement impossibles, parce qu'aucune valeur ne les sauve : **blanc sur orange** (2,62) et **orange `#F18321` sur blanc** (2,62). D'où la règle du design system : les boutons orange portent du texte **navy** — y compris au survol, là où la maquette passait au blanc sur `orange-dark` (3,37) — et tout texte orange sur fond clair utilise `orange-text`.

Trois autres tokens ont été ajoutés : `brand.whatsapp` (vert de marque, usage fonctionnel), `surface.notice` (fond des encarts d'information) et `breakpoint.menu` (1040 px, bascule vers le menu burger).

---

## Hypothèses retenues

| Sujet               | Décision                                     | Raison                                                                                                                                                                                                                                                                                                                                          |
| ------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js             | **15** (App Router)                          | Le brief dit « 14+ » ; la 15 est la version stable supportée                                                                                                                                                                                                                                                                                    |
| Tailwind            | **v4**, configuration CSS-first via `@theme` | Un seul fichier généré produit variables CSS et utilitaires ; plus de `tailwind.config` à maintenir en double                                                                                                                                                                                                                                   |
| next-intl           | **sans routage de locale**                   | Les URL du CDC n'ont pas de préfixe de langue (`/devis`, pas `/fr/devis`). L'anglais de phase 2 s'ajoutera par `messages/en.json` sans toucher aux composants                                                                                                                                                                                   |
| Montserrat          | `next/font/google`, `display: swap`          | Police auto-hébergée après le build, aucun appel externe au runtime ; le fallback ajusté supprime le décalage de mise en page                                                                                                                                                                                                                   |
| Prisma              | **7**                                        | Version majeure courante. Elle impose trois changements : l'URL de connexion passe de `schema.prisma` à `prisma.config.ts`, le client est généré dans `lib/generated/prisma` au lieu de `@prisma/client`, et son instanciation exige un **adaptateur de pilote**. Démarrer sur la majeure précédente aurait légué une dette dès le premier jour |
| Base de dev         | SQLite                                       | PostgreSQL/Neon **région Europe** en production (RGPD)                                                                                                                                                                                                                                                                                          |
| Indexation          | `robots: noindex` en dur                     | Le site ne doit pas être indexé avant la recette du lot 10                                                                                                                                                                                                                                                                                      |
| `GRANDE_MARQUE`     | `max(poids × tarif, 15 % de la valeur)`      | Conforme au brief, **`[À CONFIRMER]`** (CDC §13 point 5) — isolé dans une fonction unique                                                                                                                                                                                                                                                       |
| Images destinations | fichiers **16/9**                            | Le 21/9 du guide est un recadrage CSS de bandeau, pas un format de fichier                                                                                                                                                                                                                                                                      |

### Dépendances ajoutées hors brief

| Paquet                                | Justification                                                                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vitest`                              | Les tests unitaires du moteur de tarification sont exigés (lot 4)                                                                                      |
| `tsx`                                 | Exécution du seed Prisma en TypeScript                                                                                                                 |
| `@prisma/adapter-better-sqlite3`      | **Obligatoire** en Prisma 7 : le client ne se connecte plus sans adaptateur. L'équivalent PostgreSQL (`@prisma/adapter-pg`) sera ajouté au déploiement |
| `qrcode` _(lot 9)_                    | QR code du reçu de dépôt, exigé au CDC §10                                                                                                             |
| `browser-image-compression` _(lot 6)_ | Compression des photos côté navigateur, exigée au CDC §7.1                                                                                             |

---

## `[À COMPLÉTER]` — informations à obtenir de la cliente

Aucune de ces valeurs ne doit être inventée. Elles apparaissent comme telles dans l'interface et dans le code.

| #   | Point                                                                                                   | Impact                                                   | Criticité |
| --- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------- |
| 1   | **Prix d'achat auprès des sous-traitants** (Brazzaville, Kinshasa) — voir ci-dessous                    | Marge réelle sur deux destinations                       | 🔴        |
| 2   | Seuil d'écart devis/facture déclenchant une alerte                                                      | Paramétrage back-office                                  | 🟠        |
| 3   | Confirmation de la règle `GRANDE_MARQUE` (`max` ou remplacement pur)                                    | Facturation                                              | 🟠        |
| 4   | Points de retrait de **Brazzaville** et **Kinshasa** (adresses, contacts)                               | Pages destination                                        | 🟠        |
| 5   | Horaires, contacts et adresses précises des autres points de retrait                                    | Pages destination                                        | 🟠        |
| 6   | Délais réels par destination, réacheminement inclus                                                     | Crédibilité, pages destination                           | 🟠        |
| 7   | Statut réglementaire de l'activité de transport                                                         | Mentions légales                                         | 🟠        |
| 8   | Horaires du bureau de Rouen                                                                             | Contact, e-mail « colis disponible »                     | 🟠        |
| 9   | Mentions légales et CGS rédigées (SIREN, directeur de publication) — **à faire valider par un juriste** | Pages légales                                            | 🟠        |
| 10  | Avis clients réels                                                                                      | Le bloc témoignages reste absent tant qu'il n'y en a pas | 🟢        |
| 11  | Photos — 8 destinations + 5 photos d'activité (voir `docs/guide-images.md`)                             | Placeholders SVG en attendant                            | 🟢        |
| 12  | Marchands acceptés ou refusés pour le mode A                                                            | FAQ                                                      | 🟢        |

### Prix d'achat des sous-traitants — inconnu, et affiché comme tel

ENI ne dessert pas Brazzaville et Kinshasa elle-même : le colis est remis à un partenaire. Les prix de vente sont connus (**20 €/kg** et **15 €/kg**), le prix payé au partenaire ne l'est pas — la cliente ne l'a pas communiqué.

`Liaison.prixAchat` reste donc **nul**, et un invariant vérifie qu'il le reste : une valeur de confort rendrait fausse toute marge affichée. `/admin/tarifs` porte la mention **« marge inconnue »** sur ces deux lignes, avec l'avertissement que ces destinations peuvent être vendues à perte sans que rien ne le montre.

### Politique commerciale — tranchée le 2 septembre 2026

Trois points de cette liste ont été retirés : **plafond d'indemnisation**, **frais de garde**, **sort d'un colis jamais retiré**. La cliente retient les valeurs proposées comme base de discussion. Elles sont stockées dans `ParametresTarification`, **jamais en dur**, et affichées dans `/admin/tarifs` sous la mention « en attente de confirmation ».

| Point                            | Valeur                               | Raison                                                                            |
| -------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------- |
| Indemnisation, colis ordinaire   | 20 €/kg, plafond 400 €               | Le tarif le plus élevé de la grille, sous le plafond de la convention de Montréal |
| Indemnisation, article de valeur | Valeur déclarée, sur justificatif    | Il est déjà facturé 15 % de sa valeur                                             |
| Garde gratuite                   | 30 jours après mise à disposition    | Reprend le CDC §5.4                                                               |
| Frais de garde                   | 1 €/jour, **plafonnés au transport** | Sans plafond, le client ne vient plus : ENI perd tout                             |
| Colis abandonné                  | 120 jours, après deux relances       | Les trois quarts des destinataires sont des entreprises qui retirent aussitôt     |

**Réserve** : la disposition d'un bien abandonné obéit à une procédure. Ce délai et ce plafond doivent être **relus par un juriste** avant de figurer dans les CGS.

### France ↔ USA — fermée

Décision du 2 septembre 2026 : New York n'est ouverte qu'avec **Abidjan**, dans les deux sens. Les lignes France ↔ USA restent en base avec `actif = false` — les rouvrir est un booléen en back-office.

Cette fermeture rend le modèle exact. Le transit est porté par la **ville d'arrivée** ; France → USA était la seule liaison dont l'escale ne s'en déduisait pas, New York étant la destination et non une escale. `verifier-seed.ts` contrôle ce point et échouera si la ligne est rouverte sans porter le transit sur la liaison.

---

## Déploiement

Procédure complète dans [`DEPLOIEMENT.md`](DEPLOIEMENT.md) : Vercel, Neon **région Europe**, DNS, Zoho Mail et Resend, stockage des photos en Europe.

---

_Conçu par [di-eureka](https://www.di-eureka.com)_
