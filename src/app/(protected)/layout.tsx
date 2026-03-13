import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { listRecords, parseBrand, AIRTABLE_TABLES } from '@/lib/airtable'
import { AppShell } from '@/components/layout/app-shell'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let brands: ReturnType<typeof parseBrand>[] = []
  try {
    brands = (await listRecords(AIRTABLE_TABLES.brands)).map(parseBrand)
  } catch (err) {
    console.error('[layout] Airtable brands fetch failed:', err)
  }

  const cookieStore = await cookies()
  const cookieBrandId = cookieStore.get('selected_brand_id')?.value

  // Resolve selected brand: use cookie value if it matches a real brand, else fall back to first
  const selectedBrandId =
    brands.find((b) => b.id === cookieBrandId)?.id ?? brands[0]?.id ?? null

  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('plan, credits_remaining, credits_limit')
    .eq('user_id', user.id)
    .single()

  const creditData = {
    plan: (usage?.plan ?? 'free') as 'free' | 'pro',
    creditsRemaining: usage?.credits_remaining ?? 0,
    creditsLimit: usage?.credits_limit ?? 3,
  }

  return (
    <AppShell
      brands={brands}
      selectedBrandId={selectedBrandId}
      userEmail={user.email}
      creditData={creditData}
    >
      {children}
    </AppShell>
  )
}
