'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Layers,
  Palette,
  CreditCard,
  Sparkles,
} from 'lucide-react'

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  disabled?: boolean
}

function NavItem({ href, icon, label, disabled }: NavItemProps) {
  const pathname = usePathname()
  const isActive = !disabled && (pathname === href || pathname.startsWith(href + '/'))

  if (disabled) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-600 cursor-not-allowed select-none">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        isActive
          ? 'text-white bg-white/10'
          : 'text-zinc-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </Link>
  )
}

export function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-zinc-950 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="1" y="1" width="6" height="6" rx="1" fill="#18181b" />
              <rect x="9" y="1" width="6" height="6" rx="1" fill="#18181b" />
              <rect x="1" y="9" width="6" height="6" rx="1" fill="#18181b" />
              <rect x="9" y="9" width="6" height="6" rx="1" fill="#18181b" />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">VSS</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        <NavItem
          href="/dashboard"
          icon={<LayoutDashboard className="w-4 h-4 flex-shrink-0" />}
          label="Dashboard"
        />
        <NavItem
          href="/templates"
          icon={<Layers className="w-4 h-4 flex-shrink-0" />}
          label="Templates"
        />
        <NavItem
          href="/settings/brand"
          icon={<Palette className="w-4 h-4 flex-shrink-0" />}
          label="Brand"
        />

        <div className="my-2 border-t border-white/10" />

        <NavItem
          href="#"
          icon={<CreditCard className="w-4 h-4 flex-shrink-0" />}
          label="Billing · Phase 3"
          disabled
        />
        <NavItem
          href="#"
          icon={<Sparkles className="w-4 h-4 flex-shrink-0" />}
          label="Generate · Phase 5"
          disabled
        />
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        <p className="text-xs text-zinc-600 px-3 py-2">v0.1 — pre-launch</p>
      </div>
    </aside>
  )
}
