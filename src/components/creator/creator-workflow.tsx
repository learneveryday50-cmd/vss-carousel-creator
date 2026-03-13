'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HookStyleSelector } from '@/components/hook-styles/hook-style-selector'
import { TemplateGallery } from '@/components/templates/template-gallery'
import { TemplateAssetSelector } from '@/components/template-assets/template-asset-selector'
import { DesignStyleSelector } from '@/components/design-styles/design-style-selector'
import { SlideCountSelector, type SlideCount } from '@/components/slide-count/slide-count-selector'
import { PreviewPanel } from '@/components/creator/preview-panel'
import { InlineBrandEditor } from '@/components/brand/inline-brand-editor'
import { CreditGate } from '@/components/billing/credit-gate'
import type { HookStyle, Template, TemplateAsset, DesignStyle } from '@/lib/supabase/catalog'
import type { Brand } from '@/lib/supabase/brands'

type CreditData = { plan: 'free' | 'pro'; creditsRemaining: number; creditsLimit: number }

type Props = {
  hookStyles: HookStyle[]
  templates: Template[]
  templateAssets: TemplateAsset[]
  designStyles: DesignStyle[]
  brands: Brand[]
  selectedBrandId: string | null
  creditData: CreditData
}

type GenerationState = 'idle' | 'loading' | 'processing' | 'completed' | 'failed'

const STEPS = [
  { n: 1, tag: 'Idea',              label: 'What is your carousel idea?' },
  { n: 2, tag: 'Carousel Template', label: 'Choose a carousel template' },
  { n: 3, tag: 'Visual Style',      label: 'Choose a visual style' },
  { n: 4, tag: 'Template Style',    label: 'Choose template images' },
  { n: 5, tag: 'Hook Style',        label: 'Choose a hook style' },
  { n: 6, tag: 'Slide Count',       label: 'Number of slides' },
]

const POLL_INTERVAL_MS = 2500
const POLL_TIMEOUT_MS = 8 * 60 * 1000  // 8 minutes

