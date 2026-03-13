import { redirect } from 'next/navigation'
import { listRecords, AIRTABLE_TABLES } from '@/lib/airtable'
import { createBrandAction } from './actions'
import { BrandForm } from '@/components/brand/brand-form'
import { OnboardingPanels } from './panels'

export default async function OnboardingPage() {
  const brands = await listRecords(AIRTABLE_TABLES.brands)
  if (brands.length > 0) {
    redirect('/dashboard')
  }

  return (
    <OnboardingPanels action={createBrandAction} />
  )
}
