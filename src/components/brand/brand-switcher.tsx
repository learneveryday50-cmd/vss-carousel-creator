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
        className="h-8 px-3 rounded-lg border border-amber-200 bg-amber-50 text-sm font-medium text-amber-700 flex items-center gap-2 hover:bg-amber-100 transition-colors"
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
        className="h-8 px-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 flex items-center gap-2 hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
      >
        {selectedBrand && (
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10"
            style={{ backgroundColor: selectedBrand.primary_color }}
          />
        )}
        <span>{selectedBrand?.name ?? 'Select brand'}</span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 right-0 w-52 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
          <div className="p-1">
            {brands.map((brand) => {
              const isSelected = brand.id === (selectedBrand?.id ?? null)
              return (
                <form key={brand.id} action={setBrandAction}>
                  <input type="hidden" name="brand_id" value={brand.id} />
                  <button
                    type="submit"
                    onClick={() => setOpen(false)}
                    className={[
                      'w-full px-3 py-2 text-sm text-left rounded-lg cursor-pointer flex items-center gap-2.5 transition-colors',
                      isSelected
                        ? 'bg-amber-50 text-amber-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10"
                      style={{ backgroundColor: brand.primary_color }}
                    />
                    {brand.name}
                    {isSelected && (
                      <span className="ml-auto">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M1.5 6l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </button>
                </form>
              )
            })}
          </div>
          <div className="border-t border-gray-100 p-1">
            <Link
              href="/settings/brand"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-600 rounded-lg transition-colors"
            >
              Manage brands &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
