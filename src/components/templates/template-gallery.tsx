'use client'

import { useState } from 'react'
import type { Template } from '@/lib/supabase/catalog'
import { TemplateCard } from './template-card'

type TemplateGalleryProps = {
  templates: Template[]
  selectedId?: string
  onSelect?: (id: string) => void
}

export function TemplateGallery({
  templates,
  selectedId: controlledSelectedId,
  onSelect,
}: TemplateGalleryProps) {
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
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          selected={selectedId === template.id}
          onSelect={handleSelect}
        />
      ))}
    </div>
  )
}
