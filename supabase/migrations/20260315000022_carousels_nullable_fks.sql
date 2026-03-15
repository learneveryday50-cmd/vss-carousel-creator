-- Airtable migration: brand/template are now Airtable record IDs.
-- Drop NOT NULL + FK constraints so /api/generate can insert with null values.

ALTER TABLE public.carousels
  ALTER COLUMN brand_id DROP NOT NULL,
  ALTER COLUMN template_id DROP NOT NULL;

ALTER TABLE public.carousels
  DROP CONSTRAINT IF EXISTS carousels_brand_id_fkey,
  DROP CONSTRAINT IF EXISTS carousels_template_id_fkey;
