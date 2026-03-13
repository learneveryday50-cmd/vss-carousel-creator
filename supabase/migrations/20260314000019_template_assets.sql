-- Template assets: each row is a bundled set of 3 template images
-- (font/cover slide, content slide, CTA slide) that the user selects in the creator.

CREATE TABLE IF NOT EXISTS public.template_assets (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name                 TEXT        NOT NULL,
  description          TEXT,
  template_font_url    TEXT,
  template_content_url TEXT,
  template_cta_url     TEXT,
  is_active            BOOLEAN     NOT NULL DEFAULT true,
  sort_order           INTEGER     NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.template_assets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public_read_active_template_assets"
    ON public.template_assets FOR SELECT TO authenticated
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
