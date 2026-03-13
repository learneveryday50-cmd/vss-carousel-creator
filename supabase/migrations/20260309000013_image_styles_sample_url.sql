-- Add missing columns to image_styles table
alter table public.image_styles
  add column if not exists description text,
  add column if not exists sample_url  text;
