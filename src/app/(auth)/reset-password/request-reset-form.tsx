'use client'
import { useActionState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { requestPasswordResetAction } from './actions'

type FormState = { error?: string; success?: boolean } | null

export function RequestResetForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    requestPasswordResetAction,
    null
  )

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Reset your password</h1>
      <p className="text-gray-500 text-sm mb-6">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {state?.success ? (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 mb-4">
          <p className="text-green-700 text-sm">Reset link sent — check your inbox.</p>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="mt-1 w-full"
            />
          </div>

          {state?.error && (
            <p className="text-red-500 text-sm mt-1">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>
      )}

      <p className="text-sm text-gray-500 mt-6 text-center">
        <Link href="/login" className="text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  )
}
