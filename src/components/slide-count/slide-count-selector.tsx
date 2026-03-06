'use client'

import { useState } from 'react'

const SLIDE_COUNTS = [5, 7, 10] as const
export type SlideCount = (typeof SLIDE_COUNTS)[number]

const SLIDE_DESCRIPTIONS: Record<SlideCount, string> = {
  5:  'Short & punchy',
  7:  'Balanced depth',
  10: 'Comprehensive',
}

type Props = {
  value?: SlideCount
  onChange?: (count: SlideCount) => void
  defaultValue?: SlideCount
}

export function SlideCountSelector({ value: controlled, onChange, defaultValue = 7 }: Props) {
  const [internal, setInternal] = useState<SlideCount>(defaultValue)
  const isControlled = controlled !== undefined
  const selected = isControlled ? controlled : internal

  function handleSelect(count: SlideCount) {
    if (!isControlled) setInternal(count)
    onChange?.(count)
  }

  return (
    <div className="flex gap-3 flex-wrap">
      {SLIDE_COUNTS.map((count) => {
        const isSelected = selected === count
        return (
          <button
            key={count}
            type="button"
            aria-pressed={isSelected}
            onClick={() => handleSelect(count)}
            className={[
              'flex flex-col items-center gap-2.5 rounded-xl border p-4 w-28 transition-all duration-200',
              isSelected
                ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-50 shadow-md'
                : 'border-gray-200 bg-white shadow-sm hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5',
            ].join(' ')}
          >
            {/* Mini slide strip visual */}
            <div className="flex gap-0.5 items-end h-6">
              {Array.from({ length: count }).map((_, i) => (
                <div
                  key={i}
                  className={[
                    'w-2 rounded-sm transition-colors',
                    isSelected ? 'bg-amber-400' : 'bg-gray-300',
                  ].join(' ')}
                  style={{ height: `${50 + (i % 3) * 20}%` }}
                />
              ))}
            </div>
            <div className="text-center">
              <p className={`text-lg font-bold leading-none ${isSelected ? 'text-amber-700' : 'text-gray-800'}`}>
                {count}
              </p>
              <p className={`text-[10px] mt-0.5 font-medium ${isSelected ? 'text-amber-600' : 'text-gray-400'}`}>
                slides
              </p>
              <p className={`text-[10px] mt-1 ${isSelected ? 'text-amber-600' : 'text-gray-400'}`}>
                {SLIDE_DESCRIPTIONS[count]}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
