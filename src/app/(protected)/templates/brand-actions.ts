'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type InlineBrandActionState = { error?: string; success?: boolean } | null

export async function updateBrandInlineAction(
  _prevState: InlineBrandActionState,
  formData: FormData,
): Promise<InlineBrandActionState> {
  const id = formData.get('id') as string
  if (!id) return { error: 'Brand ID missing' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Brand name is required' }

  const voiceGuidelines = (formData.get('voice_guidelines') as string) || null
  const productDescription = (formData.get('product_description') as string) || null
  if (voiceGuidelines && voiceGuidelines.length > 3000)
    return { error: 'Voice guidelines must be 3000 characters or fewer' }
  if (productDescription && productDescription.length > 1500)
    return { error: 'Product description must be 1500 characters or fewer' }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Not authenticated' }

    const { data: updated, error } = await supabase
      .from('brands')
      .update({
        name,
        primary_color: formData.get('primary_color') as string,
        secondary_color: (formData.get('secondary_color') as string) || null,
        voice_guidelines: voiceGuidelines,
        product_description: productDescription,
        audience_description: (formData.get('audience_description') as string) || null,
        cta_text: (formData.get('cta_text') as string) || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return { error: error.message }
    if (!updated) return { error: `No brand found with id=${id}` }

    revalidatePath('/templates')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[updateBrandInlineAction] failed:', msg)
    return { error: msg }
  }
}
