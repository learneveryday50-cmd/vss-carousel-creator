import { cookies } from 'next/headers'
import { getTemplates, getDesignStyles, getHookStyles, getTemplateAssets } from '@/lib/supabase/catalog'
import { getBrands } from '@/lib/supabase/brands'
import { createClient } from '@/lib/supabase/server'
import { CreatorWorkflow } from '@/components/creator/creator-workflow'

export const metadata = {
  title: 'Generate LinkedIn Carousel',
}

export default async function TemplatesPage() {
  const cookieStore = await cookies()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Auto-fallback to first brand if no cookie is set
  const cookieBrandId = cookieStore.get('selected_brand_id')?.value ?? null
  let selectedBrandId = cookieBrandId
  if (!selectedBrandId && user) {
    const { data: firstBrand } = await supabase
      .from('brands')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
    selectedBrandId = firstBrand?.id ?? null
  }

  const { data: usage } = user
    ? await supabase.from('usage_tracking').select('plan, credits_remaining, credits_limit').eq('user_id', user.id).single()
    : { data: null }

  const creditData = {
    plan: (usage?.plan ?? 'free') as 'free' | 'pro',
    creditsRemaining: usage?.credits_remaining ?? 0,
    creditsLimit: usage?.credits_limit ?? 3,
  }

  const [templates, templateAssets, designStyles, hookStyles, brands] = await Promise.all([
    getTemplates(),
    getTemplateAssets(),
    getDesignStyles(),
    getHookStyles(),
    getBrands(),
  ])

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
        hookStyles={hookStyles}
        templates={templates}
        templateAssets={templateAssets}
        designStyles={designStyles}
        brands={brands}
        selectedBrandId={selectedBrandId}
        creditData={creditData}
      />
    </div>
  )
}
