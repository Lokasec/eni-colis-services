/**
 * Formatage des dates, en français, sur le fuseau du bureau français.
 *
 * Le fuseau est fixé explicitement : le site est consulté depuis Abidjan,
 * Dakar ou New York, et une date de clôture de dépôt doit désigner le même
 * jour pour tout le monde.
 */
const FUSEAU = 'Europe/Paris'

const jourCourt = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: FUSEAU,
})

const jourLong = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: FUSEAU,
})

const jourEtHeure = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: FUSEAU,
})

/** « jeu. 4 sept. » — pour les tableaux de départs. */
export const formaterJourCourt = (date: Date) => jourCourt.format(date)

/** « 4 septembre 2026 » — pour le corps de texte. */
export const formaterJourLong = (date: Date) => jourLong.format(date)

/** « 4 septembre 2026, 07:40 » — pour la frise de suivi. */
export const formaterJourEtHeure = (date: Date) => jourEtHeure.format(date)

/** Nombre de jours entiers écoulés depuis une date. */
export function joursDepuis(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000)
}
