-- =============================================================================
-- VSS Code SaaS — Complete Schema Migration
-- Phase 01-foundation / Plan 02
-- =============================================================================
-- Tables: profiles, brands, templates, image_styles, carousels,
--         usage_tracking, stripe_webhook_events
-- RLS: enabled on all 7 tables with policies
-- Trigger: handle_new_user — auto-creates profiles + usage_tracking on signup
-- =============================================================================


-- =============================================================================
-- SECTION 1: CREATE TABLES
-- =============================================================================

-- profiles: one row per auth user (linked via FK to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- brands: user-owned brand configurations
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT,
  voice_guidelines TEXT,
  product_description TEXT,
  audience_description TEXT,
  cta_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- templates: shared catalog — no user_id (admin-managed, readable by all auth users)
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  cover_url TEXT,
  content_url TEXT,
  cta_url TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

-- image_styles: built-ins have user_id NULL; user-created customs have user_id set
CREATE TABLE public.image_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- carousels: user-generated carousel jobs referencing brand, template, image_style
CREATE TABLE public.carousels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id),
  template_id UUID NOT NULL REFERENCES public.templates(id),
  image_style_id UUID NOT NULL REFERENCES public.image_styles(id),
  idea_text TEXT NOT NULL,
  post_body TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  slide_urls JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- usage_tracking: one row per user (UNIQUE on user_id), tracks plan + credits
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  credits_remaining INTEGER NOT NULL DEFAULT 3,
  credits_limit INTEGER NOT NULL DEFAULT 3,
  period_start TIMESTAMPTZ DEFAULT date_trunc('month', NOW()),
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_subscription_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- stripe_webhook_events: idempotency log — no user access (service role only)
CREATE TABLE public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================================================
-- SECTION 2: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- SECTION 3: RLS POLICIES
-- Note: (SELECT auth.uid()) pattern used throughout — evaluated once per
-- statement, not per row, for better performance (avoids re-evaluation).
-- =============================================================================

-- profiles: users can only read/write their own profile row
CREATE POLICY "Users manage own profile"
  ON public.profiles FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- brands: users can only read/write their own brands
CREATE POLICY "Users manage own brands"
  ON public.brands FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- templates: all authenticated users can read the shared catalog (no writes via RLS)
CREATE POLICY "Templates visible to all authenticated"
  ON public.templates FOR SELECT TO authenticated
  USING (true);

-- image_styles: users can read built-ins (user_id IS NULL) + their own customs
CREATE POLICY "image_styles SELECT: built-ins + own custom"
  ON public.image_styles FOR SELECT TO authenticated
  USING (user_id IS NULL OR (SELECT auth.uid()) = user_id);

-- image_styles: users can only insert their own custom styles
CREATE POLICY "image_styles INSERT: own custom only"
  ON public.image_styles FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- image_styles: users can only update their own custom styles
CREATE POLICY "image_styles UPDATE: own custom only"
  ON public.image_styles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- image_styles: users can only delete their own custom styles
CREATE POLICY "image_styles DELETE: own custom only"
  ON public.image_styles FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- carousels: users can only read/write their own carousels
CREATE POLICY "Users manage own carousels"
  ON public.carousels FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- usage_tracking: users can read their own row; writes go through service role (bypasses RLS)
CREATE POLICY "Users read own usage"
  ON public.usage_tracking FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- stripe_webhook_events: intentionally no policies — zero user access
-- Only service_role key (used by n8n) can read/write this table


-- =============================================================================
-- SECTION 4: TRIGGER — auto-provision profiles + usage_tracking on signup
-- =============================================================================

-- SECURITY DEFINER + search_path = '' is REQUIRED:
-- Without it, the function runs with the invoking role's permissions and
-- a guessable search_path, which can lead to silent failures or privilege
-- escalation on new user creation.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());

  INSERT INTO public.usage_tracking (
    user_id, plan, credits_remaining, credits_limit,
    period_start, last_reset_at, created_at, updated_at
  )
  VALUES (
    NEW.id, 'free', 3, 3,
    date_trunc('month', NOW()), NOW(), NOW(), NOW()
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- =============================================================================
-- SECTION 5: VERIFICATION QUERIES (run manually after applying migration)
-- =============================================================================

-- Verify RLS is enabled on all tables (run manually):
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- Expected: all seven tables should have rowsecurity = true

-- Verify trigger exists:
-- SELECT trigger_name, event_object_table FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';
-- Expected: 1 row returned

-- Verify zero tables have RLS disabled:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;
-- Expected: 0 rows
