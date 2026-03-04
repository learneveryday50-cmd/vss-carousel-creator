'use server'
import { redirect } from 'next/navigation'
import { updateBrand, deleteBrand } from '@/lib/supabase/brands'
import { revalidatePath } from 'next/cache'

type ActionState = { error?: string } | null

export async function updateBrandAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id') as string
  const voiceGuidelines = (formData.get('voice_guidelines') as string) || null
  const productDescription = (formData.get('product_description') as string) || null
  if (voiceGuidelines && voiceGuidelines.length > 3000)
    return { error: 'Voice guidelines must be 3000 characters or fewer' }
  if (productDescription && productDescription.length > 1500)
    return { error: 'Product description must be 1500 characters or fewer' }
  try {
    await updateBrand(id, {
      name: formData.get('name') as string,
      primary_color: formData.get('primary_color') as string,
      secondary_color: (formData.get('secondary_color') as string) || null,
      voice_guidelines: voiceGuidelines,
      product_description: productDescription,
      audience_description: (formData.get('audience_description') as string) || null,
      cta_text: (formData.get('cta_text') as string) || null,
    })
    revalidatePath('/settings/brand')
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update brand' }
  }
  redirect('/settings/brand')
}

export async function deleteBrandAction(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  await deleteBrand(id)
  revalidatePath('/settings/brand')
  redirect('/onboarding')
}
