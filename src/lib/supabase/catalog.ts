import { createClient } from '@/lib/supabase/server'

export type Template = {
  id: string
  name: string
  slug: string
  is_active: boolean
  sort_order: number
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


export type TemplateAsset = {
  id: string
  name: string
  description: string | null
  template_font_url: string | null
  template_content_url: string | null
  template_cta_url: string | null
  is_active: boolean
  sort_order: number
}

export async function getTemplateAssets(): Promise<TemplateAsset[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('template_assets')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
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
