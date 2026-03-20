import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  // Auth guard — prevent unauthenticated use as open proxy
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  const filename = searchParams.get('filename') ?? 'slide.png'

  if (!url) return new Response('Missing url param', { status: 400 })

  // Allowlist: ImageBB URLs and Supabase Storage carousel-slides URLs
  const supabaseStoragePrefix = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/carousel-slides/`
    : null

  const isImageBB = url.startsWith('https://i.ibb.co/') || url.startsWith('https://ibb.co/')
  const isSupabaseStorage = supabaseStoragePrefix ? url.startsWith(supabaseStoragePrefix) : false

  if (!isImageBB && !isSupabaseStorage) {
    return new Response('Forbidden', { status: 403 })
  }

  let upstream: Response
  try {
    upstream = await fetch(url)
  } catch {
    return new Response('Upstream fetch failed', { status: 502 })
  }

  if (!upstream.ok) return new Response('Upstream fetch failed', { status: 502 })

  const contentType = upstream.headers.get('content-type') ?? 'image/png'
  const buffer = await upstream.arrayBuffer()

  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
