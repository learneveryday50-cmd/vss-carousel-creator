'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { HookStyle } from '@/types/catalog'

type Props = {
  style: HookStyle
  selected: boolean
  onSelect: (id: string) => void
}

export function HookStyleCard({ style, selected, onSelect }: Props) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(style.id)}
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

      {/* Visual slide layout preview */}
      <div className={[
        'w-full aspect-[4/3] border-b flex items-center justify-center p-3',
        selected ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100',
      ].join(' ')}>
        <HookSlidePreview name={style.name} />
      </div>

      {/* Info */}
      <div className="px-3.5 py-3">
        <p className="font-semibold text-gray-900 text-sm leading-tight">{style.name}</p>
        {style.example && (
          <p className="text-xs text-gray-500 mt-1 italic leading-snug line-clamp-2">
            &ldquo;{style.example}&rdquo;
          </p>
        )}
      </div>
    </motion.button>
  )
}

/* ── Slide layout SVG previews for each hook style ────────────────────────── */

function HookSlidePreview({ name }: { name: string }) {
  switch (name) {
    case 'Contrarian':   return <ContrarianPreview />
    case 'Statistic':    return <StatisticPreview />
    case 'Curiosity':    return <CuriosityPreview />
    case 'Mistake':      return <MistakePreview />
    case 'Hot Take':     return <HotTakePreview />
    default:             return <DefaultHookPreview />
  }
}

/* Contrarian: bold opposing statement layout */
function ContrarianPreview() {
  return (
    <svg className="w-full h-full" viewBox="0 0 100 75" fill="none">
      {/* Opposing arrows at top */}
      <path d="M18 14 L42 14" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <polygon points="38,11 43,14 38,17" fill="#f59e0b" />
      <path d="M82 14 L58 14" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
      <polygon points="62,11 57,14 62,17" fill="#6b7280" />
      {/* Bold statement bars */}
      <rect x="4" y="23" width="92" height="8" rx="2.5" fill="#1f2937" />
      <rect x="4" y="34" width="72" height="8" rx="2.5" fill="#1f2937" />
      {/* Thin divider */}
      <line x1="4" y1="48" x2="48" y2="48" stroke="#e5e7eb" strokeWidth="1" />
      {/* Supporting text */}
      <rect x="4" y="54" width="80" height="3.5" rx="1.5" fill="#d1d5db" />
      <rect x="4" y="60" width="60" height="3.5" rx="1.5" fill="#e5e7eb" />
    </svg>
  )
}

/* Statistic: large number with context */
function StatisticPreview() {
  return (
    <svg className="w-full h-full" viewBox="0 0 100 75" fill="none">
      {/* Big number */}
      <text x="50" y="36" textAnchor="middle" fontSize="28" fontWeight="800" fill="#f59e0b" fontFamily="sans-serif">73%</text>
      {/* Context line */}
      <rect x="12" y="43" width="76" height="4" rx="2" fill="#374151" />
      {/* Body */}
      <rect x="18" y="53" width="64" height="3.5" rx="1.5" fill="#d1d5db" />
      <rect x="22" y="59" width="56" height="3.5" rx="1.5" fill="#e5e7eb" />
      {/* Source line */}
      <rect x="30" y="67" width="40" height="2.5" rx="1.25" fill="#e5e7eb" />
    </svg>
  )
}

/* Curiosity: question gap layout */
function CuriosityPreview() {
  return (
    <svg className="w-full h-full" viewBox="0 0 100 75" fill="none">
      {/* Big question mark */}
      <text x="14" y="38" fontSize="32" fontWeight="800" fill="#f59e0b" fontFamily="sans-serif" opacity="0.9">?</text>
      {/* Question text */}
      <rect x="30" y="10" width="66" height="6" rx="2" fill="#1f2937" />
      <rect x="30" y="19" width="56" height="6" rx="2" fill="#374151" />
      {/* Gap dots */}
      <circle cx="30" cy="38" r="2.5" fill="#d1d5db" />
      <circle cx="40" cy="38" r="2.5" fill="#d1d5db" />
      <circle cx="50" cy="38" r="2.5" fill="#d1d5db" />
      {/* Answer hint */}
      <rect x="4" y="50" width="92" height="5" rx="2" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="8" y="52.5" width="60" height="2" rx="1" fill="#d1d5db" />
      <rect x="4" y="59" width="76" height="3.5" rx="1.5" fill="#e5e7eb" />
      <rect x="4" y="65" width="56" height="3.5" rx="1.5" fill="#f3f4f6" />
    </svg>
  )
}

/* Mistake: warning-style layout */
function MistakePreview() {
  return (
    <svg className="w-full h-full" viewBox="0 0 100 75" fill="none">
      {/* Warning badge */}
      <rect x="4" y="5" width="40" height="13" rx="3" fill="#fef2f2" stroke="#fca5a5" strokeWidth="1" />
      <text x="10" y="14.5" fontSize="7" fontWeight="700" fill="#ef4444" fontFamily="sans-serif">⚠ MISTAKE</text>
      {/* Bold headline */}
      <rect x="4" y="24" width="92" height="8" rx="2.5" fill="#1f2937" />
      <rect x="4" y="35" width="76" height="8" rx="2.5" fill="#374151" />
      {/* Fix divider */}
      <line x1="4" y1="50" x2="96" y2="50" stroke="#fca5a5" strokeWidth="0.8" />
      {/* How to fix */}
      <rect x="4" y="56" width="40" height="3.5" rx="1.5" fill="#d1d5db" />
      <rect x="4" y="62" width="80" height="3.5" rx="1.5" fill="#e5e7eb" />
      <rect x="4" y="68" width="64" height="3.5" rx="1.5" fill="#d1d5db" />
    </svg>
  )
}

/* Hot Take: bold opinion layout */
function HotTakePreview() {
  return (
    <svg className="w-full h-full" viewBox="0 0 100 75" fill="none">
      {/* HOT TAKE label */}
      <rect x="4" y="5" width="92" height="14" rx="3" fill="#f59e0b" />
      <text x="50" y="14.5" textAnchor="middle" fontSize="8" fontWeight="800" fill="white" fontFamily="sans-serif" letterSpacing="1">HOT TAKE</text>
      {/* Bold lines */}
      <rect x="4" y="24" width="88" height="9" rx="2.5" fill="#1f2937" />
      <rect x="4" y="36" width="72" height="9" rx="2.5" fill="#374151" />
      <rect x="4" y="48" width="52" height="9" rx="2.5" fill="#4b5563" />
      {/* Reaction text */}
      <rect x="4" y="62" width="76" height="3.5" rx="1.5" fill="#e5e7eb" />
    </svg>
  )
}

function DefaultHookPreview() {
  return (
    <svg className="w-full h-full" viewBox="0 0 100 75" fill="none">
      <rect x="4" y="8" width="92" height="10" rx="2.5" fill="#f59e0b" opacity="0.8" />
      <rect x="4" y="26" width="80" height="4.5" rx="1.5" fill="#d1d5db" />
      <rect x="4" y="33" width="64" height="4.5" rx="1.5" fill="#e5e7eb" />
      <rect x="4" y="40" width="72" height="4.5" rx="1.5" fill="#d1d5db" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
