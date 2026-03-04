'use client'

import { useState, useActionState } from 'react'
import type { ImageStyle } from '@/lib/supabase/catalog'
import { createCustomStyleAction, deleteCustomStyleAction } from '@/app/(protected)/templates/actions'

type StyleSelectorProps = {
  styles: ImageStyle[]
  selectedId?: string
  onSelect?: (id: string) => void
}

export function StyleSelector({ styles, selectedId: controlledSelectedId, onSelect }: StyleSelectorProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | undefined>(undefined)

  const isControlled = controlledSelectedId !== undefined
  const selectedId = isControlled ? controlledSelectedId : internalSelectedId

  function handleSelect(id: string) {
    if (!isControlled) setInternalSelectedId(id)
    onSelect?.(id)
  }

  const builtIns = styles.filter((s) => !s.is_custom)
  const customs = styles.filter((s) => s.is_custom)

  return (
    <div className="space-y-6">
      {/* Section 1: Built-in styles */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
          Built-in styles
        </p>
        <div className="grid grid-cols-2 gap-3">
          {builtIns.map((style) => {
            const isSelected = selectedId === style.id
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => handleSelect(style.id)}
                className={[
                  'flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-all duration-150',
                  isSelected
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300',
                ].join(' ')}
              >
                <StyleIcon name={style.name} selected={isSelected} />
                <span className="text-sm font-medium leading-snug">{style.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Section 2: Custom styles */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
          Custom styles
        </p>
        <div className="space-y-2">
          {customs.map((style) => (
            <div key={style.id} className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleSelect(style.id)}
                className={[
                  'rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-150',
                  selectedId === style.id
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-300',
                ].join(' ')}
              >
                {style.name}
              </button>
              <DeleteStyleForm id={style.id} />
            </div>
          ))}
        </div>
        <div className="mt-3">
          <AddCustomStyleForm />
        </div>
      </div>
    </div>
  )
}

function AddCustomStyleForm() {
  const [state, formAction, isPending] = useActionState(createCustomStyleAction, null)

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        name="name"
        type="text"
        placeholder="Style name..."
        required
        disabled={isPending}
        className="flex-1 h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-0 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isPending}
        className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Adding...' : 'Add'}
      </button>
      {state?.error && (
        <p className="text-xs text-red-500 mt-1">{state.error}</p>
      )}
    </form>
  )
}

function DeleteStyleForm({ id }: { id: string }) {
  return (
    <form action={deleteCustomStyleAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
        aria-label="Delete style"
      >
        <XIcon className="w-3.5 h-3.5" />
      </button>
    </form>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  )
}

function StyleIcon({ name, selected }: { name: string; selected: boolean }) {
  const color = selected ? 'white' : '#71717a'

  if (name === 'Technical Annotation & Realism') {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="6" stroke={color} strokeWidth="1.5" />
        <line x1="9" y1="3" x2="9" y2="5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="9" y1="13" x2="9" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="3" y1="9" x2="5" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13" y1="9" x2="15" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'Notebook') {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="4" y="2" width="10" height="14" rx="1" stroke={color} strokeWidth="1.5" />
        <line x1="7" y1="6" x2="12" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="7" y1="9" x2="12" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="7" y1="12" x2="10" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'Whiteboard Diagram') {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="14" height="10" rx="1" stroke={color} strokeWidth="1.5" />
        <circle cx="6" cy="7" r="1.5" stroke={color} strokeWidth="1.25" />
        <circle cx="12" cy="7" r="1.5" stroke={color} strokeWidth="1.25" />
        <line x1="7.5" y1="7" x2="10.5" y2="7" stroke={color} strokeWidth="1.25" />
        <line x1="9" y1="14" x2="9" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'Comic Strip Storyboard') {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
        <rect x="10" y="2" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
        <rect x="2" y="10" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
        <rect x="10" y="10" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
      </svg>
    )
  }

  // Fallback generic icon
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="12" height="12" rx="2" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}
