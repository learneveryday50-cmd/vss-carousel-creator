'use server'
import { redirect } from 'next/navigation'
import { createRecord, AIRTABLE_TABLES } from '@/lib/airtable'

type ActionState = { error?: string } | null

export async function createBrandAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const voiceGuidelines = (formData.get('voice_guidelines') as string) || null
  const productDescription = (formData.get('product_description') as string) || null
  const audienceDescription = (formData.get('audience_description') as string) || null

  if (voiceGuidelines && voiceGuidelines.length > 3000)
    return { error: 'Voice guidelines must be 3000 characters or fewer' }
  if (productDescription && productDescription.length > 1500)
    return { error: 'Product description must be 1500 characters or fewer' }

  const productAndAudience = [productDescription, audienceDescription].filter(Boolean).join('\n\n')

  try {
    await createRecord(AIRTABLE_TABLES.brands, {
      'Brand Name': formData.get('name') as string,
      'Brand Color': formData.get('primary_color') as string,
      'Voice Guidelines': voiceGuidelines ?? '',
      'Product & Audience': productAndAudience,
      'CTA Text': (formData.get('cta_text') as string) || '',
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create brand' }
  }

  const redirectTo = (formData.get('redirect_to') as string) || '/dashboard'
  redirect(redirectTo)
}
