CREATE TABLE public.hook_styles (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT    NOT NULL,
  description TEXT,
  example     TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE public.hook_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hook styles visible to all authenticated"
  ON public.hook_styles FOR SELECT TO authenticated
  USING (true);
