import type { Prisma } from '@/lib/generated/prisma/client'

/**
 * Attribution des numéros de séquence.
 *
 * L'exigence comptable est une numérotation de factures CONTINUE ET SANS
 * TROU (CLAUDE.md §5.1). Le compteur est donc incrémenté DANS LA MÊME
 * TRANSACTION que la création du document : deux émissions simultanées ne
 * peuvent pas obtenir le même numéro, et un échec ne consomme pas de numéro.
 *
 * `update` sur une ligne unique pose un verrou de ligne : la seconde
 * transaction attend la première. C'est ce verrou qui fait la garantie.
 *
 * Ces fonctions s'appellent TOUJOURS depuis un `db.$transaction`.
 */

export type TypeSequence = 'DEVIS' | 'FACTURE' | 'COLIS' | 'DEMANDE' | 'DEPART' | 'CLIENT'

/** Client Prisma ou client transactionnel — les deux conviennent. */
type Executeur = Prisma.TransactionClient

/**
 * Renvoie le prochain rang de la séquence, et l'incrémente.
 * À n'appeler qu'à l'intérieur d'une transaction.
 */
export async function prochainRang(
  tx: Executeur,
  type: TypeSequence,
  annee: number,
): Promise<number> {
  const sequence = await tx.sequenceDocument.upsert({
    where: { type_annee: { type, annee } },
    create: { type, annee, dernierNumero: 1 },
    update: { dernierNumero: { increment: 1 } },
    select: { dernierNumero: true },
  })
  return sequence.dernierNumero
}

const PREFIXES: Record<TypeSequence, string> = {
  DEVIS: 'DEV',
  FACTURE: 'FAC',
  COLIS: 'ENI',
  DEMANDE: 'DEM',
  DEPART: 'DEP',
  CLIENT: 'ENI',
}

/** `DEM-2026-00042`, `ENI-2026-00123`, `FAC-2026-00007`… */
export async function prochainNumero(
  tx: Executeur,
  type: Exclude<TypeSequence, 'CLIENT'>,
  annee = new Date().getFullYear(),
): Promise<string> {
  const rang = await prochainRang(tx, type, annee)
  const largeur = type === 'DEPART' ? 4 : 5
  return `${PREFIXES[type]}-${annee}-${String(rang).padStart(largeur, '0')}`
}

/**
 * Identifiant client, au format imposé par la cliente.
 *
 * Deux formes coexistent, et c'est voulu :
 *  - `numeroClient` — ENI-AK-0042, l'identifiant complet en base ;
 *  - `nomLivraison` — « Eni Aïcha 42 », ce que le client saisit dans le
 *    champ « Nom » de ses commandes. C'est CE format qui est imposé et qui
 *    ne doit pas être modifié (CLAUDE.md §1.2).
 *
 * Le numéro séquentiel évite la collision entre deux clients de même prénom.
 */
export async function prochainIdentifiantClient(
  tx: Executeur,
  prenom: string,
  nom: string,
  annee = new Date().getFullYear(),
): Promise<{ numeroClient: string; nomLivraison: string; sequence: number }> {
  const sequence = await prochainRang(tx, 'CLIENT', annee)
  const initiales = `${premiereLettre(prenom)}${premiereLettre(nom)}`

  return {
    numeroClient: `ENI-${initiales}-${String(sequence).padStart(4, '0')}`,
    nomLivraison: `Eni ${prenom} ${sequence}`,
    sequence,
  }
}

/** Première lettre utile, accents retirés — « Émile » donne E. */
function premiereLettre(mot: string): string {
  const nettoye = mot
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z]/g, '')
  return (nettoye[0] ?? 'X').toUpperCase()
}
