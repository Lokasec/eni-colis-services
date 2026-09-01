import Image from 'next/image'

/**
 * Page d'attente du lot 1 — infrastructure uniquement.
 * L'accueil réel est construit au lot 5, d'après docs/maquette/index.html
 * et les textes validés de docs/contenus-pages.md.
 */
export default function Page() {
  return (
    <main className="max-w-page mx-auto w-full px-[var(--gutter)] py-[var(--section-y)]">
      <Image
        src="/brand/logo-horizontal_couleur.svg"
        alt="ENI Colis Services"
        width={220}
        height={56}
        priority
      />

      <p className="text-eyebrow text-orange mt-10 uppercase">Lot 1 — Infrastructure</p>
      <h1 className="text-h1 mt-3">Le socle technique est en place.</h1>
      <p className="text-body-lg text-ink-soft mt-4 max-w-xl">
        Next.js, TypeScript strict, Tailwind alimenté par <code>design/tokens.json</code>,
        Montserrat auto-hébergée, Prisma et next-intl. Aucune page métier n&apos;est encore
        construite.
      </p>

      <div className="border-line bg-sand mt-10 rounded-lg border p-6">
        <h2 className="text-h3">Vérification des tokens</h2>
        <p className="text-body-sm text-ink-soft mt-2">
          Ces aplats sont lus depuis les variables générées. Si une couleur manque, c&apos;est que{' '}
          <code>npm run brand</code> n&apos;a pas tourné.
        </p>
        <ul className="mt-5 flex flex-wrap gap-3">
          {(
            [
              ['navy', 'bg-navy'],
              ['orange', 'bg-orange'],
              ['sand', 'bg-sand'],
              ['sand-deep', 'bg-sand-deep'],
              ['line', 'bg-line'],
              ['white', 'bg-white'],
            ] as const
          ).map(([name, className]) => (
            <li key={name} className="text-caption text-muted">
              <span
                className={`border-line block h-14 w-24 rounded-md border ${className}`}
                aria-hidden
              />
              <span className="mt-1 block">{name}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
