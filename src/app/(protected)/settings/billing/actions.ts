'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/server'

export async function createCheckoutSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  // Lazy Stripe customer creation — only on first Checkout click
  let customerId = usage?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email! })
    customerId = customer.id
    const admin = createAdminClient()
    await admin
      .from('usage_tracking')
      .upsert(
        { user_id: user.id, stripe_customer_id: customerId, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/templates`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    metadata: { user_id: user.id },
    subscription_data: {
      metadata: { user_id: user.id },
    },
  })

  redirect(session.url!)
}

export async function redirectToCustomerPortal() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!usage?.stripe_customer_id) {
    // No Stripe customer yet — user has never subscribed, redirect back
    redirect('/settings/billing')
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: usage.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  })

  redirect(portalSession.url)
}
