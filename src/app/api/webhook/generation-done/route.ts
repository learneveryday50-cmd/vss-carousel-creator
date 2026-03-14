/**
 * POST /api/webhook/generation-done
 *
 * Called by n8n at the end of the carousel generation workflow.
 * Updates the Supabase carousels row so the status endpoint can return
 * the result immediately — no Airtable polling lag.
 *
 * Body (JSON):
 *   record_id   — Airtable idea record ID (used as lookup key)
 *   status      — "completed" | "failed"
 *   slide_urls  — array of image URLs (completed only)
 *   post_body   — LinkedIn caption text (completed only)
 *
 * Auth: x-webhook-secret header must match WEBHOOK_SECRET env var.
 */

import { type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  // 1. Validate webhook secret
  const secret = process.env.WEBHOOK_SECRET
  if (secret) {
    const incoming = request.headers.get('x-webhook-secret')
    if (incoming !== secret) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // 2. Parse body
  let body: {
    record_id?: string
    status?: string
    slide_urls?: string[]
    post_body?: string
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { record_id, status, slide_urls, post_body } = body

  if (!record_id || !status) {
    return Response.json({ error: 'Missing record_id or status' }, { status: 400 })
  }

  const resolvedStatus = status === 'completed' ? 'completed' : 'failed'

  // 3. Update the Supabase carousels row
  const admin = createAdminClient()
  const { error } = await admin
    .from('carousels')
    .update({
      status: resolvedStatus,
      slide_urls: slide_urls ?? [],
      post_body: post_body ?? '',
      updated_at: new Date().toISOString(),
    })
    .eq('airtable_record_id', record_id)

  if (error) {
    console.error('[webhook/generation-done] Supabase update failed:', error)
    return Response.json({ error: 'DB update failed' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
