import { describe, expect, it } from 'vitest'
import { urlSuivi, whatsappLink } from './site'

/**
 * L'URL de suivi finit imprimée dans un QR code, sur un reçu papier remis
 * au client. Un QR imprimé ne se corrige pas : ces cas sont épinglés parce
 * qu'ils ne se rattrapent pas après coup.
 */
describe('URL de suivi', () => {
  it('pointe vers /suivi avec le code en paramètre', () => {
    expect(urlSuivi('ENI-2026-00104')).toMatch(/\/suivi\?code=ENI-2026-00104$/)
  })

  it('échappe un code qui contiendrait un caractère réservé', () => {
    // Le format normal n'en contient pas, mais une saisie manuelle en
    // back-office pourrait en produire : un « & » couperait l'URL en deux.
    expect(urlSuivi('ENI 2026&00104')).toMatch(/code=ENI%202026%2600104$/)
  })

  it('est absolue — un lien relatif serait mort dans un e-mail', () => {
    expect(urlSuivi('ENI-2026-00104')).toMatch(/^https?:\/\//)
  })
})

describe('Lien WhatsApp', () => {
  it('encode le message pré-rempli', () => {
    expect(whatsappLink('Bonjour & merci')).toContain('text=Bonjour%20%26%20merci')
  })
})
