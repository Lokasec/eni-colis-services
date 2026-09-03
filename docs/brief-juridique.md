# Brief juridique — ENI Colis Services

**Document de travail à porter à un juriste. Ce n'est pas un avis juridique et rien ici n'est publiable en l'état.**

Rédigé par di-eureka le 2 septembre 2026, mis à jour le 3 septembre, à partir de l'application développée. Son objet est de faire gagner du temps au juriste : il rassemble les faits, dit ce que l'application implémente déjà, et pose les questions dont la réponse conditionne du code ou du texte publié.

Les valeurs marquées **« paramétrée »** existent en base (`ParametresTarification`) et se modifient en back-office sans redéploiement. Le juriste peut donc les corriger sans coût technique.

---

## 1. Les faits

| | |
| --- | --- |
| Activité | Expédition de colis entre la France, sept pays d'Afrique subsaharienne et New York |
| Statut annoncé | Auto-entrepreneur, **en franchise de TVA** |
| Bureau France | 67 rue Saint-Julien, 76100 Rouen — collecte et réception |
| Magasin Abidjan | Angré, face à l'immeuble Konor 2 — retrait et encaissement |
| Téléphone | +33 6 52 70 70 14 |
| Destinations | Côte d'Ivoire, Bénin, Guinée, Mali, Sénégal (Dakar **et** Thiès), Congo-Brazzaville, RD Congo, New York (depuis Abidjan) |
| Sous-traitance | **Brazzaville et Kinshasa** sont opérées par un partenaire tiers |
| Départs | Hebdomadaires, par voie aérienne |

### Trois modes de réception, trois situations juridiques différentes

Cette distinction commande une bonne part des questions qui suivent.

| | **A — Commande en ligne** | **B — Dépôt au bureau** | **C — Expédition par transporteur** |
| --- | --- | --- | --- |
| Qui remet le colis | Le marchand (Amazon, Shein…) | Le client | Le client, via La Poste |
| Où est le client | **Souvent en Afrique** | En France | En France |
| Contenu connu d'ENI | **Non** — carton scellé | Oui, ouvert au dépôt | Non |
| Paiement | **À l'arrivée** | Au dépôt | Au départ |

Sur le **mode A**, ENI vend une adresse de livraison en France : le client s'inscrit, reçoit un identifiant, et l'utilise dans ses commandes chez des marchands qui ne livrent pas en Afrique. ENI reçoit donc des colis qu'elle n'a pas ouverts, adressés à des tiers, et **avance le coût du transport** — elle n'est payée qu'au retrait, à l'arrivée.

---

## 2. La question la plus lourde : le statut réglementaire

**C'est celle qui doit être tranchée en premier, parce qu'elle conditionne tout le reste.**

ENI organise un transport qu'elle n'exécute pas elle-même : elle confie les colis à des compagnies aériennes, et sous-traite deux destinations à un partenaire. Cette configuration ressemble à celle du **commissionnaire de transport**.

Si cette qualification est retenue, elle emporte — sous réserve de vérification par le juriste — des obligations lourdes : inscription à un registre, attestation de capacité professionnelle, exigence de capacité financière, assurance spécifique, et un régime de responsabilité propre.

### Ce que nous ne savons pas

- ENI est-elle **commissionnaire de transport**, **mandataire**, ou relève-t-elle d'une autre qualification ?
- Le statut d'**auto-entrepreneur** est-il compatible avec cette activité et ses seuils de chiffre d'affaires ?
- Quelles inscriptions, licences ou assurances sont obligatoires, et lesquelles manquent aujourd'hui ?

> **Pourquoi c'est bloquant** : les mentions légales doivent porter le statut réglementaire de l'activité de transport. Tant qu'il n'est pas établi, la page ne peut pas être écrite — et le site ne peut pas être ouvert au public.

### Deux points connexes, plus discrets

**L'export hors Union européenne.** Chaque colis quittant l'UE relève de formalités douanières. L'application ne produit aucun document douanier — c'était un choix de périmètre pour la phase 1. Est-ce tenable, et sur qui pèse l'obligation déclarative : ENI, l'expéditeur, ou le transporteur aérien ?

**Le service d'adresse du mode A.** ENI reçoit à son adresse des colis destinés à des tiers, sous un identifiant qu'elle attribue. Est-ce une simple réception de courrier, ou cela touche-t-il à une activité réglementée ? Le local étant partagé avec un autre opérateur du même secteur, la traçabilité des colis reçus est déjà une préoccupation opérationnelle.

---

## 3. Mentions légales — ce qu'il nous manque

La page `/legal/mentions` existe, structurée, mais **vide de contenu** : elle ne liste aujourd'hui que les rubriques à remplir.

L'article 6 III de la LCEN impose des mentions sur tout site professionnel. Voici ce que nous devons obtenir d'ENI, et ce qui reste à trancher.

