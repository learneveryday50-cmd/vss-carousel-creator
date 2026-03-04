import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getBrands } from '@/lib/supabase/brands'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

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

  const brands = await getBrands()

  const cookieStore = await cookies()
  const cookieBrandId = cookieStore.get('selected_brand_id')?.value

  // Resolve selected brand: use cookie value if it matches a real brand, else fall back to first
  const selectedBrandId =
    brands.find((b) => b.id === cookieBrandId)?.id ?? brands[0]?.id ?? null

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          brands={brands}
          selectedBrandId={selectedBrandId}
          userEmail={user.email}
        />
        <main className="flex-1 p-6 bg-zinc-50 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
