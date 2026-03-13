-- Add per-brand carousel URL overrides and quick-generate defaults to brands table
alter table public.brands
  add column if not exists template_cover_url   text,
  add column if not exists template_content_url text,
  add column if not exists template_cta_url     text,
  add column if not exists image_style_url      text,
  add column if not exists default_idea_text    text,
  add column if not exists default_slide_count  integer;
