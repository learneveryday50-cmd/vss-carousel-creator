'use client'

import { useState, useActionState } from 'react'
import type { ImageStyle } from '@/lib/supabase/catalog'
import { createCustomStyleAction, deleteCustomStyleAction } from '@/app/(protected)/templates/actions'

type Props = {
  styles: ImageStyle[]
  selectedId?: string
  onSelect?: (id: string) => void
}

export function StyleSelector({ styles, selectedId: controlledId, onSelect }: Props) {
  const [internalId, setInternalId] = useState<string | undefined>(undefined)
  const isControlled = controlledId !== undefined
  const selectedId = isControlled ? controlledId : internalId

  function handleSelect(id: string) {
    if (!isControlled) setInternalId(id)
    onSelect?.(id)
  }

  const builtIns = styles.filter((s) => !s.is_custom)
  const customs = styles.filter((s) => s.is_custom)

  return (
    <div className="space-y-6">

      {/* Built-in styles */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-3">Built-in</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {builtIns.map((style) => {
            const isSelected = selectedId === style.id
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => handleSelect(style.id)}
                className={[
                  'relative w-full text-left rounded-xl border transition-all duration-200 bg-white overflow-hidden',
                  'shadow-sm',
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                    : 'border-gray-200 hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5',
                ].join(' ')}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm">
                    <CheckIcon />
                  </span>
                )}
                {/* Full-area visual preview */}
                <div className={[
                  'w-full aspect-[4/3] overflow-hidden border-b',
                  isSelected ? 'border-amber-100' : 'border-gray-100',
                ].join(' ')} style={{ display: 'block', position: 'relative' }}>
                  <ImageStylePreview name={style.name} index={builtIns.indexOf(style)} />
                </div>
                {/* Label */}
                <div className="px-3 py-2.5">
                  <p className="text-xs font-semibold text-gray-900 leading-tight">{style.name}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom styles */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Custom</p>

        {customs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {customs.map((style) => (
              <div key={style.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSelect(style.id)}
                  className={[
                    'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-150',
                    selectedId === style.id
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-gray-900',
                  ].join(' ')}
                >
                  {style.name}
                </button>
                <DeleteStyleForm id={style.id} />
              </div>
            ))}
          </div>
        )}

        {customs.length === 0 && (
          <p className="text-xs text-gray-400 mb-3">No custom styles yet. Add one below.</p>
        )}

        <AddCustomStyleForm />
      </div>

    </div>
  )
}

/* ── Visual previews — index-based to avoid name-mismatch bugs ──────────── */

const PREVIEW_COMPONENTS = [
  TechnicalAnnotationPreview,
  NotebookPreview,
  WhiteboardPreview,
  ComicStripPreview,
]

function ImageStylePreview({ name, index }: { name: string; index: number }) {
  const Component = PREVIEW_COMPONENTS[index]
  if (Component) return <Component />
  // fallback: name-based
  if (name === 'Technical Annotation & Realism') return <TechnicalAnnotationPreview />
  if (name === 'Notebook') return <NotebookPreview />
  if (name === 'Whiteboard Diagram') return <WhiteboardPreview />
  if (name === 'Comic Strip Storyboard') return <ComicStripPreview />
  return <FallbackPreview />
}

