'use client'

import { useState } from 'react'

const SLIDE_COUNTS = [5, 7, 10] as const
export type SlideCount = (typeof SLIDE_COUNTS)[number]

type SlideCountSelectorProps = {
  value?: SlideCount
  onChange?: (count: SlideCount) => void
  defaultValue?: SlideCount
}

export function SlideCountSelector({
  value: controlledValue,
  onChange,
  defaultValue = 7,
}: SlideCountSelectorProps) {
  const [internalValue, setInternalValue] = useState<SlideCount>(defaultValue)

  const isControlled = controlledValue !== undefined
  const selected = isControlled ? controlledValue : internalValue

  function handleSelect(count: SlideCount) {
    if (!isControlled) {
      setInternalValue(count)
    }
    onChange?.(count)
  }

  return (
    <div className="inline-flex rounded-xl border border-zinc-200 overflow-hidden">
      {SLIDE_COUNTS.map((count, index) => (
        <button
          key={count}
          type="button"
          aria-pressed={selected === count}
          onClick={() => handleSelect(count)}
          className={[
            'px-6 py-2.5 text-sm font-medium transition-colors duration-150',
            index < SLIDE_COUNTS.length - 1 ? 'border-r border-zinc-200' : '',
            selected === count
              ? 'bg-zinc-900 text-white'
              : 'bg-white text-zinc-700 hover:bg-zinc-50',
          ].join(' ')}
        >
          {count} slides
        </button>
      ))}
    </div>
  )
}
