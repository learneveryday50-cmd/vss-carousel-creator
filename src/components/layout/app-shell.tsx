'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import type { Brand } from '@/lib/supabase/brands'

interface CreditData {
  plan: 'free' | 'pro'
  creditsRemaining: number
  creditsLimit: number
}

interface Props {
  brands: Brand[]
  selectedBrandId: string | null
  userEmail?: string | null
  creditData: CreditData
  children: React.ReactNode
}

export function AppShell({ brands, selectedBrandId, userEmail, creditData, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          brands={brands}
          selectedBrandId={selectedBrandId}
          userEmail={userEmail}
          creditData={creditData}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-5 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
