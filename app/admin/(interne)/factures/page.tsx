import { exigerAdmin } from '@/lib/autorisation'
import { ModuleAVenir } from '../module-a-venir'

export const metadata = { title: 'Factures' }

export default async function Page() {
  // Rubrique reservee : un OPERATEUR est redirige, meme s'il tape l'URL.
  await exigerAdmin()

  return (
    <ModuleAVenir
      titre={'Factures'}
      lot={'lot 8'}
      reserve={true}
      contenu={[
        "Émission d'une facture à partir d'un colis pesé, avec suggestion de montant modifiable.",
        'Numérotation continue et sans trou, garantie par la table des séquences.',
        "Double devise sur les factures émises à l'arrivée : euros et monnaie locale, au taux figé.",
        'Mention « TVA non applicable, art. 293 B du CGI » sur chaque document.',
        'Export comptable.',
      ]}
    />
  )
}
