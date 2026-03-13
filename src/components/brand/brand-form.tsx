'use client'
import { useActionState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { AirtableBrand } from '@/lib/airtable'

type ActionState = { error?: string } | null

type BrandFormProps = {
  brand?: AirtableBrand
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  submitLabel?: string
  redirectTo?: string
}

export function BrandForm({
  brand,
  action,
  submitLabel = 'Save brand',
  redirectTo,
}: BrandFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <form action={formAction} className="space-y-8">
      {/* Hidden fields */}
      {brand && <input type="hidden" name="id" value={brand.id} />}
      {redirectTo && <input type="hidden" name="redirect_to" value={redirectTo} />}

      {/* Section 1: Brand Identity */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Brand Identity
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium text-zinc-700">
            Brand name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={brand?.name ?? ''}
            placeholder="Acme Inc."
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-zinc-700">
            Primary color <span className="text-red-500">*</span>
          </Label>
          <ColorField
            name="primary_color"
            defaultValue={brand?.primaryColor ?? '#000000'}
            placeholder="#000000"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-zinc-700">Secondary color</Label>
          <ColorField
            name="secondary_color"
            defaultValue={brand?.secondaryColor ?? '#ffffff'}
            placeholder="#ffffff"
          />
        </div>
      </div>

      {/* Section 2: Voice & Description */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Voice &amp; Description
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="voice_guidelines" className="text-sm font-medium text-zinc-700">
            Voice guidelines
          </Label>
          <textarea
            id="voice_guidelines"
            name="voice_guidelines"
            rows={3}
            maxLength={3000}
            defaultValue={brand?.voiceGuidelines ?? ''}
            placeholder="We speak with confidence and clarity..."
            className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="product_description" className="text-sm font-medium text-zinc-700">
            Product description
          </Label>
          <textarea
            id="product_description"
            name="product_description"
            rows={3}
            maxLength={1500}
            defaultValue={brand?.productDescription ?? ''}
            placeholder="Describe your product or service..."
            className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audience_description" className="text-sm font-medium text-zinc-700">
            Audience description
          </Label>
          <textarea
            id="audience_description"
            name="audience_description"
            rows={3}
            defaultValue={brand?.audienceDescription ?? ''}
            placeholder="Describe your target audience..."
            className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
        </div>
      </div>

      {/* Section 3: CTA */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Call to Action
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="cta_text" className="text-sm font-medium text-zinc-700">
            CTA text
          </Label>
          <Input
            id="cta_text"
            name="cta_text"
            defaultValue={brand?.ctaText ?? ''}
            placeholder="Start your free trial"
            className="h-11"
          />
        </div>
      </div>

      {state?.error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
          <p className="text-red-600 text-sm">{state.error}</p>
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full h-11 text-sm font-medium">
        {isPending ? 'Saving...' : submitLabel}
      </Button>
    </form>
  )
}

// Color field: color picker + hex text input side by side
function ColorField({
  name,
  defaultValue,
  placeholder,
}: {
  name: string
  defaultValue: string
  placeholder: string
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        name={name}
        defaultValue={defaultValue}
        className="w-12 h-11 rounded-lg border border-zinc-200 cursor-pointer p-0.5 shrink-0"
      />
      <Input
        type="text"
        readOnly
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-11 font-mono text-sm"
        tabIndex={-1}
      />
    </div>
  )
}
