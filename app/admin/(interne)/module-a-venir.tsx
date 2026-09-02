import { Topbar } from '@/components/admin/topbar'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

/**
 * Rubrique dont l'interface arrive à un lot ultérieur.
 *
 * La page existe déjà pour une raison précise : les rubriques réservées
 * doivent être RÉELLEMENT inaccessibles à un opérateur, pas seulement
 * absentes du menu. Sans page, l'URL renverrait une 404 et on ne saurait
 * pas distinguer « n'existe pas » de « interdit ».
 */
export function ModuleAVenir({
  titre,
  lot,
  reserve,
  contenu,
}: {
  titre: string
  lot: string
  reserve: boolean
  contenu: string[]
}) {
  return (
    <>
      <Topbar
        titre={titre}
        sousTitre={reserve ? 'Rubrique réservée aux administrateurs' : undefined}
      />
      <div className="max-w-[720px] space-y-5 p-4 md:p-6">
        {reserve ? (
          <p>
            <Badge tone="devisChiffre">Accès administrateur</Badge>
          </p>
        ) : null}

        <Alert>
          <b>Interface prévue au {lot}.</b> Les données correspondantes sont déjà en base et le
          contrôle d&apos;accès est actif.
        </Alert>

        <div className="border-line rounded-lg border bg-white p-5">
          <h2 className="text-h3 mb-3">Ce que cette rubrique contiendra</h2>
          <ul className="text-body-sm text-ink-soft list-disc space-y-1.5 pl-5">
            {contenu.map((ligne) => (
              <li key={ligne}>{ligne}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
