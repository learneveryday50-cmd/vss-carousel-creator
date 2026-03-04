import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getBrand } from '@/lib/supabase/brands'
import { updateBrandAction } from '../../actions'
import { BrandForm } from '@/components/brand/brand-form'

type EditBrandPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditBrandPage({ params }: EditBrandPageProps) {
  const { id } = await params
  const brand = await getBrand(id)

  if (!brand) {
    redirect('/settings/brand')
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/settings/brand"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to brands
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Edit brand</h1>
          <p className="text-zinc-500 text-sm mt-1">Update your brand details below.</p>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <BrandForm
            brand={brand}
            action={updateBrandAction}
            submitLabel="Update brand"
          />
        </div>
      </div>
    </main>
  )
}
