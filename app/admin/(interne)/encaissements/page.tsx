import { exigerAdmin } from '@/lib/autorisation'
import { ModuleAVenir } from '../module-a-venir'

export const metadata = { title: 'Encaissements' }

export default async function Page() {
  // Rubrique reservee : un OPERATEUR est redirige, meme s'il tape l'URL.
  await exigerAdmin()

  return (
    <ModuleAVenir
      titre={'Encaissements'}
      lot={'lot 8'}
      reserve={true}
      contenu={[
        "Saisie d'un règlement : montant, devise, moyen de paiement.",
        "Lieu d'encaissement — France ou Abidjan.",
        'Rapprochement avec la facture correspondante.',
      ]}
    />
  )
}
