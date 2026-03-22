'use client'

import { useEffect, useRef, useState } from 'react'
import { LayoutDashboard, Layers, History, Palette, X } from 'lucide-react'

const TOUR_KEY = 'vss_tour_done'

interface Step {
  title: string
  description: string
  icon: React.ReactNode
  /** Approx y-center of sidebar nav item in px from top — used on desktop */
  sidebarY: number
}

const STEPS: Step[] = [
  {
    title: 'Welcome to VSS 👋',
    description:
      "Your AI-powered LinkedIn carousel creator. Let's take a quick tour so you know exactly where everything lives.",
    icon: <LayoutDashboard className="w-5 h-5 text-amber-500" />,
    sidebarY: 112,
  },
  {
    title: 'Set Up Your Brand First',
    description:
      'Before creating carousels, set your colors, fonts, and tone here. Every carousel will automatically match your brand — no editing needed.',
    icon: <Palette className="w-5 h-5 text-amber-500" />,
    sidebarY: 244,
  },
  {
    title: 'Create a Carousel',
    description:
      'Pick a hook style, choose a design template, and let AI write and design your slides — ready to post in minutes.',
    icon: <Layers className="w-5 h-5 text-amber-500" />,
    sidebarY: 156,
  },
  {
    title: 'Your History',
    description:
      "Every carousel you've created is saved here. Download, zoom in on individual slides, or regenerate any time.",
    icon: <History className="w-5 h-5 text-amber-500" />,
    sidebarY: 200,
  },
]

export function OnboardingTour() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      if (!localStorage.getItem(TOUR_KEY)) setVisible(true)
    }, 700)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    localStorage.setItem(TOUR_KEY, '1')
    setVisible(false)
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else dismiss()
  }

  function back() {
    setStep((s) => Math.max(0, s - 1))
  }

  if (!visible) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  // Desktop: anchor to right of sidebar (w-56 = 224px) with 20px gap
  const desktopStyle: React.CSSProperties = {
    position: 'fixed',
    left: 252,
    top: current.sidebarY - 56,
    zIndex: 50,
  }
  // Mobile: centered
  const mobileStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 50,
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/25 lg:bg-black/10 backdrop-blur-[1px] lg:backdrop-blur-none"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Tooltip card */}
      <div
        ref={cardRef}
        className="w-[280px] bg-white rounded-2xl shadow-xl border border-gray-200 p-5"
        style={isDesktop ? desktopStyle : mobileStyle}
      >
        {/* Left arrow — desktop only */}
        {isDesktop && (
          <div
            className="absolute -left-[9px] top-7"
            style={{
              width: 0,
              height: 0,
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderRight: '9px solid white',
              filter: 'drop-shadow(-1px 0 0 #e5e7eb)',
            }}
          />
        )}

        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100"
          aria-label="Close tour"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon + Title */}
        <div className="flex items-start gap-3 mb-2 pr-5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            {current.icon}
          </div>
          <h3 className="text-sm font-bold text-gray-900 leading-snug pt-1.5">
            {current.title}
          </h3>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 leading-relaxed mb-4 pl-12">
          {current.description}
        </p>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-4 pl-12">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={[
                'rounded-full transition-all duration-200',
                i === step ? 'w-5 h-1.5 bg-amber-500' : 'w-1.5 h-1.5 bg-gray-200',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pl-0">
          <button
            onClick={dismiss}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={back}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              className="text-xs px-4 py-1.5 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 transition-colors"
            >
              {isLast ? 'Got it!' : `Next (Step ${step + 1} of ${STEPS.length})`}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
