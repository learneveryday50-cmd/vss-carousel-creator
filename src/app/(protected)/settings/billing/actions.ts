'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const CREDIT_PACKS = {
  10: process.env.WHOP_PRODUCT_10_CREDITS,
  25: process.env.WHOP_PRODUCT_25_CREDITS,
  50: process.env.WHOP_PRODUCT_50_CREDITS,
} as const

function buildCheckoutUrl(productId: string, userId: string, credits: number, appUrl: string) {
  const redirectUri = encodeURIComponent(`${appUrl}/settings/billing?success=credits`)
  return `https://whop.com/checkout/${productId}/?redirect_uri=${redirectUri}&metadata[user_id]=${userId}&metadata[credits]=${credits}`
}

async function buyCredits(credits: 10 | 25 | 50) {
  const productId = CREDIT_PACKS[credits]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!productId || !appUrl) {
    throw new Error('Billing not configured. Please contact support.')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  redirect(buildCheckoutUrl(productId, user.id, credits, appUrl))
}

export async function buyCredits10() { return buyCredits(10) }
export async function buyCredits25() { return buyCredits(25) }
export async function buyCredits50() { return buyCredits(50) }
