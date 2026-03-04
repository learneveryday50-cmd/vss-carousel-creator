-- =============================================================================
-- VSS Carousel Creator — Catalog Seed Migration
-- Phase 02-brand-onboarding / Plan 02
-- =============================================================================
-- Seeds: 5 carousel templates + 4 built-in image styles
-- Idempotent: safe to run multiple times (ON CONFLICT / WHERE NOT EXISTS)
-- =============================================================================

-- Seed carousel templates
-- Using ON CONFLICT DO NOTHING so re-running this is safe
INSERT INTO public.templates (name, slug, cover_url, content_url, cta_url, thumbnail_url, is_active, sort_order)
VALUES
  ('Hook → Insight → CTA', 'hook-insight-cta', null, null, null, null, true, 1),
  ('Problem → Solution',    'problem-solution',  null, null, null, null, true, 2),
  ('Step-by-Step Guide',    'step-by-step',      null, null, null, null, true, 3),
  ('Story Thread',          'story-thread',      null, null, null, null, true, 4),
  ('Case Study',            'case-study',        null, null, null, null, true, 5)
ON CONFLICT (slug) DO NOTHING;

-- Seed built-in image styles (user_id = NULL marks them as system-wide)
-- No UNIQUE constraint on name, so use WHERE NOT EXISTS to avoid duplicates on re-run
INSERT INTO public.image_styles (user_id, name, is_custom)
SELECT NULL, name, false FROM (VALUES
  ('Technical Annotation & Realism'),
  ('Notebook'),
  ('Whiteboard Diagram'),
  ('Comic Strip Storyboard')
) AS styles(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.image_styles WHERE user_id IS NULL AND name = styles.name
);

-- =============================================================================
-- Verification queries (run manually after applying migration):
--
-- SELECT name, slug FROM public.templates ORDER BY sort_order;
-- Expected: 5 rows
--
-- SELECT name, is_custom FROM public.image_styles WHERE user_id IS NULL;
-- Expected: 4 rows
-- =============================================================================
