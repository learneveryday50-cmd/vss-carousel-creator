'use client'

import { useState, useEffect, useRef } from 'react'

const STEP_DURATION = 4000

const steps = [
  { id: 'brand',    label: 'Set up your brand',  icon: '🎨', hint: '5 min, one time' },
  { id: 'template', label: 'Pick a template',     icon: '📐', hint: '30 seconds' },
  { id: 'generate', label: 'Type & generate',     icon: '⚡', hint: '~90 sec AI magic' },
  { id: 'download', label: 'Download & post',     icon: '🚀', hint: 'Done!' },
]

// ── Step screens ─────────────────────────────────────────────────────────────

function BrandScreen() {
  return (
    <div className="p-5 space-y-3.5 h-full overflow-hidden">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Brand Settings</p>
        <h3 className="text-sm font-bold text-gray-900 mt-0.5">Create your brand profile</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">Set it once — every carousel uses it automatically.</p>
      </div>
      <div className="space-y-2.5">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Brand name</label>
          <div className="mt-1 h-8 rounded-lg border border-gray-200 bg-gray-50 px-3 flex items-center">
            <span className="text-xs text-gray-800">Acme Corp</span>
            <span className="w-0.5 h-3.5 bg-amber-500 ml-0.5 animate-pulse inline-block" />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Primary color</label>
          <div className="mt-1 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 border-2 border-white shadow-sm shrink-0" />
            <div className="flex-1 h-8 rounded-lg border border-gray-200 bg-gray-50 px-3 flex items-center">
              <span className="text-xs text-gray-500 font-mono">#F59E0B</span>
            </div>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Brand voice</label>
          <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 h-14">
            <span className="text-xs text-gray-700 leading-relaxed">Professional, direct, data-driven. Speak to B2B decision makers.</span>
          </div>
        </div>
        <button className="w-full h-8 rounded-lg bg-amber-500 text-white text-xs font-semibold shadow-sm shadow-amber-200">
          Save brand →
        </button>
      </div>
    </div>
  )
}

