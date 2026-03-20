'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function deleteCarouselAction(carouselId: string): Promise<{ error?: string }> {
  // Auth check — admin client bypasses RLS so ownership must be verified manually
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('carousels')
    .delete()
    .eq('id', carouselId)
    .eq('user_id', user.id) // ownership guard

  if (error) return { error: error.message }
  revalidatePath('/history')
  return {}
}