/* ── 1. Technical Annotation — dark navy blueprint ────────────────────────── */
function TechnicalAnnotationPreview() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 120 90" preserveAspectRatio="xMidYMid slice">
      {/* Navy background */}
      <rect width="120" height="90" fill="#0f1f3d" />
      {/* Dot grid */}
      {[20,40,60,80,100].flatMap(x =>
        [15,30,45,60,75].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="0.7" fill="#1e3a5f" />
        ))
      )}
      {/* Corner marks */}
      <path d="M6 18 L6 6 L18 6" stroke="#38bdf8" strokeWidth="1" fill="none"/>
      <path d="M114 18 L114 6 L102 6" stroke="#38bdf8" strokeWidth="1" fill="none"/>
      <path d="M6 72 L6 84 L18 84" stroke="#38bdf8" strokeWidth="1" fill="none"/>
      <path d="M114 72 L114 84 L102 84" stroke="#38bdf8" strokeWidth="1" fill="none"/>
      {/* Dashed component box */}
      <rect x="34" y="22" width="52" height="38" rx="1.5"
        stroke="#38bdf8" strokeWidth="1.4" strokeDasharray="5 2.5" fill="#0a3060" fillOpacity="0.7"/>
      {/* Crosshair */}
      <line x1="34" y1="41" x2="86" y2="41" stroke="#1d4ed8" strokeWidth="0.6"/>
      <line x1="60" y1="22" x2="60" y2="60" stroke="#1d4ed8" strokeWidth="0.6"/>
      <circle cx="60" cy="41" r="3.5" fill="#38bdf8"/>
      <circle cx="60" cy="41" r="1.4" fill="#0f1f3d"/>
      {/* Left callout */}
      <line x1="8" y1="41" x2="32" y2="41" stroke="#7dd3fc" strokeWidth="1.2"/>
      <polygon points="30,38.5 34,41 30,43.5" fill="#7dd3fc"/>
      <rect x="1" y="33" width="24" height="13" rx="1.5" fill="#0a2540" stroke="#38bdf8" strokeWidth="0.8"/>
      <rect x="4" y="37" width="14" height="2.5" rx="0.8" fill="#7dd3fc"/>
      <rect x="4" y="41.5" width="10" height="2" rx="0.8" fill="#1d4ed8"/>
      {/* Top callout */}
      <line x1="60" y1="7" x2="60" y2="20" stroke="#7dd3fc" strokeWidth="1.2"/>
      <polygon points="57.5,18 60,22 62.5,18" fill="#7dd3fc"/>
      <rect x="44" y="1" width="32" height="12" rx="1.5" fill="#0a2540" stroke="#38bdf8" strokeWidth="0.8"/>
      <rect x="47" y="4.5" width="18" height="2.5" rx="0.8" fill="#7dd3fc"/>
      <rect x="47" y="8.5" width="12" height="2" rx="0.8" fill="#1d4ed8"/>
      {/* Bottom note box */}
      <line x1="60" y1="60" x2="60" y2="70" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 1.5"/>
      <rect x="34" y="70" width="52" height="13" rx="1.5" fill="#0a2540" stroke="#38bdf8" strokeWidth="0.8"/>
      <rect x="38" y="74" width="26" height="2.5" rx="0.8" fill="#7dd3fc"/>
      <rect x="38" y="78" width="18" height="2" rx="0.8" fill="#1d4ed8"/>
    </svg>
  )
}

/* ── 2. Notebook — warm cream ruled paper ────────────────────────────────── */
function NotebookPreview() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 120 90" preserveAspectRatio="xMidYMid slice">
      {/* Cream background */}
      <rect width="120" height="90" fill="#fefce8"/>
      {/* Ruled lines */}
      {[16,26,36,46,56,66,76,86].map(y => (
        <line key={y} x1="22" y1={y} x2="117" y2={y} stroke="#93c5fd" strokeWidth="1"/>
      ))}
      {/* Red left margin */}
      <line x1="22" y1="0" x2="22" y2="90" stroke="#f87171" strokeWidth="2.5"/>
      {/* Binding holes */}
      {[10,25,40,55,70,85].map(y => (
        <circle key={y} cx="8" cy={y} r="4" stroke="#cbd5e1" strokeWidth="1.5" fill="#f1f5f9"/>
      ))}
      {/* Handwriting strokes */}
      <path d="M26 16 C36 14 50 18 64 16 C76 14 88 17 104 16" stroke="#292524" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M26 26 C40 24 60 28 80 26 C92 24 102 27 112 26" stroke="#292524" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      {/* Yellow highlight band */}
      <rect x="26" y="31" width="78" height="10" rx="1" fill="#fde047" fillOpacity="0.6"/>
      <path d="M26 36 C38 34 58 38 80 36 C96 34 106 37 114 36" stroke="#292524" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      {/* More lines */}
      <path d="M26 46 C34 44 48 48 68 46 C82 44 96 47 110 46" stroke="#292524" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
      <path d="M26 56 C40 54 62 58 84 56 C96 54 106 57 114 56" stroke="#292524" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
      <path d="M26 66 C36 64 52 68 72 66 C86 64 100 67 112 66" stroke="#292524" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

/* ── 3. Whiteboard — white board with frame and marker drawings ──────────── */
function WhiteboardPreview() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 120 90" preserveAspectRatio="xMidYMid slice">
      {/* Light gray wall background */}
      <rect width="120" height="90" fill="#e2e8f0"/>
      {/* Board surface */}
      <rect x="5" y="5" width="110" height="74" rx="2" fill="white" stroke="#94a3b8" strokeWidth="2"/>
      {/* Bottom tray */}
      <rect x="5" y="79" width="110" height="9" rx="1" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5"/>
      {/* Markers in tray */}
      <rect x="18" y="81" width="20" height="4" rx="2" fill="#3b82f6"/>
      <rect x="44" y="81" width="16" height="4" rx="2" fill="#ef4444"/>
      <rect x="66" y="81" width="18" height="4" rx="2" fill="#22c55e"/>
      <rect x="90" y="81" width="14" height="4" rx="2" fill="#f97316"/>
      {/* Whiteboard drawings — thick marker style */}
      {/* Problem box (left) */}
      <rect x="14" y="14" width="32" height="24" rx="3" stroke="#1e293b" strokeWidth="3" fill="none"/>
      <circle cx="24" cy="24" r="3.5" fill="#ef4444"/>
      <circle cx="36" cy="24" r="3.5" fill="#ef4444"/>
      <path d="M22 32 Q30 38 38 32" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Arrow */}
      <line x1="48" y1="26" x2="62" y2="26" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round"/>
      <polygon points="58,22 64,26 58,30" fill="#1e293b"/>
      {/* Solution circle (right) */}
      <circle cx="82" cy="26" r="16" stroke="#22c55e" strokeWidth="3.5" fill="#f0fdf4"/>
      <path d="M73 26 L79 33 L91 18" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Text lines at bottom */}
      <rect x="14" y="52" width="92" height="5" rx="2.5" fill="#3b82f6" fillOpacity="0.3"/>
      <rect x="14" y="61" width="72" height="5" rx="2.5" fill="#94a3b8" fillOpacity="0.4"/>
    </svg>
  )
}

