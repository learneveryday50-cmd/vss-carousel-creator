'use client'

import { useActionState } from 'react'
import { redeemKey } from './actions'

const Spinner = () => (
  <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

export function RedeemKeyForm() {
  const [state, action, isPending] = useActionState(redeemKey, null)

  return (
    <form action={action} className="space-y-3">
      <div className="flex gap-2">
        <input
          name="license_key"
          type="text"
          placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
          autoComplete="off"
          spellCheck={false}
          className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap disabled:opacity-70 inline-flex items-center gap-2 shrink-0"
        >
          {isPending && <Spinner />}
          {isPending ? 'Verifying…' : 'Redeem'}
        </button>
      </div>
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </form>
  )
}
