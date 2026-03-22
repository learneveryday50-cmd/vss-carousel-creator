'use client'

import { useState, useEffect, useCallback } from 'react'

const Spinner = () => (
  <svg className="animate-spin w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRouter } from 'next/navigation'
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

function proxyUrl(slideUrl: string, filename: string): string {
  return `/api/download?url=${encodeURIComponent(slideUrl)}&filename=${encodeURIComponent(filename)}`
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

// --- Lightbox modal ---
function LightboxModal({
  slides,
  index,
  onClose,
  onNavigate,
}: {
  slides: string[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNavigate((index + 1) % slides.length)
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + slides.length) % slides.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, slides.length, onClose, onNavigate])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Slide counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-semibold text-white/70 bg-black/40 rounded-full px-3 py-1.5">
        {index + 1} / {slides.length}
      </div>

      {/* Prev */}
      {slides.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate((index - 1 + slides.length) % slides.length) }}
          className="absolute left-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Image */}
      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slides[index]}
          alt={`Slide ${index + 1}`}
          className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain"
          draggable={false}
        />
      </div>

      {/* Next */}
      {slides.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate((index + 1) % slides.length) }}
          className="absolute right-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onNavigate(i) }}
              className={`rounded-full transition-all ${i === index ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// --- Sortable slide card ---
function SortableSlide({
  url,
  index,
  onRemove,
  onZoom,
}: {
  url: string
  index: number
  onRemove: () => void
  onZoom: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: url })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1.5 left-1.5 z-10 p-1 rounded-md bg-black/40 text-white cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="4" cy="3" r="1"/><circle cx="8" cy="3" r="1"/>
          <circle cx="4" cy="6" r="1"/><circle cx="8" cy="6" r="1"/>
          <circle cx="4" cy="9" r="1"/><circle cx="8" cy="9" r="1"/>
        </svg>
      </div>
      {/* Slide number */}
      <div className="absolute top-1.5 right-7 z-10 text-[10px] font-bold text-white bg-black/50 rounded-full w-5 h-5 flex items-center justify-center">
        {index + 1}
      </div>
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
      >
        ×
      </button>
      {/* Zoom button */}
      <button
        onClick={onZoom}
        className="absolute bottom-1.5 right-1.5 z-10 w-6 h-6 rounded-md bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        title="View full size"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M1 4V1h3M7 1h3v3M10 7v3H7M4 10H1V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`Slide ${index + 1}`}
        onClick={onZoom}
        className="w-full aspect-square object-cover rounded-lg border border-gray-200 cursor-zoom-in"
        draggable={false}
      />
    </div>
  )
}

export function CarouselHistory({ carousels }: { carousels: Carousel[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [localCarousels, setLocalCarousels] = useState(carousels)
  const [exportingPdf, setExportingPdf] = useState<string | null>(null)
  const [downloadingZip, setDownloadingZip] = useState<string | null>(null)
  const [slideOrders, setSlideOrders] = useState<Record<string, string[]>>({})
  const [lightbox, setLightbox] = useState<{ slides: string[]; index: number } | null>(null)

  const closeLightbox = useCallback(() => setLightbox(null), [])
  const navigateLightbox = useCallback((index: number) => setLightbox((prev) => prev ? { ...prev, index } : null), [])

  const router = useRouter()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => { setLocalCarousels(carousels) }, [carousels])

  useEffect(() => {
    carousels.forEach((c) => {
      const urls = Array.isArray(c.slide_urls) ? c.slide_urls : []
      if (urls[0]) {
        const img = new Image()
        img.src = urls[0]
      }
    })
  }, [carousels])

  function getSlides(c: Carousel): string[] {
    return slideOrders[c.id] ?? (Array.isArray(c.slide_urls) ? c.slide_urls : [])
  }

  function handleDragEnd(carouselId: string, event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSlideOrders((prev) => {
      const current = prev[carouselId] ?? (localCarousels.find(c => c.id === carouselId)?.slide_urls ?? [])
      const oldIndex = current.indexOf(active.id as string)
      const newIndex = current.indexOf(over.id as string)
      return { ...prev, [carouselId]: arrayMove(current, oldIndex, newIndex) }
    })
  }

  function handleRemoveSlide(carouselId: string, url: string) {
    setSlideOrders((prev) => {
      const current = prev[carouselId] ?? (localCarousels.find(c => c.id === carouselId)?.slide_urls ?? [])
      return { ...prev, [carouselId]: current.filter((u) => u !== url) }
    })
  }

  function resetSlides(c: Carousel) {
    setSlideOrders((prev) => {
      const next = { ...prev }
      delete next[c.id]
      return next
    })
  }

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

  async function handleCopy(id: string, text: string) {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(stripMarkdown(text))
      }
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch { /* clipboard not available */ }
  }

  async function handleDownloadZip(slides: string[], ideaText: string, carouselId: string) {
    setDownloadingZip(carouselId)
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      for (let i = 0; i < slides.length; i++) {
        const url = proxyUrl(slides[i], `slide-${i + 1}.png`)
        const res = await fetch(url)
        if (!res.ok) continue
        const blob = await res.blob()
        zip.file(`slide-${i + 1}.png`, blob)
      }
      const content = await zip.generateAsync({ type: 'blob' })
      const safeTitle = ideaText.slice(0, 40).replace(/[^a-z0-9]/gi, '-').toLowerCase()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(content)
      a.download = `${safeTitle}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    } catch (err) {
      console.error('ZIP export failed:', err)
    } finally {
      setDownloadingZip(null)
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

  if (localCarousels.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-16 text-center">
        <p className="text-sm font-semibold text-gray-500">No carousels yet</p>
        <p className="text-xs text-gray-400 mt-1">Generate your first carousel from the Create page.</p>
      </div>
    )
  }

  return (
    <>
    {lightbox && (
      <LightboxModal
        slides={lightbox.slides}
        index={lightbox.index}
        onClose={closeLightbox}
        onNavigate={navigateLightbox}
      />
    )}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {localCarousels.map((c, index) => {
        const originalSlides = Array.isArray(c.slide_urls) ? c.slide_urls : []
        const slides = getSlides(c)
        const isExpanded = expanded === c.id
        const isReordered = slideOrders[c.id] !== undefined
        const slidesRemoved = slides.length < originalSlides.length
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
              {originalSlides[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={originalSlides[0]} alt="Slide 1" className="w-full h-full object-cover" />
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
              <span className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[c.status] ?? STATUS_STYLES.pending}`}>
                {c.status}
              </span>
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col gap-3 flex-1">
              <div>
                <p className="text-sm font-semibold text-gray-900 line-clamp-2">{c.idea_text}</p>
                <p className="text-xs text-gray-400 mt-0.5">{date} · {originalSlides.length || '?'} slides</p>
                {(c.brand_name || c.template_name || c.design_style_name) && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {c.brand_name && (
                      <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{c.brand_name}</span>
                    )}
                    {c.template_name && (
                      <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{c.template_name}</span>
                    )}
                    {c.design_style_name && (
                      <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{c.design_style_name}</span>
                    )}
                  </div>
                )}
              </div>

              {originalSlides.length > 0 && (
                <button
                  onClick={() => setExpanded(isExpanded ? null : c.id)}
                  className="text-xs font-medium text-amber-600 hover:text-amber-700 self-start transition-colors"
                >
                  {isExpanded ? 'Collapse ↑' : 'Customize & Download ↓'}
                </button>
              )}

              <button
                onClick={() => handleDelete(c.id)}
                disabled={deletingId === c.id}
                className="text-xs font-medium text-red-400 hover:text-red-600 self-start transition-colors disabled:opacity-50 mt-auto inline-flex items-center gap-1.5"
              >
                {deletingId === c.id && <Spinner />}
                {deletingId === c.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>

            {/* Expanded: drag-to-reorder + downloads */}
            <AnimatePresence>
              {isExpanded && originalSlides.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="border-t border-gray-100 overflow-hidden"
                >
                  <div className="p-4 flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{slides.length} slides</p>
                        <p className="text-[11px] text-gray-400">Drag to reorder · hover to remove</p>
                      </div>
                      {isReordered && (
                        <button
                          onClick={() => resetSlides(c)}
                          className="text-[11px] text-amber-600 hover:text-amber-700 transition-colors font-medium"
                        >
                          {slidesRemoved ? 'Restore all slides' : 'Reset order'}
                        </button>
                      )}
                    </div>

                    {/* Notice when slides have been removed */}
                    {slidesRemoved && (
                      <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                        <svg className="shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <circle cx="6.5" cy="6.5" r="5.5" stroke="#3b82f6" strokeWidth="1.3"/>
                          <path d="M6.5 5.5v4M6.5 4h.01" stroke="#3b82f6" strokeWidth="1.3" strokeLinecap="round"/>
                        </svg>
                        <p className="text-[11px] text-blue-600 leading-snug">
                          Removed slides only affect your download — your original carousel is unchanged.
                        </p>
                      </div>
                    )}

                    {/* Drag-to-reorder grid */}
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => handleDragEnd(c.id, e)}
                    >
                      <SortableContext items={slides} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-3 gap-2">
                          {slides.map((url, i) => (
                            <SortableSlide
                              key={url}
                              url={url}
                              index={i}
                              onRemove={() => handleRemoveSlide(c.id, url)}
                              onZoom={() => setLightbox({ slides, index: i })}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>

                    {slides.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-xs text-gray-400">All slides removed.</p>
                        <button onClick={() => resetSlides(c)} className="text-xs text-amber-600 hover:text-amber-700 mt-1">
                          Restore all
                        </button>
                      </div>
                    )}

                    {/* Download buttons */}
                    {slides.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {/* ZIP — primary */}
                        <button
                          onClick={() => handleDownloadZip(slides, c.idea_text, c.id)}
                          disabled={downloadingZip === c.id}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {downloadingZip === c.id ? <Spinner /> : (
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                              <path d="M6.5 1v7.5M3.5 6l3 3 3-3M1 10.5v1a.5.5 0 00.5.5h10a.5.5 0 00.5-.5v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {downloadingZip === c.id ? 'Zipping…' : `Download ZIP (${slides.length} slides)`}
                        </button>

                        {/* PDF */}
                        <button
                          onClick={() => handleDownloadPDF(slides, c.idea_text, c.id)}
                          disabled={exportingPdf === c.id}
                          className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {exportingPdf === c.id ? <Spinner /> : (
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                              <rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M4 5h5M4 7h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          )}
                          {exportingPdf === c.id ? 'Generating PDF…' : 'Export as PDF'}
                        </button>
                      </div>
                    )}

                    {/* Caption */}
                    {c.post_body && (
                      <div className="flex flex-col gap-1.5">
                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl p-3 border border-gray-100 max-h-32 overflow-y-auto">
                          {stripMarkdown(c.post_body)}
                        </p>
                        <button
                          onClick={() => handleCopy(c.id, c.post_body!)}
                          className="text-xs font-medium text-amber-600 hover:text-amber-700 self-end transition-colors"
                        >
                          {copied === c.id ? 'Copied!' : 'Copy caption'}
                        </button>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                      <button
                        onClick={() => router.push(`/templates?idea=${encodeURIComponent(c.idea_text)}`)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 text-xs font-semibold transition-colors"
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M11 6.5A4.5 4.5 0 112 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M11 3.5v3h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Regenerate with same idea
                      </button>
                      <button
                        onClick={() => router.push('/templates')}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-2 text-xs font-semibold transition-colors"
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        Create a new carousel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
    </>
  )
}
