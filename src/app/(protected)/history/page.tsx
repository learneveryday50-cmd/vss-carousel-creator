import { createClient } from '@/lib/supabase/server'
import { CarouselHistory } from '@/components/history/carousel-history'

export const metadata = { title: 'History' }

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: carousels } = user
    ? await supabase
        .from('carousels')
        .select('id, idea_text, status, slide_urls, post_body, created_at, slide_count')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [] }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-1">History</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Your Carousels</h1>
        <p className="text-sm text-gray-500 mt-1">{carousels?.length ?? 0} carousels generated</p>
      </div>
      <CarouselHistory carousels={carousels ?? []} />
    </div>
  )
}
