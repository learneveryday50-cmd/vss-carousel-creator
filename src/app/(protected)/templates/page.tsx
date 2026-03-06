import { getTemplates, getImageStyles, getDesignStyles, getHookStyles } from '@/lib/supabase/catalog'
import { CreatorWorkflow } from '@/components/creator/creator-workflow'

export const metadata = {
  title: 'Create Carousel',
}

export default async function TemplatesPage() {
  const [templates, styles, designStyles, hookStyles] = await Promise.all([
    getTemplates(),
    getImageStyles(),
    getDesignStyles(),
    getHookStyles(),
  ])

  return (
    <div className="w-full max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold uppercase tracking-widest border border-amber-200">
            Creator
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Carousel</h1>
        <p className="text-sm text-gray-500 mt-1">
          Set your topic, choose a structure and style, then generate.
        </p>
      </div>
      <CreatorWorkflow
        hookStyles={hookStyles}
        templates={templates}
        designStyles={designStyles}
        imageStyles={styles}
      />
    </div>
  )
}
