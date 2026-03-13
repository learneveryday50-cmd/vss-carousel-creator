import Link from 'next/link'
import { listRecords, parseBrand, AIRTABLE_TABLES } from '@/lib/airtable'
import { deleteBrandAction } from './actions'
import { Button } from '@/components/ui/button'

export default async function BrandSettingsPage() {
  const records = await listRecords(AIRTABLE_TABLES.brands)
  const brands = records.map(parseBrand)

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Your brands</h1>
            <p className="text-zinc-500 text-sm mt-1">Manage your brand identities and settings.</p>
          </div>
          <Button asChild className="h-9 px-4 text-sm font-medium">
            <Link href="/settings/brand/new">Add brand</Link>
          </Button>
        </div>

        {brands.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-2xl bg-zinc-100 mb-6" />
            <h2 className="text-zinc-900 font-semibold text-lg mb-1">No brands yet</h2>
            <p className="text-zinc-500 text-sm mb-6 max-w-xs">
              Create your first brand to start generating carousels.
            </p>
            <Button asChild variant="outline" className="h-9 px-4 text-sm font-medium">
              <Link href="/onboarding">Create your first brand</Link>
            </Button>
          </div>
        ) : (
          /* Brand list */
          <ul className="space-y-3">
            {brands.map((brand) => (
              <li
                key={brand.id}
                className="rounded-2xl border border-zinc-100 bg-white px-5 py-4 flex items-center gap-4 shadow-sm"
              >
                {/* Color swatch */}
                <div
                  className="w-9 h-9 rounded-full shrink-0 border border-zinc-200"
                  style={{ backgroundColor: brand.primaryColor }}
                />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 truncate">{brand.name}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button asChild variant="outline" size="sm" className="h-8 px-3 text-xs font-medium">
                    <Link href={`/settings/brand/${brand.id}/edit`}>Edit</Link>
                  </Button>

                  <form action={deleteBrandAction}>
                    <input type="hidden" name="id" value={brand.id} />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs font-medium text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
