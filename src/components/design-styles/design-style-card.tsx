'use client'

import type { DesignStyle } from '@/lib/supabase/catalog'

type DesignStyleCardProps = {
  style: DesignStyle
  selected: boolean
  onSelect: (id: string) => void
}

export function DesignStyleCard({ style, selected, onSelect }: DesignStyleCardProps) {
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
      {/* Preview placeholder */}
      <div className="w-full aspect-[4/3] rounded-xl bg-zinc-100 flex items-center justify-center">
        <DesignStyleIcon name={style.name} />
      </div>

      {/* Style name */}
      <p className="font-semibold text-zinc-900 mt-3 text-sm">{style.name}</p>

      {/* Description */}
      {style.description && (
        <p className="text-sm text-zinc-500 mt-1 leading-snug">{style.description}</p>
      )}

      {/* Select indicator */}
      <div className="mt-3 flex items-center gap-1.5">
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

function DesignStyleIcon({ name }: { name: string }) {
  if (name === 'Minimal') {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="8" y="10" width="16" height="2" rx="1" fill="#d4d4d8" />
        <rect x="11" y="15" width="10" height="1.5" rx="0.75" fill="#d4d4d8" />
        <rect x="13" y="19.5" width="6" height="1.5" rx="0.75" fill="#d4d4d8" />
      </svg>
    )
  }

  if (name === 'Professional') {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="6" y="8" width="20" height="3" rx="1" fill="#d4d4d8" />
        <rect x="6" y="13" width="8" height="10" rx="1" fill="#e4e4e7" />
        <rect x="16" y="13" width="10" height="4.5" rx="1" fill="#e4e4e7" />
        <rect x="16" y="19" width="10" height="4" rx="1" fill="#e4e4e7" />
      </svg>
    )
  }

  if (name === 'Bold') {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="4" y="6" width="24" height="8" rx="2" fill="#a1a1aa" />
        <rect x="4" y="17" width="14" height="3" rx="1" fill="#d4d4d8" />
        <rect x="4" y="22" width="10" height="3" rx="1" fill="#d4d4d8" />
      </svg>
    )
  }

  if (name === 'Corporate') {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="6" y="6" width="20" height="2.5" rx="1" fill="#a1a1aa" />
        <rect x="6" y="11" width="20" height="1.5" rx="0.75" fill="#d4d4d8" />
        <rect x="6" y="14.5" width="20" height="1.5" rx="0.75" fill="#d4d4d8" />
        <rect x="6" y="18" width="20" height="1.5" rx="0.75" fill="#d4d4d8" />
        <rect x="6" y="23" width="8" height="2.5" rx="1" fill="#a1a1aa" />
      </svg>
    )
  }

  if (name === 'Social') {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="12" r="5" fill="#e4e4e7" />
        <rect x="8" y="20" width="16" height="2" rx="1" fill="#d4d4d8" />
        <rect x="10" y="24" width="12" height="2" rx="1" fill="#d4d4d8" />
      </svg>
    )
  }

  // Fallback
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="6" y="6" width="20" height="20" rx="2" stroke="#d4d4d8" strokeWidth="1.5" />
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
