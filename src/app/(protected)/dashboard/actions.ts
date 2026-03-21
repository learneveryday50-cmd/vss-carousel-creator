'use server'
import { cookies } from 'next/headers'

export async function setBrandAction(brandId: string): Promise<void> {
  if (!brandId) return
  const cookieStore = await cookies()
  cookieStore.set('selected_brand_id', brandId, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  })
}
