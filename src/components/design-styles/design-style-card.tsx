'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { DesignStyle } from '@/types/catalog'

type Props = {
  style: DesignStyle
  selected: boolean
  onSelect: (id: string) => void
}

export function DesignStyleCard({ style, selected, onSelect }: Props) {
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

      {/* Visual preview */}
      <div className={[
        'w-full aspect-[4/3] border-b flex items-center justify-center',
        selected ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100',
      ].join(' ')}>
        <DesignPreview name={style.name} />
      </div>

      {/* Info */}
      <div className="px-3.5 py-3">
        <p className="font-semibold text-gray-900 text-sm leading-snug">{style.name}</p>
        {style.description && (
          <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-2">{style.description}</p>
        )}
      </div>
    </motion.button>
  )
}

function DesignPreview({ name }: { name: string }) {
  if (name === 'Minimal') {
    return (
      <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
        {/* Centered minimal layout */}
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
        {/* Two-column professional layout */}
        <rect x="6" y="8" width="68" height="7" rx="2" fill="#f59e0b" />
        <rect x="6" y="19" width="28" height="30" rx="2" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
        <rect x="38" y="19" width="36" height="13" rx="2" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
        <rect x="38" y="36" width="36" height="13" rx="2" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
        {/* Content bars */}
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
        {/* Bold full-bleed header */}
        <rect x="6" y="6" width="68" height="22" rx="3" fill="#f59e0b" />
        <rect x="11" y="12" width="40" height="5" rx="1.5" fill="white" opacity="0.9" />
        <rect x="11" y="20" width="28" height="3.5" rx="1" fill="white" opacity="0.6" />
        {/* Content */}
        <rect x="6" y="33" width="44" height="5" rx="1.5" fill="#374151" />
        <rect x="6" y="41" width="36" height="4" rx="1.5" fill="#6b7280" />
        <rect x="6" y="48" width="28" height="4" rx="1.5" fill="#9ca3af" />
      </svg>
    )
  }
  if (name === 'Corporate') {
    return (
      <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
        {/* Corporate header with rule */}
        <rect x="6" y="8" width="68" height="7" rx="1.5" fill="#1f2937" />
        <rect x="6" y="8" width="8" height="7" rx="1.5" fill="#f59e0b" />
        {/* Rule lines */}
        <line x1="6" y1="20" x2="74" y2="20" stroke="#e5e7eb" strokeWidth="1" />
        <rect x="6" y="24" width="68" height="4" rx="1.5" fill="#d1d5db" />
        <rect x="6" y="31" width="56" height="4" rx="1.5" fill="#e5e7eb" />
        <rect x="6" y="38" width="60" height="4" rx="1.5" fill="#d1d5db" />
        <line x1="6" y1="47" x2="74" y2="47" stroke="#e5e7eb" strokeWidth="1" />
        {/* CTA bar */}
        <rect x="6" y="50" width="22" height="7" rx="2" fill="#f59e0b" />
      </svg>
    )
  }
  if (name === 'Social') {
    return (
      <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
        {/* Avatar-centered social layout */}
        <circle cx="40" cy="22" r="14" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.5" />
        <circle cx="40" cy="18" r="6" fill="#d1d5db" />
        <path d="M26 32 Q40 26 54 32" fill="#d1d5db" />
        {/* Name bar */}
        <rect x="22" y="40" width="36" height="5" rx="1.5" fill="#374151" />
        {/* Handle */}
        <rect x="28" y="48" width="24" height="3.5" rx="1.5" fill="#9ca3af" />
      </svg>
    )
  }
  return (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
      <rect x="10" y="10" width="60" height="40" rx="3" stroke="#e5e7eb" strokeWidth="2" />
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
