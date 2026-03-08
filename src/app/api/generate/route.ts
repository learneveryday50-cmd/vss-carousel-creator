import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  // 1. Validate env vars
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
  const n8nWebhookSecret = process.env.N8N_WEBHOOK_SECRET

  if (!n8nWebhookUrl || !n8nWebhookSecret) {
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
    image_style_id?: string
    idea_text?: string
    slide_count?: number
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { brand_id, template_id, image_style_id, idea_text } = body

  if (!brand_id || !template_id || !image_style_id || !idea_text) {
    return Response.json(
      { error: 'Missing required fields: brand_id, template_id, image_style_id, idea_text' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  // 4. Atomic credit deduction
  const { data: creditResult, error: creditError } = await admin.rpc('consume_credit', {
    p_user_id: user.id,
  })

  if (creditError || !creditResult?.success) {
    return Response.json(
      { error: 'Insufficient credits' },
      { status: 402 }
    )
  }

  // 5. Fetch related data server-side in parallel
  const [brandResult, templateResult, imageStyleResult] = await Promise.all([
    admin.from('brands').select('id, name, primary_color, secondary_color, voice_guidelines, product_description, audience_description, cta_text').eq('id', brand_id).single(),
    admin.from('templates').select('id, name, slug, cover_url, content_url, cta_url').eq('id', template_id).single(),
    admin.from('image_styles').select('id, name, description').eq('id', image_style_id).single(),
  ])

  if (brandResult.error || !brandResult.data) {
    console.error('[generate] brand lookup failed:', brandResult.error)
    return Response.json({ error: 'Brand not found' }, { status: 500 })
  }

  if (templateResult.error || !templateResult.data) {
    console.error('[generate] template lookup failed:', templateResult.error)
    return Response.json({ error: 'Template not found' }, { status: 500 })
  }

  if (imageStyleResult.error || !imageStyleResult.data) {
    console.error('[generate] image_style lookup failed:', imageStyleResult.error)
    return Response.json({ error: 'Image style not found' }, { status: 500 })
  }

  const brand = brandResult.data
  const template = templateResult.data
  const imageStyle = imageStyleResult.data

  // 6. Insert carousel row
  const { data: carousel, error: insertError } = await admin
    .from('carousels')
    .insert({
      user_id: user.id,
      brand_id,
      template_id,
      image_style_id,
      idea_text,
      status: 'processing',
    })
    .select('id')
    .single()

  if (insertError || !carousel) {
    console.error('[generate] carousel insert failed:', insertError)
    return Response.json({ error: 'Failed to create generation job' }, { status: 500 })
  }

  // 7. Fire-and-forget n8n webhook — do NOT await
  // Flat structure matches n8n workflow's "Standardize Inputs" node field paths
  const n8nPayload = {
    carousel_id: carousel.id,
    idea_text: body.idea_text,
    slide_count: body.slide_count ?? 7,
    // Brand fields (flat)
    brand_id: brand_id,
    brand_name: brand.name,
    brand_color: brand.primary_color,
    voice_guidelines: brand.voice_guidelines,
    product_description: brand.product_description,
    audience_description: brand.audience_description,
    cta_text: brand.cta_text,
    // Template fields (flat)
    template_id: template.id,
    template_front_url: template.cover_url,
    template_content_url: template.content_url,
    template_cta_url: template.cta_url,
    // Image style fields (flat)
    image_style_id: imageStyle.id,
    style_name: imageStyle.name,
    style_description: imageStyle.description,
    // Design style (optional — not required by workflow but passed for context)
    design_style: '',
    custom_instructions: '',
  }

  fetch(n8nWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': n8nWebhookSecret,
    },
    body: JSON.stringify(n8nPayload),
  }).catch((err) => console.error('[generate] n8n fire failed:', err))

  // 8. Return immediately with carousel_id
  return Response.json({ carousel_id: carousel.id }, { status: 201 })
}
