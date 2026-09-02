#!/usr/bin/env node
/**
 * build-brand.mjs — ENI Colis Services
 *
 * Source unique : design/tokens.json
 * Sorties       : app/styles/tokens.css      (variables CSS + thème Tailwind v4)
 *                 design/tokens.generated.ts (mêmes valeurs, typées, pour le JS/PDF)
 *
 * Aucune couleur, aucun rayon, aucune ombre ne doit être écrit ailleurs.
 * Régénérer avec `npm run brand` (exécuté automatiquement avant dev et build).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = resolve(ROOT, 'design/tokens.json')
const OUT_CSS = resolve(ROOT, 'app/styles/tokens.css')
const OUT_TS = resolve(ROOT, 'design/tokens.generated.ts')
const LOGO_SVG = resolve(ROOT, 'public/brand/logo-horizontal_couleur.svg')

/**
 * Extraction des tracés du logo horizontal.
 *
 * Le SVG n'est fait que de <path> à fond plat — ni dégradé, ni texte, ni
 * masque. C'est ce qui rend l'extraction sûre : si un jour le logo gagnait
 * un dégradé, le rendu PDF le perdrait silencieusement, d'où le contrôle
 * ci-dessous qui préfère échouer.
 */
function lireLogo() {
  const svg = readFileSync(LOGO_SVG, 'utf8')

  const balisesInterdites = ['linearGradient', 'radialGradient', 'mask', 'text', 'image', 'use']
  const trouvee = balisesInterdites.find((balise) => svg.includes(`<${balise}`))
  if (trouvee) {
    throw new Error(
      `Le logo contient <${trouvee}>, que le rendu PDF ne sait pas reproduire. ` +
        `Fournissez une version aplatie, ou adaptez lib/pdf/logo.tsx.`,
    )
  }

  const viewBox = (svg.match(/viewBox="([^"]+)"/) ?? [])[1]
  if (!viewBox) throw new Error('Le logo n’a pas de viewBox : impossible de le mettre à l’échelle.')

  const paths = [...svg.matchAll(/<path[^>]*\sfill="([^"]+)"[^>]*\sd="([^"]+)"[^>]*>/g)].map(
    ([, fill, d]) => ({ fill, d }),
  )
  if (paths.length === 0) throw new Error('Aucun tracé trouvé dans le logo.')

  return { viewBox, paths }
}

const { viewBox: logoViewBox, paths: logoPaths } = lireLogo()

const BANNER = `/* GÉNÉRÉ PAR scripts/build-brand.mjs — NE PAS ÉDITER À LA MAIN.
   Source : design/tokens.json — régénérer avec \`npm run brand\`. */`

/** camelCase / PascalCase -> kebab-case */
const kebab = (s) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()

const tokens = JSON.parse(readFileSync(SOURCE, 'utf8'))

/* ------------------------------------------------------------------ */
/* Couleurs                                                            */
/* ------------------------------------------------------------------ */

/** @type {Array<[string, string]>} */
const colors = []

for (const [name, token] of Object.entries(tokens.color.brand)) {
  colors.push([kebab(name), token.value])
}
for (const [name, token] of Object.entries(tokens.color.surface)) {
  colors.push([kebab(name), token.value])
}
for (const [name, token] of Object.entries(tokens.color.text)) {
  colors.push([kebab(name), token.value])
}
for (const [name, token] of Object.entries(tokens.color.status)) {
  colors.push([`status-${kebab(name)}-bg`, token.bg])
  colors.push([`status-${kebab(name)}-fg`, token.fg])
}
for (const [name, token] of Object.entries(tokens.color.feedback)) {
  colors.push([kebab(name), token.value])
}

/* ------------------------------------------------------------------ */
/* Typographie                                                         */
/* ------------------------------------------------------------------ */

const fontStack = (primary) => `${primary}, ${tokens.font.family.fallback.value}`

/** Échelle typographique : Tailwind v4 lit les sous-propriétés `--text-x--*`. */
const textScale = Object.entries(tokens.font.scale).map(([name, spec]) => ({
  name: kebab(name),
  size: spec.size,
  weight: spec.weight,
  lineHeight: spec.lineHeight,
  tracking: spec.tracking,
  transform: spec.transform,
}))

/* ------------------------------------------------------------------ */
/* CSS                                                                 */
/* ------------------------------------------------------------------ */

const lines = []
lines.push(BANNER, '')
lines.push('@theme {')

lines.push('  /* --- couleurs : la palette par défaut de Tailwind est neutralisée, */')
lines.push('  /*     seuls les tokens de la marque restent disponibles.           */')
lines.push('  --color-*: initial;')
lines.push('  --color-transparent: transparent;')
lines.push('  --color-current: currentColor;')
lines.push('  --color-inherit: inherit;')
for (const [name, value] of colors) {
  lines.push(`  --color-${name}: ${value};`)
}

