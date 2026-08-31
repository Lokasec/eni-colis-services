# ENI Colis Services — Kit de démarrage

Site vitrine et plateforme de gestion.
Méthode di-eureka, phases 3 à 5.

## Par où commencer

1. Copier ce contenu à la racine d'un dépôt Git vide
2. Ouvrir Claude Code à la racine
3. Coller le contenu de **`PROMPT-CLAUDE-CODE.md`** en première session
4. Valider le plan proposé
5. Avancer lot par lot avec **`DEMARRER.md`**
6. Déployer avec **`DEPLOIEMENT.md`**

## Contenu

| Fichier | Rôle | Quand |
|---|---|---|
| `PROMPT-CLAUDE-CODE.md` | **Prompt de lancement**, 9 sections | Première session |
| `DEMARRER.md` | Prompts par lot, critères de validation | Chaque session |
| `CLAUDE.md` | Brief permanent, lu automatiquement | En continu |
| `DEPLOIEMENT.md` | Mise en ligne, DNS, e-mails | Fin de projet |
| `design/tokens.json` | Source unique du design system | — |
| `docs/CDC-v1.3.md` | Cahier des charges complet | Référence |
| `docs/contenus-pages.md` | Textes validés — pages transverses | Référence |
| `docs/contenus-destinations.md` | Textes validés — 8 fiches pays | Référence |
| `docs/guide-images.md` | Nommage et préparation des visuels | Référence |
| `docs/maquette/` | Maquette HTML validée par la cliente | Référence |
| `public/brand/` | Logos et favicons | — |
| `public/images/` | Photos à déposer | — |

Ouvrir `docs/maquette/index.html` dans un navigateur : elle fait foi pour la mise en page.

## Les cinq règles

1. **Un lot par session.** Quand le contexte se remplit, la qualité chute.
2. **Valider entre chaque lot**, en particulier après le design-system.
3. **Les textes sont validés** : ne pas les réinventer.
4. **Aucune couleur en dur** : tout passe par `design/tokens.json`.
5. **Si une règle métier manque, l'ajouter à `CLAUDE.md`** — pas seulement au prompt du moment.

## Points encore ouverts

À ne pas inventer, à obtenir de la cliente avant la mise en ligne :

- Plafond d'indemnisation en cas de perte ou d'avarie
- Sort d'un colis jamais retiré ni payé
- Frais de garde au-delà de 30 jours
- Points de retrait de Brazzaville et Kinshasa
- Délais réels par destination
- Horaires du bureau
- Statut réglementaire de l'activité de transport
- Mentions légales et CGS (à faire valider par un juriste)

---

*di-eureka — www.di-eureka.com*
