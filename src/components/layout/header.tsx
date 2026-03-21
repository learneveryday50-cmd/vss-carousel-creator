'use client'

import { Menu, CreditCard, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CreditBadge } from '@/components/billing/credit-badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CreditData {
  plan: 'free' | 'pro'
  creditsRemaining: number
  creditsLimit: number
}

interface HeaderProps {
  userEmail?: string | null
  creditData: CreditData
  onMenuClick?: () => void
}

export function Header({ userEmail, creditData, onMenuClick }: HeaderProps) {
  const initials = userEmail ? userEmail.charAt(0).toUpperCase() : '?'
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 lg:px-6 gap-3 flex-shrink-0">
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <CreditBadge
        plan={creditData.plan}
        creditsRemaining={creditData.creditsRemaining}
        creditsLimit={creditData.creditsLimit}
      />

      <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

      <div className="flex items-center gap-2.5 flex-shrink-0">
        {userEmail && (
          <span className="text-sm text-gray-500 hidden sm:block truncate max-w-[160px]">
            {userEmail}
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 ring-2 ring-white ring-offset-1 ring-offset-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label="User menu"
            >
              <span className="text-white text-xs font-semibold">{initials}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {userEmail && (
              <>
                <div className="px-2 py-1.5 text-xs text-gray-500 truncate">{userEmail}</div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href="/settings/billing" className="flex items-center cursor-pointer">
                <CreditCard className="w-4 h-4 mr-2 text-gray-500" />
                Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="flex items-center cursor-pointer text-red-600 focus:text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
