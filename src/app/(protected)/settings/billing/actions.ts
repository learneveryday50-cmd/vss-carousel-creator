'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/server'

async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  const supabase = await createClient()
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single()

  if (usage?.stripe_customer_id) return usage.stripe_customer_id

  const customer = await stripe.customers.create({ email })
  const admin = createAdminClient()
  await admin
    .from('usage_tracking')
    .upsert(
      { user_id: userId, stripe_customer_id: customer.id, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  return customer.id
}

export async function createCheckoutSession() {
  const priceId = process.env.STRIPE_PRO_PRICE_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!priceId || !appUrl) {
    throw new Error('Stripe is not configured. Please contact support.')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const customerId = await getOrCreateCustomer(user.id, user.email!)

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings/billing?success=pro`,
    cancel_url: `${appUrl}/settings/billing`,
    metadata: { user_id: user.id, type: 'subscription' },
    subscription_data: { metadata: { user_id: user.id } },
  })

  redirect(session.url!)
}

export async function createCreditTopupSession() {
  const priceId = process.env.STRIPE_CREDITS_PRICE_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!priceId || !appUrl) {
    throw new Error('Credit top-up is not configured. Please contact support.')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const customerId = await getOrCreateCustomer(user.id, user.email!)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings/billing?success=credits`,
    cancel_url: `${appUrl}/settings/billing`,
    metadata: { user_id: user.id, type: 'credits', credits: '10' },
  })

  redirect(session.url!)
}

export async function redirectToCustomerPortal() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!usage?.stripe_customer_id) redirect('/settings/billing')

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: usage.stripe_customer_id,
    return_url: `${appUrl ?? ''}/settings/billing`,
  })

  redirect(portalSession.url)
}
