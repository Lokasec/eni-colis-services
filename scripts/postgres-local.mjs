/**
 * PostgreSQL local, sans Docker.
 *
 * Le chemin documenté du projet est `docker-compose.yml`. Ce script en est
 * l'alternative pour une machine sans Docker : `embedded-postgres` télécharge
 * les binaires officiels de PostgreSQL et lance une instance sur le même
 * port 5433, avec les mêmes identifiants. Rien d'autre ne change — pas de
 * variante SQLite, pas de moteur différent : c'est le même PostgreSQL que
 * celui de la production.
 *
 *   node scripts/postgres-local.mjs        # démarre et reste au premier plan
 *   node scripts/postgres-local.mjs --raz  # repart d'une base vierge
 *
 * L'encodage est forcé en UTF-8 : sans lui, le seed échoue sur les emojis
 * de drapeaux des pays (constaté — l'encodage par défaut de Windows les
 * refuse).
 */
import EmbeddedPostgres from 'embedded-postgres'
import { rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DONNEES = resolve(RACINE, '.postgres-local')

const raz = process.argv.includes('--raz')
if (raz) {
  rmSync(DONNEES, { recursive: true, force: true })
  console.log('Données précédentes effacées.')
}

const pg = new EmbeddedPostgres({
  databaseDir: DONNEES,
  user: 'eni',
  password: 'eni',
  port: 5433,
  persistent: true,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
  onLog: () => {},
  onError: (erreur) => console.error('[postgres]', erreur),
})

await pg.initialise()
await pg.start()

try {
  await pg.createDatabase('eni_colis')
  console.log('Base « eni_colis » créée.')
} catch {
  console.log('Base « eni_colis » déjà présente.')
}

console.log('')
console.log('PostgreSQL écoute sur localhost:5433')
console.log('  DATABASE_URL="postgresql://eni:eni@localhost:5433/eni_colis?schema=public"')
console.log('  Ctrl+C pour arrêter.')

const arreter = async () => {
  console.log('\nArrêt de PostgreSQL…')
  await pg.stop()
  process.exit(0)
}
process.on('SIGINT', arreter)
process.on('SIGTERM', arreter)
