'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { TemplateAsset } from '@/lib/supabase/catalog'

type Props = {
  asset: TemplateAsset
  selected: boolean
  onSelect: (id: string) => void
}

export function TemplateAssetCard({ asset, selected, onSelect }: Props) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(asset.id)}
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

      {/* 3-slot image strip: Font | Content | CTA */}
      <div className={[
        'w-full p-2.5 border-b grid grid-cols-3 gap-2',
        selected ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100',
      ].join(' ')}>
        <ImageSlot url={asset.template_font_url} label="Font" />
        <ImageSlot url={asset.template_content_url} label="Content" />
        <ImageSlot url={asset.template_cta_url} label="CTA" />
      </div>

      {/* Name + description */}
      <div className="px-3.5 py-3">
        <p className="font-semibold text-gray-900 text-sm leading-snug">{asset.name}</p>
        {asset.description && (
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{asset.description}</p>
        )}
      </div>
    </motion.button>
  )
}

function ImageSlot({ url, label }: { url: string | null; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="aspect-square w-full rounded-md overflow-hidden bg-gray-200">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[9px] text-gray-400">—</span>
          </div>
        )}
      </div>
      <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 text-center">
        {label}
      </p>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
