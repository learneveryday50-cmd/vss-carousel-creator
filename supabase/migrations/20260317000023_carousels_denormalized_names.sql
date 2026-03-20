-- Denormalized display names for history page (HIST-02)
-- brand_id, template_id, design_style_id hold Airtable record IDs (no FK) — names stored at write time
ALTER TABLE public.carousels
  ADD COLUMN IF NOT EXISTS brand_name TEXT,
  ADD COLUMN IF NOT EXISTS template_name TEXT,
  ADD COLUMN IF NOT EXISTS design_style_name TEXT;
