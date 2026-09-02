import { exigerAdmin } from '@/lib/autorisation'
import { ModuleAVenir } from '../module-a-venir'

export const metadata = { title: 'Destinations' }

export default async function Page() {
  // Rubrique reservee : un OPERATEUR est redirige, meme s'il tape l'URL.
  await exigerAdmin()

  return (
    <ModuleAVenir
      titre={'Destinations'}
      lot={'lot 8'}
      reserve={true}
      contenu={[
        'Pays, villes et points de retrait.',
        'Hub de transit par liaison — donnée interne, jamais publiée.',
        'Taux de change manuels pour les devises flottantes.',
      ]}
    />
  )
}
