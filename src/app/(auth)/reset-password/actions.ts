'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type RequestResetState = { error?: string; success?: boolean } | null
type UpdatePasswordState = { error?: string } | null

export async function requestPasswordResetAction(_prevState: RequestResetState, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get('email') as string,
    { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?type=recovery&next=/reset-password` }
  )
  if (error) return { error: error.message }
  return { success: true }
}

export async function updatePasswordAction(_prevState: UpdatePasswordState, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/dashboard')
}