export function CreatorWorkflow({ hookStyles, templates, templateAssets, designStyles, brands, selectedBrandId, creditData }: Props) {
  const router = useRouter()

  const [activeBrandId, setActiveBrandId] = useState<string | null>(selectedBrandId)
  const [editBrandOpen, setEditBrandOpen] = useState(false)
  const [topic, setTopic] = useState('')
  const [templateId, setTemplateId] = useState<string | undefined>()
  const [designId, setDesignId] = useState<string | undefined>()
  const [templateAssetId, setTemplateAssetId] = useState<string | undefined>()
  const [hookId, setHookId] = useState<string | undefined>()
  const [slideCount, setSlideCount] = useState<SlideCount>(7)

  // Generation state
  const [generationState, setGenerationState] = useState<GenerationState>('idle')
  const [carouselId, setCarouselId] = useState<string | null>(null)
  const [processingStep, setProcessingStep] = useState<1 | 2 | 3>(1)
  const [slideUrls, setSlideUrls] = useState<string[]>([])
  const [postBody, setPostBody] = useState<string>('')

  const selectedHook = hookStyles.find((h) => h.id === hookId)
  const selectedTemplate = templates.find((t) => t.id === templateId)
  const activeBrand = brands.find((b) => b.id === activeBrandId) ?? null

  // Minimum-input check: topic + templateId + templateAssetId + brandId required
  const canGenerate = topic.trim().length > 0 && !!templateId && !!templateAssetId && !!activeBrandId

  const completedSteps = [
    topic.trim().length > 0,
    !!templateId,
    !!designId,
    !!templateAssetId,
    !!hookId,
    true,
  ]
  const completedCount = completedSteps.filter(Boolean).length

  // submitGeneration — does NOT guard on generationState so it works from handleGenerate and handleRetry.
  async function submitGeneration() {
    if (!canGenerate || !activeBrandId) return
    setGenerationState('loading')
    setProcessingStep(1)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: activeBrandId,
          template_id: templateId,
          template_asset_id: templateAssetId ?? null,
          hook_style_id: hookId ?? null,
          design_style_id: designId ?? null,
          idea_text: topic,
          slide_count: slideCount,
        }),
      })

      if (!res.ok) {
        setGenerationState('failed')
        return
      }

      const { carousel_id } = await res.json()
      setCarouselId(carousel_id)
      setGenerationState('processing')
    } catch {
      setGenerationState('failed')
    }
  }

  // handleGenerate — entry point from Generate button.
  // Guards on generationState === 'idle' to prevent double-submission.
  async function handleGenerate() {
    if (generationState !== 'idle') return
    await submitGeneration()
  }

  // handleRetry — resets carousel state and calls submitGeneration() directly,
  // bypassing the idle-state guard to avoid React 18 batching stale-closure issues.
  async function handleRetry() {
    // v1: retry creates a new carousel row and deducts another credit; refund-on-failure is v2
    setCarouselId(null)
    setPostBody('')
    setProcessingStep(1)
    // Call submitGeneration() directly — NOT handleGenerate() — to skip the idle-state guard.
    // React 18 batching means generationState is still 'failed' in the closure when this runs,
    // so going through handleGenerate() would hit the guard and return early silently.
    await submitGeneration()
  }

  // Polling useEffect
  useEffect(() => {
    if (!carouselId || generationState !== 'processing') return

    const startTime = Date.now()

    // Simulated step advancement (client-side only — n8n doesn't emit step updates)
    const stepTimer1 = setTimeout(() => setProcessingStep(2), 8000)
    const stepTimer2 = setTimeout(() => setProcessingStep(3), 20000)

    const interval = setInterval(async () => {
      if (Date.now() - startTime > POLL_TIMEOUT_MS) {
        clearInterval(interval)
        setGenerationState('failed')
        return
      }

      try {
        const res = await fetch(`/api/generate/status?id=${carouselId}`)
        if (!res.ok) return  // transient error — keep polling

        const data = await res.json()
        if (data.status === 'completed') {
          clearInterval(interval)
          clearTimeout(stepTimer1)
          clearTimeout(stepTimer2)
          setSlideUrls(data.slide_urls ?? [])
          setPostBody(data.post_body ?? '')
          setGenerationState('completed')
          router.refresh()  // update credit badge in header
        } else if (data.status === 'failed') {
          clearInterval(interval)
          clearTimeout(stepTimer1)
          clearTimeout(stepTimer2)
          setGenerationState('failed')
        }
      } catch {
        // transient network error — keep polling
      }
    }, POLL_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)
    }
  }, [carouselId, generationState, router])

  // Map generationState to PreviewPanel mode prop
  const previewMode = generationState === 'loading'
    ? 'processing'
    : generationState === 'idle'
      ? 'config'
      : generationState

  return (
    <>
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-10 items-start">

      {/* ── Left: Config flow ─────────────────────────────────── */}
      <div className="min-w-0 space-y-0">

        {/* ── Brand step ─────────────────────────────────────── */}
        {brands.length > 0 && (
          <section className="py-8">
            <div className="flex items-start gap-4 mb-5">
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 transition-colors',
                activeBrandId ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400',
              ].join(' ')}>
                {activeBrandId ? <CheckIcon /> : <BrandIcon />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-0.5">Brand</p>
                <h2 className="text-base font-semibold text-gray-900 leading-snug">Choose your brand</h2>
                <p className="text-sm text-gray-500 mt-0.5">Your brand identity applied to every slide.</p>
              </div>
            </div>

            <div className="ml-11 space-y-3">
              {/* Brand chips */}
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => {
                  const isActive = b.id === activeBrandId
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => { setActiveBrandId(b.id); setEditBrandOpen(false) }}
                      className={[
                        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                        isActive
                          ? 'bg-amber-50 border-amber-400 text-amber-700 ring-2 ring-amber-400/30'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.primary_color }} />
                      {b.name}
                    </button>
                  )
                })}
              </div>

              {/* Edit brand toggle + note */}
              {activeBrand && (
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setEditBrandOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <PencilIcon />
                    {editBrandOpen ? 'Close editor' : 'Edit brand'}
                  </button>
                  {!editBrandOpen && (
                    <p className="text-xs text-gray-400">
                      — then complete the steps below to generate.
                    </p>
                  )}
                </div>
              )}

              {/* Inline brand editor */}
              {editBrandOpen && activeBrand && (
                <InlineBrandEditor
                  brand={activeBrand}
                  onSaved={() => { setEditBrandOpen(false); router.refresh() }}
                  onCancel={() => setEditBrandOpen(false)}
                />
              )}
            </div>
          </section>
        )}

        {brands.length > 0 && <SectionDivider />}

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

        {/* 1 · Idea */}
        <ConfigSection step={1} tag="Idea" title="What is your carousel idea?" done={topic.trim().length > 0}>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Why most startups fail in the first year"
            rows={2}
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all shadow-sm"
          />
          <p className="text-xs text-gray-400 mt-1.5">Clear, specific ideas generate better carousels.</p>
        </ConfigSection>

        <SectionDivider />

        {/* 2 · Carousel Template */}
        <ConfigSection step={2} tag="Carousel Template" title="Choose a carousel template" description="Controls the narrative flow of your slides." done={!!templateId}>
          <TemplateGallery templates={templates} selectedId={templateId} onSelect={setTemplateId} />
        </ConfigSection>

        <SectionDivider />

        {/* 3 · Visual Style */}
        <ConfigSection step={3} tag="Visual Style" title="Choose a visual style" description="Design philosophy Gemini applies when editing your slides." done={!!designId}>
          <DesignStyleSelector styles={designStyles} selectedId={designId} onSelect={setDesignId} />
        </ConfigSection>

        <SectionDivider />

        {/* 4 · Template Style */}
        <ConfigSection step={4} tag="Template Style" title="Choose template images" description="The font, content, and CTA slide images used as your carousel base." done={!!templateAssetId}>
          <TemplateAssetSelector assets={templateAssets} selectedId={templateAssetId} onSelect={setTemplateAssetId} />
        </ConfigSection>

        <SectionDivider />

        {/* 5 · Hook Style */}
        <ConfigSection step={5} tag="Hook Style" title="Choose a hook style" description="Controls how your first slide opens." done={!!hookId}>
          <HookStyleSelector styles={hookStyles} selectedId={hookId} onSelect={setHookId} />
        </ConfigSection>

        <SectionDivider />

        {/* 6 · Slide Count */}
        <ConfigSection step={6} tag="Slide Count" title="Number of slides" description="How many slides your carousel will have." done>
          <SlideCountSelector value={slideCount} onChange={setSlideCount} />
        </ConfigSection>

        <SectionDivider />

        {/* 7 · Generate */}
        <div className="py-6">
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {canGenerate ? 'Ready to generate your carousel.' : 'Complete the required steps to unlock generation.'}
              </p>
              {!canGenerate && (
                <ul className="text-xs text-gray-400 mt-1 space-y-0.5">
                  {!activeBrandId && <li>• No brand selected — choose one above</li>}
                  {!topic.trim() && <li>• Step 1: Enter a topic</li>}
                  {!templateId && <li>• Step 2: Select a carousel template</li>}
                  {!templateAssetId && <li>• Step 4: Select a template style</li>}
                </ul>
              )}
            </div>

            {creditData.creditsRemaining === 0 ? (
              <CreditGate />
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || generationState !== 'idle'}
                className={[
                  'inline-flex items-center gap-2.5 rounded-xl bg-gray-900 text-white px-5 py-2.5 text-sm font-semibold flex-shrink-0 transition-opacity',
                  (!canGenerate || generationState !== 'idle') ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-800',
                ].join(' ')}
              >
                {generationState === 'loading' ? 'Starting\u2026' : 'Generate carousel'}
                <ArrowRightIcon />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ── Right: Live config preview (always config mode) ──── */}
      <aside className="xl:sticky xl:top-6">
        <PreviewPanel
          topic={topic}
          template={selectedTemplate}
          hookStyle={selectedHook}
          slideCount={slideCount}
          mode="config"
        />
      </aside>

    </div>

    {/* ── Generation modal ─────────────────────────────────────── */}
    {generationState !== 'idle' && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="relative w-full max-w-lg my-auto">
          {/* Close button — inside top-right of panel */}
          <button
            onClick={() => {
              setGenerationState('idle')
              setCarouselId(null)
              setSlideUrls([])
              setPostBody('')
              setProcessingStep(1)
            }}
            className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 1l10 10M11 1L1 11" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
          <PreviewPanel
            topic={topic}
            template={selectedTemplate}
            hookStyle={selectedHook}
            slideCount={slideCount}
            mode={previewMode}
            processingStep={processingStep}
            slideUrls={slideUrls}
            postBody={postBody}
            onRetry={handleRetry}
          />
        </div>
      </div>
    )}
    </>
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

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BrandIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="5.5" cy="5.5" r="1.8" fill="currentColor"/>
    </svg>
  )
}
