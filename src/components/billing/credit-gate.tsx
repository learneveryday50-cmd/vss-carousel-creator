'use client'

import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function CreditGate() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
        <Lock className="w-5 h-5 text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">No credits remaining</p>
        <p className="text-sm text-gray-500 mt-1">
          You&apos;ve used all your credits. Top up to keep generating carousels.
        </p>
      </div>
      <Button
        onClick={() => router.push('/settings/billing')}
        className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
      >
        Buy Credits →
      </Button>
    </div>
  )
}
