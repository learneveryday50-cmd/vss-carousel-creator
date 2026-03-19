'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { deleteCarouselAction } from '@/app/(protected)/history/actions'

type Carousel = {
  id: string
  idea_text: string
  status: string
  slide_urls: string[] | null
  post_body: string | null
  brand_name: string | null
  template_name: string | null
  design_style_name: string | null
  created_at: string
}

function proxyUrl(imagebbUrl: string, filename: string): string {
  return `/api/download?url=${encodeURIComponent(imagebbUrl)}&filename=${encodeURIComponent(filename)}`
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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [localCarousels, setLocalCarousels] = useState(carousels)
  const [exportingPdf, setExportingPdf] = useState<string | null>(null)

  // Sync with server-revalidated prop
  useEffect(() => { setLocalCarousels(carousels) }, [carousels])

  // Preload first slide of each carousel for fast thumbnails
  useEffect(() => {
    carousels.forEach((c) => {
      const urls = Array.isArray(c.slide_urls) ? c.slide_urls : []
      if (urls[0]) {
        const img = new Image()
        img.src = urls[0]
      }
    })
  }, [carousels])

  async function handleDelete(id: string) {
    setDeletingId(id)
    setLocalCarousels((prev) => prev.filter((c) => c.id !== id))
    const { error } = await deleteCarouselAction(id)
    if (error) {
      setLocalCarousels(carousels)
      console.error('Delete failed:', error)
    }
    setDeletingId(null)
  }

  if (localCarousels.length === 0) {
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
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(stripMarkdown(text))
      }
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // clipboard not available
    }
  }

  async function handleDownloadAll(slides: string[], carouselId: string) {
    for (let i = 0; i < slides.length; i++) {
      try {
        const url = proxyUrl(slides[i], `slide-${i + 1}.png`)
        const res = await fetch(url)
        if (!res.ok) continue
        const blob = await res.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `slide-${i + 1}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(a.href)
        await new Promise((r) => setTimeout(r, 300))
      } catch { /* skip */ }
    }
  }

  async function handleDownloadPDF(slides: string[], ideaText: string, carouselId: string) {
    setExportingPdf(carouselId)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: [1080, 1080] })

      for (let i = 0; i < slides.length; i++) {
        if (i > 0) doc.addPage()
        const url = proxyUrl(slides[i], `slide-${i + 1}.png`)
        const res = await fetch(url)
        if (!res.ok) continue
        const blob = await res.blob()
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
        doc.addImage(dataUrl, 'PNG', 0, 0, 1080, 1080)
      }

      const safeTitle = ideaText.slice(0, 40).replace(/[^a-z0-9]/gi, '-').toLowerCase()
      doc.save(`${safeTitle}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setExportingPdf(null)
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {localCarousels.map((c, index) => {
        const slides = Array.isArray(c.slide_urls) ? c.slide_urls : []
        const isExpanded = expanded === c.id
        const slide = getSlide(c.id)
        const date = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

        return (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: Math.min(index * 0.05, 0.3) }}
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
                {(c.brand_name || c.template_name || c.design_style_name) && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {c.brand_name && (
                      <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {c.brand_name}
                      </span>
                    )}
                    {c.template_name && (
                      <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        {c.template_name}
                      </span>
                    )}
                    {c.design_style_name && (
                      <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {c.design_style_name}
                      </span>
                    )}
                  </div>
                )}
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

              {/* Delete button */}
              <button
                onClick={() => handleDelete(c.id)}
                disabled={deletingId === c.id}
                className="text-xs font-medium text-red-400 hover:text-red-600 self-start transition-colors disabled:opacity-50 mt-auto"
              >
                {deletingId === c.id ? 'Deleting…' : 'Delete'}
              </button>
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
                  <button
                    onClick={() => {
                      const url = proxyUrl(slides[slide], `slide-${slide + 1}.png`)
                      fetch(url).then(r => r.blob()).then(blob => {
                        const a = document.createElement('a')
                        a.href = URL.createObjectURL(blob)
                        a.download = `slide-${slide + 1}.png`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(a.href)
                      })
                    }}
                    title="Download this slide"
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1v8M4 7l3 3 3-3M1 11.5v.5a1 1 0 001 1h10a1 1 0 001-1v-.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <span className="text-xs text-gray-500">{slide + 1} / {slides.length}</span>
                  <button onClick={() => setSlide(c.id, Math.min(slides.length - 1, slide + 1))} disabled={slide === slides.length - 1}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Download all */}
                <button
                  onClick={() => handleDownloadAll(slides, c.id)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 text-xs font-semibold transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M6.5 1v7.5M3.5 6l3 3 3-3M1 10.5v1a.5.5 0 00.5.5h10a.5.5 0 00.5-.5v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Download all {slides.length} slides
                </button>

                {/* PDF export */}
                <button
                  onClick={() => handleDownloadPDF(slides, c.idea_text, c.id)}
                  disabled={exportingPdf === c.id}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M4 5h5M4 7h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {exportingPdf === c.id ? 'Generating PDF…' : 'Export as PDF'}
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
          </motion.div>
        )
      })}
    </div>
  )
}
