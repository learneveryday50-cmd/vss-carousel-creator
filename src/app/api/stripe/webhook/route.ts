import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/server'
import { createAdminClient } from '@/lib/supabase/admin'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  // CRITICAL: raw body for signature verification — do NOT use req.json()
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook signature failed: ${message}` }, { status: 400 })
  }

  const admin = createAdminClient()

  // Idempotency check — skip already-processed events
  const { data: existing } = await admin
    .from('stripe_webhook_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ received: true, skipped: true })
  }

  // Insert BEFORE processing — prevents double-processing on Stripe retry
  // If a concurrent request beats us here, the UNIQUE constraint throws — treat as skipped
  try {
    await admin.from('stripe_webhook_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
    })
  } catch {
    return NextResponse.json({ received: true, skipped: true })
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      await admin
        .from('usage_tracking')
        .update({
          plan: 'pro',
          credits_limit: 10,
          credits_remaining: 10,
          stripe_subscription_id: sub.id,
          stripe_subscription_status: sub.status,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId)
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      await admin
        .from('usage_tracking')
        .update({
          plan: 'free',
          credits_limit: 3,
          credits_remaining: 3,
          stripe_subscription_id: null,
          stripe_subscription_status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId)
      break
    }
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      // Only reset credits for subscription invoices (not one-time payments)
      // Stripe SDK v20+ uses invoice.parent.type === 'subscription_details' instead of invoice.subscription
      if (invoice.parent?.type !== 'subscription_details') break
      const customerId = invoice.customer as string
      await admin
        .from('usage_tracking')
        .update({
          credits_remaining: 10,
          last_reset_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId)
        .eq('plan', 'pro')
      break
    }
    // All other event types: acknowledged but no action
  }

  return NextResponse.json({ received: true })
}
