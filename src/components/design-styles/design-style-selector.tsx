'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { DesignStyle } from '@/lib/supabase/catalog'
import { DesignStyleCard } from './design-style-card'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
}

type DesignStyleSelectorProps = {
  styles: DesignStyle[]
  selectedId?: string
  onSelect?: (id: string) => void
}

export function DesignStyleSelector({ styles, selectedId: controlledSelectedId, onSelect }: DesignStyleSelectorProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | undefined>(undefined)
  const isControlled = controlledSelectedId !== undefined
  const selectedId = isControlled ? controlledSelectedId : internalSelectedId

  function handleSelect(id: string) {
    if (!isControlled) setInternalSelectedId(id)
    onSelect?.(id)
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {styles.map((style) => (
        <motion.div key={style.id} variants={item}>
          <DesignStyleCard
            style={style}
            selected={selectedId === style.id}
            onSelect={handleSelect}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
