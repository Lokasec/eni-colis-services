import type { ReactNode } from 'react'

/**
 * Barre supérieure du back-office.
 *
 * Le back-office est utilisé debout, un colis dans les mains : le titre
 * et l'action principale restent visibles en permanence, et les cibles
 * font au moins 44 px.
 */
export function Topbar({
  titre,
  sousTitre,
  actions,
  menu,
}: {
  titre: string
  sousTitre?: ReactNode
  actions?: ReactNode
  menu?: ReactNode
}) {
  return (
    <header className="border-line sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md">
      <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-3 md:px-6">
        {menu}
        <div className="mr-auto min-w-0">
          <h1 className="text-h3 text-navy truncate">{titre}</h1>
          {sousTitre ? <p className="text-caption text-muted truncate">{sousTitre}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
