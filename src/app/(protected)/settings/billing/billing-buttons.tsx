'use client'

import { useTransition } from 'react'
import { buyCredits10, buyCredits25, buyCredits50 } from './actions'

const Spinner = () => (
  <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

function BuyButton({ action, label }: { action: () => Promise<void>; label: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      onClick={() => startTransition(() => action())}
      disabled={isPending}
      className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap disabled:opacity-70 inline-flex items-center gap-2"
    >
      {isPending && <Spinner />}
      {isPending ? 'Redirecting…' : label}
    </button>
  )
}

export function Buy10CreditsButton() {
  return <BuyButton action={buyCredits10} label="Buy 10 credits →" />
}

export function Buy25CreditsButton() {
  return <BuyButton action={buyCredits25} label="Buy 25 credits →" />
}

export function Buy50CreditsButton() {
  return <BuyButton action={buyCredits50} label="Buy 50 credits →" />
}
