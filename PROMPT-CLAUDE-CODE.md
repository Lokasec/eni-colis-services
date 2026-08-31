# PROMPT CLAUDE CODE — ENI Colis Services

> **Mode d'emploi** — Copie l'intégralité du bloc ci-dessous dans Claude Code, à la racine du dépôt, en première session. Structure conforme à la méthode di-eureka, phase 3, neuf sections obligatoires.
>
> Ensuite, avance **lot par lot** en suivant `DEMARRER.md`.

---

```
═══════════════════════════════════════════════════════════
SECTION 1 — RÔLE ET MÉTHODE DE TRAVAIL
═══════════════════════════════════════════════════════════

Tu es un ingénieur full-stack senior doublé d'un designer produit.

Lis ce brief entièrement, ainsi que CLAUDE.md, avant d'écrire la moindre
ligne de code. Consulte aussi docs/CDC-v1.3.md pour le détail fonctionnel,
docs/contenus-pages.md et docs/contenus-destinations.md pour les textes,
et docs/maquette/ pour la mise en page validée par la cliente.

Méthode imposée :
1. Établis un plan de tâches, présente-le, attends ma validation.
2. Construis de façon INCRÉMENTALE, lot par lot. Arrête-toi entre chaque
   lot et montre-moi le résultat. Ne code jamais tout d'un coup.
3. À chaque étape : npm run build sans erreur, typecheck propre,
   vérification visuelle du rendu.
4. Commit après chaque étape, avec des messages explicites :
   feat(design-system): Button, Card, Header, Footer
5. Ne pose que les questions bloquantes. Pour le reste, applique les
   défauts définis ici et note tes hypothèses dans le README.

Barre de qualité non négociable : beauté, simplicité, ergonomie,
mobile-first, performance, accessibilité. Un rendu « générique IA »
est un échec.

═══════════════════════════════════════════════════════════
SECTION 2 — CONTEXTE MÉTIER
═══════════════════════════════════════════════════════════

ENI Colis Services expédie des colis entre la France, l'Afrique
subsaharienne et New York.

- Bureau France : 67 rue Saint-Julien, 76100 Rouen (collecte, réception)
- Magasin Abidjan : Angré, face à l'immeuble Konor 2 (retrait, encaissement)
- Statut : auto-entrepreneur, EN FRANCHISE DE TVA
- Téléphone / WhatsApp : +33 6 52 70 70 14

MODÈLE ÉCONOMIQUE — ce n'est PAS un e-commerce.
Tarifs au kilo affichés publiquement. Devis sur photos pour les cas
particuliers. Paiement au comptoir ou à l'arrivée, jamais en ligne.

TROIS MODES DE RÉCEPTION — structure fondatrice :

  A — COMMANDE EN LIGNE
      Le client (souvent en Afrique) commande sur un site marchand français
      et fait livrer à l'adresse d'ENI. Il s'identifie par un identifiant
      inséré dans le champ « Nom » de sa commande.
      → PAIEMENT À L'ARRIVÉE. Devis estimatif puis facture définitive.

  B — DÉPÔT AU BUREAU
      Le client vient déposer son colis, ouvert. Pesée sur place.
      → PAIEMENT AU DÉPÔT. Facture directe, pas de devis nécessaire
        pour un colis ordinaire.

  C — EXPÉDITION PAR TRANSPORTEUR
      Le client, éloigné, envoie son colis au bureau à ses frais, avec
      son numéro de devis collé dessus.
      → PAIEMENT AU DÉPART. Devis obligatoire puis facture.

ACTION CENTRALE DU SITE : « Demander un devis » — mais ATTENTION,
le devis n'est PAS un passage obligé (voir interdits ci-dessous).

FORMELLEMENT INTERDIT :
- Aucun calcul de prix automatique côté public. Ni calculateur, ni
  estimation « indicative ». La cliente veut examiner l'article avant
  de chiffrer les cas particuliers.
- Le devis n'est PAS obligatoire pour un colis ordinaire déposé au
  bureau : le tarif au kilo affiché s'applique. Le devis est requis
  seulement pour : électronique, articles de valeur, colis encombrant,
  envoi à distance, ou doute du client. Toute interface qui impose le
  devis à tous est une erreur de cadrage.
- Pas de panier, pas de prix fixe catalogue, pas de paiement en ligne.
- AUCUN montant de TVA nulle part (franchise, art. 293 B du CGI).
- Aucun témoignage fictif, même en donnée de démonstration visible.
- Aucun contenu repris d'un autre site du secteur.

CIBLES : diaspora africaine en France (B2C), clients résidant en Afrique
(mode A), petits professionnels, clients à New York.
Mobile-first impératif : ~80 % du trafic. Réseaux lents à l'arrivée.

CONTRAINTE SECTORIELLE PARTICULIÈRE :
Un autre opérateur du même secteur partage le local commercial et est
sous-traitant sur Brazzaville et Kinshasa. Conséquences :
- Préfixe ENI- obligatoire sur tous les codes
- Identifiant client obligatoire dans l'adresse de livraison (mode A)
- Bases, comptes et domaines strictement distincts, aucun accès croisé
- Différenciation visuelle stricte (voir section 4)

═══════════════════════════════════════════════════════════
SECTION 3 — STACK TECHNIQUE (décidée, non négociable)
═══════════════════════════════════════════════════════════

- Next.js 14+ App Router + TypeScript strict
- Tailwind CSS, tokens générés depuis design/tokens.json
- Prisma + PostgreSQL (SQLite en dev). Prod : Neon, RÉGION EUROPE
- next-intl (FR par défaut, prêt pour EN)
- React Hook Form + Zod (validation serveur systématique)
- next/font : Montserrat auto-hébergée, poids 400/500/600/700/800
- Upload photos : stockage objet RÉGION EUROPE, compression navigateur
- Resend (e-mails transactionnels)
- Auth.js credentials, middleware sur /admin, rôles ADMIN et OPERATEUR
- @react-pdf/renderer (devis, factures, reçus)
- WhatsApp : liens wa.me pré-remplis (API Business = phase 2)
- Déploiement Vercel

N'ajoute aucune dépendance sans la justifier explicitement.

═══════════════════════════════════════════════════════════
SECTION 4 — CHARTE GRAPHIQUE (tokens exacts)
═══════════════════════════════════════════════════════════

SOURCE UNIQUE : design/tokens.json
Crée scripts/build-brand.mjs qui génère les variables CSS et la config
Tailwind depuis ce fichier (commande npm run brand).
JAMAIS de couleur écrite en dur dans un composant.

  navy       #0C335E   titres, en-tête, footer — PAS la dominante des fonds
  orange     #F18321   accent ASSUMÉ : CTA, sur-titres, prix, chiffres
  white      #FFFFFF   DOMINANTE du site
  sand       #FDF3E7   sections en respiration, une sur deux
  sand-deep  #F8E7D2   encarts, surbrillance
  line       #E6D9C8   filets — accordés au sable, PAS de gris froid
  ink        #111111   texte courant
  ink-soft   #4A4A4A   texte secondaire
  muted      #8A7B6A   légendes — teinté chaud

Typographie : Montserrat.
  800 display/H1/H2 · 700 H3/nav · 600 sur-titres/boutons · 500/400 corps
Sur-titres en capitales espacées (tracking .12em), en orange.

Logos dans public/brand/ :
  logo-horizontal_couleur.svg      → en-tête, PDF (fonds clairs)
  logo-horizontal_fond-sombre.svg  → footer, sidebar admin
  logo-vertical_couleur.svg        → formats étroits
  symbole_couleur.svg              → avatar, marquage, < 24 px
Favicons fournis. theme-color : #0C335E.

DIFFÉRENCIATION IMPÉRATIVE :
L'opérateur co-localisé utilise navy + bleu + orange sur FONDS BLEUTÉS
FROIDS (#F4F7FB), en Sora + Inter. ENI doit rester sur BLANC dominant
avec sable en respiration, orange très présent, Montserrat.
Ne JAMAIS dériver vers des fonds gris ou bleutés.

INTERDIT :
- Effet IA générique : glassmorphism, cartes violettes, dégradés criards,
  emojis décoratifs (les drapeaux pays restent autorisés, ils sont
  fonctionnels), animations gratuites.
- Gris froid en fond de section.
- Déformer, pivoter, recolorer ou ombrer le logo ; version couleur sur
  fond orange.
- Blanc sur orange #F18321 en petit corps (contraste AA insuffisant) :
  sur les boutons orange, utiliser le TEXTE NAVY.

═══════════════════════════════════════════════════════════
SECTION 5 — PAGES ET CONTENUS RÉELS
═══════════════════════════════════════════════════════════

LES TEXTES SONT ÉCRITS ET VALIDÉS PAR LA CLIENTE.
Ne les réinvente pas, ne les reformule pas, ne les appauvris pas.

  docs/contenus-pages.md         → accueil, services, tarifs, devis,
                                   départs, suivi, FAQ, à propos, contact,
                                   recevoir, micro-copies
  docs/contenus-destinations.md  → les 8 fiches pays, une par une
  docs/maquette/                 → mise en page validée, fait foi

PAGES PUBLIQUES :
  /                        accueil
  /destinations            index
  /destinations/[slug]     8 fiches pays
  /recevoir                service d'adresse en France (mode A)
  /inscription             attribution de l'identifiant
  /services
  /tarifs
  /devis                   formulaire principal
  /departs
  /suivi
  /faq
  /a-propos
  /contact
  /legal/mentions · /legal/confidentialite · /legal/cgs · /legal/cookies

Accroche de l'accueil (H1) :
  « De 12 à 20 € le kilo. Tarifs affichés. »
Sous-titre :
  « Envoyez vos colis vers l'Afrique et New York. Pour un colis ordinaire,
  le tarif au kilo de votre destination s'applique : vous n'avez qu'à venir
  le déposer. Pour l'électronique, les articles de valeur ou les colis
  encombrants, demandez un devis sur photos. »

Chaque fiche destination a un ANGLE ÉDITORIAL PROPRE — aucun paragraphe
n'est transposable d'une page à l'autre. C'est ce qui protège le
référencement face à l'opérateur co-localisé qui dessert cinq des mêmes
destinations.

Contenus à NE PAS inventer, laisse des TODO explicites et liste-les
dans le README : délais réels par destination, plafond d'indemnisation,
sort d'un colis jamais retiré, frais de garde, points de retrait de
Brazzaville et Kinshasa, horaires du bureau, statut réglementaire de
l'activité, mentions légales et CGS, avis clients, photos.

IMAGES : crée des placeholders SVG aux bons ratios pour chaque
emplacement (voir docs/guide-images.md). Les vraies photos seront
déposées dans public/images/ avec les mêmes noms, sans modification
de code. next/image, WebP automatique, lazy-loading.

═══════════════════════════════════════════════════════════
SECTION 6 — SPÉCIFICATIONS FONCTIONNELLES
═══════════════════════════════════════════════════════════

TARIFS PAR LIAISON (valeurs de SEED, jamais en dur dans la logique) :
  Abidjan, Cotonou, Conakry, Bamako : 15 €/kg aller · 12 €/kg retour
  Dakar : 12 €/kg dans les deux sens
  Brazzaville : 20 €/kg dans les deux sens
  Kinshasa : 15 €/kg dans les deux sens
  New York ↔ Abidjan : 20 €/kg dans les deux sens
  Départs HEBDOMADAIRES sur toutes les destinations.
  France ↔ USA : opérée via Abidjan mais afficheePubliquement = false.

CATÉGORIES D'ARTICLES (moteur dans lib/tarification/, TESTÉ) :
  STANDARD          poids × tarif de la liaison
  PIECE_DETACHEE    20 €/kg — REMPLACE le tarif de la liaison
  GRANDE_MARQUE     max(poids × tarif, 15 % de la valeur d'achat)
  ELECTRONIQUE      à l'unité, non publié → « nous consulter »
Ce moteur n'est appelé QUE depuis le back-office, comme SUGGESTION
modifiable, jamais imposée. Aucun appel côté public.

HUB D'ÉCLATEMENT — INVISIBLE POUR LE CLIENT :
Cotonou, Conakry, Bamako, Dakar transitent par Abidjan.
  Public : statut EN_TRANSIT, aucun détail de parcours
  Admin  : statut EN_REACHEMINEMENT, interne uniquement
Ne JAMAIS exposer villeTransit dans une réponse d'API publique.
Vérifie-le explicitement dans les sélections Prisma.

DEVISES :
  Zone CFA (XOF, XAF) : 1 € = 655,957 — parité fixe, conversion automatique
  Guinée, RD Congo (France → Afrique) : payé en France, en euros
  RD Congo → France, New York : USD, taux SAISI en back-office
Le site public affiche UNIQUEMENT des euros. La double devise n'apparaît
que sur les documents émis à l'arrivée.
RÈGLE IMPÉRATIVE : le taux est FIGÉ à l'émission du document, jamais
recalculé à l'encaissement. montantDevise est stocké, pas dérivé.

DOCUMENTS :
  Devis   DEV-2026-00123 — estimatif, validité 7 jours
  Facture FAC-2026-00123 — définitif, NUMÉROTATION CONTINUE SANS TROU
Mention OBLIGATOIRE sur les deux : « TVA non applicable, art. 293 B du CGI »

FORMULAIRE DE DEVIS (/devis) — voir docs/maquette/devis.html :
  Champs : pays et ville de départ · pays et ville d'arrivée · mode de
  remise (dépôt / expédition) · nature du colis · poids estimé ·
  dimensions · valeur d'achat (si article de valeur) · description ·
  1 à 3 PHOTOS · nom, téléphone, e-mail · départ souhaité · consentement.
  Comportement conditionnel : électronique → avertissement ;
  article de valeur → champ valeur + mention du justificatif ;
  expédition → consignes de marquage.
  Upload : capture="environment" sur mobile, compression navigateur,
  JPEG/PNG/HEIC, 5 Mo max, stockage région Europe.
  Sécurité : Zod côté serveur indépendamment du client, honeypot, rate-limit.
  AUCUN prix affiché ni calculé sur cette page.

INSCRIPTION (/inscription) — voir docs/maquette/inscription.html :
  Prénom, nom, téléphone, e-mail, pays et ville de retrait, consentement.
  À la validation : attribution de l'identifiant, affichage du bloc
  d'adresse complet prêt à copier, envoi par e-mail.
  Format imposé par la cliente, NE PAS LE MODIFIER :
      Nom        : Eni Aïcha 42     ← « Eni » + prénom + séquence
      Prénom     : colis service
      Adresse    : 67 rue Saint-Julien
      Code postal: 76100
      Ville      : Rouen
      Département: Seine-Maritime
      Téléphone  : +33 6 52 70 70 14   ← celui d'ENI, pas du client
      E-mail     : celui du client
  En base, l'identifiant complet est ENI-XX-0000 (initiales + séquence) ;
  la partie affichée au client reste « Eni Prénom NN ».

SUIVI PUBLIC (/suivi) :
  Code ENI-AAAA-NNNNN → statut, historique en frise, point de retrait.
  NE JAMAIS afficher : adresse complète, valeur déclarée, contenu détaillé,
  téléphone. Prénom et initiale du nom du destinataire UNIQUEMENT.
  EN_REACHEMINEMENT est mappé en EN_TRANSIT côté public.
  Rate-limit sur la recherche (anti-énumération).
  Statuts : DEVIS_ACCEPTE · RECU · EN_PREPARATION · EXPEDIE · EN_TRANSIT ·
  EN_REACHEMINEMENT (interne) · ARRIVE · DISPONIBLE_RETRAIT · RETIRE · LITIGE

BACK-OFFICE (/admin) :
  Tableau de bord : devis en attente · colis reçus non rattachés ·
    départs à venir · colis à réacheminer · CRÉANCES · colis à retirer
  Clients        : CRUD, identifiants, historique
  Réceptions     : FILE des colis reçus non rattachés, avec photo,
                   rattachement manuel — traitement quotidien. Un client
                   oubliera son numéro : sans cette file, le carton
                   n'existe nulle part.
  Devis          : photos en grand, chiffrage, envoi, relance, conversion
  Colis          : CRUD, statuts, recherche, changement en masse
  Factures       : émission, numérotation continue, PDF, export comptable
  Encaissements  : montant, devise, lieu (France / Abidjan), rapprochement
  Créances       : colis partis non payés, ancienneté, total, relances
  Départs        : CRUD, affectation, clôture
  Réacheminement : colis au hub en attente du second segment
  Destinations   : pays, villes, liaisons, points de retrait, taux manuels
  Tarifs         : prix par liaison et par sens, catégories
  Messagerie     : campagnes e-mail groupées, liste WhatsApp pré-remplie
  Utilisateurs · Paramètres

  OPERATEUR n'accède ni aux tarifs, ni aux paramètres, ni aux factures,
  ni aux exports. VÉRIFICATION CÔTÉ SERVEUR, pas seulement masquage.
  Ergonomie : usage debout, sur téléphone, colis dans les mains.
  Saisie d'un colis en moins de 60 secondes.

E-MAILS AUTOMATIQUES (Resend) :
  Demande de devis reçue → accusé au client + alerte à l'exploitante
  Devis chiffré → montant, validité, conditions
  Devis accepté → code de suivi + instructions ADAPTÉES AU MODE DE REMISE
  Colis reçu → reçu PDF
  Départ effectué → e-mail groupé aux expéditeurs du départ
  Colis disponible → point de retrait, horaires, pièce d'identité

PDF :
  Devis   : validité 7 jours, mention art. 293 B, « sous réserve du poids »
  Facture : numéro continu, EUR + devise locale si émise à l'arrivée
            avec le taux appliqué, mention art. 293 B
  Reçu    : code de suivi en évidence + QR CODE vers /suivi?code=…

POINTS DE RETRAIT :
  Abidjan     Angré, face à l'immeuble Konor 2
              (sur Yango : « Eni Colis Service Cocody »)
  Cotonou     Gbégamey
  Conakry     Dabondy
  Bamako      Bamako centre — nous contacter
  Dakar ET Thiès  deux points — nous contacter
  New York    2738 Hone Ave, Bronx, NY 10469
  Brazzaville, Kinshasa : À COMPLÉTER (sous-traités)
  Le Sénégal a DEUX villes de retrait : le modèle
  Pays → Villes[] → PointRetrait[] doit le supporter nativement.

═══════════════════════════════════════════════════════════
SECTION 7 — MODÈLE DE DONNÉES (esquisse Prisma)
═══════════════════════════════════════════════════════════

Détail complet dans docs/CDC-v1.3.md §9. Affine-le proprement.

Client
  numeroClient (ENI-XX-0000), nom, prenom, telephone, email
  paysDestination, villeDestination, actif, dateInscription, Colis[]

Pays
  codeISO, nom, monnaie (XOF|XAF|GNF|CDF|USD|EUR)
  tauxFixe (655.957 zone CFA) | tauxManuel
  Ville[] → nom, codeAeroport, villeTransit (auto-réf, INTERNE),
            PointRetrait[] → nom, adresse, telephone, horaires

Liaison                            ← ORIENTÉE : l'inverse est une autre ligne
  paysOrigine, paysDestination, mode (AERIEN|MARITIME)
  prixParKg, delaiJoursMin/Max
  sousTraitee, prixAchat (interne)
  afficheePubliquement, actif

CategorieArticle
  libelle, modeCalcul, valeur, remplaceTarifLiaison, publie

Colis
  codeSuivi (ENI-AAAA-NNNNN), client (nullable)
  modeReception (COMMANDE_EN_LIGNE|DEPOT|EXPEDITION)
  momentPaiement (DEPART|ARRIVEE)
  expediteur, destinataire, villeDestination, pointRetrait, depart
  necessiteReacheminement
  poidsEstime, poidsReel, dimensions
  categorie, valeurDeclaree, justificatifFourni
  statut, statutPaiement
  devis → Document, facture → Document
  HistoriqueStatut[]                ← APPEND-ONLY

Document                            ← devis ET facture
  type (DEVIS|FACTURE), numero, colis
  montantEur, devise, tauxApplique, montantDevise   ← FIGÉS à l'émission
  dateEmission, dateValidite, mentionFiscale, pdfUrl

Encaissement
  document, montant, devise, tauxApplique
  lieu (FRANCE|ABIDJAN|AUTRE), dateEncaissement, moyen, operateur

Depart
  reference, liaison, dateClotureDepot, dateDepart,
  dateArriveeEstimee, statut, Colis[]

MessageCampagne · Utilisateur (role ADMIN|OPERATEUR)

Prévois sans les construire : Paiement, NotificationLog (phase 2).

SEED réaliste : 8 pays et leurs villes (SÉNÉGAL AVEC DAKAR ET THIÈS),
les liaisons et tarifs ci-dessus, les 4 catégories, France ↔ USA en
afficheePubliquement: false, les points de retrait, ~6 clients avec
identifiants, ~4 départs hebdomadaires, ~8 colis à statuts et modes de
réception variés, ~4 devis, ~3 factures dont une payée à l'arrivée en FCFA.
AUCUN faux témoignage, AUCUN nom de client réel.

═══════════════════════════════════════════════════════════
SECTION 8 — HORS PÉRIMÈTRE (ne PAS construire)
═══════════════════════════════════════════════════════════

- Paiement en ligne                          → phase 2
- API WhatsApp Business automatisée          → phase 2
- Espace client complet (historique, suivi personnel) → phase 2
- Fret maritime ACTIF (structure présente, désactivée en base) → phase 2
- Version anglaise complète                  → phase 2
- Notifications SMS                          → phase 2
- Documents douaniers                        → phase 2
- Application mobile native                  → non planifié

DANS le périmètre : l'inscription au service de réception. Elle est
nécessaire au mode A, elle n'est pas un espace client complet.

═══════════════════════════════════════════════════════════
SECTION 9 — DÉFINITION DE « TERMINÉ »
═══════════════════════════════════════════════════════════

- npm run build passe sans erreur
- tsc --noEmit propre, lint propre
- Migrations et seed fournis et fonctionnels
- README complet : installation, .env.example, scripts, hypothèses,
  LISTE DE TOUS LES [À COMPLÉTER]
- Lighthouse mobile > 90 sur les 4 axes
- Responsive desktop + mobile impeccable
- Navigation clavier fonctionnelle

PARCOURS BOUT-EN-BOUT À VÉRIFIER :
 1. Un visiteur remplit /devis avec 2 photos depuis un mobile
    → l'exploitante reçoit l'alerte
 2. L'admin ouvre le devis, voit les photos, chiffre
    → le demandeur reçoit son devis
 3. Devis accepté → code de suivi généré → reçu PDF avec QR code → e-mail
 4. Le client saisit son code sur /suivi → bon statut, aucune donnée sensible
 5. Un client s'inscrit sur /inscription → identifiant attribué
    → bloc d'adresse affiché et envoyé
 6. L'admin enregistre un colis reçu (mode A), le rattache à un client,
    le pèse → devis estimatif envoyé
 7. Le colis arrive → facture émise en EUR et FCFA → encaissement saisi
    → la créance se solde
 8. L'admin crée un départ → il apparaît sur /departs
    → changement de statut → e-mail de notification

CHECKLIST SPÉCIFIQUE AU PROJET :
 [ ] Aucun calculateur de prix côté public, sous aucune forme
 [ ] Le devis n'est jamais présenté comme obligatoire pour un colis
     ordinaire déposé au bureau
 [ ] villeTransit n'apparaît dans AUCUNE réponse publique
     (vérifié dans le HTML rendu)
 [ ] France ↔ USA absente des destinations, sélecteurs et sitemap
 [ ] /destinations, /departs et /suivi lisent la VRAIE base
 [ ] Moteur de tarification testé unitairement, jamais appelé côté public
 [ ] Aucun tarif, destination ou règle de catégorie en dur
 [ ] Mention « TVA non applicable, art. 293 B du CGI » sur devis ET factures
 [ ] Numérotation des factures continue, sans trou
 [ ] Taux de change figé à l'émission, montantDevise stocké
 [ ] File des colis non identifiés fonctionnelle
 [ ] Vue créances avec ancienneté et total
 [ ] Upload photo depuis un téléphone réel, avec compression
 [ ] Code ENI-AAAA-NNNNN + reçu PDF avec QR code
 [ ] Rôle OPERATEUR réellement restreint CÔTÉ SERVEUR
 [ ] Suivi public : prénom + initiale seulement
 [ ] Back-office utilisable sur mobile, debout
 [ ] Sénégal : deux villes de retrait (Dakar et Thiès)
 [ ] Aucune couleur en dur hors tokens
 [ ] Boutons orange : texte navy (contraste AA)
 [ ] Aucun faux témoignage, bloc masqué
 [ ] RGPD : hébergement UE base ET photos, purge prévue
 [ ] Crédit « Conçu par di-eureka » en pied de page, avec lien
 [ ] README avec la liste complète des [À COMPLÉTER]

═══════════════════════════════════════════════════════════

Commence par me présenter ton plan de tâches. N'écris aucune ligne
de code avant que je l'aie validé.
```

---

## Après ce prompt

Claude Code présente son plan. Une fois validé, avance **lot par lot** avec les prompts de `DEMARRER.md`, en t'arrêtant pour valider entre chacun.

Point de vigilance de la méthode : après le lot design-system, **demande l'URL du serveur de dev et regarde le rendu** avant d'aller plus loin. C'est le moment de corriger l'ADN visuel — pas après quinze pages construites dessus.

---

*di-eureka — [www.di-eureka.com](https://www.di-eureka.com)*