| Rubrique | À fournir par ENI | À valider par le juriste |
| --- | --- | --- |
| Dénomination et statut | Raison sociale exacte, forme juridique | Formulation du statut d'auto-entrepreneur |
| Identification | **SIREN / SIRET** | Mention RCS ou dispense d'immatriculation |
| Siège | Le 67 rue Saint-Julien est-il le **siège** ou seulement un bureau ? | Adresse à publier |
| Directeur de la publication | Nom et qualité | — |
| Hébergeur | Vercel — dénomination et adresse complètes | Formulation exacte |
| TVA | Franchise, art. 293 B du CGI | ✅ Déjà porté sur tout devis et toute facture |
| Statut réglementaire du transport | — | **Voir §2 — bloquant** |
| Assurance professionnelle | Assureur, numéro de police, étendue | Mention obligatoire ou non |

---

## 4. Conditions générales de service

La page `/legal/cgs` existe avec ses neuf rubriques, **sans texte**. Voici, pour chacune, ce que l'application fait déjà et ce qui manque.

### 4.1 Les arbitrages — deux origines distinctes

Ces points n'avaient jamais été fixés. Ils ont désormais deux origines qu'il faut ne pas confondre :

- **L'indemnisation** reste **notre proposition**, défendable mais non validée, retenue par la cliente à titre de base de discussion.
- **La garde et la vente** sont la **décision de la cliente**, arrêtée le 3 septembre 2026. Nous l'avons appliquée telle quelle, en maintenant nos réserves.

Toutes ces valeurs sont paramétrées en base : le juriste peut les corriger sans coût technique.

| Point | Valeur retenue | Notre raisonnement | À trancher |
| --- | --- | --- | --- |
| Indemnisation, colis ordinaire | **20 €/kg**, plafond **400 €** par colis | Le tarif le plus élevé de la grille, que nous croyons inférieur au plafond de la convention de Montréal pour le transport aérien | Le plafond conventionnel est-il applicable ici, et à quel montant ? Une limitation contractuelle est-elle opposable au client ? |
| Indemnisation, article de valeur | **Valeur déclarée**, sur justificatif d'achat | Il est déjà facturé 15 % de sa valeur : le couvrir au barème au kilo serait incohérent | Une déclaration de valeur engage-t-elle ENI au-delà du plafond ? Faut-il une assurance dédiée ? |
| Garde gratuite | **7 jours** après mise à disposition | Décision de la cliente | Un délai si court est-il opposable au destinataire ? |
| Frais de garde | **3 €/jour**, **sans plafond** | Décision de la cliente. Nous avions proposé un plafond au montant du transport | Des frais de garde sont-ils opposables sans acceptation préalable ? Un montant non plafonné peut-il être jugé abusif ? |
| Colis non retiré | **21 jours** → **mise en vente aux enchères** | Décision de la cliente, pour se rembourser les frais de stockage | **Voir ci-dessous — devenu la question n° 1** |

> ### La vente aux enchères — question n° 1
>
> **La cliente a tranché le 3 septembre 2026** : une semaine pour retirer, puis 3 €/jour, et **mise en vente aux enchères au bout de trois semaines** pour se rembourser les frais de stockage. Nous avons enregistré cette décision et l'avons appliquée dans l'application ; elle n'est **pas validée juridiquement**, et nous ne pouvons pas la valider nous-mêmes.
>
> Ce qui nous inquiète, dans l'ordre :
>
> 1. **Vendre le bien d'autrui obéit à une procédure.** Faut-il un commissaire de justice, une mise en demeure formelle, une autorisation judiciaire, un délai légal minimum ? Une vente irrégulière expose ENI bien au-delà du montant en jeu.
> 2. **La vente aurait lieu à Abidjan**, où se trouve le colis — donc sous **droit ivoirien**, pas français. Quel droit régit la disposition du bien : celui du lieu du contrat, du lieu de la chose, du domicile du destinataire ?
> 3. **Vingt et un jours est court.** Le délai court à compter de la mise à disposition ; un destinataire en déplacement ou hospitalisé perd sa marchandise.
> 4. **Sur le mode A, le destinataire n'a peut-être jamais rien signé.** C'est le client inscrit qui a accepté les conditions, et ce n'est pas toujours la même personne. Les frais de garde et la vente lui sont-ils opposables ?
> 5. **Les frais dépassent vite le transport.** Un colis de 5 kg vers Dakar coûte 60 € ; du 8ᵉ au 21ᵉ jour, la garde ajoute 42 €. Un montant de garde disproportionné au service peut-il être contesté ?
>
> **Si la procédure décrite n'est pas praticable, dites-nous laquelle l'est.** Les délais et les montants sont paramétrés en base : les changer ne coûte rien.

### 4.2 Les autres rubriques

