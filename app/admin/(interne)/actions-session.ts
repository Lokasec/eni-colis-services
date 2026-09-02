'use server'

import { signOut } from '@/auth'

export async function seDeconnecter() {
  await signOut({ redirectTo: '/admin/login' })
}
