'use client'

import { useState } from 'react'
import type { HookStyle } from '@/lib/supabase/catalog'
import { HookStyleCard } from './hook-style-card'

type HookStyleSelectorProps = {
  styles: HookStyle[]
  selectedId?: string
  onSelect?: (id: string) => void
}

export function HookStyleSelector({
  styles,
  selectedId: controlledSelectedId,
  onSelect,
}: HookStyleSelectorProps) {
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
        <HookStyleCard
          key={style.id}
          style={style}
          selected={selectedId === style.id}
          onSelect={handleSelect}
        />
      ))}
    </div>
  )
}
