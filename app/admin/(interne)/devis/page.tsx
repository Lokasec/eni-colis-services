import { exigerConnexion } from '@/lib/autorisation'
import { ModuleAVenir } from '../module-a-venir'

export const metadata = { title: 'Devis' }

export default async function Page() {
  // Accessible aux deux roles.
  await exigerConnexion()

  return (
    <ModuleAVenir
      titre={'Devis'}
      lot={'lot 8'}
      reserve={false}
      contenu={[
        'Demandes reçues du formulaire public, photos affichées en grand.',
        'Chiffrage assisté : le moteur propose un montant, la cliente le modifie librement.',
        'Envoi par e-mail et lien WhatsApp pré-rempli, relance, conversion en colis.',
      ]}
    />
  )
}
