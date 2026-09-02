import { exigerAdmin } from '@/lib/autorisation'
import { ModuleAVenir } from '../module-a-venir'

export const metadata = { title: 'Paramètres' }

export default async function Page() {
  // Rubrique reservee : un OPERATEUR est redirige, meme s'il tape l'URL.
  await exigerAdmin()

  return (
    <ModuleAVenir
      titre={'Paramètres'}
      lot={'lot 8'}
      reserve={true}
      contenu={[
        "Coordonnées de l'entreprise, telles qu'elles figurent sur les documents.",
        'Comptes utilisateurs et rôles.',
        "Délais de garde, frais et plafond d'indemnisation, une fois arbitrés.",
      ]}
    />
  )
}
