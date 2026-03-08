'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, XCircle } from 'lucide-react'
import type { Template, HookStyle } from '@/lib/supabase/catalog'
import type { SlideCount } from '@/components/slide-count/slide-count-selector'

type GenerationMode = 'config' | 'processing' | 'completed' | 'failed'

type Props = {
  // Existing config props (unchanged)
  topic?: string
  template?: Template
  hookStyle?: HookStyle
  slideCount: SlideCount
  // New generation props
  mode?: GenerationMode          // defaults to 'config' when undefined
  processingStep?: 1 | 2 | 3    // active step during processing
  slideUrls?: string[]           // ImgBB URLs when completed
  postBody?: string              // caption text when completed
  onRetry?: () => void           // called by Retry button in failed mode
}

const HOOK_HEADLINES: Record<string, string> = {
  'hook-insight-cta':  'Why 90% of startups\nfail in their first year',
  'problem-solution':  'Your product is great.\nBut nobody knows it exists.',
  'step-by-step':      '5 steps to grow from 0\nto 10k followers in 90 days',
  'story-thread':      'I failed 3 businesses\nbefore building a $1M one.',
  'case-study':        'How we grew 300% in 6 months\nwithout spending on ads',
}

const HOOK_SUBTEXT: Record<string, string> = {
  'hook-insight-cta':  'Most founders never see it coming.',
  'problem-solution':  "Here's the mistake costing you growth.",
  'step-by-step':      'No ads. No luck. Just this system.',
  'story-thread':      "Here's what I learned the hard way.",
  'case-study':        'A real breakdown of what actually worked.',
}

const CONTENT_SLIDES: Record<string, Array<{ title: string; body: string }>> = {
  'hook-insight-cta': [
    { title: 'Most founders focus on product', body: 'But ignore distribution entirely.' },
    { title: 'They optimize the wrong thing', body: "Features won't save you. Distribution will." },
  ],
  'problem-solution': [
    { title: 'The problem', body: "You're building in silence. Nobody knows what you're working on." },
    { title: 'The solution', body: 'Share your journey publicly. Build in public.' },
  ],
  'step-by-step': [
    { title: 'Step 1: Pick a niche', body: "Don't try to talk to everyone. Pick one audience." },
    { title: 'Step 2: Post consistently', body: 'One insight per day. Every single day.' },
  ],
  'story-thread': [
    { title: 'The beginning', body: 'I had a great idea. I was wrong about everything.' },
    { title: 'The struggle', body: '18 months of zero traction. I almost quit.' },
  ],
  'case-study': [
    { title: 'The situation', body: 'A SaaS team with 50 users and no growth strategy.' },
    { title: 'What we did', body: 'Doubled content output and focused on long-tail SEO.' },
  ],
}

const FALLBACK_SLUG = 'hook-insight-cta'

const PROCESSING_STEPS = [
  'Writing carousel content',
  'Generating slides',
  'Rendering images',
]

