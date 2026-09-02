import { exigerAdmin } from '@/lib/autorisation'
import { ModuleAVenir } from '../module-a-venir'

export const metadata = { title: 'Créances' }

export default async function Page() {
  // Rubrique reservee : un OPERATEUR est redirige, meme s'il tape l'URL.
  await exigerAdmin()

  return (
    <ModuleAVenir
      titre={'Créances'}
      lot={'lot 8'}
      reserve={true}
      contenu={[
        'Colis partis et non payés, avec le montant dû en euros et en devise locale.',
        'Ancienneté depuis le départ effectif, et total des créances.',
        'Relances, et suivi des colis non retirés.',
      ]}
    />
  )
}
