'use client'

import { useTransition } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createCheckoutSession } from '@/app/(protected)/settings/billing/actions'

const Spinner = () => (
  <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

export function CreditGate() {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
        <Lock className="w-5 h-5 text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">No credits remaining</p>
        <p className="text-sm text-gray-500 mt-1">
          You&apos;ve used all 3 free credits. Upgrade to Pro for $29.99/month and get 10 credits.
        </p>
      </div>
      <Button
        onClick={() => startTransition(() => createCheckoutSession())}
        disabled={isPending}
        className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
      >
        {isPending && <Spinner />}
        {isPending ? 'Redirecting…' : 'Upgrade to Pro →'}
      </Button>
    </div>
  )
}
