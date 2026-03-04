'use server'
import { revalidatePath } from 'next/cache'
import { createCustomStyle, deleteCustomStyle } from '@/lib/supabase/catalog'

type ActionState = { error?: string } | null

export async function createCustomStyleAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Style name is required' }
  try {
    await createCustomStyle(name)
    revalidatePath('/templates')
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create style' }
  }
  return null
}

export async function deleteCustomStyleAction(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  await deleteCustomStyle(id)
  revalidatePath('/templates')
}
