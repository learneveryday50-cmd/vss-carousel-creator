'use client'
import { motion } from 'framer-motion'
import { BrandForm } from '@/components/brand/brand-form'
import type { Brand } from '@/lib/supabase/brands'

type ActionState = { error?: string } | null

type OnboardingPanelsProps = {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

const LogoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 16 16">
    <rect x="1" y="1" width="6" height="6" rx="1.5" />
    <rect x="9" y="1" width="6" height="6" rx="1.5" opacity="0.4" />
    <rect x="1" y="9" width="6" height="6" rx="1.5" opacity="0.4" />
    <rect x="9" y="9" width="6" height="6" rx="1.5" opacity="0.15" />
  </svg>
)

const BULLETS = [
  'Consistent visual identity',
  'AI-aligned voice and tone',
  'One-click generation ready',
]

export function OnboardingPanels({ action }: OnboardingPanelsProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* Mobile dark header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="lg:hidden relative overflow-hidden bg-zinc-950 px-6 pt-10 pb-14 rounded-b-[2.5rem]"
      >
        <div className="pointer-events-none absolute -top-20 -left-20 w-64 h-64 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-0 w-52 h-52 rounded-full bg-indigo-600/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
            <LogoIcon className="w-4 h-4 text-zinc-900" />
          </div>
          <span className="text-white font-semibold text-base tracking-tight">VSS Creator</span>
        </div>

        <div className="relative z-10 space-y-3">
          <h1 className="text-[1.75rem] font-bold text-white leading-tight tracking-tight">
            Set up your brand
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
            Your brand defines how every carousel looks and sounds.
          </p>
        </div>
      </motion.div>

      {/* Desktop left panel */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="hidden lg:flex lg:flex-1 flex-col justify-between bg-zinc-950 px-12 py-10 relative overflow-hidden"
      >
        <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-20 w-[400px] h-[400px] rounded-full bg-indigo-600/15 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
            <LogoIcon className="w-4 h-4 text-zinc-900" />
          </div>
          <span className="text-white font-semibold text-base tracking-tight">VSS Creator</span>
        </div>

        {/* Copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white leading-[1.15] tracking-tight">
              Set up your brand
            </h1>
            <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
              Your brand defines how every carousel looks and sounds.
            </p>
          </div>

          <ul className="space-y-3">
            {BULLETS.map((bullet) => (
              <li key={bullet} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                <span className="text-zinc-300 text-sm">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom spacer */}
        <div className="relative z-10" />
      </motion.div>

      {/* Right panel: form */}
      <div className="flex flex-1 lg:flex-none lg:w-[520px] items-start justify-center px-6 py-10 bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Create your brand</h2>
            <p className="text-zinc-500 text-sm mt-1.5">
              Fill in the details below to get started.
            </p>
          </div>

          <BrandForm
            action={action}
            submitLabel="Create brand"
            redirectTo="/dashboard"
          />
        </motion.div>
      </div>
    </div>
  )
}
