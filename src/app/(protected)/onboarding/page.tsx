import { redirect } from 'next/navigation'
import { getBrands } from '@/lib/supabase/brands'
import { createBrandAction } from './actions'
import { BrandForm } from '@/components/brand/brand-form'
import { OnboardingPanels } from './panels'

export default async function OnboardingPage() {
  const brands = await getBrands()
  if (brands.length > 0) {
    redirect('/dashboard')
  }

  return (
    <OnboardingPanels action={createBrandAction} />
  )
}
