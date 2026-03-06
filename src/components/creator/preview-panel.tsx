'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Template, HookStyle } from '@/lib/supabase/catalog'
import type { SlideCount } from '@/components/slide-count/slide-count-selector'

type Props = {
  topic?: string
  template?: Template
  hookStyle?: HookStyle
  slideCount: SlideCount
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

export function PreviewPanel({ topic, template, hookStyle, slideCount }: Props) {
  const slug = template?.slug ?? FALLBACK_SLUG
  const extraSlides = Math.max(0, slideCount - 3)
  const hookHeadline = topic?.trim() || HOOK_HEADLINES[slug] || HOOK_HEADLINES[FALLBACK_SLUG]
  const hookSub      = HOOK_SUBTEXT[slug] ?? HOOK_SUBTEXT[FALLBACK_SLUG]
  const slides       = CONTENT_SLIDES[slug] ?? CONTENT_SLIDES[FALLBACK_SLUG]
  const animKey = `${template?.id ?? 'none'}-${slideCount}`

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
          {slideCount} slides
        </span>
      </div>

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
    </div>
  )
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
