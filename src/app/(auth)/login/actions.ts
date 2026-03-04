'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signInAction(formData: FormData) {
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
