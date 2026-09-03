/**
 * Lecture défensive des variables d'environnement.
 *
 * `process.env.X ?? 'défaut'` ne se déclenche que si la variable est
 * ABSENTE. Une variable définie mais VIDE traverse le `??` et gagne : on
 * se retrouve avec une adresse d'expéditeur vide, ou une URL de site vide,
 * sans le moindre message d'erreur.
 *
 * Ce n'est pas théorique. Vercel crée automatiquement une variable pour
 * chaque clé trouvée dans `.env.example` à l'import d'un dépôt — treize
 * variables, toutes vides. Sans ce garde-fou, le premier déploiement
 * partait avec des valeurs vides là où le code croyait avoir ses défauts.
 *
 * La fonction prend la VALEUR, pas le nom. C'est délibéré : Next.js
 * remplace `process.env.NEXT_PUBLIC_X` par sa valeur au build, mais
 * seulement quand l'accès est écrit littéralement. Un `process.env[nom]`
 * dynamique ne serait jamais remplacé, et vaudrait `undefined` dans le
 * navigateur.
 */
export function renseignee(valeur: string | undefined): string | undefined {
  const propre = valeur?.trim()
  return propre === undefined || propre === '' ? undefined : propre
}
