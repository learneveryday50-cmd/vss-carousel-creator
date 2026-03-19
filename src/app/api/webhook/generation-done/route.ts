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

async function uploadSlideToStorage(
  admin: ReturnType<typeof createAdminClient>,
  imagebbUrl: string,
  recordId: string,
  index: number
): Promise<string> {
  try {
    // Download from ImageBB
    const res = await fetch(imagebbUrl)
    if (!res.ok) throw new Error(`ImageBB fetch failed: ${res.status}`)
    const buffer = await res.arrayBuffer()

    // Upload to Supabase Storage
    const path = `${recordId}/slide-${index}.jpg`
    const { error } = await admin.storage
      .from('carousel-slides')
      .upload(path, buffer, { contentType: 'image/jpeg', upsert: true })

    if (error) throw new Error(`Storage upload failed: ${error.message}`)

    // Return public URL
    const { data } = admin.storage.from('carousel-slides').getPublicUrl(path)
    return data.publicUrl
  } catch (err) {
    // Fallback: return original ImageBB URL so the generation isn't lost
    console.error(`[webhook] Slide ${index} upload failed, using ImageBB fallback:`, err)
    return imagebbUrl
  }
}

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

  // 3. Re-upload slides to Supabase Storage (STORE-02)
  // Falls back to original ImageBB URL per slide on failure (STORE-05)
  const admin = createAdminClient()
  let finalSlideUrls = slide_urls ?? []
  if (resolvedStatus === 'completed' && finalSlideUrls.length > 0) {
    finalSlideUrls = await Promise.all(
      finalSlideUrls.map((url, i) => uploadSlideToStorage(admin, url, record_id, i))
    )
  }

  // 4. Update the Supabase carousels row
  const { error } = await admin
    .from('carousels')
    .update({
      status: resolvedStatus,
      slide_urls: finalSlideUrls,
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
