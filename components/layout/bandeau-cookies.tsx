'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const CLE = 'eni-cookies-vu'

/**
 * Bandeau cookies — une INFORMATION, pas une demande de consentement.
 *
 * Le site ne dépose aucun traceur : pas d'analytique, pas de régie, pas de
 * pixel, aucun script tiers. Le seul cookie est celui de session du
 * back-office, strictement nécessaire à l'authentification.
 *
 * La directive ePrivacy n'exige de consentement que pour les cookies NON
 * nécessaires. Afficher deux boutons « Accepter / Refuser » pour un site
 * qui ne dépose rien serait un faux choix : le visiteur croirait arbitrer
 * quelque chose qui n'existe pas, et cliquer « Refuser » ne changerait
 * rien. Ce bandeau informe et se ferme, c'est tout.
 *
 * Le jour où une mesure d'audience est ajoutée, ce composant devra devenir
 * un vrai gestionnaire de consentement — avec dépôt CONDITIONNÉ au clic.
 */
export function BandeauCookies() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Rendu après montage, jamais au serveur : sinon le bandeau
    // clignoterait chez ceux qui l'ont déjà fermé.
    try {
      if (window.localStorage.getItem(CLE) !== '1') setVisible(true)
    } catch {
      // Navigation privée ou stockage bloqué : on informe quand même.
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  function fermer() {
    try {
      window.localStorage.setItem(CLE, '1')
    } catch {
      /* stockage indisponible : le bandeau réapparaîtra, sans dommage */
    }
    setVisible(false)
  }

  return (
    <div
      role="region"
      aria-label="Information sur les cookies"
      className="border-line fixed right-3 bottom-3 left-3 z-50 rounded-lg border bg-white p-4 shadow-lg sm:right-4 sm:bottom-4 sm:left-auto sm:max-w-md"
    >
      <p className="text-body-sm text-ink-soft m-0">
        <b className="text-navy">Ce site ne vous piste pas.</b> Aucun traceur, aucune mesure
        d&apos;audience, aucun script tiers. Le seul cookie déposé est celui de connexion à
        l&apos;espace de gestion, indispensable à son fonctionnement.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={fermer}
          className="bg-orange text-navy text-body-sm rounded-pill hover:bg-orange-dark min-h-11 px-5 font-semibold"
        >
          J&apos;ai compris
        </button>
        <Link href="/legal/cookies" className="text-caption text-navy font-semibold">
          En savoir plus
        </Link>
      </div>
    </div>
  )
}
