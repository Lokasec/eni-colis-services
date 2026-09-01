import { whatsappLink } from '@/lib/site'

/**
 * Bouton WhatsApp flottant.
 *
 * WhatsApp est le canal de contact principal de la clientèle visée.
 * Le vert est la couleur de marque du service : usage strictement
 * fonctionnel, jamais décoratif.
 *
 * L'icône blanche sur le vert #25D366 est un élément graphique
 * (seuil WCAG de 3:1, atteint) et non du texte.
 */
export function WhatsAppFloat({ message }: { message?: string }) {
  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Nous écrire sur WhatsApp"
      className="bg-whatsapp duration-base ease-brand fixed right-4.5 bottom-4.5 z-70 flex size-14.5 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-7 fill-white">
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.07-.79.37s-1.04 1.02-1.04 2.48 1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.53 0-3.03-.41-4.34-1.19l-.31-.18-3.23.85.86-3.15-.2-.32a8.2 8.2 0 01-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.24-8.23 8.24z" />
      </svg>
    </a>
  )
}
