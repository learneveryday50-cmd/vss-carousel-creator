-- =============================================================================
-- VSS Carousel Creator — Image Styles: Add description + sample_url
-- Phase 04-n8n-workflow-migration
-- =============================================================================
-- Adds description and sample_url columns to image_styles table.
-- Seeds descriptions for the 4 built-in styles so the n8n LLM has context.
-- =============================================================================

ALTER TABLE public.image_styles
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS sample_url  text;

-- Update descriptions for the 4 built-in styles
UPDATE public.image_styles
SET description = CASE name
  WHEN 'Technical Annotation & Realism'
    THEN 'Photorealistic imagery with precise technical labels, callout lines, and annotation overlays. Best for product explainers, engineering breakdowns, and data-driven slides.'
  WHEN 'Notebook'
    THEN 'Hand-drawn notebook aesthetic with lined paper texture, pen-stroke sketches, and handwritten-style labels. Ideal for personal stories, study content, and brainstorm carousels.'
  WHEN 'Whiteboard Diagram'
    THEN 'Clean whiteboard marker drawings on a white background with simple shapes, arrows, and bold text. Perfect for frameworks, processes, and educational step-by-step content.'
  WHEN 'Comic Strip Storyboard'
    THEN 'Bold comic-panel layout with expressive characters, speech bubbles, and vibrant colour fills. Great for storytelling, case studies, and high-energy engagement carousels.'
END
WHERE user_id IS NULL
  AND name IN (
    'Technical Annotation & Realism',
    'Notebook',
    'Whiteboard Diagram',
    'Comic Strip Storyboard'
  );

-- =============================================================================
-- Verification:
-- SELECT name, description FROM public.image_styles WHERE user_id IS NULL;
-- Expected: 4 rows, each with a non-null description
-- =============================================================================
