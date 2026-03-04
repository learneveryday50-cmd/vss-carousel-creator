'use server'
import { redirect } from 'next/navigation'
import { createBrand } from '@/lib/supabase/brands'

type ActionState = { error?: string } | null

export async function createBrandAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await createBrand({
      name: formData.get('name') as string,
      primary_color: formData.get('primary_color') as string,
      secondary_color: (formData.get('secondary_color') as string) || null,
      voice_guidelines: (formData.get('voice_guidelines') as string) || null,
      product_description: (formData.get('product_description') as string) || null,
      audience_description: (formData.get('audience_description') as string) || null,
      cta_text: (formData.get('cta_text') as string) || null,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create brand' }
  }
  const redirectTo = (formData.get('redirect_to') as string) || '/dashboard'
  redirect(redirectTo)
}
