'use client'

import { useTransition } from 'react'
import { createCheckoutSession, createCreditTopupSession, redirectToCustomerPortal } from './actions'

const Spinner = () => (
  <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

export function UpgradeButton() {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      onClick={() => startTransition(() => createCheckoutSession())}
      disabled={isPending}
      className="bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap disabled:opacity-70 inline-flex items-center gap-2"
    >
      {isPending && <Spinner />}
      {isPending ? 'Redirecting…' : 'Upgrade →'}
    </button>
  )
}

export function BuyCreditsButton() {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      onClick={() => startTransition(() => createCreditTopupSession())}
      disabled={isPending}
      className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap disabled:opacity-70 inline-flex items-center gap-2"
    >
      {isPending && <Spinner />}
      {isPending ? 'Redirecting…' : 'Buy 10 credits →'}
    </button>
  )
}

export function ManageBillingButton() {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      onClick={() => startTransition(() => redirectToCustomerPortal())}
      disabled={isPending}
      className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-70 inline-flex items-center gap-2"
    >
      {isPending && <Spinner />}
      {isPending ? 'Opening…' : 'Manage Billing'}
    </button>
  )
}
