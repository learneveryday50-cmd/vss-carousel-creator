'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import '@/lib/lemonsqueezy/server'
import { createCheckout, getSubscription } from '@lemonsqueezy/lemonsqueezy.js'

export async function createCheckoutSession() {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID
  const variantId = process.env.LEMONSQUEEZY_PRO_VARIANT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!storeId || !variantId || !appUrl) {
    throw new Error('LemonSqueezy is not configured. Please contact support.')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: user.email,
      custom: { user_id: user.id, type: 'subscription' },
    },
    productOptions: {
      redirectUrl: `${appUrl}/settings/billing?success=pro`,
    },
  })

  if (error || !data?.data.attributes.url) {
    throw new Error('Failed to create checkout. Please try again.')
  }

  redirect(data.data.attributes.url)
}

export async function createCreditTopupSession() {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID
  const variantId = process.env.LEMONSQUEEZY_CREDITS_VARIANT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!storeId || !variantId || !appUrl) {
    throw new Error('Credit top-up is not configured. Please contact support.')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: user.email,
      custom: { user_id: user.id, type: 'credits', credits: '10' },
    },
    productOptions: {
      redirectUrl: `${appUrl}/settings/billing?success=credits`,
    },
  })

  if (error || !data?.data.attributes.url) {
    throw new Error('Failed to create checkout. Please try again.')
  }

  redirect(data.data.attributes.url)
}

export async function redirectToCustomerPortal() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('stripe_subscription_id')
    .eq('user_id', user.id)
    .single()

  if (!usage?.stripe_subscription_id) redirect('/settings/billing')

  const { data: sub } = await getSubscription(usage.stripe_subscription_id)
  const portalUrl = sub?.data.attributes.urls?.customer_portal

  if (!portalUrl) redirect('/settings/billing')

  redirect(portalUrl)
}
