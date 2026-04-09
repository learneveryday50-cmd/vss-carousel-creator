import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RedeemKeyForm } from './redeem-key-form'

export const metadata = { title: 'Billing' }

const CREDIT_PACKS = [
  {
    credits: 10,
    price: '$9',
    label: 'Starter Pack',
    description: 'Perfect for trying out',
    url: process.env.NEXT_PUBLIC_GUMROAD_URL_10,
  },
  {
    credits: 25,
    price: '$19',
    label: 'Creator Pack',
    description: 'Most popular',
    url: process.env.NEXT_PUBLIC_GUMROAD_URL_25,
  },
  {
    credits: 50,
    price: '$35',
    label: 'Pro Pack',
    description: 'Best value',
    url: process.env.NEXT_PUBLIC_GUMROAD_URL_50,
  },
]

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
    .select('credits_remaining')
    .eq('user_id', user.id)
    .single()

  const { success } = await searchParams
  const creditsRemaining = usage?.credits_remaining ?? 0

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold uppercase tracking-widest border border-amber-200">
          Settings
        </span>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Top up your credits to generate more carousels.</p>
      </div>

      {/* Success banner */}
      {success === 'credits' && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 font-medium">
          ✓ Credits added successfully! Your balance has been updated.
        </div>
      )}

      {/* Credits balance card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-4">Your Balance</h2>
        <div className="flex items-end gap-1 mb-1">
          <span className="text-4xl font-bold text-gray-900">{creditsRemaining}</span>
          <span className="text-gray-400 text-sm mb-1.5">credits remaining</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Each carousel generation uses 1 credit. Credits never expire.
        </p>
      </div>

      {/* Credit packs */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-3">Buy Credits</h2>
        <div className="space-y-3">
          {CREDIT_PACKS.map(({ credits, price, label, description, url }) => (
            <div key={credits} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-gray-900">{label}</span>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{description}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-gray-900">{credits}</span>
                    <span className="text-sm text-gray-500">credits</span>
                    <span className="text-sm text-gray-400">·</span>
                    <span className="text-sm font-semibold text-amber-600">{price}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <a
                    href={url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap inline-flex items-center gap-1"
                  >
                    Buy on Gumroad →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Redeem license key */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-1">Redeem License Key</h2>
        <p className="text-xs text-gray-400 mb-4">
          After purchasing, you&apos;ll receive a license key by email. Enter it below to add credits.
        </p>
        <RedeemKeyForm />
      </div>

      {/* Info note */}
      <p className="text-xs text-gray-400 text-center">
        Credits never expire · Secure checkout via Gumroad · Instant delivery
      </p>

    </div>
  )
}
