import { createClient } from '@/lib/supabase/server'

export type Brand = {
  id: string
  user_id: string
  name: string
  primary_color: string
  secondary_color: string | null
  voice_guidelines: string | null
  product_description: string | null
  audience_description: string | null
  cta_text: string | null
  created_at: string
  updated_at: string
}

export type BrandInput = Omit<Brand, 'id' | 'user_id' | 'created_at' | 'updated_at'>

export async function getBrands(): Promise<Brand[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getBrand(id: string): Promise<Brand | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function createBrand(input: BrandInput): Promise<Brand> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('brands')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBrand(id: string, input: Partial<BrandInput>): Promise<Brand> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brands')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBrand(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('brands').delete().eq('id', id)
  if (error) throw error
}
