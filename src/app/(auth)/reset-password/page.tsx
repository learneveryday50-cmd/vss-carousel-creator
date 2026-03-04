import { createClient } from '@/lib/supabase/server'
import { AuthCard } from '@/components/auth/auth-card'
import { RequestResetForm } from './request-reset-form'
import { UpdatePasswordForm } from './update-password-form'

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user has an active recovery session, show the "set new password" form
  const hasRecoverySession = !!user

  return (
    <AuthCard>
      {hasRecoverySession ? <UpdatePasswordForm /> : <RequestResetForm />}
    </AuthCard>
  )
}
