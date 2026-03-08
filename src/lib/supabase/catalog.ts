import { createClient } from '@/lib/supabase/server'

export type Template = {
  id: string
  name: string
  slug: string
  cover_url: string | null
  content_url: string | null
  cta_url: string | null
  thumbnail_url: string | null
  is_active: boolean
  sort_order: number
}

export type ImageStyle = {
  id: string
  user_id: string | null
  name: string
  description: string | null
  sample_url: string | null
  is_custom: boolean
  created_at: string
}

export async function getTemplates(): Promise<Template[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getImageStyles(): Promise<ImageStyle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('image_styles')
    .select('*')
    .order('is_custom', { ascending: true })  // built-ins first
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createCustomStyle(name: string): Promise<ImageStyle> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('image_styles')
    .insert({ name, user_id: user.id, is_custom: true })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCustomStyle(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('image_styles').delete().eq('id', id)
  if (error) throw error
}

export type DesignStyle = {
  id: string
  name: string
  description: string | null
  preview_image: string | null
  sort_order: number
  is_active: boolean
}

export async function getDesignStyles(): Promise<DesignStyle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('design_styles')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export type HookStyle = {
  id: string
  name: string
  description: string | null
  example: string | null
  prompt_instruction: string | null
  sort_order: number
  is_active: boolean
}

export async function getHookStyles(): Promise<HookStyle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hook_styles')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}
