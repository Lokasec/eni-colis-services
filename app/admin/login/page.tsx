import type { Metadata } from 'next'
import Image from 'next/image'
import { FormulaireConnexion } from './formulaire'

export const metadata: Metadata = {
  title: 'Connexion au back-office',
  robots: { index: false, follow: false },
}

export default async function Connexion({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>
}) {
  const { suite } = await searchParams

  return (
    <main className="bg-sand flex min-h-screen items-center justify-center px-[var(--gutter)] py-12">
      <div className="w-full max-w-[420px]">
        <Image
          src="/brand/logo-horizontal_couleur.svg"
          alt="ENI Colis Services"
          width={190}
          height={84}
          priority
          className="mx-auto mb-8 h-auto w-[190px]"
        />
        <FormulaireConnexion suite={suite ?? '/admin'} />
        <p className="text-caption text-muted mt-6 text-center">
          Espace réservé à l&apos;équipe d&apos;ENI Colis Services.
        </p>
      </div>
    </main>
  )
}
