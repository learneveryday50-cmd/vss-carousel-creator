import crypto from 'crypto'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!

type LsWebhookPayload = {
  meta: {
    event_name: string
    custom_data?: Record<string, string>
  }
  data: {
    id: number | string
    attributes: {
      status: string
      customer_id?: number
      urls?: { customer_portal?: string }
      [key: string]: unknown
    }
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('x-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing x-signature header' }, { status: 400 })
  }

  // Verify HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', webhookSecret)
  const digest = hmac.update(body).digest('hex')
  if (!crypto.timingSafeEqual(Buffer.from(digest, 'utf8'), Buffer.from(sig, 'utf8'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const payload = JSON.parse(body) as LsWebhookPayload
  const eventName = payload.meta.event_name
  const customData = payload.meta.custom_data ?? {}
  const resourceId = payload.data.id.toString()
  const dedupKey = `${eventName}:${resourceId}`

  const admin = createAdminClient()

  // Deduplicate events
  const { data: existing } = await admin
    .from('stripe_webhook_events')
    .select('id')
    .eq('stripe_event_id', dedupKey)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ received: true, skipped: true })
  }

  try {
    await admin.from('stripe_webhook_events').insert({
      stripe_event_id: dedupKey,
      event_type: eventName,
    })
  } catch {
    return NextResponse.json({ received: true, skipped: true })
  }

  const attrs = payload.data.attributes

  switch (eventName) {
    case 'order_created': {
      if (attrs.status !== 'paid') break
      const userId = customData.user_id
      if (!userId || customData.type !== 'credits') break

      const creditsToAdd = parseInt(customData.credits ?? '10', 10)
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

    case 'subscription_created': {
      const userId = customData.user_id
      if (!userId) break

      const customerId = attrs.customer_id?.toString() ?? ''
      await admin
        .from('usage_tracking')
        .upsert({
          user_id: userId,
          plan: 'pro',
          credits_limit: 10,
          credits_remaining: 10,
          stripe_customer_id: customerId,
          stripe_subscription_id: resourceId,
          stripe_subscription_status: 'active',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      console.log(`[webhook] User ${userId} upgraded to Pro`)
      break
    }

    case 'subscription_payment_success': {
      // Renewal — reset credits for the billing cycle
      await admin
        .from('usage_tracking')
        .update({
          credits_remaining: 10,
          last_reset_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', resourceId)
        .eq('plan', 'pro')
      break
    }

    case 'subscription_cancelled': {
      // Cancelled but still active until period ends — just update status
      await admin
        .from('usage_tracking')
        .update({
          stripe_subscription_status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', resourceId)
      break
    }

    case 'subscription_expired': {
      // Subscription fully ended — downgrade to free
      await admin
        .from('usage_tracking')
        .update({
          plan: 'free',
          credits_limit: 3,
          credits_remaining: 3,
          stripe_subscription_id: null,
          stripe_subscription_status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', resourceId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
