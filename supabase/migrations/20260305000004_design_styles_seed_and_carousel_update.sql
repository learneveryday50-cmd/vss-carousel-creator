-- Seed 5 built-in design styles (idempotent WHERE NOT EXISTS pattern)
INSERT INTO public.design_styles (name, description, sort_order, is_active)
SELECT name, description, sort_order, true
FROM (VALUES
  ('Minimal',      'Clean whitespace, sparse layout, single accent colour.',   1),
  ('Professional', 'Structured grid, muted palette, executive tone.',          2),
  ('Bold',         'High contrast, large type, punchy colour blocks.',         3),
  ('Corporate',    'Formal layout, brand-safe palette, institutional feel.',   4),
  ('Social',       'Bright, energetic, optimised for feed scroll-stopping.',   5)
) AS ds(name, description, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.design_styles WHERE design_styles.name = ds.name
);

-- Extend carousels table
ALTER TABLE public.carousels
  ADD COLUMN IF NOT EXISTS design_style_id UUID
    REFERENCES public.design_styles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS slide_count INTEGER NOT NULL DEFAULT 7;
