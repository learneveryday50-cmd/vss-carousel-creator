'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ActionState = { error?: string } | null

export async function signUpAction(_prevState: ActionState, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?type=email&next=/onboarding`,
    },
  })
  if (error) return { error: error.message }
  redirect('/verify-email')
}
