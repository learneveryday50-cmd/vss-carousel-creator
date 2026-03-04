'use client'
import { useActionState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { signInAction } from './actions'

type FormState = { error?: string } | null

const LogoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 16 16">
    <rect x="1" y="1" width="6" height="6" rx="1.5" />
    <rect x="9" y="1" width="6" height="6" rx="1.5" opacity="0.4" />
    <rect x="1" y="9" width="6" height="6" rx="1.5" opacity="0.4" />
    <rect x="9" y="9" width="6" height="6" rx="1.5" opacity="0.15" />
  </svg>
)

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
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

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(signInAction, null)

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Mobile hero header (hidden on desktop) ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="lg:hidden relative overflow-hidden bg-zinc-950 px-6 pt-10 pb-14 rounded-b-[2.5rem]"
      >
        {/* Orbs */}
        <div className="pointer-events-none absolute -top-20 -left-20 w-64 h-64 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-0 w-52 h-52 rounded-full bg-indigo-600/20 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
            <LogoIcon className="w-4 h-4 text-zinc-900" />
          </div>
          <span className="text-white font-semibold text-base tracking-tight">VSS Creator</span>
        </div>

        {/* Copy */}
        <div className="relative z-10 space-y-3">
          <h1 className="text-[1.75rem] font-bold text-white leading-tight tracking-tight">
            Create viral carousel<br />posts in seconds
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
            AI-powered LinkedIn carousels — no design tools required.
          </p>
        </div>

        {/* Pill badges */}
        <div className="relative z-10 flex flex-wrap gap-2 mt-6">
          {['AI-powered', 'LinkedIn ready', 'No design skills'].map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium text-zinc-300 bg-white/10 border border-white/10 rounded-full px-3 py-1"
            >
              {tag}
            </span>
          ))}
        </div>
      </motion.div>

      {/* ── Desktop left panel (hidden on mobile) ── */}
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

        {/* Copy + preview */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white leading-[1.15] tracking-tight">
              Create viral carousel<br />posts in seconds
            </h1>
            <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
              Generate high-performing carousel content for LinkedIn using
              AI-powered templates — no design tools required.
            </p>
          </div>
          <CarouselPreview />
        </div>

        {/* Trust signal */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {['bg-violet-400', 'bg-indigo-400', 'bg-sky-400', 'bg-teal-400'].map((color, i) => (
              <div key={i} className={`w-7 h-7 rounded-full border-2 border-zinc-950 ${color}`} />
            ))}
          </div>
          <p className="text-zinc-500 text-sm">Trusted by creators worldwide</p>
        </div>
      </motion.div>

      {/* ── Auth form (both mobile + desktop) ── */}
      <div className="flex flex-1 lg:flex-none lg:w-[480px] items-center justify-center px-6 py-10 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
          className="w-full max-w-sm"
        >
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Welcome back</h2>
            <p className="text-zinc-500 text-sm mt-1.5">Sign in to your account to continue</p>
          </div>

          {/* Google button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 text-sm font-medium border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-zinc-400 uppercase tracking-widest">or</span>
            </div>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-zinc-700">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="you@example.com" className="h-11" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-zinc-700">Password</Label>
                <Link href="/reset-password" className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" name="password" type="password" required placeholder="Enter your password" className="h-11" />
            </div>

            {state?.error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-red-600 text-sm">{state.error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-sm font-medium mt-1" disabled={isPending}>
              {isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-sm text-zinc-500 mt-6 text-center">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-zinc-900 font-semibold hover:underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>

    </div>
  )
}
