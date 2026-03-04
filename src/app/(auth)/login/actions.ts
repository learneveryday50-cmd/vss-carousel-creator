'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ActionState = { error?: string } | null

export async function signInAction(_prevState: ActionState, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  // Check if user has a brand to determine redirect
  const { data: brand } = await supabase.from('brands').select('id').single()
  redirect(brand ? '/dashboard' : '/onboarding')
}
