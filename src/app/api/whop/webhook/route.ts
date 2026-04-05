import crypto from 'crypto'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const webhookSecret = process.env.WHOP_WEBHOOK_SECRET!

type WhopWebhookPayload = {
  action: string
  data: {
    id: string
    product_id: string
    status: string
    metadata?: Record<string, string>
  }
}

function verifyWhopSignature(body: string, sig: string): boolean {
  // Whop format: "t=TIMESTAMP,v1=HMAC_SHA256"
  const parts: Record<string, string> = {}
  for (const part of sig.split(',')) {
    const [key, val] = part.split('=')
    if (key && val) parts[key] = val
  }

  const timestamp = parts.t
  const receivedSig = parts.v1
  if (!timestamp || !receivedSig) return false

  const hmac = crypto.createHmac('sha256', webhookSecret)
  const expected = hmac.update(`${timestamp}.${body}`).digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(expected, 'utf8'),
    Buffer.from(receivedSig, 'utf8'),
  )
}

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('whop-signature') ?? ''

  if (!sig) {
    return NextResponse.json({ error: 'Missing whop-signature header' }, { status: 400 })
  }

  if (!verifyWhopSignature(body, sig)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const payload = JSON.parse(body) as WhopWebhookPayload

  // Only handle payment_succeeded
  if (payload.action !== 'payment_succeeded') {
    return NextResponse.json({ received: true, skipped: true })
  }

  const { id: saleId, metadata } = payload.data

  const admin = createAdminClient()

  // Deduplicate via existing stripe_webhook_events table
  const dedupKey = `whop:payment:${saleId}`
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
      event_type: 'payment_succeeded',
    })
  } catch {
    return NextResponse.json({ received: true, skipped: true })
  }

  const userId = metadata?.user_id
  const creditsToAdd = parseInt(metadata?.credits ?? '0', 10)

  if (!userId || !creditsToAdd) {
    console.warn('[whop webhook] Missing user_id or credits in metadata', metadata)
    return NextResponse.json({ received: true })
  }

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

  console.log(`[whop webhook] Added ${creditsToAdd} credits to user ${userId}`)

  return NextResponse.json({ received: true })
}
