import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { listRecords, parseBrand, AIRTABLE_TABLES } from '@/lib/airtable'

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

  const displayName = user?.email?.split('@')[0] ?? 'there'

  if (!activeBrand) {
    return (
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
    )
  }

  return (
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
          <span className="text-xs text-gray-500">AI generation coming in Phase 5</span>
        </div>
      </div>

    </div>
  )
}
