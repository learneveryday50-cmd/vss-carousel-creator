import Link from 'next/link'

const LogoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="1" y="1" width="6" height="6" rx="1.5" />
    <rect x="9" y="1" width="6" height="6" rx="1.5" opacity="0.4" />
    <rect x="1" y="9" width="6" height="6" rx="1.5" opacity="0.4" />
    <rect x="9" y="9" width="6" height="6" rx="1.5" opacity="0.15" />
  </svg>
)

export default function ManifestoPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shrink-0">
              <LogoIcon />
            </div>
            <span className="text-gray-900 font-semibold text-sm tracking-tight">VSS Creator</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="bg-gray-900 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-gray-800 transition-colors whitespace-nowrap">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Header ───────────────────────────────────────────────── */}
      <section className="bg-zinc-950 relative overflow-hidden py-24">
        <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full bg-amber-500/8 blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-6 text-center space-y-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-400">Our Manifesto</p>
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight">
            Expertise deserves an audience.{' '}
            <span className="text-zinc-400">Not just people with design budgets.</span>
          </h1>
          <p className="text-zinc-400 text-base lg:text-lg leading-relaxed max-w-xl mx-auto">
            What we believe. Why we built this. Who it&apos;s for — and who it&apos;s not.
          </p>
        </div>
      </section>

      {/* ── The Story ────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-6 space-y-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600">The story</p>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            We watched brilliant people stay invisible on LinkedIn.
          </h2>
          <div className="space-y-5 text-gray-600 text-base leading-relaxed">
            <p>
              Consultants with 15 years of hard-earned insight. Founders building remarkable companies. Marketing leaders with frameworks that could change how entire industries operate.
            </p>
            <p>
              All of them knew what to post. None of them posted it.
            </p>
            <p>
              Not because they lacked ideas. Not because they lacked expertise. Because the gap between <em className="text-gray-900 not-italic font-semibold">&ldquo;I have something worth saying&rdquo;</em> and <em className="text-gray-900 not-italic font-semibold">&ldquo;I have a finished carousel ready to post&rdquo;</em> was 4 hours in Canva, a blank page, and a design skill they never had — and never wanted.
            </p>
            <p>
              So the ideas stayed in their heads. The audience never grew. The opportunities never came.
            </p>
            <p className="text-gray-900 font-semibold">
              We built VSS Creator to close that gap. Permanently.
            </p>
          </div>
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-gray-100" />
      </div>

      {/* ── What We Believe ──────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-6 space-y-10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-3">What we believe</p>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              These are the convictions that drive every decision we make.
            </h2>
          </div>

          <div className="space-y-8">
            {[
              {
                number: '01',
                belief: 'Your ideas are the product. The tool should be invisible.',
                body: 'The best tools disappear. You shouldn\'t be thinking about layout, typography, or color theory when you have something to say. You should be thinking about the idea. VSS Creator handles the rest — so the only thing your audience ever sees is your thinking.',
              },
              {
                number: '02',
                belief: 'Consistency beats perfection. Every single time.',
                body: 'One perfectly crafted carousel every 6 weeks doesn\'t build an audience. Showing up every week does — even if each post isn\'t flawless. The creators who win on LinkedIn aren\'t the most talented designers. They\'re the most consistent publishers. We built VSS Creator to make consistency effortless.',
              },
              {
                number: '03',
                belief: 'Brand identity shouldn\'t require a designer on retainer.',
                body: 'Your brand isn\'t just a logo. It\'s a voice, a color, a point of view that stays consistent across every piece of content you publish. That consistency used to require either a serious design budget or hours of manual effort. It shouldn\'t. We believe it should be automatic.',
              },
              {
                number: '04',
                belief: 'The LinkedIn algorithm is real. Carousels work. Use them.',
                body: 'Carousel posts get 3× more impressions than text posts. That\'s not a theory — it\'s what the data shows. If you\'re not using carousels, you\'re leaving reach on the table. We believe every creator deserves to compete on a level playing field, regardless of design skills.',
              },
              {
                number: '05',
                belief: 'Speed matters. A tool you don\'t use is no tool at all.',
                body: 'We\'ve seen people spend $50/month on tools they open twice. We\'d rather you generate a carousel in 90 seconds and post it than spend 3 hours perfecting something that never ships. The best content strategy is the one you actually execute.',
              },
            ].map(({ number, belief, body }) => (
              <div key={number} className="flex gap-6">
                <div className="shrink-0 mt-1">
                  <span className="text-3xl font-bold text-amber-200 leading-none">{number}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-gray-900">{belief}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who It's For ─────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-3">Who it&apos;s for</p>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-8">
            VSS Creator is built for one type of person.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {[
              {
                title: 'The Expert with No Time',
                body: 'You have 10 years of insights your audience needs. You just can\'t spend 4 hours packaging each idea into a carousel.',
              },
              {
                title: 'The Founder Building in Public',
                body: 'You want to document your journey and grow an audience while running a company. Content creation can\'t be a second job.',
              },
              {
                title: 'The Consultant Growing Their Pipeline',
                body: 'You know LinkedIn is the best B2B channel. You need to show up consistently without hiring a content team.',
              },
              {
                title: 'The Marketer Who Needs Scale',
                body: 'You\'re managing a brand and a content calendar. You need fast, on-brand output — not a design bottleneck.',
              },
            ].map(({ title, body }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-green-500 font-bold text-base">✓</span>
                  <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          {/* Who It's NOT For */}
          <div className="bg-zinc-950 rounded-2xl p-8 space-y-5">
            <h3 className="text-base font-bold text-white">And who it&apos;s NOT for — we&apos;ll be honest.</h3>
            <div className="space-y-4">
              {[
                {
                  title: 'Pixel-perfect perfectionists',
                  body: 'If you need full control over every margin and font size, VSS Creator will frustrate you. We make design decisions for you — by design.',
                },
                {
                  title: 'Graphic designers',
                  body: 'You\'re already better at this than us. This tool is for people who aren\'t designers and don\'t want to be.',
                },
                {
                  title: 'People who post once a quarter',
                  body: 'VSS Creator is built for consistency. If you\'re not committed to showing up regularly, the tool won\'t change that for you.',
                },
              ].map(({ title, body }) => (
                <div key={title} className="flex gap-3">
                  <span className="text-red-400 font-bold text-base shrink-0 mt-0.5">✕</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">{title}</p>
                    <p className="text-sm text-zinc-400 leading-relaxed mt-0.5">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── The Promise ──────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-2xl mx-auto px-6 space-y-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600">Our promise</p>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            We promise to stay out of your way.
          </h2>
          <div className="space-y-5 text-gray-600 text-base leading-relaxed">
            <p>
              We will never make VSS Creator complicated. We will never add features that slow you down in the name of &ldquo;more control.&rdquo; We will never let the tool become the barrier it was supposed to remove.
            </p>
            <p>
              You paste an idea. You get a carousel. Your audience sees your thinking — not our software.
            </p>
            <p>
              That&apos;s the product. That&apos;s the promise. That&apos;s why we built this.
            </p>
            <p className="text-gray-900 font-semibold">
              — The VSS Creator Team
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="bg-zinc-950 py-20 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-amber-500/8 blur-3xl" />
        <div className="relative max-w-xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">
            If this resonates — you&apos;re exactly who we built this for.
          </h2>
          <p className="text-zinc-400 text-base">
            Start with 3 free carousels. No credit card. No commitment.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2.5 bg-amber-500 text-white hover:bg-amber-400 rounded-xl px-8 py-3.5 text-sm font-semibold transition-colors shadow-xl shadow-amber-500/20"
          >
            Create my first carousel — free
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7h9M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p className="text-xs text-zinc-600">Or <Link href="/" className="underline hover:text-zinc-400 transition-colors">see how it works</Link> first.</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center shrink-0">
              <LogoIcon />
            </div>
            <span className="text-gray-900 font-semibold text-sm tracking-tight">VSS Creator</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Home</Link>
            <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Sign in</Link>
            <Link href="/signup" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Get started free</Link>
          </div>
          <p className="text-sm text-gray-400">© 2026 VSS Creator. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
