import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createRecord,
  IDEAS_TABLE_URL,
  AIRTABLE_TABLES,
} from '@/lib/airtable'

export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate request body
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

  const admin = createAdminClient()

  // 3. Create Airtable idea record first — credit is only deducted if this succeeds
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

  // 4. Atomic credit deduction (Supabase) — after Airtable succeeds so failures don't consume credits
  const { data: creditResult, error: creditError } = await admin.rpc('consume_credit', {
    p_user_id: user.id,
  })

  if (creditError || !creditResult?.success) {
    return Response.json({ error: 'Insufficient credits' }, { status: 402 })
  }

  // 5. Create a tracking row in Supabase so status can be resolved instantly
  //    via the n8n callback webhook (no polling needed)
  try {
    await admin
      .from('carousels')
      .insert({
        user_id: user.id,
        brand_id: null,          // Airtable brand, not Supabase brand
        template_id: null,       // Airtable template, not Supabase template
        idea_text,
        status: 'processing',
        airtable_record_id: record.id,
      })
      .throwOnError()
  } catch (err) {
    console.error('[generate] Supabase carousels insert failed:', err)
  }

  // 6. Fire-and-forget n8n webhook
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
  if (n8nWebhookUrl) {
    const webhookUrl = `${n8nWebhookUrl}?table_url=${encodeURIComponent(IDEAS_TABLE_URL)}&record_id=${record.id}`
    console.log('[generate] firing n8n:', webhookUrl)
    fetch(webhookUrl)
      .then((r) => console.log('[generate] n8n response:', r.status))
      .catch((err) => console.error('[generate] n8n fire failed:', err))
  } else {
    console.warn('[generate] N8N_WEBHOOK_URL not set — skipping webhook')
  }

  // 7. Return immediately with Airtable record_id
  return Response.json({ record_id: record.id }, { status: 201 })
}