/* ── 4. Comic Strip — black-guttered 2×2 vivid panels ───────────────────── */
function ComicStripPreview() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 120 90" preserveAspectRatio="xMidYMid slice">
      {/* Black gutter background */}
      <rect width="120" height="90" fill="#111827"/>
      {/* Panel 1 — yellow: happy face */}
      <rect x="3" y="3" width="55" height="40" fill="#fef9c3"/>
      <circle cx="30" cy="21" r="13" stroke="#111827" strokeWidth="2.5" fill="#fde047"/>
      <circle cx="24" cy="17" r="3" fill="#111827"/>
      <circle cx="36" cy="17" r="3" fill="#111827"/>
      <path d="M22 25 Q30 33 38 25" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Panel 2 — orange: action star */}
      <rect x="62" y="3" width="55" height="40" fill="#ffedd5"/>
      <path d="M89 9 L92 19 L102 14 L95 22 L105 26 L95 30 L102 38 L92 33 L89 43 L86 33 L76 38 L83 30 L73 26 L83 22 L76 14 L86 19 Z"
        fill="#f97316" stroke="#111827" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="89" cy="26" r="6" fill="#111827"/>
      <circle cx="89" cy="26" r="2.5" fill="white"/>
      {/* Panel 3 — blue sky: outdoor scene */}
      <rect x="3" y="47" width="55" height="40" fill="#bfdbfe"/>
      <rect x="3" y="69" width="55" height="18" fill="#86efac"/>
      <circle cx="20" cy="58" r="10" fill="#fbbf24"/>
      <rect x="36" y="58" width="16" height="14" fill="white" stroke="#1e293b" strokeWidth="1.5"/>
      <rect x="40" y="63" width="8" height="9" fill="#93c5fd"/>
      <polygon points="36,58 44,48 52,58" fill="#94a3b8" stroke="#1e293b" strokeWidth="1"/>
      {/* Panel 4 — pink: shocked face */}
      <rect x="62" y="47" width="55" height="40" fill="#fce7f3"/>
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const r = Math.PI / 180
        return (
          <line key={i}
            x1={89 + 14 * Math.cos(deg * r)} y1={67 + 14 * Math.sin(deg * r)}
            x2={89 + 22 * Math.cos(deg * r)} y2={67 + 22 * Math.sin(deg * r)}
            stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"/>
        )
      })}
      <circle cx="89" cy="67" r="12" stroke="#111827" strokeWidth="2.5" fill="#fef9c3"/>
      <circle cx="83" cy="63" r="3" stroke="#111827" strokeWidth="1.5" fill="white"/>
      <circle cx="95" cy="63" r="3" stroke="#111827" strokeWidth="1.5" fill="white"/>
      <circle cx="83" cy="63" r="1.5" fill="#111827"/>
      <circle cx="95" cy="63" r="1.5" fill="#111827"/>
      <ellipse cx="89" cy="73" rx="4" ry="4.5" stroke="#111827" strokeWidth="1.8" fill="#fda4af"/>
    </svg>
  )
}

function FallbackPreview() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#f9fafb', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, padding: '0 16px' }}>
      <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3 }} />
      <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, width: '80%' }} />
      <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, width: '60%' }} />
    </div>
  )
}

/* ── Form helpers ─────────────────────────────────────────────────────────── */

function AddCustomStyleForm() {
  const [state, formAction, isPending] = useActionState(createCustomStyleAction, null)
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        name="name"
        type="text"
        placeholder="Custom style name..."
        required
        disabled={isPending}
        className="flex-1 h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent disabled:opacity-50 transition-all shadow-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="h-9 rounded-lg bg-amber-500 px-4 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm"
      >
        {isPending ? 'Adding…' : 'Add'}
      </button>
      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
    </form>
  )
}

function DeleteStyleForm({ id }: { id: string }) {
  return (
    <form action={deleteCustomStyleAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        aria-label="Delete style"
      >
        <XIcon />
      </button>
    </form>
  )
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
