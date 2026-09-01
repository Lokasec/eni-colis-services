/* GÉNÉRÉ PAR scripts/build-brand.mjs — NE PAS ÉDITER À LA MAIN.
   Source : design/tokens.json — régénérer avec `npm run brand`. */

export const brandColors = {
  "navy": "#0C335E",
  "navy-dark": "#08243F",
  "orange": "#F18321",
  "orange-dark": "#D96F12",
  "sand": "#FDF3E7",
  "sand-deep": "#F8E7D2",
  "white": "#FFFFFF",
  "line": "#E6D9C8",
  "line-strong": "#D4C2AC",
  "ink": "#111111",
  "ink-soft": "#4A4A4A",
  "muted": "#8A7B6A",
  "on-navy": "#FFFFFF",
  "on-orange": "#FFFFFF",
  "status-devis-nouveau-bg": "#FDF3E7",
  "status-devis-nouveau-fg": "#B26A15",
  "status-devis-chiffre-bg": "#E7EFF7",
  "status-devis-chiffre-fg": "#0C335E",
  "status-en-transit-bg": "#FBF0DC",
  "status-en-transit-fg": "#B8860B",
  "status-arrive-bg": "#EAF1E9",
  "status-arrive-fg": "#4A6B3F",
  "status-disponible-bg": "#E3F3EA",
  "status-disponible-fg": "#1F7A55",
  "status-retire-bg": "#F0EBE4",
  "status-retire-fg": "#7A6E60",
  "status-litige-bg": "#FBE9E7",
  "status-litige-fg": "#B03A2B",
  "status-complet-bg": "#F4E4E2",
  "status-complet-fg": "#9C3A2C",
  "success": "#1F7A55",
  "warning": "#B8860B",
  "error": "#B03A2B",
  "info": "#0C335E"
} as const

export const brandRadius = {
  "sm": "8px",
  "md": "12px",
  "lg": "16px",
  "xl": "24px",
  "pill": "999px"
} as const

export const brandShadow = {
  "sm": "0 1px 2px rgba(12, 51, 94, 0.06)",
  "md": "0 4px 12px rgba(12, 51, 94, 0.08)",
  "lg": "0 12px 32px rgba(12, 51, 94, 0.10)"
} as const

export const brandTypeScale = {
  "display": {
    "size": "clamp(2.25rem, 5vw, 3.5rem)",
    "weight": 800,
    "lineHeight": 1.08,
    "tracking": "-0.02em"
  },
  "h1": {
    "size": "clamp(1.875rem, 4vw, 2.75rem)",
    "weight": 800,
    "lineHeight": 1.15,
    "tracking": "-0.015em"
  },
  "h2": {
    "size": "clamp(1.5rem, 3vw, 2rem)",
    "weight": 700,
    "lineHeight": 1.2,
    "tracking": "-0.01em"
  },
  "h3": {
    "size": "1.25rem",
    "weight": 700,
    "lineHeight": 1.3
  },
  "eyebrow": {
    "size": "0.8125rem",
    "weight": 600,
    "lineHeight": 1.2,
    "tracking": "0.12em",
    "transform": "uppercase"
  },
  "bodyLg": {
    "size": "1.125rem",
    "weight": 400,
    "lineHeight": 1.65
  },
  "body": {
    "size": "1rem",
    "weight": 400,
    "lineHeight": 1.6
  },
  "bodySm": {
    "size": "0.9375rem",
    "weight": 400,
    "lineHeight": 1.55
  },
  "caption": {
    "size": "0.8125rem",
    "weight": 500,
    "lineHeight": 1.45
  },
  "button": {
    "size": "1rem",
    "weight": 600,
    "lineHeight": 1,
    "tracking": "0.01em"
  }
} as const

export const brandLogos = {
  "path": "/brand/",
  "files": {
    "horizontalCouleur": "eni-colis-services_logo-horizontal_couleur.svg",
    "horizontalFondSombre": "eni-colis-services_logo-horizontal_fond-sombre.svg",
    "horizontalBlanc": "eni-colis-services_logo-horizontal_monochrome-blanc.svg",
    "verticalCouleur": "eni-colis-services_logo-vertical_couleur.svg",
    "symboleCouleur": "eni-colis-services_symbole_couleur.svg",
    "symboleBlanc": "eni-colis-services_symbole_monochrome-blanc.svg"
  },
  "usage": {
    "header": "horizontalCouleur — fond sable ou blanc",
    "footer": "horizontalFondSombre — fond navy",
    "sidebarAdmin": "horizontalFondSombre",
    "recuPdf": "horizontalCouleur",
    "favicon": "généré depuis le symbole — fichiers fournis dans 03_Favicon-App",
    "marquageColis": "symboleCouleur"
  },
  "minWidthPx": {
    "horizontal": 120,
    "vertical": 90,
    "symbol": 24
  },
  "clearSpace": "X = hauteur des capitales ENI. Rien n'entre dans cette zone."
} as const

export type BrandColor = keyof typeof brandColors
