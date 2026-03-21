import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { listRecords, parseBrand, AIRTABLE_TABLES } from '@/lib/airtable'
import { PageWrapper } from '@/components/layout/page-wrapper'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  const cookieBrandId = cookieStore.get('selected_brand_id')?.value

  const [brandRecords, templateRecords, designStyleRecords] = await Promise.all([
    listRecords(AIRTABLE_TABLES.brands).catch(() => []),
    listRecords(AIRTABLE_TABLES.templates).catch(() => []),
    listRecords(AIRTABLE_TABLES.designStyles).catch(() => []),
  ])

  const brands = brandRecords.map(parseBrand)
  const activeBrand =
    brands.find((b) => b.id === cookieBrandId) ?? brands[0] ?? null

  const recentResult = user && activeBrand
    ? await supabase
        .from('carousels')
        .select('id, idea_text, slide_urls, created_at, brand_name')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .eq('brand_name', activeBrand.name)
        .order('created_at', { ascending: false })
        .limit(3)
    : { data: [] }

  const recentCarousels = (recentResult as { data: { id: string; idea_text: string; slide_urls: string[] | null; created_at: string }[] | null }).data ?? []

  const displayName = user?.email?.split('@')[0] ?? 'there'

  if (!activeBrand) {
    return (
      <PageWrapper>
      <div className="max-w-lg mx-auto mt-12">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2v18M2 11h18" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Set up your brand first</h2>
          <p className="text-gray-500 text-sm mb-6">
            You need at least one brand before you can use the dashboard.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Create a brand &rarr;
          </Link>
        </div>
      </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
    <div className="max-w-4xl space-y-8">

      {/* Heading */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-1">Dashboard</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Welcome back, <span className="text-amber-600">{displayName}</span>
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Your brand is set up. Ready to create.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1 — Active Brand */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3 xl:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Active brand</p>
          <div className="flex items-center gap-2.5">
            <span
              className="w-5 h-5 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
              style={{ backgroundColor: activeBrand.primaryColor }}
            />
            <span className="font-bold text-xl text-gray-900 truncate">{activeBrand.name}</span>
          </div>
          <Link
            href={`/settings/brand/${activeBrand.id}/edit`}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium"
          >
            Edit brand &rarr;
          </Link>
        </div>

        {/* Card 2 — Templates */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Templates</p>
          <p className="font-bold text-2xl text-gray-900">{templateRecords.length}</p>
          <Link href="/templates" className="text-xs text-amber-600 hover:text-amber-700 font-medium">
            Browse &rarr;
          </Link>
        </div>

        {/* Card 3 — Design Styles */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Design styles</p>
          <p className="font-bold text-2xl text-gray-900">{designStyleRecords.length}</p>
          <Link href="/templates" className="text-xs text-amber-600 hover:text-amber-700 font-medium">
            Browse &rarr;
          </Link>
        </div>

      </div>

      {/* Recent Carousels */}
      {recentCarousels.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Recent — {activeBrand.name}
            </p>
            <Link href="/history" className="text-xs text-amber-600 hover:text-amber-700 font-medium">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {recentCarousels.map((c) => {
              const thumb = Array.isArray(c.slide_urls) ? c.slide_urls[0] : null
              const date = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              return (
                <Link key={c.id} href="/history" className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:border-amber-300 hover:shadow-md transition-all">
                  <div className="aspect-video bg-gray-50 overflow-hidden">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="9" height="9" rx="1.5" fill="currentColor" opacity=".4"/><rect x="13" y="2" width="9" height="9" rx="1.5" fill="currentColor" opacity=".4"/><rect x="2" y="13" width="9" height="9" rx="1.5" fill="currentColor" opacity=".4"/><rect x="13" y="13" width="9" height="9" rx="1.5" fill="currentColor" opacity=".4"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-900 line-clamp-1">{c.idea_text}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{date}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* CTA Block */}
      <div className="rounded-2xl bg-gray-900 text-white p-8 flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-2">Next step</p>
          <h2 className="text-lg font-bold mb-1">Ready to generate your first carousel?</h2>
          <p className="text-gray-400 text-sm">
            Select a hook style, template, and design style — then let AI do the rest.
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            Create a carousel
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7h9M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

    </div>
    </PageWrapper>
  )
}
