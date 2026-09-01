import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { navInformations, navLegal, site, type NavLink } from '@/lib/site'

/**
 * Pied de page navy — l'un des blocs pleine largeur où le navy est
 * autorisé (design/tokens.json §rules.dominante).
 *
 * La colonne « Destinations » est alimentée par le parent : au lot 5 elle
 * lira les liaisons publiques en base. Ne jamais y faire figurer
 * France ↔ USA (afficheePubliquement = false).
 */
export function Footer({ destinations = [] }: { destinations?: NavLink[] }) {
  return (
    <footer data-tone="navy" className="bg-navy-dark text-body-sm pt-13 pb-6.5 text-white/70">
      <Container>
        <div className="grid gap-8.5 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/brand/logo-horizontal_fond-sombre.svg"
              alt="ENI Colis Services"
              width={180}
              height={80}
              className="mb-4 h-auto w-[180px]"
            />
            <p className="max-w-[280px] leading-relaxed">
              {site.baseline}
              <br />
              <br />
              {site.adresse.rue}
              <br />
              {site.adresse.codePostal} {site.adresse.ville}
              <br />
              {site.telephone}
            </p>
          </div>

          {destinations.length > 0 ? (
            <FooterColonne titre="Destinations" liens={destinations} />
          ) : null}
          <FooterColonne titre="Informations" liens={navInformations} />
          <FooterColonne titre="Légal" liens={navLegal} />
        </div>

        <div className="mt-10 flex flex-wrap justify-between gap-2.5 border-t border-white/12 pt-5.5 text-[0.875rem]">
          <span>© {new Date().getFullYear()} ENI Colis Services. Tous droits réservés.</span>
          <span>
            Conçu par{' '}
            <a
              href={site.concepteur.url}
              className="text-orange no-underline hover:underline"
              rel="noopener"
            >
              {site.concepteur.nom}
            </a>
          </span>
        </div>
      </Container>
    </footer>
  )
}

function FooterColonne({ titre, liens }: { titre: string; liens: NavLink[] }) {
  return (
    <div>
      <h2 className="text-caption text-on-navy mb-4 font-bold tracking-[0.1em] uppercase">
        {titre}
      </h2>
      <ul className="m-0 list-none p-0">
        {liens.map((lien) => (
          <li key={lien.href}>
            <Link
              href={lien.href}
              className="duration-base ease-brand hover:text-orange inline-flex min-h-11 items-center text-white/70 no-underline transition-colors"
            >
              {lien.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
