# ENI Colis Services

Site public et back-office d'exploitation d'**ENI Colis Services** — envoi de colis entre la France, l'Afrique subsaharienne et New York.

Le brief permanent est dans [`CLAUDE.md`](CLAUDE.md), le cahier des charges dans [`docs/CDC-v1.3.md`](docs/CDC-v1.3.md), la maquette validée dans [`docs/maquette/`](docs/maquette/).

> **État d'avancement : lot 1 — infrastructure.** Aucune page métier, aucun modèle de données. La suite est décrite dans [`DEMARRER.md`](DEMARRER.md).

---

## Installation

```bash
npm install
cp .env.example .env
npm run brand
npm run dev
```

L'application démarre sur <http://localhost:3000>.

Prérequis : **Node.js 20 ou plus** (développé sous Node 24).

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
components/           design system
  ui/                 primitives publiques (Button, Section, Card, Badge…)
  layout/             Header, Footer, WhatsAppFloat
  form/               champs de saisie et upload photo
  admin/              Sidebar, Topbar, StatCard, Modal, Toast…
design/
  tokens.json         SOURCE UNIQUE du design system
  tokens.generated.ts GÉNÉRÉ — mêmes valeurs, pour le JS (PDF, e-mails)
docs/                 CDC, contenus rédactionnels validés, maquette HTML
i18n/request.ts       configuration next-intl
lib/                  logique métier (tarification, accès données…)
  db.ts               client Prisma (singleton + adaptateur de pilote)
  generated/          GÉNÉRÉ — client Prisma, hors Git
messages/fr.json      libellés d'interface
prisma.config.ts      configuration du CLI Prisma (URL, migrations, seed)
prisma/schema.prisma  modèle de données
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

| Token | Avant | Après | Contraste |
|---|---|---|---|
| `status.enTransit.fg` | `#B8860B` | `#8E6708` | 2,88 → 4,54 |
| `status.devisNouveau.fg` | `#B26A15` | `#9E5E11` | 3,86 → 4,71 |
| `status.retire.fg` | `#7A6E60` | `#71655A` | 4,19 → 4,77 |
| `text.muted` | `#8A7B6A` | `#786A5B` | 3,74 → 4,77 sur sable |
| **nouveau** `brand.orangeText` | — | `#B05A0A` | 5,08 sur blanc |

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
| 1   | Plafond d'indemnisation en cas de perte ou d'avarie                                                     | CGS, exposition financière                               | 🔴        |
| 2   | Sort d'un colis jamais retiré ni payé                                                                   | CGS, module créances                                     | 🔴        |
| 3   | Frais de garde au-delà de 30 jours                                                                      | CGS, relances                                            | 🟠        |
| 4   | Seuil d'écart devis/facture déclenchant une alerte                                                      | Paramétrage back-office                                  | 🟠        |
| 5   | Confirmation de la règle `GRANDE_MARQUE` (`max` ou remplacement pur)                                    | Facturation                                              | 🟠        |
| 6   | Points de retrait de **Brazzaville** et **Kinshasa** (adresses, contacts)                               | Pages destination                                        | 🟠        |
| 7   | Horaires, contacts et adresses précises des autres points de retrait                                    | Pages destination                                        | 🟠        |
| 8   | Délais réels par destination, réacheminement inclus                                                     | Crédibilité, pages destination                           | 🟠        |
| 9   | Statut réglementaire de l'activité de transport                                                         | Mentions légales                                         | 🟠        |
| 10  | Horaires du bureau de Rouen                                                                             | Contact, e-mail « colis disponible »                     | 🟠        |
| 11  | Mentions légales et CGS rédigées (SIREN, directeur de publication) — **à faire valider par un juriste** | Pages légales                                            | 🟠        |
| 12  | Avis clients réels                                                                                      | Le bloc témoignages reste absent tant qu'il n'y en a pas | 🟢        |
| 13  | Photos — 8 destinations + 5 photos d'activité (voir `docs/guide-images.md`)                             | Placeholders SVG en attendant                            | 🟢        |
| 14  | Marchands acceptés ou refusés pour le mode A                                                            | FAQ                                                      | 🟢        |

---

## Déploiement

Procédure complète dans [`DEPLOIEMENT.md`](DEPLOIEMENT.md) : Vercel, Neon **région Europe**, DNS, Zoho Mail et Resend, stockage des photos en Europe.

---

_Conçu par [di-eureka](https://www.di-eureka.com)_
