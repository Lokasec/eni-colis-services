'use client'

import { useState } from 'react'
import { Modal } from '@/components/admin/modal'
import { StatusSelect } from '@/components/admin/status-select'
import { ToastProvider, useToast } from '@/components/admin/toast'
import { RadioCards } from '@/components/form/radio-cards'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import type { StatutColis } from '@/lib/statuts'

export function DemoModal() {
  const [ouvert, setOuvert] = useState(false)
  return (
    <>
      <Button onClick={() => setOuvert(true)}>Ouvrir la modale</Button>
      <Modal
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        titre="Rattacher le colis à un client"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setOuvert(false)}>
              Annuler
            </Button>
            <Button size="sm" onClick={() => setOuvert(false)}>
              Rattacher
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-ink-soft">
          Échap ferme, le focus est piégé dans la fenêtre et l&apos;arrière-plan devient inerte :
          comportements fournis par l&apos;élément <code>&lt;dialog&gt;</code> natif.
        </p>
      </Modal>
    </>
  )
}

function BoutonsToast() {
  const toast = useToast()
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => toast('succes', 'Colis ENI-2026-00123 enregistré.')}>
        Succès
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => toast('erreur', 'Le poids réel est obligatoire.')}
      >
        Erreur
      </Button>
      <Button size="sm" variant="outline" onClick={() => toast('info', 'Devis envoyé au client.')}>
        Info
      </Button>
    </div>
  )
}

export function DemoToast() {
  return (
    <ToastProvider>
      <BoutonsToast />
    </ToastProvider>
  )
}

export function DemoStatusSelect() {
  const [statut, setStatut] = useState<StatutColis>('EN_TRANSIT')
  return <StatusSelect id="demo-statut" valeur={statut} onChange={setStatut} />
}

export function DemoRadioCards() {
  const [nature, setNature] = useState('standard')
  return (
    <>
      <RadioCards
        name="demo-nature"
        legend="Nature du colis"
        defaultValue="standard"
        onChange={setNature}
        options={[
          {
            value: 'standard',
            titre: 'Colis ordinaire',
            description: 'Vêtements, denrées, effets personnels.',
          },
          {
            value: 'piece',
            titre: 'Pièce détachée',
            description: 'Automobile, mécanique, industrielle.',
          },
          {
            value: 'electronique',
            titre: 'Matériel électronique',
            description: 'Téléphone, ordinateur, téléviseur.',
          },
          {
            value: 'valeur',
            titre: 'Article de valeur',
            description: 'Justificatif d’achat demandé.',
          },
        ]}
      />
      {nature === 'electronique' ? (
        <Alert tone="warn">
          <b>Le matériel électronique est tarifé à l’unité.</b> Nous devons voir l’appareil avant de
          chiffrer : joignez des photos, nous revenons vers vous sous 24 heures.
        </Alert>
      ) : null}
      {nature === 'valeur' ? (
        <Alert>
          <b>Justificatif d’achat obligatoire.</b> Facture ou ticket de caisse, à présenter au
          dépôt.
        </Alert>
      ) : null}
    </>
  )
}
