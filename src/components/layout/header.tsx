import type { Brand } from '@/lib/supabase/brands'
import { BrandSwitcher } from '@/components/brand/brand-switcher'

interface HeaderProps {
  brands: Brand[]
  selectedBrandId: string | null
  userEmail?: string | null
}

export function Header({ brands, selectedBrandId, userEmail }: HeaderProps) {
  const initials = userEmail
    ? userEmail.charAt(0).toUpperCase()
    : '?'

  return (
    <header className="h-14 border-b border-zinc-100 bg-white flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex-1" />
      <BrandSwitcher brands={brands} selectedBrandId={selectedBrandId} />
      {/* User avatar */}
      <div className="flex items-center gap-2">
        {userEmail && (
          <span className="text-sm text-zinc-500 hidden sm:block">{userEmail}</span>
        )}
        <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">
          <span className="text-white text-xs font-semibold">{initials}</span>
        </div>
      </div>
    </header>
  )
}
