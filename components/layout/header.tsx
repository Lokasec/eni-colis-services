'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { cn } from '@/lib/cn'
import { navPrincipale } from '@/lib/site'

/**
 * En-tête collant.
 *
 * Sous 1040 px (point de rupture `menu`), la navigation bascule en tiroir.
 * Le fond est blanc translucide : le blanc est la dominante, l'en-tête ne
 * doit pas introduire un aplat sable ou navy en haut de chaque page.
 */
export function Header() {
  const pathname = usePathname()
  const [ouvert, setOuvert] = useState(false)

  // Le tiroir se referme à chaque navigation.
  useEffect(() => {
    setOuvert(false)
  }, [pathname])

  const estActif = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="border-line sticky top-0 z-60 border-b bg-white/95 backdrop-blur-md backdrop-saturate-150">
      <Container className="flex min-h-[74px] items-center gap-4">
        <Link href="/" aria-label="ENI Colis Services — accueil" className="w-[168px] flex-none">
          <Image
            src="/brand/logo-horizontal_couleur.svg"
            alt="ENI Colis Services"
            width={168}
            height={74}
            priority
            className="h-auto w-full"
          />
        </Link>

        <nav
          aria-label="Navigation principale"
          className="menu:flex ml-auto hidden items-center gap-6.5"
        >
          {navPrincipale.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              aria-current={estActif(lien.href) ? 'page' : undefined}
              className={cn(
                'text-body-sm text-navy flex min-h-11 items-center border-b-2 font-semibold no-underline',
                'duration-base ease-brand hover:border-orange transition-colors',
                estActif(lien.href) ? 'border-orange' : 'border-transparent',
              )}
            >
              {lien.label}
            </Link>
          ))}
        </nav>

        <div className="menu:ml-6 menu:block ml-auto hidden">
          <Button href="/devis" size="sm">
            Demander un devis
          </Button>
        </div>

        <button
          type="button"
          aria-expanded={ouvert}
          aria-controls="menu-mobile"
          aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setOuvert((v) => !v)}
          className="border-navy menu:hidden ml-auto flex size-12 flex-none items-center justify-center rounded-sm border-2"
        >
          <span className="bg-navy before:bg-navy after:bg-navy relative block h-0.5 w-5 before:absolute before:-top-1.5 before:left-0 before:h-0.5 before:w-5 before:content-[''] after:absolute after:top-1.5 after:left-0 after:h-0.5 after:w-5 after:content-['']" />
        </button>
      </Container>

      {ouvert ? (
        <div
          id="menu-mobile"
          data-tone="white"
          className="border-line menu:hidden border-t bg-white"
        >
          <Container className="pt-3 pb-5.5">
            {navPrincipale.map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                aria-current={estActif(lien.href) ? 'page' : undefined}
                className="border-line text-navy block border-b py-3.5 font-semibold no-underline"
              >
                {lien.label}
              </Link>
            ))}
            <Button href="/devis" block className="mt-4.5">
              Demander un devis
            </Button>
          </Container>
        </div>
      ) : null}
    </header>
  )
}
