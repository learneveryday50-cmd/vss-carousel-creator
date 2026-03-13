import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRecord, searchRecords, AIRTABLE_TABLES } from '@/lib/airtable'

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

  // 3. Fetch the Ideas record and check System Message
  let ideaRecord: { id: string; fields: Record<string, unknown> }
  try {
    ideaRecord = await getRecord(AIRTABLE_TABLES.ideas, recordId)
  } catch (err) {
    console.error('[status] Airtable getRecord failed:', err)
    return Response.json({ error: 'Record not found' }, { status: 404 })
  }

  const systemMessage = String(ideaRecord.fields['System Message'] ?? '')

  // Completed signal
  if (systemMessage.includes('(3/3) Draft Post Completed')) {
    // Fetch Draft Posts linked to this idea
    try {
      const draftRecords = await searchRecords(
        AIRTABLE_TABLES.draftPosts,
        `FIND("${recordId}", ARRAYJOIN({Idea}, ","))`
      )

      const draft = draftRecords[0]
      if (!draft) {
        // Draft not yet linked — keep polling
        return Response.json({ status: 'processing', step: 3 })
      }

      type Attachment = { url: string }
      const postBody = String(draft.fields['Post Body'] ?? '')
      const attachments = (draft.fields['Generated Carousel'] as Attachment[] | undefined) ?? []
      const slideUrls = attachments.map((a) => a.url)

      return Response.json({
        status: 'completed',
        post_body: postBody,
        slide_urls: slideUrls,
      })
    } catch (err) {
      console.error('[status] Airtable draftPosts fetch failed:', err)
      return Response.json({ status: 'processing', step: 3 })
    }
  }

  // Derive step from System Message
  let step = 1
  if (systemMessage.includes('(2/3)')) step = 2
  if (systemMessage.includes('(3/3)')) step = 3

  return Response.json({ status: 'processing', step })
}
