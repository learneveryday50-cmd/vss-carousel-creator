'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Carousel = {
  id: string
  idea_text: string
  status: string
  slide_urls: string[] | null
  post_body: string | null
  created_at: string
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*_]{3,}\s*$/gm, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const STATUS_STYLES: Record<string, string> = {
  completed:  'bg-green-50 text-green-700 border-green-200',
  processing: 'bg-amber-50 text-amber-700 border-amber-200',
  pending:    'bg-gray-50 text-gray-500 border-gray-200',
  failed:     'bg-red-50 text-red-600 border-red-200',
}

export function CarouselHistory({ carousels }: { carousels: Carousel[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [slideIndex, setSlideIndex] = useState<Record<string, number>>({})
  const [copied, setCopied] = useState<string | null>(null)

  if (carousels.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-16 text-center">
        <p className="text-sm font-semibold text-gray-500">No carousels yet</p>
        <p className="text-xs text-gray-400 mt-1">Generate your first carousel from the Create page.</p>
      </div>
    )
  }

  function getSlide(id: string) { return slideIndex[id] ?? 0 }
  function setSlide(id: string, n: number) { setSlideIndex((s) => ({ ...s, [id]: n })) }

  async function handleCopy(id: string, text: string) {
    await navigator.clipboard.writeText(stripMarkdown(text))
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleDownloadAll(slides: string[]) {
    for (let i = 0; i < slides.length; i++) {
      try {
        const res = await fetch(slides[i])
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `slide-${i + 1}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        await new Promise((r) => setTimeout(r, 300))
      } catch { /* skip */ }
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {carousels.map((c) => {
        const slides = Array.isArray(c.slide_urls) ? c.slide_urls : []
        const isExpanded = expanded === c.id
        const slide = getSlide(c.id)
        const date = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

        return (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
          >
            {/* Thumbnail */}
            <div
              className="aspect-square bg-gray-50 flex items-center justify-center cursor-pointer relative overflow-hidden"
              onClick={() => setExpanded(isExpanded ? null : c.id)}
            >
              {slides[0] ? (
                <img src={slides[0]} alt="Slide 1" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-300">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect x="2" y="2" width="12" height="12" rx="2" fill="currentColor" opacity=".4"/>
                    <rect x="18" y="2" width="12" height="12" rx="2" fill="currentColor" opacity=".4"/>
                    <rect x="2" y="18" width="12" height="12" rx="2" fill="currentColor" opacity=".4"/>
                    <rect x="18" y="18" width="12" height="12" rx="2" fill="currentColor" opacity=".4"/>
                  </svg>
                  <span className="text-xs capitalize">{c.status}</span>
                </div>
              )}
              {/* Status badge overlay */}
              <span className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[c.status] ?? STATUS_STYLES.pending}`}>
                {c.status}
              </span>
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col gap-3 flex-1">
              <div>
                <p className="text-sm font-semibold text-gray-900 line-clamp-2">{c.idea_text}</p>
                <p className="text-xs text-gray-400 mt-0.5">{date} · {slides.length || '?'} slides</p>
              </div>

              {/* Expand button */}
              {slides.length > 0 && (
                <button
                  onClick={() => setExpanded(isExpanded ? null : c.id)}
                  className="text-xs font-medium text-amber-600 hover:text-amber-700 self-start transition-colors"
                >
                  {isExpanded ? 'Collapse ↑' : 'View slides ↓'}
                </button>
              )}
            </div>

            {/* Expanded viewer */}
            {isExpanded && slides.length > 0 && (
              <div className="border-t border-gray-100 p-4 flex flex-col gap-3">
                {/* Slide viewer */}
                <img
                  src={slides[slide]}
                  alt={`Slide ${slide + 1}`}
                  className="w-full rounded-lg object-contain max-h-64"
                />
                <div className="flex items-center justify-between">
                  <button onClick={() => setSlide(c.id, Math.max(0, slide - 1))} disabled={slide === 0}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-500">{slide + 1} / {slides.length}</span>
                  <button onClick={() => setSlide(c.id, Math.min(slides.length - 1, slide + 1))} disabled={slide === slides.length - 1}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Download */}
                <button
                  onClick={() => handleDownloadAll(slides)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 text-xs font-semibold transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M6.5 1v7.5M3.5 6l3 3 3-3M1 10.5v1a.5.5 0 00.5.5h10a.5.5 0 00.5-.5v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Download all {slides.length} slides
                </button>

                {/* Caption */}
                {c.post_body && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl p-3 border border-gray-100 max-h-32 overflow-y-auto">
                      {stripMarkdown(c.post_body)}
                    </p>
                    <button onClick={() => handleCopy(c.id, c.post_body!)}
                      className="text-xs font-medium text-amber-600 hover:text-amber-700 self-end transition-colors">
                      {copied === c.id ? 'Copied!' : 'Copy caption'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