export function PreviewPanel({
  topic,
  template,
  hookStyle,
  slideCount,
  mode = 'config',
  processingStep = 1,
  slideUrls = [],
  postBody = '',
  onRetry,
}: Props) {
  const slug = template?.slug ?? FALLBACK_SLUG
  const extraSlides = Math.max(0, slideCount - 3)
  const hookHeadline = topic?.trim() || HOOK_HEADLINES[slug] || HOOK_HEADLINES[FALLBACK_SLUG]
  const hookSub      = HOOK_SUBTEXT[slug] ?? HOOK_SUBTEXT[FALLBACK_SLUG]
  const slides       = CONTENT_SLIDES[slug] ?? CONTENT_SLIDES[FALLBACK_SLUG]
  const animKey = `${template?.id ?? 'none'}-${slideCount}`

  const [currentSlide, setCurrentSlide] = useState(0)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const cleanCaption = stripMarkdown(postBody)

  function handleCopy() {
    navigator.clipboard.writeText(cleanCaption).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleDownloadAll() {
    if (downloading || slideUrls.length === 0) return
    setDownloading(true)
    for (let i = 0; i < slideUrls.length; i++) {
      try {
        const res = await fetch(slideUrls[i])
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `slide-${i + 1}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        await new Promise((r) => setTimeout(r, 300))
      } catch {
        // skip failed slide
      }
    }
    setDownloading(false)
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
          </div>
          <p className="text-xs font-semibold text-gray-500 ml-1">Preview</p>
        </div>
        <span className="text-[11px] bg-white border border-gray-200 text-gray-500 px-2.5 py-0.5 rounded-full font-medium shadow-sm">
          {mode === 'completed' ? `${slideUrls.length} slides` : `${slideCount} slides`}
        </span>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Config mode ─────────────────────────────────────── */}
        {mode === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {topic && (
              <div className="px-5 pt-4 pb-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600 mb-1">Your topic</p>
                <p className="text-xs font-medium text-gray-700 italic line-clamp-2 leading-relaxed">
                  &ldquo;{topic}&rdquo;
                </p>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={animKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="p-4 flex flex-col gap-2.5"
              >
                <SlideShell number={1} tag={hookStyle?.name ?? 'Hook'} tagStyle="primary">
                  <p className="text-sm font-semibold text-gray-900 leading-snug whitespace-pre-line">{hookHeadline}</p>
                  <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">{hookSub}</p>
                </SlideShell>

                <SlideShell number={2} tag={template?.name ?? 'Content'} tagStyle="light">
                  <p className="text-xs font-semibold text-gray-800">{slides[0]?.title}</p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{slides[0]?.body}</p>
                </SlideShell>

                <SlideShell number={3} tag="Content" tagStyle="light">
                  <p className="text-xs font-semibold text-gray-800">{slides[1]?.title}</p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{slides[1]?.body}</p>
                </SlideShell>

                {extraSlides > 0 && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                    <span className="text-[10px] text-gray-400 flex-shrink-0 font-medium">+{extraSlides} more slides</span>
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                  </div>
                )}

                <SlideShell number={slideCount} tag="CTA" tagStyle="outline">
                  <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                    <p className="text-xs font-semibold text-gray-800">Want the full growth playbook?</p>
                    <p className="text-[11px] text-amber-600 mt-0.5 font-medium">Follow for more.</p>
                  </div>
                </SlideShell>
              </motion.div>
            </AnimatePresence>

            {/* Bottom action hint */}
            <div className="px-4 pb-4">
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 flex items-center justify-between">
                <p className="text-[11px] text-gray-400">Live preview updates as you configure</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5,6].map((i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-gray-300" />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Processing mode ──────────────────────────────────── */}
        {mode === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center gap-6 py-10 px-6"
          >
            {/* Pulsing amber spinner */}
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-10 h-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"
              style={{ animation: undefined }}
            >
              <motion.div
                className="w-full h-full rounded-full border-2 border-amber-400 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>

            {/* Step rows */}
            <div className="w-full flex flex-col gap-3">
              {PROCESSING_STEPS.map((label, i) => {
                const stepNum = (i + 1) as 1 | 2 | 3
                const isActive = processingStep === stepNum
                const isDone = processingStep > stepNum

                return (
                  <motion.div
                    key={label}
                    className="flex items-center gap-3"
                    animate={isActive ? { scale: [1, 1.02, 1] } : {}}
                    transition={isActive ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
                  >
                    {/* Circle indicator */}
                    {isDone ? (
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                          <path d="M1.5 5l2.5 2.5 4.5-5" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    ) : isActive ? (
                      <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-white">{stepNum}</span>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-gray-400">{stepNum}</span>
                      </div>
                    )}

                    {/* Label */}
                    <span className={[
                      'text-sm font-medium',
                      isDone ? 'text-gray-400' : isActive ? 'text-amber-600' : 'text-gray-300',
                    ].join(' ')}>
                      {label}
                    </span>
                  </motion.div>
                )
              })}
            </div>

            <p className="text-xs text-gray-400">This usually takes 30&ndash;60 seconds</p>
          </motion.div>
        )}

        {/* ── Completed mode ───────────────────────────────────── */}
        {mode === 'completed' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 flex flex-col gap-4"
          >
            {/* Slide carousel */}
            {slideUrls.length > 0 && (
              <div className="flex flex-col gap-2">
                <img
                  src={slideUrls[currentSlide]}
                  className="w-full rounded-lg object-contain max-h-72"
                  alt={`Slide ${currentSlide + 1}`}
                />

                {/* Nav row */}
                <div className="flex items-center justify-between px-1">
                  <button
                    onClick={() => setCurrentSlide((s) => Math.max(0, s - 1))}
                    disabled={currentSlide === 0}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-500">
                    Slide {currentSlide + 1} of {slideUrls.length}
                  </span>
                  <button
                    onClick={() => setCurrentSlide((s) => Math.min(slideUrls.length - 1, s + 1))}
                    disabled={currentSlide === slideUrls.length - 1}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Download all */}
                <button
                  onClick={handleDownloadAll}
                  disabled={downloading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                    <path d="M6.5 1v7.5M3.5 6l3 3 3-3M1 10.5v1a.5.5 0 00.5.5h10a.5.5 0 00.5-.5v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {downloading ? 'Downloading…' : `Download all ${slideUrls.length} slides`}
                </button>
              </div>
            )}

            {/* Post body */}
            {cleanCaption && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl p-4 border border-gray-200">
                  {cleanCaption}
                </p>
                <button
                  onClick={handleCopy}
                  className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1 self-end transition-colors"
                >
                  {copied ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M1.5 6l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <rect x="3.5" y="1.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M1.5 4.5v6a1 1 0 001 1h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      Copy Caption
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Failed mode ──────────────────────────────────────── */}
        {mode === 'failed' && (
          <motion.div
            key="failed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center gap-3 py-10 px-6 text-center"
          >
            <XCircle className="w-8 h-8 text-red-400" />
            <div>
              <p className="font-semibold text-gray-900">Generation failed</p>
              <p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p>
            </div>
            <button
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Try again
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')       // **bold**
    .replace(/\*([^*]+)\*/g, '$1')           // *italic*
    .replace(/^#{1,6}\s+/gm, '')             // ## headings
    .replace(/^[-*_]{3,}\s*$/gm, '')         // --- dividers
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')      // [text](url)
    .replace(/`(.+?)`/g, '$1')               // `code`
    .replace(/^\s*[-*+]\s+/gm, '• ')         // - list → bullet
    .replace(/\n{3,}/g, '\n\n')              // collapse excess newlines
    .trim()
}

function SlideShell({ number, tag, tagStyle, children }: {
  number: number
  tag: string
  tagStyle: 'primary' | 'light' | 'outline'
  children: React.ReactNode
}) {
  const tagClass =
    tagStyle === 'primary'
      ? 'bg-amber-500 text-white'
      : tagStyle === 'outline'
        ? 'border border-gray-200 text-gray-500'
        : 'bg-gray-100 text-gray-500'

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
        <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500 leading-none">
          {number}
        </span>
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${tagClass}`}>{tag}</span>
      </div>
      <div className="px-3 py-3">{children}</div>
    </div>
  )
}
