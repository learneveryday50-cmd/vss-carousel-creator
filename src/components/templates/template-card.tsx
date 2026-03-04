'use client'

import type { Template } from '@/lib/supabase/catalog'

const DESCRIPTIONS: Record<string, string> = {
  'hook-insight-cta': 'Open with a bold hook, deliver one key insight, close with a strong CTA.',
  'problem-solution': 'Present a relatable problem, then walk through your solution.',
  'step-by-step': 'Break down a process into clear sequential steps.',
  'story-thread': 'Share a narrative arc — beginning, struggle, resolution.',
  'case-study': 'Show real results: situation, actions taken, measurable outcome.',
}

type TemplateCardProps = {
  template: Template
  selected: boolean
  onSelect: (id: string) => void
}

export function TemplateCard({ template, selected, onSelect }: TemplateCardProps) {
  const description = DESCRIPTIONS[template.slug] ?? ''

  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      className={[
        'w-full text-left rounded-2xl border p-5 transition-all duration-150',
        'bg-white hover:shadow-sm',
        selected
          ? 'border-zinc-300 ring-2 ring-zinc-900'
          : 'border-zinc-100 hover:border-zinc-300',
      ].join(' ')}
    >
      {/* Thumbnail placeholder */}
      <div className="w-full aspect-[4/3] rounded-xl bg-zinc-100 flex items-center justify-center">
        <SlideStackIcon />
      </div>

      {/* Template name */}
      <p className="font-semibold text-zinc-900 mt-3 text-sm">{template.name}</p>

      {/* Description */}
      {description && (
        <p className="text-sm text-zinc-500 mt-1 leading-snug">{description}</p>
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

function SlideStackIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="4" y="6" width="24" height="5" rx="1.5" fill="#d4d4d8" />
      <rect x="4" y="13.5" width="24" height="5" rx="1.5" fill="#d4d4d8" />
      <rect x="4" y="21" width="24" height="5" rx="1.5" fill="#d4d4d8" />
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
