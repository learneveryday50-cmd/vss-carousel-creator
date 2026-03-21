'use client'
import { useActionState } from 'react'
import Link from 'next/link'
import { AuthCard } from '@/components/auth/auth-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { signUpAction } from './actions'

const Spinner = () => (
  <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

type FormState = { error?: string } | null

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    signUpAction,
    null
  )

  return (
    <AuthCard>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create your account</h1>
      <p className="text-gray-500 text-sm mb-6">Start building your branded carousels</p>

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

        <div>
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            className="mt-1 w-full"
          />
        </div>

        {state?.error && (
          <p className="text-red-500 text-sm mt-1">{state.error}</p>
        )}

        <Button type="submit" className="w-full gap-2" disabled={isPending}>
          {isPending && <Spinner />}
          {isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-sm text-gray-500 mt-6 text-center">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  )
}
