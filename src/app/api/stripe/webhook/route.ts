import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/server'
import { createAdminClient } from '@/lib/supabase/admin'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
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

  const { data: existing } = await admin
    .from('stripe_webhook_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ received: true, skipped: true })
  }

  try {
    await admin.from('stripe_webhook_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
    })
  } catch {
    return NextResponse.json({ received: true, skipped: true })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const type = session.metadata?.type
      const customerId = session.customer as string

      if (!userId) {
        console.error('[webhook] No user_id in session metadata — skipping')
        break
      }

      // One-time credit top-up
      if (type === 'credits') {
        const creditsToAdd = parseInt(session.metadata?.credits ?? '10', 10)
        const { data: current } = await admin
          .from('usage_tracking')
          .select('credits_remaining')
          .eq('user_id', userId)
          .single()

        await admin
          .from('usage_tracking')
          .update({
            credits_remaining: (current?.credits_remaining ?? 0) + creditsToAdd,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        console.log(`[webhook] Added ${creditsToAdd} credits to user ${userId}`)
        break
      }

      // Subscription upgrade
      const subscriptionId = session.subscription as string
      const { error } = await admin
        .from('usage_tracking')
        .upsert({
          user_id: userId,
          plan: 'pro',
          credits_limit: 10,
          credits_remaining: 10,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_subscription_status: 'active',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (error) console.error('[webhook] upsert failed:', error)
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
  }

  return NextResponse.json({ received: true })
}