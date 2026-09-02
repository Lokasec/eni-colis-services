import { exigerAdmin } from '@/lib/autorisation'
import { ModuleAVenir } from '../module-a-venir'

export const metadata = { title: 'Tarifs' }

export default async function Page() {
  // Rubrique reservee : un OPERATEUR est redirige, meme s'il tape l'URL.
  await exigerAdmin()

  return (
    <ModuleAVenir
      titre={'Tarifs'}
      lot={'lot 8'}
      reserve={true}
      contenu={[
        'Prix au kilo par liaison et par sens — chaque liaison est orientée.',
        "Catégories d'articles et leurs modes de calcul.",
        'Paramètres de poids facturé : arrondi, minimum, poids volumétrique.',
      ]}
    />
  )
}
