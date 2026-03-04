'use client'

import { useState } from 'react'
import type { DesignStyle } from '@/lib/supabase/catalog'
import { DesignStyleCard } from './design-style-card'

type DesignStyleSelectorProps = {
  styles: DesignStyle[]
  selectedId?: string
  onSelect?: (id: string) => void
}

export function DesignStyleSelector({
  styles,
  selectedId: controlledSelectedId,
  onSelect,
}: DesignStyleSelectorProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | undefined>(undefined)

  const isControlled = controlledSelectedId !== undefined
  const selectedId = isControlled ? controlledSelectedId : internalSelectedId

  function handleSelect(id: string) {
    if (!isControlled) {
      setInternalSelectedId(id)
    }
    onSelect?.(id)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {styles.map((style) => (
        <DesignStyleCard
          key={style.id}
          style={style}
          selected={selectedId === style.id}
          onSelect={handleSelect}
        />
      ))}
    </div>
  )
}
