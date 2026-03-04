'use client'

import type { HookStyle } from '@/lib/supabase/catalog'

type HookStyleCardProps = {
  style: HookStyle
  selected: boolean
  onSelect: (id: string) => void
}

export function HookStyleCard({ style, selected, onSelect }: HookStyleCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(style.id)}
      className={[
        'w-full text-left rounded-2xl border p-5 transition-all duration-150',
        'bg-white hover:shadow-sm',
        selected
          ? 'border-zinc-300 ring-2 ring-zinc-900'
          : 'border-zinc-100 hover:border-zinc-300',
      ].join(' ')}
    >
      {/* Icon + name row */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
          <HookStyleIcon name={style.name} />
        </div>
        <p className="font-semibold text-zinc-900 text-sm">{style.name}</p>
      </div>

      {/* Description */}
      {style.description && (
        <p className="text-sm text-zinc-500 mt-3 leading-snug">{style.description}</p>
      )}

      {/* Example */}
      {style.example && (
        <p className="mt-3 text-xs text-zinc-400 italic border-l-2 border-zinc-200 pl-3 leading-snug">
          &ldquo;{style.example}&rdquo;
        </p>
      )}

      {/* Select indicator */}
      <div className="mt-4 flex items-center gap-1.5">
        {selected ? (
          <>
            <CheckIcon className="w-4 h-4 text-zinc-900" />
            <span className="text-xs font-medium text-zinc-900">Selected</span>
          </>
        ) : (
          <span className="text-xs text-zinc-400">Select</span>
        )}
      </div>
    </button>
  )
}

function HookStyleIcon({ name }: { name: string }) {
  if (name === 'Contrarian') {
    // Two opposing arrows
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M3 6h9M3 6l3-3M3 6l3 3" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 12H6M15 12l-3-3M15 12l-3 3" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'Statistic') {
    // Bar chart
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="2" y="10" width="3.5" height="6" rx="1" fill="#71717a" />
        <rect x="7.25" y="6" width="3.5" height="10" rx="1" fill="#71717a" />
        <rect x="12.5" y="2" width="3.5" height="14" rx="1" fill="#71717a" />
      </svg>
    )
  }

  if (name === 'Curiosity') {
    // Question mark
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M7 6.5a2 2 0 013.73-.72C11.24 6.7 10.5 7.5 9 8.5V10" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="13" r="1" fill="#71717a" />
      </svg>
    )
  }

  if (name === 'Mistake') {
    // Warning triangle
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M9 2L16.5 15H1.5L9 2z" stroke="#71717a" strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="9" y1="7" x2="9" y2="10.5" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="12.5" r="0.75" fill="#71717a" />
      </svg>
    )
  }

  if (name === 'Hot Take') {
    // Flame
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M9 16c-3.31 0-6-2.24-6-5 0-2 1.5-3.5 2-4.5.5 1 1.5 1.5 2 1 0-2 1-4 3-5-.5 2 1 3 1.5 4 .5-1 .5-2 0-3 2 1.5 2.5 4 1.5 6.5C13.5 11 14 11.5 14 12.5 14 14.5 11.76 16 9 16z" stroke="#71717a" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  }

  // Fallback
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6.5" stroke="#71717a" strokeWidth="1.5" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  )
}
