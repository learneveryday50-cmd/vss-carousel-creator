import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { CreatorWorkflow } from '@/components/creator/creator-workflow'
import {
  listRecords,
  parseBrand,
  parseTemplate,
  parseDesignStyle,
  AIRTABLE_TABLES,
  type AirtableBrand,
  type AirtableTemplate,
  type AirtableDesignStyle,
} from '@/lib/airtable'

export const metadata = {
  title: 'Generate LinkedIn Carousel',
}

export default async function TemplatesPage() {
  const cookieStore = await cookies()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: usage } = user
    ? await supabase.from('usage_tracking').select('plan, credits_remaining, credits_limit').eq('user_id', user.id).single()
    : { data: null }

  const creditData = {
    plan: (usage?.plan ?? 'free') as 'free' | 'pro',
    creditsRemaining: usage?.credits_remaining ?? 0,
    creditsLimit: usage?.credits_limit ?? 3,
  }

  const [brandRecords, templateRecords, designStyleRecords] = await Promise.all([
    listRecords(AIRTABLE_TABLES.brands),
    listRecords(AIRTABLE_TABLES.templates),
    listRecords(AIRTABLE_TABLES.designStyles),
  ])

  const brands: AirtableBrand[] = brandRecords.map(parseBrand)
  const templates: AirtableTemplate[] = templateRecords.map(parseTemplate)
  const designStyles: AirtableDesignStyle[] = designStyleRecords.map(parseDesignStyle)

  // Auto-select first brand from cookie or first available
  const cookieBrandId = cookieStore.get('selected_brand_id')?.value ?? null
  const selectedBrandId = (cookieBrandId && brands.find((b) => b.id === cookieBrandId))
    ? cookieBrandId
    : (brands[0]?.id ?? null)

  return (
    <div className="w-full max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold uppercase tracking-widest border border-amber-200">
            Creator
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Generate LinkedIn Carousel</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add your idea, choose a template and design style, then generate.
        </p>
      </div>
      <CreatorWorkflow
        brands={brands}
        templates={templates}
        designStyles={designStyles}
        selectedBrandId={selectedBrandId}
        creditData={creditData}
      />
    </div>
  )
}
