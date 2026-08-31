# GUIDE IMAGES — ENI Colis Services

**Prestataire** : di-eureka — [www.di-eureka.com](https://www.di-eureka.com)
**Version** : 1.0 — 27 août 2026

> Les emplacements sont déjà en place dans la maquette. Déposez les fichiers dans le dossier `images/` **avec exactement les noms indiqués** : le site les affiche automatiquement, sans aucune modification de code. Tant qu'un fichier est absent, un cadre affiche son nom.

---

## 1. Où trouver les photos

| Source | Licence | Remarque |
|---|---|---|
| **[Unsplash](https://unsplash.com)** | Libre, usage commercial autorisé, sans attribution | Le meilleur choix. Attention : peu de photos d'Afrique de l'Ouest, il faut chercher. |
| **[Pexels](https://pexels.com)** | Idem | Souvent complémentaire d'Unsplash sur l'Afrique |
| **[Wikimedia Commons](https://commons.wikimedia.org)** | Variable — **vérifier chaque photo** | Meilleure couverture des villes africaines. Certaines licences imposent de citer l'auteur. |

### À ne pas utiliser

- **Google Images, Pinterest, blogs de voyage** : aucune de ces images n'est libre de droits. Les photos de villes africaines sont souvent prises par des photographes locaux qui surveillent leurs usages, et une réclamation sur un site commercial est un vrai risque.
- **Les photos d'agences de transport concurrentes** : évident, mais ça arrive.

---

## 2. Les images à trouver

### Destinations — format large (1600 × 900 minimum)

| Fichier | Termes de recherche | Ce qu'on cherche |
|---|---|---|
| `destination-abidjan.jpg` | *Abidjan skyline*, *Plateau Abidjan*, *Abidjan lagoon* | La skyline du Plateau vue de la lagune. Reconnaissable, moderne. |
| `destination-cotonou.jpg` | *Cotonou Benin*, *Cotonou market*, *Benin street* | Marché, rue animée, port. Éviter les images trop rurales. |
| `destination-conakry.jpg` | *Conakry Guinea*, *Guinea Conakry city* | Rare sur Unsplash — chercher aussi sur Wikimedia. |
| `destination-bamako.jpg` | *Bamako Mali*, *Niger river Bamako*, *Mali architecture* | Le fleuve, un pont, l'architecture en terre. |
| `destination-dakar.jpg` | *Dakar Senegal*, *Dakar city*, *Senegal coast* | Bien fourni. Côte, Monument de la Renaissance, ville. |
| `destination-brazzaville.jpg` | *Brazzaville Congo*, *Congo river* | Rare — Wikimedia sera plus fiable. |
| `destination-kinshasa.jpg` | *Kinshasa DRC*, *Kinshasa city*, *Congo river Kinshasa* | Rare — Wikimedia. |
| `destination-new-york.jpg` | *New York skyline*, *Bronx New York* | Très fourni. Préférer une vue de quartier plutôt que Times Square. |

**Critères de choix**

- **Horizontale**, jamais verticale — l'emplacement est en 21/9
- **Lumineuse**, plutôt en journée : le site a un fond blanc, une photo sombre jure
- **Une ville réelle**, pas une carte postale : évitez les couchers de soleil génériques
- **Pas de visage identifiable** au premier plan — question de droit à l'image
- **Pas de logo de marque** visible (enseignes, panneaux publicitaires)
- **Cohérence entre les huit** : si l'une est très saturée et l'autre très pâle, la grille de l'accueil paraîtra désordonnée

### Activité — photos de la cliente

Ce sont **les images les plus importantes du site**. Une photo de son magasin vaut mieux que la plus belle skyline : elle prouve que l'entreprise existe physiquement, et personne d'autre ne peut avoir la même.

| Fichier | Sujet | Conseil de prise de vue |
|---|---|---|
| `activite-depot.jpg` | Un dépôt au comptoir | De trois-quarts, mains et carton visibles, pas de visage |
| `activite-depart.jpg` | Colis prêts avant un départ | Une pile de cartons étiquetés — c'est très parlant |
| `activite-reception.jpg` | Cartons marchands reçus | Illustre le service d'adresse en France |
| `magasin-abidjan.jpg` | Le magasin d'Abidjan | Devanture ou intérieur, en journée |
| `bureau-rouen.jpg` | La devanture de Rouen | Enseigne visible si elle existe |

**Conseils pratiques**

- Photographier **en journée, près d'une fenêtre** ou en extérieur. Pas de flash.
- **Format horizontal**, téléphone tenu à l'horizontale.
- **Aucun visage de client reconnaissable** sans autorisation écrite. De dos ou cadré sur les mains.
- **Aucune étiquette lisible** comportant un nom, une adresse ou un numéro de téléphone.
- Ranger le cadre avant de photographier : ce qui traîne se voit toujours sur la photo.

---

## 3. Préparer les fichiers

1. **Recadrer** en 16/9 pour les destinations, 16/9 ou 4/3 pour l'activité
2. **Redimensionner** à 1600 px de large maximum
3. **Compresser** sur [squoosh.app](https://squoosh.app) — MozJPEG, qualité 80
4. **Viser moins de 300 Ko** par image
5. **Nommer** exactement comme indiqué, en minuscules, sans accent ni espace
6. **Déposer** dans le dossier `images/`

Une image de 4 Mo sortie d'un téléphone met plusieurs secondes à charger sur une connexion africaine. La compression n'est pas un détail de confort : c'est ce qui rend le site utilisable pour les destinataires.

---

## 4. Ordre de priorité

Si tout n'est pas disponible tout de suite :

| Priorité | Images | Pourquoi |
|---|---|---|
| 🔴 1 | `destination-abidjan` · `destination-dakar` · `destination-new-york` | Les trois destinations les plus consultées, et les mieux fournies en photos libres |
| 🔴 2 | `magasin-abidjan` · `bureau-rouen` | La preuve d'existence physique — ce qui rassure le plus |
| 🟠 3 | Les cinq autres destinations | La grille de l'accueil paraît incomplète tant qu'il en manque |
| 🟢 4 | Les trois photos d'activité | Confort visuel, moins critique |

Le site fonctionne sans aucune image : les cadres indiquent simplement ce qui manque. Vous pouvez donc mettre en ligne et compléter au fur et à mesure.

---

## 5. Et pour la version définitive

Au moment du développement, les images seront servies au format **WebP** et redimensionnées automatiquement selon l'écran. Vous n'aurez rien à refaire : les mêmes fichiers JPG seront repris, l'optimisation se fera côté serveur.

---

*Document produit par **di-eureka** — conception et développement web*
