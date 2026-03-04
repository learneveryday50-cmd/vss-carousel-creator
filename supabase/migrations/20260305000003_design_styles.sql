CREATE TABLE public.design_styles (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT    NOT NULL,
  description   TEXT,
  preview_image TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE public.design_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Design styles visible to all authenticated"
  ON public.design_styles FOR SELECT TO authenticated
  USING (true);
