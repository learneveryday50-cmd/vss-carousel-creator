'use server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listRecords, AIRTABLE_TABLES } from '@/lib/airtable'

type ActionState = { error?: string } | null

export async function signInAction(_prevState: ActionState, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  const brands = await listRecords(AIRTABLE_TABLES.brands)
  redirect(brands.length > 0 ? '/dashboard' : '/onboarding')
}

export async function signInWithGoogleAction() {
  const supabase = await createClient()
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const origin = `${protocol}://${host}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error || !data.url) {
    const msg = encodeURIComponent(error?.message ?? 'Could not start Google sign-in.')
    redirect(`/login?error=${msg}`)
  }

  redirect(data.url)
}
