'use client'

import { motion } from 'framer-motion'
import type { TemplateAsset } from '@/types/catalog'
import { TemplateAssetCard } from './template-asset-card'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
}

type Props = {
  assets: TemplateAsset[]
  selectedId?: string
  onSelect?: (id: string) => void
}

export function TemplateAssetSelector({ assets, selectedId, onSelect }: Props) {
  if (assets.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-3">
        No template styles available yet. Add rows to the <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">template_assets</code> table in Supabase.
      </p>
    )
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {assets.map((asset) => (
        <motion.div key={asset.id} variants={item}>
          <TemplateAssetCard
            asset={asset}
            selected={selectedId === asset.id}
            onSelect={onSelect ?? (() => {})}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
