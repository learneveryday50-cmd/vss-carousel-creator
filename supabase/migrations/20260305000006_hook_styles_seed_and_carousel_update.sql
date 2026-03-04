-- Seed 5 built-in hook styles (idempotent WHERE NOT EXISTS pattern)
INSERT INTO public.hook_styles (name, description, example, sort_order, is_active)
SELECT name, description, example, sort_order, true
FROM (VALUES
  ('Contrarian',  'Challenge a widely-held belief to stop the scroll.',          'Everyone says X — but here''s why they''re wrong.',   1),
  ('Statistic',   'Lead with a surprising data point that earns authority.',      '83% of people fail at this — and they don''t know why.', 2),
  ('Curiosity',   'Open a curiosity gap the reader must swipe to close.',         'There''s one thing top creators never talk about...',  3),
  ('Mistake',     'Call out a common mistake your audience is probably making.',  'You''re making this mistake — and it''s costing you.',  4),
  ('Hot Take',    'State a bold, polarising opinion that sparks engagement.',     'Unpopular opinion: hustle culture is killing creativity.', 5)
) AS hs(name, description, example, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.hook_styles WHERE hook_styles.name = hs.name
);

-- Extend carousels table
ALTER TABLE public.carousels
  ADD COLUMN IF NOT EXISTS hook_style_id UUID
    REFERENCES public.hook_styles(id) ON DELETE SET NULL;
