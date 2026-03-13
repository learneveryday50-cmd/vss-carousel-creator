import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createRecord,
  IDEAS_TABLE_URL,
  AIRTABLE_TABLES,
} from '@/lib/airtable'

export async function POST(request: NextRequest) {
  // 1. Validate env vars
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL

  if (!n8nWebhookUrl) {
    return Response.json(
      { error: 'Generation service not configured' },
      { status: 503 }
    )
  }

  // 2. Auth check
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Parse and validate request body
  let body: {
    brand_id?: string
    template_id?: string
    design_style_id?: string
    idea_text?: string
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { brand_id, template_id, design_style_id, idea_text } = body

  if (!brand_id || !template_id || !idea_text) {
    return Response.json(
      { error: 'Missing required fields: brand_id, template_id, idea_text' },
      { status: 400 }
    )
  }

  // 4. Atomic credit deduction (Supabase)
  const admin = createAdminClient()
  const { data: creditResult, error: creditError } = await admin.rpc('consume_credit', {
    p_user_id: user.id,
  })

  if (creditError || !creditResult?.success) {
    return Response.json({ error: 'Insufficient credits' }, { status: 402 })
  }

  // 5. Create Airtable idea record
  const ideaFields: Record<string, unknown> = {
    'Idea': idea_text,
    '❗Brand Voice': [brand_id],
    '❗Carousel Template': [template_id],
    'Number of Drafts': 1,
  }

  if (design_style_id) {
    ideaFields['❗Design Style'] = [design_style_id]
  }

  let record: { id: string }
  try {
    record = await createRecord(AIRTABLE_TABLES.ideas, ideaFields)
  } catch (err) {
    console.error('[generate] Airtable createRecord failed:', err)
    return Response.json({ error: 'Failed to create generation job' }, { status: 500 })
  }

  // 6. Fire-and-forget n8n webhook
  const webhookUrl = `${n8nWebhookUrl}?table_url=${encodeURIComponent(IDEAS_TABLE_URL)}&record_id=${record.id}`
  fetch(webhookUrl, { method: 'POST' })
    .catch((err) => console.error('[generate] n8n fire failed:', err))

  // 7. Return immediately with Airtable record_id
  return Response.json({ record_id: record.id }, { status: 201 })
}
