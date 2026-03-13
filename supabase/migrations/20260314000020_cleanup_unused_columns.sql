-- Cleanup: remove columns no longer used after template_assets refactor.
-- All DROP COLUMN use IF EXISTS so this is safe to re-run.

ALTER TABLE public.templates
  DROP COLUMN IF EXISTS cover_url,
  DROP COLUMN IF EXISTS content_url,
  DROP COLUMN IF EXISTS cta_url,
  DROP COLUMN IF EXISTS thumbnail_url;

ALTER TABLE public.brands
  DROP COLUMN IF EXISTS template_url;
