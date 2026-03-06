'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Template } from '@/lib/supabase/catalog'
import { TemplateCard } from './template-card'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
}

type TemplateGalleryProps = {
  templates: Template[]
  selectedId?: string
  onSelect?: (id: string) => void
}

export function TemplateGallery({ templates, selectedId: controlledSelectedId, onSelect }: TemplateGalleryProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | undefined>(undefined)
  const isControlled = controlledSelectedId !== undefined
  const selectedId = isControlled ? controlledSelectedId : internalSelectedId

  function handleSelect(id: string) {
    if (!isControlled) setInternalSelectedId(id)
    onSelect?.(id)
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {templates.map((template) => (
        <motion.div key={template.id} variants={item}>
          <TemplateCard
            template={template}
            selected={selectedId === template.id}
            onSelect={handleSelect}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