lines.push('')
lines.push('  /* --- familles typographiques (Montserrat auto-hébergée via next/font) */')
lines.push(`  --font-sans: var(--font-montserrat), ${fontStack(tokens.font.family.body.value)};`)
lines.push(`  --font-body: var(--font-montserrat), ${fontStack(tokens.font.family.body.value)};`)
lines.push(`  --font-title: var(--font-montserrat), ${fontStack(tokens.font.family.title.value)};`)

lines.push('')
lines.push('  /* --- échelle typographique */')
for (const t of textScale) {
  lines.push(`  --text-${t.name}: ${t.size};`)
  if (t.lineHeight !== undefined) lines.push(`  --text-${t.name}--line-height: ${t.lineHeight};`)
  if (t.weight !== undefined) lines.push(`  --text-${t.name}--font-weight: ${t.weight};`)
  if (t.tracking !== undefined) lines.push(`  --text-${t.name}--letter-spacing: ${t.tracking};`)
}

lines.push('')
lines.push('  /* --- rayons */')
for (const [name, value] of Object.entries(tokens.radius)) {
  if (name === 'role') continue
  lines.push(`  --radius-${kebab(name)}: ${value};`)
}

lines.push('')
lines.push('  /* --- ombres (teintées navy, jamais de noir pur) */')
for (const [name, value] of Object.entries(tokens.shadow)) {
  if (name === 'role') continue
  lines.push(`  --shadow-${kebab(name)}: ${value};`)
}

lines.push('')
lines.push('  /* --- mouvement */')
lines.push(`  --ease-brand: ${tokens.motion.easing};`)
for (const name of ['fast', 'base', 'slow']) {
  lines.push(`  --duration-${name}: ${tokens.motion[name]};`)
}

lines.push('')
lines.push('  /* --- points de rupture propres au projet */')
for (const [name, token] of Object.entries(tokens.breakpoint ?? {})) {
  lines.push(`  --breakpoint-${kebab(name)}: ${token.value};`)
}

lines.push('')
lines.push('  /* --- gabarit */')
lines.push(`  --container-page: ${tokens.space.container.max};`)
lines.push('}')

lines.push('')
lines.push(':root {')
lines.push('  /* Valeurs non traduisibles en utilitaire Tailwind, exposées en CSS pur. */')
lines.push(`  --gutter: ${tokens.space.container.gutterMobile};`)
lines.push(`  --section-y: ${tokens.space.section.mobile};`)
lines.push(`  --touch-min: ${tokens.touch.minTarget};`)
lines.push(`  --eyebrow-transform: ${tokens.font.scale.eyebrow.transform};`)
lines.push('}')
lines.push('')
lines.push('@media (min-width: 900px) {')
lines.push('  :root {')
lines.push(`    --gutter: ${tokens.space.container.gutterDesktop};`)
lines.push(`    --section-y: ${tokens.space.section.desktop};`)
lines.push('  }')
lines.push('}')
lines.push('')

mkdirSync(dirname(OUT_CSS), { recursive: true })
writeFileSync(OUT_CSS, lines.join('\n'), 'utf8')

/* ------------------------------------------------------------------ */
/* TypeScript — mêmes valeurs, pour le code qui ne passe pas par le CSS */
/* (rendu PDF @react-pdf/renderer, e-mails, canvas…)                    */
/* ------------------------------------------------------------------ */

const ts = `${BANNER}

export const brandColors = ${JSON.stringify(Object.fromEntries(colors), null, 2)} as const

export const brandRadius = ${JSON.stringify(
  Object.fromEntries(Object.entries(tokens.radius).filter(([k]) => k !== 'role')),
  null,
  2,
)} as const

export const brandShadow = ${JSON.stringify(
  Object.fromEntries(Object.entries(tokens.shadow).filter(([k]) => k !== 'role')),
  null,
  2,
)} as const

export const brandTypeScale = ${JSON.stringify(tokens.font.scale, null, 2)} as const

export const brandLogos = ${JSON.stringify(tokens.logo, null, 2)} as const

/**
 * Tracés du logo horizontal, extraits du SVG.
 *
 * Les PDF sont composés par @react-pdf/renderer, qui ne sait pas lire un
 * fichier .svg : il attend des <Path> décrits un par un. Les extraire ici
 * évite deux écueils — une lecture de fichier à chaque génération, et un
 * logo redessiné à la main qui divergerait de la source.
 *
 * Régénéré par \`npm run brand\`, comme les couleurs.
 */
export const brandLogoPaths = ${JSON.stringify(logoPaths, null, 2)} as const

export const brandLogoViewBox = ${JSON.stringify(logoViewBox)} as const

export type BrandColor = keyof typeof brandColors
`

writeFileSync(OUT_TS, ts, 'utf8')

const count = colors.length
console.log(
  `✓ npm run brand — ${count} couleurs, ${textScale.length} niveaux typographiques, ${logoPaths.length} tracés de logo`,
)
console.log(`  → ${OUT_CSS.replace(ROOT, '.')}`)
console.log(`  → ${OUT_TS.replace(ROOT, '.')}`)
