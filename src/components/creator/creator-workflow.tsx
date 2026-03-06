'use client'

import { useState } from 'react'
import { HookStyleSelector } from '@/components/hook-styles/hook-style-selector'
import { TemplateGallery } from '@/components/templates/template-gallery'
import { DesignStyleSelector } from '@/components/design-styles/design-style-selector'
import { StyleSelector } from '@/components/image-styles/style-selector'
import { SlideCountSelector, type SlideCount } from '@/components/slide-count/slide-count-selector'
import { PreviewPanel } from '@/components/creator/preview-panel'
import type { HookStyle, Template, DesignStyle, ImageStyle } from '@/lib/supabase/catalog'

type Props = {
  hookStyles: HookStyle[]
  templates: Template[]
  designStyles: DesignStyle[]
  imageStyles: ImageStyle[]
}

const STEPS = [
  { n: 1, tag: 'Topic',         label: 'What do you want to create?' },
  { n: 2, tag: 'Structure',     label: 'Choose a template' },
  { n: 3, tag: 'Writing Style', label: 'Choose a hook style' },
  { n: 4, tag: 'Design',        label: 'Choose a layout style' },
  { n: 5, tag: 'Images',        label: 'Choose a visual style' },
  { n: 6, tag: 'Output',        label: 'Choose a slide count' },
]

export function CreatorWorkflow({ hookStyles, templates, designStyles, imageStyles }: Props) {
  const [topic, setTopic] = useState('')
  const [hookId, setHookId] = useState<string | undefined>()
  const [templateId, setTemplateId] = useState<string | undefined>()
  const [designId, setDesignId] = useState<string | undefined>()
  const [imageId, setImageId] = useState<string | undefined>()
  const [slideCount, setSlideCount] = useState<SlideCount>(7)

  const selectedHook = hookStyles.find((h) => h.id === hookId)
  const selectedTemplate = templates.find((t) => t.id === templateId)

  const completedSteps = [
    topic.trim().length > 0,
    !!templateId,
    !!hookId,
    !!designId,
    !!imageId,
    true,
  ]
  const completedCount = completedSteps.filter(Boolean).length

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-10 items-start">

      {/* ── Left: Config flow ─────────────────────────────────── */}
      <div className="min-w-0 space-y-0">

        {/* Progress bar */}
        <div className="mb-8 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-400 flex-shrink-0 tabular-nums">
            {completedCount}/{STEPS.length}
          </span>
        </div>

        {/* 1 · Topic */}
        <ConfigSection step={1} tag="Topic" title="What carousel do you want to create?" done={topic.trim().length > 0}>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Why most startups fail in the first year"
            rows={2}
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all shadow-sm"
          />
          <p className="text-xs text-gray-400 mt-1.5">Clear, specific topics generate better carousels.</p>
        </ConfigSection>

        <SectionDivider />

        {/* 2 · Structure */}
        <ConfigSection step={2} tag="Structure" title="Choose a template" description="Controls the narrative flow of your slides." done={!!templateId}>
          <TemplateGallery templates={templates} selectedId={templateId} onSelect={setTemplateId} />
        </ConfigSection>

        <SectionDivider />

        {/* 3 · Writing Style */}
        <ConfigSection step={3} tag="Writing Style" title="Choose a hook style" description="Controls how your first slide opens." done={!!hookId}>
          <HookStyleSelector styles={hookStyles} selectedId={hookId} onSelect={setHookId} />
        </ConfigSection>

        <SectionDivider />

        {/* 4 · Design Style */}
        <ConfigSection step={4} tag="Design Style" title="Choose a layout style" description="Visual aesthetic applied to every slide." done={!!designId}>
          <DesignStyleSelector styles={designStyles} selectedId={designId} onSelect={setDesignId} />
        </ConfigSection>

        <SectionDivider />

        {/* 5 · Image Style */}
        <ConfigSection step={5} tag="Image Style" title="Choose a visual style" description="Illustration style for AI-generated images." done={!!imageId}>
          <StyleSelector styles={imageStyles} selectedId={imageId} onSelect={setImageId} />
        </ConfigSection>

        <SectionDivider />

        {/* 6 · Output */}
        <ConfigSection step={6} tag="Output" title="Choose a slide count" description="How many slides your carousel will have." done>
          <SlideCountSelector value={slideCount} onChange={setSlideCount} />
        </ConfigSection>

        <SectionDivider />

        {/* 7 · Generate */}
        <div className="py-6">
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Ready to generate</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Complete all steps above, then hit generate.
                <span className="ml-1 text-amber-500 font-medium">AI generation coming in Phase 5.</span>
              </p>
            </div>
            <button
              disabled
              className="inline-flex items-center gap-2.5 rounded-xl bg-gray-900 text-white px-5 py-2.5 text-sm font-semibold opacity-40 cursor-not-allowed flex-shrink-0"
            >
              Generate carousel
              <ArrowRightIcon />
            </button>
          </div>
        </div>

      </div>

      {/* ── Right: Live preview ───────────────────────────────── */}
      <aside className="xl:sticky xl:top-6">
        <PreviewPanel topic={topic} template={selectedTemplate} hookStyle={selectedHook} slideCount={slideCount} />
      </aside>

    </div>
  )
}

function ConfigSection({ step, tag, title, description, done, children }: {
  step: number
  tag: string
  title: string
  description?: string
  done?: boolean
  children: React.ReactNode
}) {
  return (
    <section className="py-8">
      <div className="flex items-start gap-4 mb-5">
        <div className={[
          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 transition-colors',
          done
            ? 'bg-amber-500 text-white'
            : 'bg-gray-100 text-gray-400',
        ].join(' ')}>
          {done ? <CheckIcon /> : step}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-0.5">{tag}</p>
          <h2 className="text-base font-semibold text-gray-900 leading-snug">{title}</h2>
          {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="ml-11">
        {children}
      </div>
    </section>
  )
}

function SectionDivider() {
  return <div className="border-t border-gray-100" />
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M1.5 6l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7h9M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
