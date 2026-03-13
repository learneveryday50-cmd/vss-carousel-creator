-- Drop brand columns that were added in migration 11 but never used by the app.
-- template_cover_url / template_content_url / template_cta_url were superseded
-- by the single template_url column (migration 12).
-- default_idea_text / default_slide_count were speculative additions, unused.
alter table public.brands
  drop column if exists template_cover_url,
  drop column if exists template_content_url,
  drop column if exists template_cta_url,
  drop column if exists default_idea_text,
  drop column if exists default_slide_count;
