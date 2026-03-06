'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Template } from '@/lib/supabase/catalog'
import { TemplatePreview } from './template-preview'

const DESCRIPTIONS: Record<string, string> = {
  'hook-insight-cta':  'Bold hook → key insight → strong CTA',
  'problem-solution':  'Relatable problem → clear solution',
  'step-by-step':      'Sequential steps through a process',
  'story-thread':      'Narrative arc: setup → struggle → resolution',
  'case-study':        'Situation → actions → measurable outcome',
}

type Props = { template: Template; selected: boolean; onSelect: (id: string) => void }

export function TemplateCard({ template, selected, onSelect }: Props) {
  const description = DESCRIPTIONS[template.slug] ?? ''
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(template.id)}
      className={[
        'relative w-full text-left rounded-xl border bg-white transition-all duration-200 overflow-hidden',
        selected
          ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-md'
          : 'border-gray-200 hover:border-amber-300 hover:shadow-md shadow-sm',
      ].join(' ')}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      animate={selected ? { scale: [0.97, 1.02, 1] } : { scale: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {/* Selected badge */}
      <AnimatePresence>
        {selected && (
          <motion.span
            className="absolute top-2.5 right-2.5 z-10 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.15, ease: 'backOut' }}
          >
            <CheckIcon />
          </motion.span>
        )}
      </AnimatePresence>

      {/* Preview area */}
      <div className={[
        'w-full aspect-[4/3] p-3 flex flex-col border-b',
        selected ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100',
      ].join(' ')}>
        <TemplatePreview slug={template.slug} />
      </div>

      {/* Info */}
      <div className="px-3.5 py-3">
        <p className="font-semibold text-gray-900 text-sm leading-snug">{template.name}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-1 leading-snug">{description}</p>
        )}
      </div>
    </motion.button>
  )
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
