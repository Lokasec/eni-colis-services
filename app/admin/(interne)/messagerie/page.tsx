import { exigerConnexion } from '@/lib/autorisation'
import { ModuleAVenir } from '../module-a-venir'

export const metadata = { title: 'Messagerie' }

export default async function Page() {
  // Accessible aux deux roles.
  await exigerConnexion()

  return (
    <ModuleAVenir
      titre={'Messagerie'}
      lot={'lot 9'}
      reserve={false}
      contenu={[
        "Envoi groupé aux expéditeurs d'un même départ.",
        'Liste WhatsApp cliquable, avec messages pré-remplis.',
        'Modèles éditables et historique des envois.',
      ]}
    />
  )
}
