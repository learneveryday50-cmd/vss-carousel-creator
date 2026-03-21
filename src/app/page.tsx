import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Palette,
  LayoutTemplate,
  Image,
  MessageSquare,
  Download,
  Zap,
  Lightbulb,
  Sparkles,
} from 'lucide-react'

const LogoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="1" y="1" width="6" height="6" rx="1.5" />
    <rect x="9" y="1" width="6" height="6" rx="1.5" opacity="0.4" />
    <rect x="1" y="9" width="6" height="6" rx="1.5" opacity="0.4" />
    <rect x="9" y="9" width="6" height="6" rx="1.5" opacity="0.15" />
  </svg>
)

function CarouselPreview() {
  return (
    <div className="relative w-full max-w-[320px] mx-auto select-none">
      <div className="absolute inset-x-6 top-3 bottom-0 rounded-2xl bg-white/5 rotate-2" />
      <div className="absolute inset-x-3 top-1.5 bottom-0 rounded-2xl bg-white/8" />
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
          <div className="w-9 h-9 rounded-full bg-zinc-200 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-2.5 w-24 rounded-full bg-zinc-200" />
            <div className="h-2 w-16 rounded-full bg-zinc-100" />
          </div>
          <div className="ml-auto h-6 w-16 rounded-full bg-zinc-900/90 flex items-center justify-center">
            <div className="h-1.5 w-8 rounded-full bg-white/80" />
          </div>
        </div>
        <div className="mx-4 mb-3 bg-zinc-900 rounded-xl aspect-[4/3] flex flex-col items-start justify-end p-5 gap-2">
          <div className="space-y-1.5 w-full">
            <div className="h-3 w-4/5 rounded-full bg-white/90" />
            <div className="h-3 w-3/5 rounded-full bg-white/70" />
          </div>
          <div className="space-y-1 w-full pt-1">
            <div className="h-2 w-full rounded-full bg-white/25" />
            <div className="h-2 w-5/6 rounded-full bg-white/25" />
            <div className="h-2 w-2/3 rounded-full bg-white/25" />
          </div>
          <div className="flex items-center gap-1 pt-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={`rounded-full ${i === 0 ? 'h-1.5 w-4 bg-white' : 'h-1.5 w-1.5 bg-white/30'}`} />
            ))}
          </div>
        </div>
        <div className="flex gap-2 px-4 pb-4">
          {['bg-zinc-900', 'bg-zinc-100', 'bg-zinc-100', 'bg-zinc-100', 'bg-zinc-100'].map((bg, i) => (
            <div key={i} className={`flex-1 rounded-lg aspect-square ${bg} ${i === 0 ? 'ring-2 ring-zinc-900 ring-offset-1' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shrink-0">
              <LogoIcon />
            </div>
            <span className="text-gray-900 font-semibold text-sm tracking-tight">VSS Creator</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-gray-900 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-gray-800 transition-colors whitespace-nowrap"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="bg-zinc-950 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-20 w-[400px] h-[400px] rounded-full bg-indigo-600/15 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div className="space-y-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
              LinkedIn Content Creator
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight">
              Turn ideas into viral LinkedIn carousels in under a minute
            </h1>
            <p className="text-zinc-400 text-base lg:text-lg leading-relaxed max-w-md">
              AI-powered carousel generation with your brand&apos;s voice, colors, and style — no design tool required.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/signup"
                className="bg-amber-500 text-white hover:bg-amber-400 rounded-xl px-6 py-3 text-sm font-semibold inline-flex items-center gap-2 transition-colors"
              >
                Get started free
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7h9M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="text-zinc-400 hover:text-white text-sm font-medium transition-colors"
              >
                Sign in
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {['AI-powered', 'LinkedIn ready', 'No design skills', 'Your brand voice'].map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium text-zinc-300 bg-white/10 border border-white/10 rounded-full px-3 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex justify-center">
            <CarouselPreview />
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-zinc-950 to-zinc-900 py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-500">How it works</p>
          <h2 className="text-3xl font-bold text-zinc-100 tracking-tight mt-2">From idea to LinkedIn post in 4 steps</h2>
          <p className="text-zinc-400 text-base mt-3">No design skills needed. No complicated setup. Just follow these steps.</p>

          <div className="mt-14 flex flex-col gap-0">
            {[
              {
                step: '01',
                icon: <Palette className="w-5 h-5 text-amber-400" />,
                title: 'Set up your brand',
                body: 'Create your brand profile with your company name, primary color, brand voice, target audience, and CTA. This is done once — every carousel you generate will automatically reflect your identity.',
                detail: 'Go to Settings → Brand → Create brand',
              },
              {
                step: '02',
                icon: <LayoutTemplate className="w-5 h-5 text-amber-400" />,
                title: 'Pick a template & image style',
                body: 'Browse 5+ carousel templates and choose an image style (Technical, Notebook, Whiteboard, Comic Strip, and more). Your selection controls how the slides look and feel.',
                detail: 'Go to Templates → select your layout and style',
              },
              {
                step: '03',
                icon: <Lightbulb className="w-5 h-5 text-amber-400" />,
                title: 'Type your idea and generate',
                body: 'Write your carousel topic in the idea box — just a sentence or two is enough. Hit Generate. AI writes the slide copy, creates visuals with DALL-E 3, and assembles the full carousel in under 2 minutes.',
                detail: 'Go to Dashboard → type your idea → click Generate',
              },
              {
                step: '04',
                icon: <Download className="w-5 h-5 text-amber-400" />,
                title: 'Download and post to LinkedIn',
                body: 'Once generated, preview all your slides and copy the ready-to-post LinkedIn caption. Download individual slides as PNG or export the full carousel as a PDF. Upload to LinkedIn and you\'re done.',
                detail: 'View result → Download slides or PDF → Copy caption → Post',
              },
            ].map(({ step, icon, title, body, detail }, i, arr) => (
              <div key={step} className="flex gap-6 md:gap-10">
                {/* Left: step number + connector line */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <span className="text-amber-400 font-bold text-sm">{step}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="w-px flex-1 bg-zinc-800 my-3" />
                  )}
                </div>

                {/* Right: content */}
                <div className={`pb-10 ${i < arr.length - 1 ? '' : ''}`}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      {icon}
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">{body}</p>
                  <div className="mt-3 inline-flex items-center gap-2 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-1.5">
                    <span className="text-[11px] font-mono text-amber-400/80">{detail}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-amber-500 text-white hover:bg-amber-400 rounded-xl px-6 py-3 text-sm font-semibold transition-colors"
            >
              Start for free — no credit card needed
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7h9M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600">Why VSS Creator</p>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mt-2">Everything you need to create at scale</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {[
              {
                icon: <Palette className="w-5 h-5 text-amber-600" />,
                title: 'Your brand, always',
                body: 'Set your brand colors, voice guidelines, and audience once. Every carousel reflects your identity automatically.',
              },
              {
                icon: <LayoutTemplate className="w-5 h-5 text-amber-600" />,
                title: '5+ templates',
                body: 'Choose from professionally designed carousel layouts — cover page, content slides, and a CTA slide included.',
              },
              {
                icon: <Image className="w-5 h-5 text-amber-600" />,
                title: 'AI-generated visuals',
                body: 'DALL-E 3 generates on-brand images for each slide based on your content and chosen style.',
              },
              {
                icon: <MessageSquare className="w-5 h-5 text-amber-600" />,
                title: 'LinkedIn-ready captions',
                body: 'Get a full post body with your carousel — written in your brand\'s voice and optimized for LinkedIn engagement.',
              },
              {
                icon: <Download className="w-5 h-5 text-amber-600" />,
                title: 'Download in seconds',
                body: 'Export individual slides as PNG or a full PDF ready to upload to LinkedIn. No extra tools needed.',
              },
              {
                icon: <Zap className="w-5 h-5 text-amber-600" />,
                title: 'Credit-based pricing',
                body: 'Pay only for what you use. Free plan includes 3 carousels per month. Upgrade to Pro for 10 per month.',
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
                  {icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600">Pricing</p>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mt-2">Simple, transparent pricing</h2>
            <p className="text-gray-500 text-base mt-2">Start free. Upgrade when you&apos;re ready.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-2xl mx-auto">

            {/* Free */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Free</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500 text-base font-normal">/ month</span>
              </div>
              <div className="border-t border-gray-200 my-6" />
              <ul className="space-y-3">
                {[
                  '3 carousels per month',
                  'All templates',
                  'AI-generated images',
                  'LinkedIn caption included',
                  'PNG & PDF export',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="text-green-600 font-bold text-sm">✓</span>
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="w-full mt-8 rounded-xl border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-4 py-2.5 text-sm font-semibold text-center block transition-colors"
              >
                Get started free
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 relative overflow-hidden">
              <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-3 py-1">
                Most popular
              </span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Pro</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold text-white">$29.99</span>
                <span className="text-zinc-400 text-base font-normal">/ month</span>
              </div>
              <div className="border-t border-zinc-800 my-6" />
              <ul className="space-y-3">
                {[
                  { text: '10 carousels per month', bold: true },
                  { text: 'All templates', bold: false },
                  { text: 'AI-generated images', bold: false },
                  { text: 'LinkedIn caption included', bold: false },
                  { text: 'PNG & PDF export', bold: false },
                  { text: 'Priority processing', bold: false },
                ].map(({ text, bold }) => (
                  <li key={text} className="flex items-center gap-3">
                    <span className="text-amber-400 font-bold text-sm">✓</span>
                    <span className={`text-sm ${bold ? 'text-white font-semibold' : 'text-zinc-300'}`}>{text}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="w-full mt-8 rounded-xl bg-amber-500 text-white hover:bg-amber-400 px-4 py-2.5 text-sm font-semibold text-center block transition-colors"
              >
                Upgrade to Pro →
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────── */}
      <section className="bg-zinc-950 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-400">Get started today</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mt-2">
            Your next viral post starts with one idea
          </h2>
          <p className="text-zinc-400 text-base mt-4">
            Join creators who are shipping LinkedIn content faster with AI.
          </p>
          <Link
            href="/signup"
            className="bg-amber-500 text-white hover:bg-amber-400 rounded-xl px-8 py-3 text-sm font-semibold inline-flex items-center gap-2 mt-8 transition-colors"
          >
            Create your first carousel
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7h9M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center shrink-0">
              <LogoIcon />
            </div>
            <span className="text-gray-900 font-semibold text-sm tracking-tight">VSS Creator</span>
          </div>
          <p className="text-sm text-gray-400">© 2026 VSS Creator. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