| Rubrique | État dans l'application | Ce qui manque |
| --- | --- | --- |
| Objets interdits et restreints | Aucune liste | Liste à établir : matières dangereuses, denrées, espèces, produits réglementés à l'export et à l'import dans neuf pays |
| Remise contre paiement | ✅ Règle appliquée, non paramétrable | Formulation contractuelle |
| Envois à distance (mode C) | ✅ Devis accepté avant départ, numéro collé sur le colis | Moment de formation du contrat, droit de rétractation éventuel |
| Recours à un sous-traitant | ✅ Brazzaville et Kinshasa identifiés | Mention obligatoire dans les CGS, et régime de responsabilité d'ENI pour le fait de son sous-traitant |
| Réclamations | Aucun délai fixé | Délai de réclamation, forme, prescription |
| Retard | Rien | ENI s'engage-t-elle sur un délai ? Les délais réels par destination ne nous ont jamais été communiqués |
| Litiges | Rien | Droit applicable et juridiction, alors que le destinataire est **souvent hors de France** — point sensible |

### 4.3 Une particularité du mode A à porter au juriste

Sur le mode A, **ENI avance le transport** et n'est payée qu'à l'arrivée, parfois plusieurs semaines plus tard. L'application gère cette créance et affiche son ancienneté.

Deux questions en découlent :

- Qui est le **cocontractant** : l'expéditeur (le marchand, qui ignore tout d'ENI), le client inscrit, ou le destinataire qui retire ?
- ENI ouvre le carton pour peser et vérifier. **Sur quel fondement**, et faut-il le faire accepter à l'inscription ?

---

## 5. RGPD

### Ce qui est déjà en place

| Obligation | État |
| --- | --- |
| Hébergement UE | ✅ Base et photos en région Europe |
| Minimisation | ✅ Le suivi public n'affiche que « Prénom I. » — jamais l'adresse, la valeur, le contenu ni le téléphone |
| Consentement horodaté | ✅ Sur les demandes de devis et les inscriptions |
| Conservation | ✅ Annoncée : devis non convertis 12 mois · clients 3 ans après le dernier envoi · pièces comptables 10 ans |
| Traceurs | ✅ **Aucun** — pas d'analytique, pas de régie, pas de pixel. Le seul cookie est celui de session du back-office |
| Sécurité | ✅ Mots de passe hachés, en-têtes de sécurité, validation serveur, limitation de débit sur les formulaires publics |

### Ce qui manque, et qui n'est pas du code

1. **Le registre des traitements** — obligatoire, à rédiger.
2. **Le contrat de sous-traitance (article 28)** avec le partenaire de Brazzaville et Kinshasa. Il n'existe pas.
3. **Le transfert hors UE.** Point que nous voulons souligner : transmettre le nom, le téléphone et l'adresse d'un destinataire à un sous-traitant établi au Congo ou en RD Congo est un **transfert de données hors Espace économique européen**. Ces pays ne bénéficient pas, à notre connaissance, d'une décision d'adéquation. Un encadrement contractuel spécifique semble nécessaire — à confirmer et à rédiger.
4. **Les durées de conservation** annoncées sont notre proposition. Sont-elles justifiables ?
5. **Les photos de colis**, conservées comme preuve en cas de litige. Quelle durée, sur quelle base légale ?

---

## 6. Ce que nous demandons au juriste

Par ordre d'urgence.

1. **Quel est le statut réglementaire de l'activité ?** Rien ne peut être publié tant que ce point n'est pas tranché. *(§2)*
2. **La vente aux enchères d'un colis non retiré** — procédure, formalités, droit applicable. La cliente veut l'appliquer à 21 jours. *(§4.1)*
3. **Les frais de garde de 3 €/jour, sans plafond**, sont-ils opposables ? *(§4.1)*
4. **Le plafond d'indemnisation est-il opposable**, et à quel montant ? *(§4.1)*
5. **Rédaction des mentions légales**, une fois le §3 complété par ENI.
6. **Rédaction des CGS**, à partir du §4.
7. **Encadrement du transfert de données** vers le sous-traitant hors UE. *(§5)*
8. **Modèle de contrat de sous-traitance** au sens de l'article 28.

---

## 7. Ce qu'ENI doit fournir, sans juriste

Ces éléments ne demandent aucune analyse — seulement d'être communiqués.

- [ ] SIREN / SIRET et raison sociale exacte
- [ ] Nom du directeur de la publication
- [ ] Adresse du siège, si différente du bureau de Rouen
- [ ] Attestation d'assurance professionnelle
- [ ] Horaires d'ouverture du bureau de Rouen
- [ ] Délais réels par destination, réacheminement inclus
- [ ] Adresses et contacts des points de retrait de **Brazzaville et Kinshasa**
- [ ] Coordonnées du sous-traitant, pour le contrat article 28
- [ ] Liste des objets qu'ENI refuse de transporter

---

*Document de travail — di-eureka, 2 septembre 2026. Aucune des analyses ci-dessus ne constitue un avis juridique.*
