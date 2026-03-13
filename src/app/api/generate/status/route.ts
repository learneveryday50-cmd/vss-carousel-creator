import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // 1. Auth check — return 401 (not 404) so the client can distinguish auth failure
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Read id query param
  const carouselId = request.nextUrl.searchParams.get('id')

  if (!carouselId) {
    return Response.json({ error: 'Missing required query parameter: id' }, { status: 400 })
  }

  // 3. Query carousel — .eq('user_id', user.id) enforces ownership alongside RLS
  const { data: carousel, error } = await supabase
    .from('carousels')
    .select('id, status, slide_urls, slide_content, post_body')
    .eq('id', carouselId)
    .eq('user_id', user.id)
    .single()

  if (error || !carousel) {
    return Response.json({ error: 'Carousel not found' }, { status: 404 })
  }

  // 4. Return result
  return Response.json({
    id: carousel.id,
    status: carousel.status,
    slide_urls: carousel.slide_urls,
    slide_content: carousel.slide_content,
    post_body: carousel.post_body,
  })
}
