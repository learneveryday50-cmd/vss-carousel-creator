import Link from 'next/link'

interface CreditBadgeProps {
  plan: 'free' | 'pro'
  creditsRemaining: number
  creditsLimit: number
}

export function CreditBadge({ plan, creditsRemaining, creditsLimit }: CreditBadgeProps) {
  const isZero = creditsRemaining === 0
  const isLow = creditsRemaining === 1

  const badgeClass =
    plan === 'pro' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'

  const countClass = isZero ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-600'

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span
        className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${badgeClass}`}
      >
        {plan === 'pro' ? 'PRO' : 'FREE'}
      </span>
      <span className={`font-medium tabular-nums ${countClass}`}>
        {creditsRemaining} / {creditsLimit}
      </span>
      <span className="text-gray-400 text-xs">credits</span>
      {isZero && plan === 'free' && (
        <Link href="/settings/billing" className="text-xs text-amber-600 hover:underline ml-1">
          Upgrade
        </Link>
      )}
    </div>
  )
}
