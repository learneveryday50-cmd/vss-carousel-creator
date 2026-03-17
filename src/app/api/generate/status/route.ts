import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRecord, AIRTABLE_TABLES } from '@/lib/airtable'

export async function GET(request: NextRequest) {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Read id query param (Airtable record ID)
  const recordId = request.nextUrl.searchParams.get('id')

  if (!recordId) {
    return Response.json({ error: 'Missing required query parameter: id' }, { status: 400 })
  }

  // 3. Check Supabase first — n8n webhook may have already updated the row
  const admin = createAdminClient()
  const { data: carousel } = await admin
    .from('carousels')
    .select('status, slide_urls, post_body')
    .eq('airtable_record_id', recordId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (carousel?.status === 'completed') {
    return Response.json({
      status: 'completed',
      post_body: carousel.post_body ?? '',
      slide_urls: (carousel.slide_urls as string[]) ?? [],
    })
  }

  // 4. Poll Airtable directly (n8n callback requires deployed URL; Airtable is the reliable path)
  let ideaRecord: { id: string; fields: Record<string, unknown> }
  try {
    ideaRecord = await getRecord(AIRTABLE_TABLES.ideas, recordId)
  } catch (err) {
    console.error('[status] Airtable getRecord failed:', err)
    return Response.json({ error: 'Record not found' }, { status: 404 })
  }

  const systemMessage = String(ideaRecord.fields['System Message'] ?? '')

  // Completed signal from Airtable
  if (systemMessage.includes('(3/3) Draft Post Completed')) {
    const linkedDraftIds = (ideaRecord.fields['📝 Draft Posts'] as string[] | undefined) ?? []
    const draftId = linkedDraftIds[0]

    if (!draftId) {
      // Draft not yet linked — keep polling
      return Response.json({ status: 'processing', step: 3 })
    }

    try {
      const draft = await getRecord(AIRTABLE_TABLES.draftPosts, draftId)
      type Attachment = { url: string }
      const postBody = String(draft.fields['Post Body'] ?? '')
      const attachments = (draft.fields['Generated Carousel'] as Attachment[] | undefined) ?? []
      const slideUrls = attachments.map((a) => a.url)

      // Cache result in Supabase so next poll returns instantly (fire-and-forget)
      void admin
        .from('carousels')
        .update({ status: 'completed', slide_urls: slideUrls, post_body: postBody, updated_at: new Date().toISOString() })
        .eq('airtable_record_id', recordId)

      return Response.json({
        status: 'completed',
        post_body: postBody,
        slide_urls: slideUrls,
      })
    } catch (err) {
      console.error('[status] Airtable draft fetch failed:', err)
      return Response.json({ status: 'processing', step: 3 })
    }
  }

  // Derive step from System Message
  let step = 1
  if (systemMessage.includes('(2/3)')) step = 2
  if (systemMessage.includes('(3/3)')) step = 3

  return Response.json({ status: 'processing', step })
}
