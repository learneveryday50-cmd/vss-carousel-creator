'use client'

import { useActionState, useEffect } from 'react'
import { updateBrandInlineAction } from '@/app/(protected)/templates/brand-actions'
import type { Brand } from '@/lib/supabase/brands'

type Props = {
  brand: Brand
  onSaved: () => void
  onCancel: () => void
}

export function InlineBrandEditor({ brand, onSaved, onCancel }: Props) {
  const [state, formAction, isPending] = useActionState(updateBrandInlineAction, null)

  useEffect(() => {
    if (state?.success) onSaved()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <div className="mt-3 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

      {/* Header strip */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: brand.primary_color }} />
        <p className="text-xs font-semibold text-gray-700 flex-1">{brand.name}</p>
      </div>

      <div className="px-5 py-5">

        {/* Per-brand isolation notice */}
        <div className="mb-5 flex gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3">
          <InfoIcon />
          <p className="text-[11px] leading-relaxed text-blue-700">
            These settings belong <strong>only to &ldquo;{brand.name}&rdquo;</strong>. Each brand keeps its own defaults — switching brands loads that brand&apos;s own settings, never mixing them up.
          </p>
        </div>

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="id" value={brand.id} />

          {/* Error — shown at top so it's never missed */}
          {state?.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-semibold text-red-700 mb-0.5">Save failed</p>
              <p className="text-xs text-red-600 font-mono break-all">{state.error}</p>
            </div>
          )}

          {/* ── Brand Identity ─────────────────────────────── */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-gray-500 mb-2">Brand Identity</legend>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Brand name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                defaultValue={brand.name}
                placeholder="Acme Inc."
                className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent shadow-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Brand Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" name="primary_color" defaultValue={brand.primary_color}
                    className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 shrink-0" />
                  <input type="text" readOnly defaultValue={brand.primary_color}
                    className="flex-1 h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-mono text-gray-500" tabIndex={-1} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Secondary color</label>
                <div className="flex items-center gap-2">
                  <input type="color" name="secondary_color" defaultValue={brand.secondary_color ?? '#ffffff'}
                    className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 shrink-0" />
                  <input type="text" readOnly defaultValue={brand.secondary_color ?? '#ffffff'}
                    className="flex-1 h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-mono text-gray-500" tabIndex={-1} />
                </div>
              </div>
            </div>
          </fieldset>

          {/* ── Voice & Description ────────────────────────── */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-gray-500 mb-2">Voice &amp; Description</legend>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Brand Voice</label>
              <textarea name="voice_guidelines" rows={2} maxLength={3000}
                defaultValue={brand.voice_guidelines ?? ''} placeholder="We speak with confidence and clarity..."
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Product &amp; Audience</label>
              <textarea name="product_description" rows={2} maxLength={1500}
                defaultValue={brand.product_description ?? ''} placeholder="Describe your product or service..."
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Audience description</label>
              <textarea name="audience_description" rows={2}
                defaultValue={brand.audience_description ?? ''} placeholder="Describe your target audience..."
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">CTA Text</label>
              <input name="cta_text" defaultValue={brand.cta_text ?? ''} placeholder="Start your free trial"
                className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent shadow-sm" />
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="h-9 rounded-lg bg-gray-900 text-white px-4 text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              {isPending ? 'Saving…' : 'Save brand'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="h-9 rounded-lg border border-gray-200 bg-white text-gray-500 px-4 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function InfoIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
