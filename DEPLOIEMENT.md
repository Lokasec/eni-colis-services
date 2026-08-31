# DÉPLOIEMENT — ENI Colis Services

Procédure de mise en ligne, phase 5 de la méthode di-eureka.
*di-eureka — [www.di-eureka.com](https://www.di-eureka.com)*

---

## Principe de propriété

**Tous les comptes de production sont ouverts au nom d'ENI Colis Services**, avec la cliente comme titulaire et payeur. di-eureka intervient en accès délégué, révocable à tout moment.

Ce n'est pas une formalité : c'est ce qui garantit à la cliente qu'elle reste propriétaire de son outil, et à toi que tu n'es pas responsable de ses factures.

---

## L'ordre

1. `npm run build` passe sans erreur — **jamais après le déploiement**
2. Push GitHub, `.gitignore` vérifié
3. Vercel : import du dépôt, variables d'environnement, déploiement
4. Base de données Neon, **région Europe**, `prisma db push` puis seed
5. Domaine : achat, puis DNS vers Vercel
6. E-mails : Zoho Mail (boîtes) + Resend (envois automatiques)
7. Stockage des photos, **région Europe**
8. Tests en production

---

## 1. Avant le push

```bash
npm run build      # doit passer sans erreur
npx tsc --noEmit   # typecheck propre
```

Le mode dev est permissif, le build de production est strict. Les erreurs TypeScript et les images mal référencées sortent ici. Corriger maintenant prend cinq minutes ; corriger sur Vercel prend trente minutes de débogage à distance.

**Vérifier le `.gitignore` avant le premier push.** À ne jamais pousser :

```
node_modules/   .next/   .env   .env.local   .env.*.local   *.db   .vercel
```

---

## 2. Vercel

Connexion GitHub → import du dépôt → détection automatique de Next.js.

**Ajouter les variables d'environnement AVANT le premier déploiement :**

| Variable | Valeur |
|---|---|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://enicolisservices.com` |
| `DATABASE_URL` | URL Neon Postgres, région Europe |
| `RESEND_API_KEY` | Clé API Resend |
| `EMAIL_FROM` | `noreply@enicolisservices.com` |
| `EMAIL_INTERNAL` | `contact@enicolisservices.com` |
| `BLOB_READ_WRITE_TOKEN` | Stockage des photos de devis, **région Europe** |
| `NEXT_PUBLIC_SITE_URL` | `https://enicolisservices.com` |
| `NEXT_PUBLIC_WHATSAPP` | `33652707014` |
| `TAUX_CFA` | `655.957` — parité fixe, en variable pour traçabilité |

Le plan Hobby est gratuit et suffisant pour une vitrine avec formulaires et back-office. Passer en Pro seulement si un SLA garanti devient nécessaire.

---

## 3. Base de données

**Neon, région Europe obligatoire** — la conformité RGPD l'impose, et le CDC l'engage vis-à-vis de la cliente.

```bash
npx prisma db push
npx prisma db seed
```

Le seed crée les pays, villes, liaisons, tarifs, catégories et points de retrait. **Vérifier ensuite que les données de démonstration (colis, devis, clients fictifs) ont bien été retirées** avant l'ouverture au public.

---

## 4. Domaine et DNS

Achat chez OVH, Namecheap ou Gandi — environ 15 €/an. **Au nom de la cliente.**

| Type | Nom | Valeur |
|---|---|---|
| A | `@` | IP Vercel — à vérifier dans le tableau de bord |
| CNAME | `www` | `cname.vercel-dns.com.` (avec le point final) |

Propagation : quinze minutes à deux heures. Vercel ajoute le HTTPS automatiquement.

> **Ne pas confondre trois services distincts** qui cohabitent sur le même nom de domaine : le domaine (registrar) n'est que l'adresse, l'hébergement (Vercel) sert le site, les e-mails (Zoho) reçoivent les messages. On n'achète pas l'hébergement chez le registrar.

---

## 5. E-mails

Deux services complémentaires sur le même domaine.

| Service | Rôle | Configuration |
|---|---|---|
| **Zoho Mail** | Boîtes de réception professionnelles | Enregistrements MX chez le registrar |
| **Resend** | Envois automatiques du site | Clé API dans Vercel + DNS DKIM |

**MX à ajouter chez le registrar :**

```
@  IN  MX  10  mx.zoho.eu.
@  IN  MX  20  mx2.zoho.eu.
@  IN  MX  50  mx3.zoho.eu.
@  IN  TXT "v=spf1 include:zoho.eu include:amazonses.com ~all"
```

Ajouter ensuite les enregistrements DKIM fournis par Resend, sans quoi les e-mails transactionnels partiront en indésirables.

**Boîtes à créer** : `contact@`, `devis@`, `noreply@` (envois uniquement).

---

## 6. Photos de devis

Stockage objet en **région Europe**. Les photos envoyées par les clients sont des données personnelles au sens du RGPD : elles ne doivent pas quitter l'Union européenne, au même titre que la base.

Prévoir la purge automatique des devis non convertis après douze mois.

---

## 7. Tests en production

- Parcours bout-en-bout complet (voir `PROMPT-CLAUDE-CODE.md` section 9)
- Soumission du formulaire de devis **depuis un vrai téléphone**, avec photo prise en direct
- Réception effective des e-mails, y compris en boîte principale et non en indésirables
- Lighthouse mobile > 90
- Navigation clavier
- Vérifier dans le HTML rendu qu'aucun `villeTransit` ne fuit
- Vérifier que la liaison France ↔ USA n'apparaît nulle part

---

## 8. Après la mise en ligne

**Google Business Profile — point de vigilance particulier.** Le local est partagé avec un autre opérateur du même secteur. Google peut fusionner ou suspendre deux fiches à la même adresse dans la même catégorie. Pour l'éviter :

- Complément d'adresse distinct (bâtiment, local, étage)
- Catégorie principale différente
- Numéro de téléphone propre
- Horaires renseignés séparément

**Search Console** : soumettre le sitemap, vérifier l'indexation des huit fiches destination.

**Formation de la cliente** : le back-office est conçu pour un usage debout, sur téléphone. Prévoir une session sur le module Réceptions et le module Créances — ce sont les deux qu'elle utilisera tous les jours.

---

## Récapitulatif des outils

| Outil | Usage | Coût |
|---|---|---|
| GitHub | Versioning et sauvegarde | Gratuit |
| Vercel | Hébergement Next.js | Gratuit (Hobby) |
| Neon | PostgreSQL, région Europe | Gratuit |
| Resend | E-mails automatiques | Gratuit jusqu'à 3 000/mois |
| Zoho Mail | Boîtes professionnelles | Gratuit jusqu'à 5 boîtes |
| OVH / Namecheap | Nom de domaine | ~15 €/an |
| Squoosh | Compression des images | Gratuit |

---

*di-eureka — [www.di-eureka.com](https://www.di-eureka.com)*
