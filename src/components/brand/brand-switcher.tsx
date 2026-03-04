'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { Brand } from '@/lib/supabase/brands'
import { setBrandAction } from '@/app/(protected)/dashboard/actions'

interface BrandSwitcherProps {
  brands: Brand[]
  selectedBrandId: string | null
}

export function BrandSwitcher({ brands, selectedBrandId }: BrandSwitcherProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedBrand = brands.find((b) => b.id === selectedBrandId) ?? brands[0] ?? null

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  if (brands.length === 0) {
    return (
      <Link
        href="/onboarding"
        className="h-9 px-3 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 flex items-center gap-2 hover:bg-zinc-50"
      >
        Set up brand
      </Link>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 px-3 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 flex items-center gap-2 hover:bg-zinc-50"
      >
        {selectedBrand && (
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: selectedBrand.primary_color }}
          />
        )}
        <span>{selectedBrand?.name ?? 'Select brand'}</span>
        <svg
          className="w-4 h-4 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 w-52 bg-white rounded-xl border border-zinc-200 shadow-lg overflow-hidden z-50">
          {brands.map((brand) => {
            const isSelected = brand.id === (selectedBrand?.id ?? null)
            return (
              <form key={brand.id} action={setBrandAction}>
                <input type="hidden" name="brand_id" value={brand.id} />
                <button
                  type="submit"
                  onClick={() => setOpen(false)}
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-zinc-50 cursor-pointer flex items-center gap-2 ${
                    isSelected ? 'text-zinc-900 font-medium' : 'text-zinc-600'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: brand.primary_color }}
                  />
                  {brand.name}
                </button>
              </form>
            )
          })}
          <div className="border-t border-zinc-100">
            <Link
              href="/settings/brand"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
            >
              Manage brands
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
