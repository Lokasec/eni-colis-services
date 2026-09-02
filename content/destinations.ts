/**
 * Contenus rédactionnels des fiches destination.
 *
 * Repris VERBATIM de docs/contenus-destinations.md, validé par la cliente.
 * Ne pas reformuler, ne pas appauvrir, ne pas en inventer d'autres.
 *
 * Chaque fiche a son angle éditorial propre — aucune ne partage de
 * paragraphe avec une autre. C'est ce qui protège le référencement face à
 * l'opérateur co-localisé qui dessert cinq des mêmes destinations.
 *
 * Les tarifs et les points de retrait ne figurent PAS ici : ils sont lus en
 * base. Seul le texte éditorial vit dans ce fichier.
 */

export type FicheDestination = {
  /** Slug d'URL, tel que défini dans les contenus validés. */
  slug: string
  titreSeo: string
  metaDescription: string
  surTitre: string
  h1: string
  chapo: string
  /** Deux à trois paragraphes, propres à cette destination. */
  editorial: string[]
  envois: string
  bonASavoir: string
  /** Paragraphe additionnel, utilisé par la seule fiche New York. */
  complement?: { titre: string; texte: string }
  cta: string
}

/** Clé : code ISO du pays de destination. */
export const fichesDestination: Record<string, FicheDestination> = {
  CI: {
    slug: 'cote-divoire',
    titreSeo: "Envoi de colis France → Abidjan, Côte d'Ivoire",
    metaDescription:
      'Expédiez vos colis vers Abidjan par groupage aérien. Tarif au kilo, devis sous 24 h sur photos, retrait à Abidjan. Départs réguliers depuis la France.',
    surTitre: "Côte d'Ivoire",
    h1: 'Envoyer un colis à Abidjan',
    chapo:
      "Abidjan est notre destination la plus desservie. C'est aussi le point d'appui de notre réseau : la plupart de nos liaisons africaines passent par cet aéroport, ce qui nous permet d'assurer des départs fréquents et des délais tenus.",
    editorial: [
      "L'aéroport Félix-Houphouët-Boigny concentre l'essentiel du trafic aérien de la région. Pour vous, cela signifie des rotations plus nombreuses et une meilleure disponibilité en soute que sur des destinations moins fréquentées — donc des colis qui partent plus vite.",
      "Abidjan fonctionne aussi dans l'autre sens. Si vous avez de la famille ou des partenaires sur place qui souhaitent vous expédier quelque chose, nous assurons la liaison retour vers la France à 12 €/kg. C'est le même circuit, la même équipe, le même suivi.",
    ],
    envois:
      "Cartons familiaux (vêtements, produits d'hygiène, denrées non périssables), pièces détachées automobiles, matériel électronique, marchandises pour de petits commerçants.",
    bonASavoir:
      "Abidjan est également notre point de départ vers New York. Si vous expédiez depuis la Côte d'Ivoire vers les États-Unis, c'est la seule liaison directe que nous opérons — voir la fiche New York.",
    cta: 'Demander un devis pour Abidjan',
  },

  BJ: {
    slug: 'benin',
    titreSeo: 'Envoi de colis France → Cotonou, Bénin',
    metaDescription:
      'Colis vers Cotonou par fret aérien groupé. Prix ferme sous 24 h après envoi de photos. Point de retrait à Cotonou, tarif au kilo.',
    surTitre: 'Bénin',
    h1: 'Envoyer un colis à Cotonou',
    chapo:
      "Cotonou est le point d'entrée de tous nos envois vers le Bénin. Attention à une confusion fréquente : la capitale administrative du pays est Porto-Novo, mais c'est bien à Cotonou que se trouve l'aéroport international et que vos colis sont mis à disposition.",
    editorial: [
      'Le Bénin occupe une place particulière dans les flux commerciaux ouest-africains : Cotonou est une place marchande active, et une partie de nos envois vers cette destination sont des marchandises destinées à la revente plutôt que des cartons familiaux.',
      "Cela change la nature de la demande. Nos clients béninois nous interrogent souvent sur les envois répétés, les volumes réguliers et les pièces détachées. Si c'est votre cas, indiquez-le dans votre demande de devis : nous adaptons notre réponse à la fréquence de vos expéditions.",
    ],
    envois:
      'Marchandises pour la revente, textile, pièces détachées, matériel électronique, cartons familiaux.',
    bonASavoir:
      "Les pièces détachées sont tarifées 20 €/kg vers toutes nos destinations, y compris Cotonou. Ce tarif remplace le prix standard : il ne s'y ajoute pas.",
    cta: 'Demander un devis pour Cotonou',
  },

  GN: {
    slug: 'guinee',
    titreSeo: 'Envoi de colis France → Conakry, Guinée',
    metaDescription:
      'Expédiez vers Conakry par groupage aérien. Devis chiffré sous 24 h, tarif au kilo, retrait à Conakry. Aller et retour assurés.',
    surTitre: 'Guinée',
    h1: 'Envoyer un colis à Conakry',
    chapo:
      "Conakry est desservie dans les deux sens depuis la France. La liaison est moins fréquentée que celles d'Abidjan ou de Dakar, ce qui rend le calendrier des départs d'autant plus important à consulter avant de préparer votre colis.",
    editorial: [
      "Sur les destinations à rotation moins dense, le groupage prend tout son sens : nous rassemblons les colis de plusieurs clients pour remplir un envoi et obtenir un tarif au kilo que personne n'obtiendrait seul. En contrepartie, il faut respecter la date de clôture des dépôts — un colis déposé après cette date part au départ suivant.",
      'Notre conseil : consultez la page des prochains départs avant de préparer votre envoi, et déposez quelques jours avant la clôture plutôt que la veille.',
    ],
    envois:
      "Cartons familiaux, vêtements, produits d'hygiène, matériel électronique, pièces détachées.",
    bonASavoir:
      "Si votre colis contient un appareil électronique, sa batterie doit rester à l'intérieur de l'appareil. Une batterie lithium expédiée seule est refusée en fret aérien, sans exception.",
    cta: 'Demander un devis pour Conakry',
  },

  ML: {
    slug: 'mali',
    titreSeo: 'Envoi de colis France → Bamako, Mali',
    metaDescription:
      'Colis vers Bamako par fret aérien. Prix ferme après examen des photos, tarif au kilo, point de retrait à Bamako.',
    surTitre: 'Mali',
    h1: 'Envoyer un colis à Bamako',
    chapo:
      "Le Mali n'a pas d'accès à la mer. Pour un envoi depuis la France, cela signifie que le fret aérien n'est pas une option parmi d'autres : c'est la voie directe, sans transbordement portuaire ni acheminement routier sur des centaines de kilomètres.",
    editorial: [
      'Cette situation géographique explique pourquoi les envois vers Bamako se font presque exclusivement par avion, et pourquoi le poids compte plus qu’ailleurs. Un carton bien rempli coûte moins cher au kilo transporté qu’un carton à moitié vide de même encombrement.',
      "C'est aussi la raison pour laquelle nous demandons des photos : sur cette destination, l'écart entre un colis compact et un colis volumineux se ressent immédiatement sur le prix. Mieux vaut le savoir avant de faire ses cartons.",
    ],
    envois:
      "Cartons familiaux, textile, produits d'hygiène et de beauté, denrées non périssables, matériel électronique.",
    bonASavoir:
      'Un conseil de préparation : privilégiez un carton bien rempli et compact plutôt que deux cartons à moitié vides. Le volume occupé compte autant que le poids sur la balance.',
    cta: 'Demander un devis pour Bamako',
  },

  SN: {
    slug: 'senegal',
    titreSeo: 'Envoi de colis France → Dakar, Sénégal — 12 €/kg',
    metaDescription:
      'Notre tarif le plus bas : 12 €/kg vers Dakar, dans les deux sens. Devis sous 24 h sur photos, retrait à Dakar.',
    surTitre: 'Sénégal',
    h1: 'Envoyer un colis à Dakar',
    chapo:
      "Dakar est notre destination la moins chère : 12 €/kg, et le même tarif dans le sens du retour. C'est aussi la seule de nos liaisons où le prix est identique à l'aller et au retour.",
    editorial: [
      'Cette symétrie tarifaire s’explique par la densité du trafic entre la France et le Sénégal. Les rotations sont nombreuses, la capacité en soute est disponible dans les deux sens, et nous répercutons cet avantage sur nos tarifs plutôt que de l’absorber.',
      'Concrètement, un envoi vers Dakar vous coûte 20 % de moins qu’un envoi vers Abidjan ou Cotonou, à poids égal. Si vous hésitez sur le volume à expédier, c’est la destination où vous pouvez vous permettre le carton le plus généreux.',
    ],
    envois:
      'Cartons familiaux, vêtements, produits de beauté, denrées non périssables, matériel électronique, marchandises de revente.',
    bonASavoir:
      'Le tarif retour à 12 €/kg s’applique aussi aux envois depuis Dakar vers la France. Vos proches sur place peuvent vous expédier au même prix que vous les expédiez.',
    cta: 'Demander un devis pour Dakar',
  },

  CG: {
    slug: 'congo-brazzaville',
    titreSeo: 'Envoi de colis France → Brazzaville, Congo',
    metaDescription:
      'Expédiez vers Brazzaville par groupage aérien. Devis chiffré sous 24 h, acheminement assuré avec notre partenaire local.',
    surTitre: 'Congo-Brazzaville',
    h1: 'Envoyer un colis à Brazzaville',
    chapo:
      "Attention à ne pas confondre : Brazzaville est la capitale de la République du Congo, à ne pas mélanger avec Kinshasa, capitale de la République démocratique du Congo, située juste en face sur l'autre rive du fleuve. Ce sont deux pays distincts, avec deux tarifs et deux points de retrait différents.",
    editorial: [
      "Sur cette destination, l'acheminement est assuré en partenariat avec un opérateur spécialisé sur l'Afrique centrale. Votre interlocuteur reste ENI Colis Services : c'est nous qui prenons votre colis en charge, qui vous remettons le reçu et le code de suivi, et qui répondons de l'envoi jusqu'à sa mise à disposition.",
      "Le tarif de 20 €/kg reflète le coût réel de la desserte : les liaisons vers l'Afrique centrale sont moins nombreuses et la capacité en soute plus rare que vers l'Afrique de l'Ouest.",
    ],
    envois:
      "Cartons familiaux, vêtements, produits d'hygiène, denrées non périssables, matériel électronique.",
    bonASavoir:
      'Vérifiez la ville de destination avant de commander votre devis. Brazzaville et Kinshasa sont séparées par quelques kilomètres mais relèvent de deux pays, deux formalités et deux tarifs distincts.',
    cta: 'Demander un devis pour Brazzaville',
  },

  CD: {
    slug: 'rd-congo',
    titreSeo: 'Envoi de colis France → Kinshasa, RD Congo',
    metaDescription:
      'Colis vers Kinshasa par fret aérien groupé. Prix ferme sous 24 h après photos, point de retrait à Kinshasa.',
    surTitre: 'République démocratique du Congo',
    h1: 'Envoyer un colis à Kinshasa',
    chapo:
      "Kinshasa est l'une des plus grandes villes d'Afrique et concentre une part importante du trafic aérien de la région. C'est ce volume qui nous permet de proposer un tarif de 15 €/kg, inférieur à celui de Brazzaville alors que les deux villes se font face.",
    editorial: [
      "L'écart de tarif entre Kinshasa et Brazzaville surprend parfois. Il tient à la fréquence des liaisons : l'aéroport de N'Djili traite un trafic nettement supérieur, ce qui rend la capacité en soute plus disponible et moins chère. Nous répercutons cette différence plutôt que d'appliquer un tarif unique à l'Afrique centrale.",
      'Comme pour Brazzaville, l’acheminement s’appuie sur un partenaire spécialisé sur la zone. Vous restez client d’ENI Colis Services de bout en bout : reçu, code de suivi, notifications et interlocuteur.',
    ],
    envois:
      "Cartons familiaux, textile, produits d'hygiène et de beauté, matériel électronique, pièces détachées.",
    bonASavoir:
      "Si vous expédiez vers une autre ville que Kinshasa — Lubumbashi par exemple — signalez-le dans votre demande de devis. Nous vous dirons si l'acheminement est possible et à quelles conditions.",
    cta: 'Demander un devis pour Kinshasa',
  },

  US: {
    slug: 'new-york',
    titreSeo: 'Envoi de colis Abidjan ↔ New York',
    metaDescription:
      'Liaison directe entre Abidjan et New York, dans les deux sens. 20 €/kg, devis sous 24 h. Une desserte rare sur ce corridor.',
    surTitre: 'États-Unis',
    h1: 'Abidjan ↔ New York',
    chapo:
      "C'est notre liaison la plus singulière. Peu d'opérateurs de groupage relient directement l'Afrique de l'Ouest à la côte est américaine : nous assurons cette desserte dans les deux sens, entre Abidjan et New York, à 20 €/kg.",
    editorial: [
      "La diaspora ivoirienne et ouest-africaine installée à New York expédie régulièrement vers le pays, et reçoit tout autant. Jusqu'ici, ces envois passaient le plus souvent par des transporteurs express au tarif prohibitif, ou par des arrangements informels sans suivi ni recours.",
      'Notre liaison offre une troisième voie : un tarif au kilo, un devis ferme, un code de suivi et un interlocuteur identifié. Le fonctionnement est le même que sur nos destinations africaines — vous photographiez, nous chiffrons, vous déposez.',
    ],
    envois:
      'Cartons familiaux, produits alimentaires non périssables, textile, matériel électronique, articles de marque.',
    bonASavoir:
      'Les envois vers les États-Unis sont soumis aux formalités douanières américaines. Une déclaration de contenu détaillée est obligatoire, et certains produits alimentaires font l’objet de restrictions spécifiques. Décrivez précisément le contenu dans votre demande de devis : nous vous indiquerons ce qui est acceptable avant que vous prépariez votre colis.',
    complement: {
      titre: 'Depuis la France vers les États-Unis',
      texte:
        "Nous n'opérons pas de liaison directe entre la France et les États-Unis. Pour un envoi de ce type, contactez-nous : nous étudierons la demande au cas par cas.",
    },
    cta: 'Demander un devis pour cette liaison',
  },
}

/** Code ISO -> slug d'URL, et l'inverse. */
export const slugParPays: Record<string, string> = Object.fromEntries(
  Object.entries(fichesDestination).map(([codeIso, fiche]) => [codeIso, fiche.slug]),
)

export const paysParSlug: Record<string, string> = Object.fromEntries(
  Object.entries(fichesDestination).map(([codeIso, fiche]) => [fiche.slug, codeIso]),
)
