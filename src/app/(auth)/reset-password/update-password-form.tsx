'use client'
import { useActionState, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { updatePasswordAction } from './actions'

const Spinner = () => (
  <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

type FormState = { error?: string } | null

export function UpdatePasswordForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    updatePasswordAction,
    null
  )
  const [confirmError, setConfirmError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirm = (form.elements.namedItem('confirm') as HTMLInputElement).value
    if (password !== confirm) {
      e.preventDefault()
      setConfirmError('Passwords do not match')
      return
    }
    setConfirmError(null)
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Set new password</h1>
      <p className="text-gray-500 text-sm mb-6">Choose a strong password for your account.</p>

      <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            New password
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

        <div>
          <Label htmlFor="confirm" className="text-sm font-medium text-gray-700">
            Confirm password
          </Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            required
            placeholder="Repeat your new password"
            className="mt-1 w-full"
          />
          {confirmError && (
            <p className="text-red-500 text-sm mt-1">{confirmError}</p>
          )}
        </div>

        {state?.error && (
          <p className="text-red-500 text-sm mt-1">{state.error}</p>
        )}

        <Button type="submit" className="w-full gap-2" disabled={isPending}>
          {isPending && <Spinner />}
          {isPending ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </>
  )
}
