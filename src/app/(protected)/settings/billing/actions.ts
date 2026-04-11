'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const GUMROAD_VERIFY_URL = 'https://api.gumroad.com/v2/licenses/verify'

const PRODUCTS = [
  { productId: process.env.GUMROAD_PRODUCT_10!, credits: 10 },
  { productId: process.env.GUMROAD_PRODUCT_20!, credits: 20 },
  { productId: process.env.GUMROAD_PRODUCT_40!, credits: 40 },
]

async function verifyGumroadLicense(productId: string, licenseKey: string, increment: boolean) {
  const res = await fetch(GUMROAD_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      product_id: productId,
      license_key: licenseKey,
      increment_uses_count: increment ? 'true' : 'false',
    }),
  })
  return res.json() as Promise<{ success: boolean; uses?: number; message?: string }>
}

export async function redeemKey(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const key = ((formData.get('license_key') as string) ?? '').trim()
  if (!key) return { error: 'Please enter a license key.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find which product this key belongs to (check without incrementing first)
  let matched: { productId: string; credits: number } | null = null
  let currentUses = 0

  for (const product of PRODUCTS) {
    if (!product.productId) continue
    const data = await verifyGumroadLicense(product.productId, key, false)
    if (data.success) {
      matched = product
      currentUses = data.uses ?? 0
      break
    }
  }

  if (!matched) return { error: 'Invalid license key. Please check and try again.' }
  if (currentUses > 0) return { error: 'This license key has already been redeemed.' }

  // Mark as used (increment_uses_count=true)
  const confirm = await verifyGumroadLicense(matched.productId, key, true)
  if (!confirm.success || (confirm.uses ?? 0) > 1) {
    return { error: 'This license key has already been redeemed.' }
  }

  const admin = createAdminClient()
  const { data: result, error: rpcError } = await admin.rpc('add_credits', {
    p_user_id: user.id,
    p_credits: matched.credits,
  })

  if (rpcError || !result?.success) return { error: 'Failed to add credits. Please contact support.' }

  revalidatePath('/', 'layout')
  redirect('/settings/billing?success=credits')
}
