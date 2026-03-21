import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UpgradeButton, BuyCreditsButton, ManageBillingButton } from './billing-buttons'

export const metadata = { title: 'Billing' }

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('plan, credits_remaining, credits_limit, stripe_subscription_status')
    .eq('user_id', user.id)
    .single()

  const { success } = await searchParams

  const plan = usage?.plan ?? 'free'
  const creditsRemaining = usage?.credits_remaining ?? 0
  const isPro = plan === 'pro'
  const creditsPackConfigured = !!process.env.STRIPE_CREDITS_PRICE_ID

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold uppercase tracking-widest border border-amber-200">
          Settings
        </span>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your plan and credits.</p>
      </div>

      {/* Success banner */}
      {success === 'credits' && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 font-medium">
          ✓ Credits added successfully! Your balance has been updated.
        </div>
      )}
      {success === 'pro' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 font-medium">
          ✓ Welcome to Pro! You now have 10 credits available.
        </div>
      )}

      {/* Current plan card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Current Plan</h2>
          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${isPro ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
            {isPro ? 'PRO' : 'FREE'}
          </span>
        </div>

        {/* Credits display */}
        <div className="flex items-end gap-1 mb-1">
          <span className="text-4xl font-bold text-gray-900">{creditsRemaining}</span>
          <span className="text-gray-400 text-sm mb-1.5">credits remaining</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
          <div
            className="bg-amber-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(100, (creditsRemaining / (isPro ? 10 : 3)) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400">
          {isPro
            ? 'Pro plan — credits reset each billing cycle'
            : 'Free plan — 3 one-time credits (no monthly reset)'}
        </p>
      </div>

      {/* Buy Credits — available to everyone */}
      {creditsPackConfigured && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-1">Buy More Credits</h2>
              <p className="text-sm text-gray-500">
                Top up your balance with 10 extra credits. Stacks on top of your current balance.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Example: you have {creditsRemaining} credits → buy 10 → total {creditsRemaining + 10} credits
              </p>
            </div>
            <div className="flex-shrink-0">
              <BuyCreditsButton />
            </div>
          </div>
        </div>
      )}

      {/* Upgrade to Pro */}
      {!isPro && (
        <div className="bg-gray-900 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Pro Plan</span>
              <h2 className="text-lg font-bold mt-1 mb-1">Upgrade to Pro</h2>
              <p className="text-sm text-zinc-400">$29.99/month — 10 credits per billing cycle, resets automatically.</p>
              <ul className="mt-3 space-y-1">
                {['10 carousels/month', 'All templates & styles', 'Priority processing'].map(f => (
                  <li key={f} className="text-xs text-zinc-300 flex items-center gap-2">
                    <span className="text-amber-400">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-shrink-0">
              <UpgradeButton />
            </div>
          </div>
        </div>
      )}

      {/* Manage Billing (Pro only) */}
      {isPro && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-1">Manage Subscription</h2>
            <p className="text-sm text-gray-500">Update payment method, view invoices, or cancel.</p>
          </div>
          <ManageBillingButton />
        </div>
      )}

    </div>
  )
}