function TemplateScreen({ images }: { images: string[] }) {
  return (
    <div className="p-5 space-y-3.5 h-full overflow-hidden">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Templates</p>
        <h3 className="text-sm font-bold text-gray-900 mt-0.5">Pick your layout & style</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">Controls how every slide looks and feels.</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => {
          const imgUrl = images[i]
          const selected = i === 0
          return (
            <div
              key={i}
              className={`aspect-square rounded-xl border-2 overflow-hidden transition-colors ${
                selected ? 'border-amber-400 ring-2 ring-amber-200' : 'border-gray-200'
              }`}
            >
              {imgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgUrl}
                  alt={`Carousel preview ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full flex flex-col p-2 gap-1 ${selected ? 'bg-amber-50' : 'bg-gray-50'}`}>
                  <div className={`h-2 rounded-full ${selected ? 'bg-amber-300' : 'bg-gray-300'} w-4/5`} />
                  <div className={`h-1.5 rounded-full ${selected ? 'bg-amber-200' : 'bg-gray-200'} w-3/5`} />
                  <div className={`flex-1 rounded-md mt-0.5 ${selected ? 'bg-amber-100' : 'bg-gray-200'}`} />
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div>
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Image style</p>
        <div className="grid grid-cols-4 gap-1.5">
          {['Technical', 'Notebook', 'Whiteboard', 'Comic'].map((s, i) => (
            <div
              key={s}
              className={`rounded-lg border py-1.5 text-center text-[10px] font-semibold ${
                i === 0 ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-500 bg-gray-50'
              }`}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GenerateScreen() {
  return (
    <div className="p-5 space-y-3 h-full overflow-hidden">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Dashboard</p>
        <h3 className="text-sm font-bold text-gray-900 mt-0.5">Type your idea</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">One sentence is enough. AI handles the rest.</p>
      </div>
      <div>
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50/40 px-3 py-2.5 shadow-sm shadow-amber-100">
          <span className="text-xs text-gray-800">5 reasons most sales strategies fail in the first 30 days</span>
          <span className="inline-block w-0.5 h-3.5 bg-amber-500 ml-0.5 animate-pulse" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-8 rounded-lg border border-gray-200 bg-gray-50 px-2.5 flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
          <span className="text-[11px] text-gray-600 truncate">Acme Corp</span>
        </div>
        <div className="flex-1 h-8 rounded-lg border border-gray-200 bg-gray-50 px-2.5 flex items-center">
          <span className="text-[11px] text-gray-600 truncate">Classic Pro</span>
        </div>
      </div>
      <button className="w-full h-9 rounded-xl bg-amber-500 flex items-center justify-center gap-2 shadow-md shadow-amber-200">
        <svg className="animate-spin w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-white text-xs font-bold">Generating your carousel…</span>
      </button>
      <div className="rounded-xl bg-zinc-950 p-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-xs">✦</span>
          <span className="text-[11px] text-zinc-300 font-medium">Writing slide copy in your brand voice…</span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full w-2/3 rounded-full bg-amber-500 animate-pulse" />
        </div>
        <p className="text-[10px] text-zinc-600">DALL-E 3 generating visuals • Step 2 of 4</p>
      </div>
    </div>
  )
}

function DownloadScreen() {
  return (
    <div className="p-5 space-y-3.5 h-full overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-600">Done!</p>
          </div>
          <h3 className="text-sm font-bold text-gray-900">Your carousel is ready</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">5 slides · LinkedIn caption included</p>
        </div>
      </div>

      {/* Slides strip */}
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 aspect-square rounded-lg flex flex-col items-start justify-end p-1.5 ${
              i === 0 ? 'bg-zinc-900 ring-2 ring-amber-400 ring-offset-1' : 'bg-zinc-800'
            }`}
          >
            <div className="space-y-0.5 w-full">
              <div className="h-1 rounded-full bg-white/80 w-4/5" />
              <div className="h-1 rounded-full bg-white/30 w-3/5" />
            </div>
          </div>
        ))}
      </div>

      {/* Caption preview */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-[11px] text-gray-600 leading-relaxed line-clamp-2">
        Most sales strategies don&apos;t fail because of bad salespeople — they fail because of these 5 systemic issues that nobody talks about… 🧵
      </div>

      <div className="space-y-1.5">
        <button className="w-full h-9 rounded-xl bg-amber-500 flex items-center justify-center gap-1.5 shadow-sm shadow-amber-200">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v7.5M3.5 6l3 3 3-3M1 10.5v1a.5.5 0 00.5.5h10a.5.5 0 00.5-.5v-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-white text-xs font-bold">Download ZIP (5 slides)</span>
        </button>
        <button className="w-full h-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center">
          <span className="text-gray-700 text-xs font-semibold">Copy LinkedIn caption</span>
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DemoSection({ demoImages = [] }: { demoImages?: string[] }) {
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startTimers(stepIndex: number) {
    if (intervalRef.current) clearTimeout(intervalRef.current)
    if (progressRef.current) clearInterval(progressRef.current)

    setProgress(0)
    const tick = 50
    const steps_count = STEP_DURATION / tick
    let current = 0

    progressRef.current = setInterval(() => {
      current++
      setProgress((current / steps_count) * 100)
      if (current >= steps_count) {
        if (progressRef.current) clearInterval(progressRef.current)
      }
    }, tick)

    intervalRef.current = setTimeout(() => {
      setActive((prev) => (prev + 1) % screens.length)
    }, STEP_DURATION)
  }

  useEffect(() => {
    startTimers(active)
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  function handleStepClick(i: number) {
    if (intervalRef.current) clearTimeout(intervalRef.current)
    if (progressRef.current) clearInterval(progressRef.current)
    setActive(i)
  }

  const screenComponents = [BrandScreen, TemplateScreen, GenerateScreen, DownloadScreen]
  const ActiveScreen = screenComponents[active]

  return (
    <section className="bg-white py-24">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-2">See it in action</p>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            From idea to LinkedIn post in 4 steps.
          </h2>
          <p className="text-gray-500 text-base mt-3 max-w-lg mx-auto">
            Watch how VSS Creator works — no design skills, no complicated setup.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">

          {/* Step tabs — left on desktop, top on mobile */}
          <div className="w-full lg:w-64 shrink-0 order-2 lg:order-1">
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              {steps.map((step, i) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(i)}
                  className={[
                    'flex items-start gap-3 rounded-2xl p-3 lg:p-4 text-left transition-all duration-200 shrink-0 w-40 lg:w-full',
                    active === i
                      ? 'bg-amber-50 border border-amber-200 shadow-sm'
                      : 'border border-transparent hover:bg-gray-50',
                  ].join(' ')}
                >
                  <span className="text-xl shrink-0 mt-0.5">{step.icon}</span>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold leading-tight ${active === i ? 'text-amber-700' : 'text-gray-700'}`}>
                      {step.label}
                    </p>
                    <p className={`text-[11px] mt-0.5 ${active === i ? 'text-amber-500' : 'text-gray-400'}`}>
                      {step.hint}
                    </p>
                    {/* Progress bar — only on active */}
                    {active === i && (
                      <div className="mt-2 h-1 rounded-full bg-amber-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-none"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-4 hidden lg:block px-1">
              Auto-advances every 4 seconds · click to jump
            </p>
          </div>

          {/* Browser mockup — right on desktop */}
          <div className="flex-1 order-1 lg:order-2 w-full max-w-md lg:max-w-none mx-auto">
            <div className="rounded-2xl border border-gray-200 shadow-2xl shadow-gray-100 overflow-hidden">

              {/* Browser chrome */}
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
                {/* Traffic lights */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                {/* URL bar */}
                <div className="flex-1 bg-white rounded-lg px-3 py-1.5 flex items-center gap-2 border border-gray-200">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="text-green-500 shrink-0">
                    <rect x="1" y="4" width="9" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M3.5 4V3a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[11px] text-gray-500 truncate">vsscreator.app/{steps[active].id === 'brand' ? 'settings/brand' : steps[active].id === 'template' ? 'templates' : steps[active].id === 'generate' ? 'dashboard' : 'history'}</span>
                </div>
                {/* Step badge */}
                <div className="shrink-0 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  {active + 1}/4
                </div>
              </div>

              {/* Sidebar + content layout */}
              <div className="flex bg-white" style={{ minHeight: 340 }}>
                {/* Mini sidebar */}
                <div className="w-10 bg-gray-50 border-r border-gray-100 flex flex-col items-center py-3 gap-3 shrink-0">
                  {[
                    <svg key="d" width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="#9ca3af"/><rect x="8" y="1" width="5" height="5" rx="1" fill="#9ca3af" opacity=".4"/><rect x="1" y="8" width="5" height="5" rx="1" fill="#9ca3af" opacity=".4"/><rect x="8" y="8" width="5" height="5" rx="1" fill="#9ca3af" opacity=".2"/></svg>,
                    <svg key="t" width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="3" rx="1" fill="#9ca3af" opacity=".5"/><rect x="1" y="6" width="12" height="3" rx="1" fill="#9ca3af" opacity=".3"/><rect x="1" y="11" width="8" height="2" rx="1" fill="#9ca3af" opacity=".2"/></svg>,
                    <svg key="h" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="#9ca3af" strokeWidth="1.3" opacity=".5"/><path d="M7 4v3.5l2 1" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" opacity=".5"/></svg>,
                    <svg key="b" width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="2" stroke="#9ca3af" strokeWidth="1.3" opacity=".5"/><path d="M5 7h4M5 9.5h2.5" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" opacity=".5"/></svg>,
                  ].map((icon, i) => (
                    <div
                      key={i}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        active === i ? 'bg-amber-100' : ''
                      }`}
                    >
                      {icon}
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 overflow-hidden">
                  {active === 1
                    ? <TemplateScreen images={demoImages} />
                    : <ActiveScreen />
                  }
                </div>
              </div>
            </div>

            {/* Caption below mockup */}
            <p className="text-center text-xs text-gray-400 mt-3">
              Interactive demo — click the steps to explore
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
