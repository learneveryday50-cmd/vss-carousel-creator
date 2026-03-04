'use server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function setBrandAction(formData: FormData): Promise<void> {
  const brandId = formData.get('brand_id') as string
  if (!brandId) return
  const cookieStore = await cookies()
  cookieStore.set('selected_brand_id', brandId, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  })
  revalidatePath('/dashboard')
}
