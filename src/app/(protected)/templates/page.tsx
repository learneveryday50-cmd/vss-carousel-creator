import { getTemplates, getImageStyles, getDesignStyles, getHookStyles } from '@/lib/supabase/catalog'
import { TemplateGallery } from '@/components/templates/template-gallery'
import { StyleSelector } from '@/components/image-styles/style-selector'
import { DesignStyleSelector } from '@/components/design-styles/design-style-selector'
import { SlideCountSelector } from '@/components/slide-count/slide-count-selector'
import { HookStyleSelector } from '@/components/hook-styles/hook-style-selector'

export const metadata = {
  title: 'Templates & Styles',
}

export default async function TemplatesPage() {
  const [templates, styles, designStyles, hookStyles] = await Promise.all([
    getTemplates(),
    getImageStyles(),
    getDesignStyles(),
    getHookStyles(),
  ])

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-zinc-900">Templates &amp; Styles</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Choose a hook style, template, design style, image style, and slide count.
          </p>
        </div>

        {/* Section 1: Hook Styles */}
        <section>
          <h2 className="text-base font-semibold text-zinc-900 mb-1">Choose a hook style</h2>
          <p className="text-sm text-zinc-400 mb-4">Controls how the first slide is written.</p>
          <HookStyleSelector styles={hookStyles} />
        </section>

        {/* Divider */}
        <div className="my-10 border-t border-zinc-100" />

        {/* Section 2: Templates */}
        <section>
          <h2 className="text-base font-semibold text-zinc-900 mb-4">Choose a template</h2>
          <TemplateGallery templates={templates} />
        </section>

        {/* Divider */}
        <div className="my-10 border-t border-zinc-100" />

        {/* Section 3: Design Styles */}
        <section>
          <h2 className="text-base font-semibold text-zinc-900 mb-4">Choose a design style</h2>
          <DesignStyleSelector styles={designStyles} />
        </section>

        {/* Divider */}
        <div className="my-10 border-t border-zinc-100" />

        {/* Section 4: Image styles */}
        <section>
          <h2 className="text-base font-semibold text-zinc-900 mb-4">Choose an image style</h2>
          <div className="max-w-xl">
            <StyleSelector styles={styles} />
          </div>
        </section>

        {/* Divider */}
        <div className="my-10 border-t border-zinc-100" />

        {/* Section 5: Slide Count */}
        <section>
          <h2 className="text-base font-semibold text-zinc-900 mb-4">Choose a slide count</h2>
          <SlideCountSelector />
        </section>

      </div>
    </div>
  )
}
