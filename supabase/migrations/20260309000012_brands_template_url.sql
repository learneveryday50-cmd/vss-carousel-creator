-- Add single template_url column to brands (replaces the 3 separate cover/content/cta URLs in the UI)
alter table public.brands
  add column if not exists template_url text;
