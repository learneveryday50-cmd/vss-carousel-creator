import Link from 'next/link'
import { cookies } from 'next/headers'
import { getBrands } from '@/lib/supabase/brands'
import { getTemplates, getImageStyles, getDesignStyles, getHookStyles } from '@/lib/supabase/catalog'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  const cookieBrandId = cookieStore.get('selected_brand_id')?.value

  const [brands, templates, styles, designStyles, hookStyles] = await Promise.all([
    getBrands(),
    getTemplates(),
    getImageStyles(),
    getDesignStyles(),
    getHookStyles(),
  ])

  const activeBrand =
    brands.find((b) => b.id === cookieBrandId) ?? brands[0] ?? null

  const customStyleCount = styles.filter((s) => s.is_custom).length
  const builtInStyleCount = styles.filter((s) => !s.is_custom).length

  // Derive a greeting name from email
  const displayName = user?.email?.split('@')[0] ?? 'there'

  if (!activeBrand) {
    return (
      <div className="max-w-4xl">
        <div className="bg-white rounded-2xl border border-zinc-100 p-8 text-center">
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">Set up your brand first</h2>
          <p className="text-zinc-500 text-sm mb-4">
            You need at least one brand before you can use the dashboard.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
          >
            Create a brand
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Welcome, {displayName}</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          Your brand is set up. Ready to create.
        </p>
      </div>

      {/* 5 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* Card 1 — Active Brand */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-2">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Active brand</p>
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: activeBrand.primary_color }}
            />
            <span className="font-bold text-xl text-zinc-900 truncate">{activeBrand.name}</span>
          </div>
          <Link
            href={`/settings/brand/${activeBrand.id}/edit`}
            className="text-xs text-zinc-400 hover:text-zinc-600 underline"
          >
            Edit brand
          </Link>
        </div>

        {/* Card 2 — Templates */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-2">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Template library</p>
          <p className="font-bold text-xl text-zinc-900">{templates.length} templates available</p>
          <Link
            href="/templates"
            className="text-xs text-zinc-400 hover:text-zinc-600 underline"
          >
            Browse &rarr;
          </Link>
        </div>

        {/* Card 3 — Image Styles */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-2">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Image styles</p>
          <p className="font-bold text-xl text-zinc-900">
            {builtInStyleCount} built-in
            {customStyleCount > 0 ? ` + ${customStyleCount} custom` : ''}
          </p>
          <Link
            href="/templates"
            className="text-xs text-zinc-400 hover:text-zinc-600 underline"
          >
            Manage &rarr;
          </Link>
        </div>

        {/* Card 4 — Design Styles */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-2">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Design styles</p>
          <p className="font-bold text-xl text-zinc-900">{designStyles.length} styles available</p>
          <Link href="/templates" className="text-xs text-zinc-400 hover:text-zinc-600 underline">
            Browse &rarr;
          </Link>
        </div>

        {/* Card 5 — Hook Styles */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-2">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Hook styles</p>
          <p className="font-bold text-xl text-zinc-900">{hookStyles.length} hooks available</p>
          <Link href="/templates" className="text-xs text-zinc-400 hover:text-zinc-600 underline">
            Browse &rarr;
          </Link>
        </div>
      </div>

      {/* CTA Block */}
      <div className="rounded-2xl bg-zinc-900 text-white p-8">
        <h2 className="text-xl font-bold mb-2">Ready to generate your first carousel</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Select a hook style, template, design style, and image style, enter your topic, and let AI do the rest.
        </p>
        <div className="flex items-center gap-4">
          <button
            disabled
            className="inline-flex items-center px-5 py-2.5 rounded-lg bg-white/20 text-white/50 text-sm font-medium cursor-not-allowed"
          >
            Generate carousel
          </button>
          <span className="text-xs text-white/40">Unlocks in Phase 5</span>
        </div>
      </div>
    </div>
  )
}
