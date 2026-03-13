// Shared catalog types — used by UI components
// These types mirror the Airtable data shape used throughout the creator workflow.

export type Template = {
  id: string
  name: string
  slug: string
  is_active: boolean
  sort_order: number
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

export type DesignStyle = {
  id: string
  name: string
  description: string | null
  preview_image: string | null
  sort_order: number
  is_active: boolean
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
