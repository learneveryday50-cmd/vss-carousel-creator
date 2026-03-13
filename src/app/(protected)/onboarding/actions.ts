'use server'
import { redirect } from 'next/navigation'
import { createBrand } from '@/lib/supabase/brands'
import { syncBrandToAirtable } from '@/lib/airtable'

type ActionState = { error?: string } | null

export async function createBrandAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const voiceGuidelines = (formData.get('voice_guidelines') as string) || null
  const productDescription = (formData.get('product_description') as string) || null
  if (voiceGuidelines && voiceGuidelines.length > 3000)
    return { error: 'Voice guidelines must be 3000 characters or fewer' }
  if (productDescription && productDescription.length > 1500)
    return { error: 'Product description must be 1500 characters or fewer' }
  let brand
  try {
    brand = await createBrand({
      name: formData.get('name') as string,
      primary_color: formData.get('primary_color') as string,
      secondary_color: (formData.get('secondary_color') as string) || null,
      voice_guidelines: voiceGuidelines,
      product_description: productDescription,
      audience_description: (formData.get('audience_description') as string) || null,
      cta_text: (formData.get('cta_text') as string) || null,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create brand' }
  }

  // Sync to Airtable (fire and forget — never block the redirect)
  syncBrandToAirtable({
    supabaseId: brand.id,
    name: brand.name,
    primaryColor: brand.primary_color,
    voiceGuidelines: brand.voice_guidelines,
    productDescription: brand.product_description,
    audienceDescription: brand.audience_description,
    ctaText: brand.cta_text,
  })
  const redirectTo = (formData.get('redirect_to') as string) || '/dashboard'
  redirect(redirectTo)
}
