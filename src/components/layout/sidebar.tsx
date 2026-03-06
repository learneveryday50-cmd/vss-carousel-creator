'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Layers,
  Palette,
  CreditCard,
  Sparkles,
  X,
} from 'lucide-react'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  disabled?: boolean
  onClick?: () => void
}

function NavItem({ href, icon, label, disabled, onClick }: NavItemProps) {
  const pathname = usePathname()
  const isActive = !disabled && (pathname === href || pathname.startsWith(href + '/'))

  if (disabled) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-300 cursor-not-allowed select-none">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
    )
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-amber-50 text-amber-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
      ].join(' ')}
    >
      <span className={isActive ? 'text-amber-600' : 'text-gray-400'}>{icon}</span>
      {label}
    </Link>
  )
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  return (
    <>
      {/* Logo row */}
      <div className="h-14 px-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" />
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" />
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" />
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" />
            </svg>
          </div>
          <span className="text-gray-900 font-semibold text-sm tracking-tight">VSS</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Main
        </p>
        <NavItem
          href="/dashboard"
          icon={<LayoutDashboard className="w-4 h-4 flex-shrink-0" />}
          label="Dashboard"
          onClick={onClose}
        />
        <NavItem
          href="/templates"
          icon={<Layers className="w-4 h-4 flex-shrink-0" />}
          label="Create Carousel"
          onClick={onClose}
        />
        <NavItem
          href="/settings/brand"
          icon={<Palette className="w-4 h-4 flex-shrink-0" />}
          label="Brand"
          onClick={onClose}
        />

        <div className="pt-3">
          <NavItem
            href="/settings/billing"
            icon={<CreditCard className="w-4 h-4 flex-shrink-0" />}
            label="Billing"
            onClick={onClose}
          />
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-300">
            Coming Soon
          </p>
          <NavItem
            href="#"
            icon={<Sparkles className="w-4 h-4 flex-shrink-0" />}
            label="Generate"
            disabled
          />
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 px-2">v0.1 &mdash; pre-launch</p>
      </div>
    </>
  )
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  return (
    <>
      {/* ── Desktop static sidebar (lg+) ─────────────────────── */}
      <aside className="hidden lg:flex w-56 min-h-screen bg-white border-r border-gray-200 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer (< lg) ──────────────────────────────── */}
      <div
        aria-hidden="true"
        className={[
          'fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
      />

      <aside
        className={[
          'fixed top-0 left-0 h-full w-56 bg-white border-r border-gray-200 flex flex-col z-50 lg:hidden',
          'transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <SidebarContent onClose={onClose} />
      </aside>
    </>
  )
}
