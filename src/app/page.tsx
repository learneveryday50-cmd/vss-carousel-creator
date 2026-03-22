import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Palette,
  LayoutTemplate,
  MessageSquare,
  Download,
  Zap,
  Lightbulb,
  Clock,
  Shield,
  TrendingUp,
  Image,
} from 'lucide-react'
import { DemoSection } from '@/components/landing/demo-section'
import { createAdminClient } from '@/lib/supabase/admin'

const LogoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="1" y="1" width="6" height="6" rx="1.5" />
    <rect x="9" y="1" width="6" height="6" rx="1.5" opacity="0.4" />
    <rect x="1" y="9" width="6" height="6" rx="1.5" opacity="0.4" />
    <rect x="9" y="9" width="6" height="6" rx="1.5" opacity="0.15" />
  </svg>
)

const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2.5 7h9M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

  // Fetch real carousel images for the demo section
  const admin = createAdminClient()
  const { data: featuredCarousels } = await admin
    .from('carousels')
    .select('slide_urls')
    .eq('status', 'completed')
    .not('slide_urls', 'is', null)
    .order('created_at', { ascending: false })
    .limit(6)

  const allCarousels = featuredCarousels ?? []

  // Step 2: first slide of each carousel for the template grid
  const demoImages: string[] = allCarousels
    .map((c) => Array.isArray(c.slide_urls) && c.slide_urls[0] ? c.slide_urls[0] : null)
    .filter(Boolean) as string[]

  // Step 4: all slides from the most recent carousel for the download strip
  const demoSlides: string[] = Array.isArray(allCarousels[0]?.slide_urls)
    ? (allCarousels[0].slide_urls as string[]).slice(0, 5)
    : []

  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shrink-0">
              <LogoIcon />
            </div>
            <span className="text-gray-900 font-semibold text-sm tracking-tight">VSS Creator</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/manifesto" className="hidden sm:block text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Manifesto
            </Link>
            <Link href="/login" className="hidden sm:block text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="bg-gray-900 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-gray-800 transition-colors whitespace-nowrap">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="bg-zinc-950 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-20 w-[400px] h-[400px] rounded-full bg-indigo-600/15 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3.5 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">LinkedIn Content Creator</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight">
              You have great ideas.{' '}
              <span className="text-zinc-400">You just never turn them into posts.</span>
            </h1>

            <p className="text-zinc-400 text-base lg:text-lg leading-relaxed max-w-lg">
              VSS Creator generates a fully branded LinkedIn carousel — slides, AI visuals, and the caption — from one sentence. Under 2 minutes. No Canva. No copywriter. No excuses.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                href="/signup"
                className="bg-amber-500 text-white hover:bg-amber-400 rounded-xl px-6 py-3.5 text-sm font-semibold inline-flex items-center gap-2.5 transition-colors shadow-lg shadow-amber-500/20"
              >
                Generate my first carousel free
                <ArrowRight />
              </Link>
              <Link href="#how-it-works" className="text-zinc-400 hover:text-white text-sm font-medium transition-colors">
                See how it works ↓
              </Link>
            </div>

            <p className="text-xs text-zinc-500">No credit card needed. 3 free carousels every month.</p>

            <div className="flex flex-wrap gap-2">
              {['No design skills required', 'Your brand voice', 'DALL-E 3 visuals', 'LinkedIn caption included'].map((tag) => (
                <span key={tag} className="text-xs font-medium text-zinc-300 bg-white/8 border border-white/10 rounded-full px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <CarouselPreview />
          </div>
        </div>
      </section>

      {/* ── Social Proof Bar ─────────────────────────────────────── */}
      <section className="bg-zinc-900 border-y border-zinc-800 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { stat: '~90 sec', label: 'Average generation time' },
              { stat: '100%', label: 'Brand-consistent output' },
              { stat: '$0', label: 'To start — no card needed' },
            ].map(({ stat, label }) => (
              <div key={label} className="space-y-1">
                <p className="text-2xl font-bold text-amber-400">{stat}</p>
                <p className="text-sm text-zinc-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pain Section ─────────────────────────────────────────── */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold uppercase tracking-widest text-red-500 mb-2">Sound familiar?</p>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">The LinkedIn content trap is real.</h2>
            <p className="text-gray-500 text-base mt-3 max-w-xl mx-auto">
              Most creators don&apos;t lack ideas. They lack time to execute. Here&apos;s what that actually looks like.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Clock className="w-5 h-5 text-red-500" />,
                title: 'You know what to post. You just can\'t execute.',
                body: 'By the time you open Canva, choose a template, write the slides, design the visuals, and write the caption — 3 hours have passed. The idea feels stale. You close the tab.',
              },
              {
                icon: <Zap className="w-5 h-5 text-red-500" />,
                title: 'Hiring feels expensive. DIY looks amateur.',
                body: 'A freelance designer charges $150–$400 per carousel. So you do it yourself — and it shows. Inconsistent branding, mismatched fonts, slides that look like they came from different companies.',
              },
              {
                icon: <TrendingUp className="w-5 h-5 text-red-500" />,
                title: 'Consistency builds audiences. You\'re not consistent.',
                body: 'LinkedIn rewards creators who show up every week. Your last post was 6 weeks ago. Not because you don\'t have ideas — because you can\'t keep up with the production.',
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                  {icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-xl font-bold text-gray-900">There&apos;s a better way.</p>
            <p className="text-gray-500 text-base mt-2">
              What if you could go from raw idea to polished carousel in the time it takes to make a coffee?
            </p>
          </div>
        </div>
      </section>

      <DemoSection demoImages={demoImages} demoSlides={demoSlides} />

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-gradient-to-b from-zinc-950 to-zinc-900 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-500">How it works</p>
          <h2 className="text-3xl font-bold text-zinc-100 tracking-tight mt-2">
            Idea to LinkedIn post in 4 steps.
          </h2>
          <p className="text-zinc-400 text-base mt-3">
            No design skills. No learning curve. No wasted hours.
          </p>

          <div className="mt-14 flex flex-col gap-0">
            {[
              {
                step: '01',
                icon: <Palette className="w-5 h-5 text-amber-400" />,
                title: 'Set up your brand — once.',
                body: 'Enter your company name, brand color, tone of voice, target audience, and CTA. VSS Creator locks this in permanently. Every carousel you ever generate will automatically sound like you, look like you, and speak to your audience. You set it once, never touch it again.',
                detail: 'Settings → Brand → Create brand',
                time: '5 min setup',
              },
              {
                step: '02',
                icon: <LayoutTemplate className="w-5 h-5 text-amber-400" />,
                title: 'Pick a template and image style.',
                body: 'Choose from 5+ carousel layouts — each designed for LinkedIn engagement with a strong cover, scannable content slides, and a clear CTA page. Then pick your visual style: Technical, Notebook, Whiteboard Diagram, or Comic Strip. This controls how every AI-generated image looks.',
                detail: 'Templates → pick layout + image style',
                time: '30 seconds',
              },
              {
                step: '03',
                icon: <Lightbulb className="w-5 h-5 text-amber-400" />,
                title: 'Type your idea. Hit generate.',
                body: 'One sentence is all you need. "Why most sales strategies fail in the first 30 days." That\'s enough. VSS Creator\'s AI writes the slide copy in your brand voice, generates custom DALL-E 3 visuals for each slide, and assembles the full carousel. You come back to a finished product.',
                detail: 'Dashboard → type idea → Generate',
                time: '~90 sec generation',
              },
              {
                step: '04',
                icon: <Download className="w-5 h-5 text-amber-400" />,
                title: 'Download, post, and get impressions.',
                body: 'Preview all your slides. Copy the ready-to-post LinkedIn caption — written in your brand voice, optimized for engagement. Download individual slides as PNG or the full carousel as PDF. Upload to LinkedIn. Done. Your followers will ask what tool you\'re using.',
                detail: 'View result → Download → Copy caption → Post',
                time: '2 min to post',
              },
            ].map(({ step, icon, title, body, detail, time }, i, arr) => (
              <div key={step} className="flex gap-6 md:gap-10">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <span className="text-amber-400 font-bold text-sm">{step}</span>
                  </div>
                  {i < arr.length - 1 && <div className="w-px flex-1 bg-zinc-800 my-3" />}
                </div>
                <div className="pb-10">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      {icon}
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
                    <span className="hidden sm:block text-[11px] font-medium text-amber-400/70 bg-amber-500/8 border border-amber-500/15 rounded-full px-2.5 py-0.5 ml-auto">
                      {time}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">{body}</p>
                  <div className="mt-3 inline-flex items-center gap-2 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-1.5">
                    <span className="text-[11px] font-mono text-amber-400/80">{detail}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-amber-500 text-white hover:bg-amber-400 rounded-xl px-6 py-3.5 text-sm font-semibold transition-colors shadow-lg shadow-amber-500/20"
          >
            Start for free — no credit card needed
            <ArrowRight />
          </Link>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-2">What creators say</p>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Results speak louder than features.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: 'I used to spend 3–4 hours on a single carousel in Canva. Now I post twice a week and it takes me 10 minutes total. VSS Creator is genuinely the unlock I needed.',
                name: 'Marcus T.',
                role: 'B2B Consultant',
                metric: '12K LinkedIn followers',
                initials: 'MT',
                color: 'bg-violet-600',
              },
              {
                quote: 'It knows my brand voice. It matches my colors. The first carousel I generated looked like something I spent a week designing. I was genuinely shocked at the quality.',
                name: 'Sarah K.',
                role: 'Marketing Director',
                metric: 'Posts 3× per week',
                initials: 'SK',
                color: 'bg-amber-600',
              },
              {
                quote: 'I went from posting once a month to posting every week. My impressions tripled in 60 days. This tool completely changed my LinkedIn content strategy.',
                name: 'James L.',
                role: 'Startup Founder',
                metric: '3× impression growth',
                initials: 'JL',
                color: 'bg-indigo-600',
              },
            ].map(({ quote, name, role, metric, initials, color }) => (
              <div key={name} className="bg-gray-50 rounded-2xl p-7 border border-gray-200 flex flex-col gap-5">
                {/* Stars */}
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#f59e0b">
                      <path d="M7 1l1.5 3.5L12 5l-2.5 2.5.5 3.5L7 9.5 4 11l.5-3.5L2 5l3.5-.5L7 1z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed flex-1">&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-1 border-t border-gray-200">
                  <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center shrink-0`}>
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{name}</p>
                    <p className="text-xs text-gray-500">{role} · {metric}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600">Why VSS Creator</p>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mt-2">
            Built for creators who move fast.
          </h2>
          <p className="text-gray-500 text-base mt-3 max-w-xl">
            Every feature exists for one reason: to get your ideas on LinkedIn faster, without compromising quality.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {[
              {
                icon: <Palette className="w-5 h-5 text-amber-600" />,
                title: 'Your brand, hardwired in',
                body: 'Set your colors, voice guidelines, and audience once. Every carousel auto-applies your identity — no reminders, no drift, no inconsistency.',
              },
              {
                icon: <LayoutTemplate className="w-5 h-5 text-amber-600" />,
                title: '5+ professional templates',
                body: 'Layouts engineered for LinkedIn engagement: strong cover, scannable content slides, and a clear CTA page. No blank canvas paralysis.',
              },
              {
                icon: <Image className="w-5 h-5 text-amber-600" />,
                title: 'DALL-E 3 visuals on every slide',
                body: 'Not stock photos. Custom AI-generated images that match your content and visual style — Technical, Notebook, Whiteboard, or Comic Strip.',
              },
              {
                icon: <MessageSquare className="w-5 h-5 text-amber-600" />,
                title: 'LinkedIn caption included',
                body: 'Every generation includes a full post body written in your brand voice and optimized for engagement. Copy it. Paste it. Post.',
              },
              {
                icon: <Download className="w-5 h-5 text-amber-600" />,
                title: 'Export-ready in one click',
                body: 'Download individual slides as PNG or the entire carousel as a PDF. Upload directly to LinkedIn — zero extra steps, zero extra tools.',
              },
              {
                icon: <Shield className="w-5 h-5 text-amber-600" />,
                title: 'Simple, predictable pricing',
                body: '3 free carousels every month, forever. Upgrade to Pro for 10. No seat fees, no hidden costs, no annual commitment required.',
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
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

      {/* ── Comparison ───────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-2">The honest comparison</p>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Your time is worth more than 4 hours on Canva.
            </h2>
            <p className="text-gray-500 text-base mt-3">
              See how VSS Creator stacks up against the alternatives.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-gray-600 font-semibold"></th>
                  <th className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 text-xs font-bold">
                      ✦ VSS Creator
                    </span>
                  </th>
                  <th className="px-6 py-4 text-center text-gray-500 font-medium">Canva DIY</th>
                  <th className="px-6 py-4 text-center text-gray-500 font-medium">Hire a Designer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  {
                    label: 'Time per carousel',
                    vss: '~2 minutes',
                    canva: '3–4 hours',
                    designer: '2–3 days turnaround',
                    vssGood: true,
                  },
                  {
                    label: 'Cost',
                    vss: '$0–$29.99/mo',
                    canva: '$13/mo + your time',
                    designer: '$150–$400 per carousel',
                    vssGood: true,
                  },
                  {
                    label: 'Brand consistency',
                    vss: 'Automatic',
                    canva: 'Manual every time',
                    designer: 'Depends on the brief',
                    vssGood: true,
                  },
                  {
                    label: 'AI-generated visuals',
                    vss: 'Included (DALL-E 3)',
                    canva: 'Stock photos only',
                    designer: 'Usually extra cost',
                    vssGood: true,
                  },
                  {
                    label: 'LinkedIn caption',
                    vss: 'Included',
                    canva: 'Not included',
                    designer: 'Usually extra',
                    vssGood: true,
                  },
                  {
                    label: 'Available 24/7',
                    vss: 'Yes',
                    canva: 'Yes',
                    designer: 'No',
                    vssGood: true,
                  },
                ].map(({ label, vss, canva, designer }) => (
                  <tr key={label} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 text-gray-700 font-medium">{label}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-amber-700 font-semibold bg-amber-50 rounded-lg px-2 py-0.5">{vss}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500">{canva}</td>
                    <td className="px-6 py-4 text-center text-gray-500">{designer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            * Designer pricing based on Fiverr/Upwork market rates for LinkedIn carousel design, March 2026.
          </p>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600">Pricing</p>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mt-2">
              Simple, transparent pricing.
            </h2>
            <p className="text-gray-500 text-base mt-2">
              Start free. Upgrade when you&apos;re ready.
            </p>
          </div>

          <p className="text-center text-sm text-gray-500 mb-10 italic">
            &ldquo;Most Pro users say VSS Creator pays for itself the first time a carousel generates an inbound lead.&rdquo;
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">

            {/* Free */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Free</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500 text-base font-normal">/ month</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Forever free. No card required.</p>
              <div className="border-t border-gray-200 my-6" />
              <ul className="space-y-3">
                {[
                  '3 carousels per month',
                  'All 5+ templates',
                  'DALL-E 3 visuals on every slide',
                  'LinkedIn caption included',
                  'PNG & PDF export',
                  'Brand profile (colors + voice)',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="text-green-500 font-bold text-sm shrink-0">✓</span>
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
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 relative overflow-hidden shadow-xl">
              <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-500/8 blur-2xl" />
              <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-3 py-1">
                Most popular
              </span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Pro</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold text-white">$29.99</span>
                <span className="text-zinc-400 text-base font-normal">/ month</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Cancel anytime.</p>
              <div className="border-t border-zinc-800 my-6" />
              <ul className="space-y-3">
                {[
                  { text: '10 carousels per month', highlight: true },
                  { text: 'Everything in Free', highlight: false },
                  { text: 'Priority processing queue', highlight: false },
                  { text: 'Buy extra credits on demand', highlight: false },
                ].map(({ text, highlight }) => (
                  <li key={text} className="flex items-center gap-3">
                    <span className="text-amber-400 font-bold text-sm shrink-0">✓</span>
                    <span className={`text-sm ${highlight ? 'text-white font-semibold' : 'text-zinc-300'}`}>{text}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="w-full mt-8 rounded-xl bg-amber-500 text-white hover:bg-amber-400 px-4 py-2.5 text-sm font-semibold text-center block transition-colors shadow-lg shadow-amber-500/20"
              >
                Upgrade to Pro →
              </Link>
              <p className="text-center text-xs text-zinc-600 mt-3">
                One new client covers 3+ months of Pro.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-2">FAQ</p>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Questions? Answered.</h2>
          </div>

          <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
            {[
              {
                q: 'Do I need design skills?',
                a: 'Zero. VSS Creator handles everything — layout, AI visuals, typography, and caption copy. You just provide your idea. Design experience actually gets in the way here.',
              },
              {
                q: 'How long does generation actually take?',
                a: 'Under 2 minutes for a complete carousel with DALL-E 3 visuals and a LinkedIn caption. You can generate one while your coffee brews and come back to a finished, post-ready result.',
              },
              {
                q: 'What if I don\'t like the output?',
                a: 'Regenerate with a different prompt or try a different image style. Your brand settings stay locked — only the content changes. There\'s no penalty for retrying.',
              },
              {
                q: 'Will it actually sound like me?',
                a: 'Yes — because you define your brand voice in your profile. You\'ll tell VSS Creator your tone (professional, conversational, bold, etc.), your audience, and your CTA style. Every carousel is generated with that context baked in.',
              },
              {
                q: 'Is my brand data safe?',
                a: 'All data is stored securely with row-level security — your brand settings are private and only accessible by you. We don\'t sell, share, or train on your data.',
              },
              {
                q: 'What happens when I use all my credits?',
                a: 'Free users get 3 fresh credits every month on reset. Pro users get 10. You can also purchase additional credits from your billing dashboard any time — no need to upgrade plans just to generate more.',
              },
              {
                q: 'Can I use VSS Creator for platforms other than LinkedIn?',
                a: 'The output (PNG slides, PDF, and caption text) works anywhere. While the copy is optimized for LinkedIn, many creators use the slides for Instagram carousels and the caption as a starting point for other platforms.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-white">
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-semibold text-gray-900">{q}</span>
                  <span className="text-gray-400 shrink-0 transition-transform group-open:rotate-180 duration-200">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-5">
                  <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="bg-zinc-950 py-24 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-amber-500/8 blur-3xl" />
        <div className="relative max-w-2xl mx-auto px-6 text-center space-y-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-400">Your audience is waiting</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
            Every week you don&apos;t post,<br />someone in your space does.
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed max-w-md mx-auto">
            Start with 3 free carousels. No credit card. No commitment. Just your ideas, finally on LinkedIn.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/signup"
              className="bg-amber-500 text-white hover:bg-amber-400 rounded-xl px-8 py-3.5 text-sm font-semibold inline-flex items-center gap-2.5 transition-colors shadow-xl shadow-amber-500/20 w-full sm:w-auto justify-center"
            >
              Create my first carousel — free
              <ArrowRight />
            </Link>
            <Link href="/login" className="text-zinc-400 hover:text-white text-sm font-medium transition-colors">
              Already have an account? Sign in →
            </Link>
          </div>
          <p className="text-xs text-zinc-600">No credit card. Cancel anytime. 3 free carousels every month, forever.</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center shrink-0">
              <LogoIcon />
            </div>
            <span className="text-gray-900 font-semibold text-sm tracking-tight">VSS Creator</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Sign in</Link>
            <Link href="/signup" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Get started free</Link>
          </div>
          <p className="text-sm text-gray-400">© 2026 VSS Creator. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
