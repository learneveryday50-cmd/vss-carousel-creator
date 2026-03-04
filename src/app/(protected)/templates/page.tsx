import { getTemplates, getImageStyles } from '@/lib/supabase/catalog'
import { TemplateGallery } from '@/components/templates/template-gallery'
import { StyleSelector } from '@/components/image-styles/style-selector'

export const metadata = {
  title: 'Templates & Styles',
}

export default async function TemplatesPage() {
  const [templates, styles] = await Promise.all([getTemplates(), getImageStyles()])

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-zinc-900">Templates &amp; Styles</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Choose a carousel structure and an image style for your generation.
          </p>
        </div>

        {/* Section 1: Templates */}
        <section>
          <h2 className="text-base font-semibold text-zinc-900 mb-4">Choose a template</h2>
          <TemplateGallery templates={templates} />
        </section>

        {/* Divider */}
        <div className="my-10 border-t border-zinc-100" />

        {/* Section 2: Image styles */}
        <section>
          <h2 className="text-base font-semibold text-zinc-900 mb-4">Choose an image style</h2>
          <div className="max-w-xl">
            <StyleSelector styles={styles} />
          </div>
        </section>

      </div>
    </div>
  )
}
