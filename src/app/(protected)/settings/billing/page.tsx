import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createCheckoutSession, redirectToCustomerPortal } from './actions'

export const metadata = { title: 'Billing' }

export default async function BillingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('plan, credits_remaining, credits_limit, stripe_subscription_status')
    .eq('user_id', user.id)
    .single()

  const plan = usage?.plan ?? 'free'
  const creditsRemaining = usage?.credits_remaining ?? 0
  const creditsLimit = usage?.credits_limit ?? 3
  const isPro = plan === 'pro'

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold uppercase tracking-widest border border-amber-200">
          Settings
        </span>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your plan and credit balance.</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Section 1 — Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">{isPro ? 'Pro' : 'Free'}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {creditsRemaining} / {creditsLimit} credits remaining this month
              </p>
            </div>
            <span
              className={`text-[10px] font-semibold uppercase px-2 py-1 rounded ${isPro ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}
            >
              {isPro ? 'PRO' : 'FREE'}
            </span>
          </CardContent>
        </Card>

        {/* Section 2 — Upgrade (hidden for Pro users) */}
        {!isPro && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upgrade to Pro</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  $29.99/month — 10 carousel generations per month
                </p>
              </div>
              <form action={createCheckoutSession}>
                <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white">
                  Upgrade to Pro
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Section 3 — Manage Billing (always shown) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manage Billing</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Update payment method, view invoices, or cancel your subscription.
            </p>
            <form action={redirectToCustomerPortal}>
              <Button type="submit" variant="outline">
                Manage Billing
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
