'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PreviewPanel } from '@/components/creator/preview-panel'
import { CreditGate } from '@/components/billing/credit-gate'
import type { AirtableBrand, AirtableTemplate, AirtableDesignStyle } from '@/lib/airtable'

type CreditData = { plan: 'free' | 'pro'; creditsRemaining: number; creditsLimit: number }

type Props = {
  brands: AirtableBrand[]
  templates: AirtableTemplate[]
  designStyles: AirtableDesignStyle[]
  selectedBrandId: string | null
  creditData: CreditData
}

type GenerationState = 'idle' | 'loading' | 'processing' | 'completed' | 'failed'

const STEPS = [
  { n: 1, tag: 'Idea',          label: 'What is your carousel idea?' },
  { n: 2, tag: 'Visual Style',  label: 'Choose a visual style' },
  { n: 3, tag: 'Template',      label: 'Choose a template' },
]

const POLL_INTERVAL_MS = 2500
const POLL_TIMEOUT_MS = 8 * 60 * 1000

export function CreatorWorkflow({ brands, templates, designStyles, selectedBrandId, creditData }: Props) {
  const router = useRouter()

  const [activeBrandId, setActiveBrandId] = useState<string | null>(selectedBrandId)
  const [topic, setTopic] = useState('')
  const [designId, setDesignId] = useState<string | undefined>()
  const [templateId, setTemplateId] = useState<string | undefined>()

  // Generation state
  const [generationState, setGenerationState] = useState<GenerationState>('idle')
  const [carouselId, setCarouselId] = useState<string | null>(null)
  const [processingStep, setProcessingStep] = useState<1 | 2 | 3>(1)
  const [slideUrls, setSlideUrls] = useState<string[]>([])
  const [postBody, setPostBody] = useState<string>('')

  const canGenerate = topic.trim().length > 0 && !!templateId && !!activeBrandId

  const completedSteps = [
    topic.trim().length > 0,
    !!designId,
    !!templateId,
  ]
  const completedCount = completedSteps.filter(Boolean).length

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
          design_style_id: designId ?? null,
          idea_text: topic,
        }),
      })

      if (!res.ok) {
        setGenerationState('failed')
        return
      }

      const { record_id } = await res.json()
      setCarouselId(record_id)
      setGenerationState('processing')
    } catch {
      setGenerationState('failed')
    }
  }

  async function handleGenerate() {
    if (generationState !== 'idle') return
    await submitGeneration()
  }

  async function handleRetry() {
    setCarouselId(null)
    setPostBody('')
    setProcessingStep(1)
    await submitGeneration()
  }

  // Polling — reads Airtable System Message via status route
  useEffect(() => {
    if (!carouselId || generationState !== 'processing') return

    const startTime = Date.now()
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
        if (!res.ok) return

        const data = await res.json()
        if (data.status === 'completed') {
          clearInterval(interval)
          clearTimeout(stepTimer1)
          clearTimeout(stepTimer2)
          setSlideUrls(data.slide_urls ?? [])
          setPostBody(data.post_body ?? '')
          setGenerationState('completed')
          router.refresh()
        } else if (data.status === 'failed') {
          clearInterval(interval)
          clearTimeout(stepTimer1)
          clearTimeout(stepTimer2)
          setGenerationState('failed')
        } else if (data.step) {
          setProcessingStep(data.step as 1 | 2 | 3)
        }
      } catch {
        // transient — keep polling
      }
    }, POLL_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)
    }
  }, [carouselId, generationState, router])

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

            <div className="ml-11">
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => {
                  const isActive = b.id === activeBrandId
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setActiveBrandId(b.id)}
                      className={[
                        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                        isActive
                          ? 'bg-amber-50 border-amber-400 text-amber-700 ring-2 ring-amber-400/30'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.primaryColor }} />
                      {b.name}
                    </button>
                  )
                })}
              </div>
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

        {/* 2 · Visual Style */}
        <ConfigSection step={2} tag="Visual Style" title="Choose a visual style" description="Design philosophy applied to your slides." done={!!designId}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {designStyles.map((style) => {
              const isSelected = style.id === designId
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setDesignId(style.id)}
                  className={[
                    'relative w-full text-left rounded-xl border bg-white transition-all duration-200 overflow-hidden shadow-sm',
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                      : 'border-gray-200 hover:border-amber-300 hover:shadow-md',
                  ].join(' ')}
                >
                  {isSelected && (
                    <span className="absolute top-2.5 right-2.5 z-10 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm">
                      <CheckIcon />
                    </span>
                  )}
                  <div className={[
                    'w-full aspect-[4/3] border-b flex items-center justify-center overflow-hidden',
                    isSelected ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100',
                  ].join(' ')}>
                    {style.exampleUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={style.exampleUrl} alt={style.name} className="w-full h-full object-cover" />
                    ) : (
                      <DesignPreview name={style.name} />
                    )}
                  </div>
                  <div className="px-3.5 py-3">
                    <p className="font-semibold text-gray-900 text-sm leading-snug">{style.name}</p>
                    {style.description && (
                      <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-2">{style.description}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </ConfigSection>

        <SectionDivider />

        {/* 3 · Template */}
        <ConfigSection step={3} tag="Template" title="Choose a template" description="The slide images used as your carousel base." done={!!templateId}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((t) => {
              const isSelected = t.id === templateId
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className={[
                    'text-left rounded-xl border overflow-hidden transition-all',
                    isSelected
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm',
                  ].join(' ')}
                >
                  {/* Preview row */}
                  <div className="grid grid-cols-3 gap-1 p-2 bg-gray-50">
                    {[t.frontPageUrl, t.contentPageUrl, t.ctaPageUrl].map((url, i) => (
                      <div key={i} className="aspect-[4/3] rounded-md overflow-hidden bg-gray-200">
                        {url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[9px] text-gray-400">{['F', 'C', 'CTA'][i]}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="px-3 py-2">
                    <p className={['text-xs font-semibold', isSelected ? 'text-amber-700' : 'text-gray-900'].join(' ')}>
                      {t.name}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </ConfigSection>

        <SectionDivider />

        {/* Generate */}
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
                  {!templateId && <li>• Step 3: Select a template</li>}
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

      {/* ── Right: Live config preview ─────────────────────────── */}
      <aside className="xl:sticky xl:top-6">
        <PreviewPanel
          topic={topic}
          template={undefined}
          hookStyle={undefined}
          slideCount={7}
          mode="config"
        />
      </aside>

    </div>

    {/* ── Generation modal ─────────────────────────────────────── */}
    {generationState !== 'idle' && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="relative w-full max-w-lg my-auto">
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
            template={undefined}
            hookStyle={undefined}
            slideCount={7}
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
          done ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400',
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

function DesignPreview({ name }: { name: string }) {
  if (name === 'Minimal') {
    return (
      <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
        <rect x="16" y="12" width="48" height="8" rx="2.5" fill="#f59e0b" />
        <rect x="22" y="24" width="36" height="4" rx="1.5" fill="#6b7280" />
        <rect x="28" y="31" width="24" height="4" rx="1.5" fill="#9ca3af" />
        <rect x="32" y="38" width="16" height="4" rx="1.5" fill="#d1d5db" />
      </svg>
    )
  }
  if (name === 'Professional') {
    return (
      <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
        <rect x="6" y="8" width="68" height="7" rx="2" fill="#f59e0b" />
        <rect x="6" y="19" width="28" height="30" rx="2" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
        <rect x="38" y="19" width="36" height="13" rx="2" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
        <rect x="38" y="36" width="36" height="13" rx="2" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
        <rect x="9" y="24" width="20" height="3" rx="1" fill="#d1d5db" />
        <rect x="9" y="30" width="16" height="3" rx="1" fill="#e5e7eb" />
        <rect x="41" y="23" width="26" height="3" rx="1" fill="#d1d5db" />
        <rect x="41" y="39" width="22" height="3" rx="1" fill="#d1d5db" />
      </svg>
    )
  }
  if (name === 'Bold') {
    return (
      <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
        <rect x="6" y="6" width="68" height="22" rx="3" fill="#f59e0b" />
        <rect x="11" y="12" width="40" height="5" rx="1.5" fill="white" opacity="0.9" />
        <rect x="11" y="20" width="28" height="3.5" rx="1" fill="white" opacity="0.6" />
        <rect x="6" y="33" width="44" height="5" rx="1.5" fill="#374151" />
        <rect x="6" y="41" width="36" height="4" rx="1.5" fill="#6b7280" />
        <rect x="6" y="48" width="28" height="4" rx="1.5" fill="#9ca3af" />
      </svg>
    )
  }
  if (name === 'Corporate') {
    return (
      <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
        <rect x="6" y="8" width="68" height="7" rx="1.5" fill="#1f2937" />
        <rect x="6" y="8" width="8" height="7" rx="1.5" fill="#f59e0b" />
        <line x1="6" y1="20" x2="74" y2="20" stroke="#e5e7eb" strokeWidth="1" />
        <rect x="6" y="24" width="68" height="4" rx="1.5" fill="#d1d5db" />
        <rect x="6" y="31" width="56" height="4" rx="1.5" fill="#e5e7eb" />
        <rect x="6" y="38" width="60" height="4" rx="1.5" fill="#d1d5db" />
        <line x1="6" y1="47" x2="74" y2="47" stroke="#e5e7eb" strokeWidth="1" />
        <rect x="6" y="50" width="22" height="7" rx="2" fill="#f59e0b" />
      </svg>
    )
  }
  if (name === 'Social') {
    return (
      <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
        <circle cx="40" cy="22" r="14" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.5" />
        <circle cx="40" cy="18" r="6" fill="#d1d5db" />
        <path d="M26 32 Q40 26 54 32" fill="#d1d5db" />
        <rect x="22" y="40" width="36" height="5" rx="1.5" fill="#374151" />
        <rect x="28" y="48" width="24" height="3.5" rx="1.5" fill="#9ca3af" />
      </svg>
    )
  }
  // Generic fallback
  return (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
      <rect x="10" y="8" width="60" height="8" rx="2" fill="#f59e0b" />
      <rect x="10" y="20" width="60" height="4" rx="1.5" fill="#d1d5db" />
      <rect x="10" y="27" width="48" height="4" rx="1.5" fill="#e5e7eb" />
      <rect x="10" y="34" width="40" height="4" rx="1.5" fill="#e5e7eb" />
      <rect x="10" y="44" width="20" height="8" rx="2" fill="#1f2937" />
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
