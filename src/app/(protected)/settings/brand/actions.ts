'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { updateRecord, deleteRecord, AIRTABLE_TABLES } from '@/lib/airtable'

type ActionState = { error?: string } | null

export async function updateBrandAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id') as string
  const voiceGuidelines = (formData.get('voice_guidelines') as string) || null
  const productDescription = (formData.get('product_description') as string) || null
  const audienceDescription = (formData.get('audience_description') as string) || null

  if (voiceGuidelines && voiceGuidelines.length > 3000)
    return { error: 'Voice guidelines must be 3000 characters or fewer' }
  if (productDescription && productDescription.length > 1500)
    return { error: 'Product description must be 1500 characters or fewer' }

  const productAndAudience = [productDescription, audienceDescription].filter(Boolean).join('\n\n')

  try {
    await updateRecord(AIRTABLE_TABLES.brands, id, {
      'Brand Name': formData.get('name') as string,
      'Brand Color': formData.get('primary_color') as string,
      'Voice Guidelines': voiceGuidelines ?? '',
      'Product & Audience': productAndAudience,
      'Product Description': productDescription ?? '',
      'Audience Description': audienceDescription ?? '',
      'CTA Text': (formData.get('cta_text') as string) || '',
    })
    revalidatePath('/settings/brand')
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update brand' }
  }

  redirect('/settings/brand')
}

export async function deleteBrandAction(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  await deleteRecord(AIRTABLE_TABLES.brands, id)
  revalidatePath('/settings/brand')
  redirect('/settings/brand')
}
