# Phase 1: Foundation - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Project scaffolding, complete multi-tenant database schema with RLS enforced at the database level, and all authentication flows (sign up, email verification, login, persistent session, password reset). No UI beyond auth pages — dashboard shell deferred to later phases.

</domain>

<decisions>
## Implementation Decisions

### Project Scaffolding
- Next.js 15 + TypeScript, App Router (not Pages Router)
- `@supabase/ssr` for all Supabase client instantiation — use `createServerClient` in Server Components/Route Handlers, `createBrowserClient` in Client Components. The deprecated `@supabase/auth-helpers-nextjs` is NOT used.
- Tailwind CSS for styling, Framer Motion for animations
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, never exposed to client)
- Vercel deployment config (vercel.json or project settings) — no special config needed beyond env vars
- GitHub repo connected to Vercel for auto-deploy on push to main

### Database Schema
Seven tables. Every user-scoped table has `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` and RLS enabled.

**`profiles`** — auto-created on auth.users insert via trigger
- `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at TIMESTAMPTZ DEFAULT NOW()`

**`brands`** — single brand per user (v1)
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- `name TEXT NOT NULL`
- `primary_color TEXT NOT NULL` (hex string)
- `secondary_color TEXT`
- `voice_guidelines TEXT`
- `product_description TEXT`
- `audience_description TEXT`
- `cta_text TEXT`
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at TIMESTAMPTZ DEFAULT NOW()`

**`templates`** — shared catalog, not user-scoped
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `name TEXT NOT NULL`
- `slug TEXT NOT NULL UNIQUE`
- `cover_url TEXT` (placeholder for v1)
- `content_url TEXT` (placeholder for v1)
- `cta_url TEXT` (placeholder for v1)
- `thumbnail_url TEXT`
- `is_active BOOLEAN DEFAULT TRUE`
- `sort_order INTEGER DEFAULT 0`

**`image_styles`** — built-in styles (user_id NULL) + custom styles (user_id SET)
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE` (NULL for built-ins)
- `name TEXT NOT NULL`
- `is_custom BOOLEAN DEFAULT FALSE`
- `created_at TIMESTAMPTZ DEFAULT NOW()`

**`carousels`** — generation history
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- `brand_id UUID NOT NULL REFERENCES brands(id)`
- `template_id UUID NOT NULL REFERENCES templates(id)`
- `image_style_id UUID NOT NULL REFERENCES image_styles(id)`
- `idea_text TEXT NOT NULL`
- `post_body TEXT`
- `status TEXT NOT NULL DEFAULT 'pending'` (pending | generating | completed | failed)
- `slide_urls JSONB DEFAULT '[]'` (array of ImageBB URLs)
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at TIMESTAMPTZ DEFAULT NOW()`

**`usage_tracking`** — one row per user, credit system
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE`
- `plan TEXT NOT NULL DEFAULT 'free'` (free | pro)
- `credits_remaining INTEGER NOT NULL DEFAULT 3`
- `credits_limit INTEGER NOT NULL DEFAULT 3`
- `period_start TIMESTAMPTZ DEFAULT date_trunc('month', NOW())`
- `last_reset_at TIMESTAMPTZ DEFAULT NOW()`
- `stripe_customer_id TEXT`
- `stripe_subscription_id TEXT`
- `stripe_subscription_status TEXT`
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at TIMESTAMPTZ DEFAULT NOW()`

**`stripe_webhook_events`** — idempotency table
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `stripe_event_id TEXT NOT NULL UNIQUE`
- `event_type TEXT NOT NULL`
- `processed_at TIMESTAMPTZ DEFAULT NOW()`

### RLS Policies
- **`profiles`**: `USING (auth.uid() = id)` — users read/write own profile only
- **`brands`**: `USING (auth.uid() = user_id)` — full CRUD, own rows only
- **`templates`**: `SELECT` for all authenticated users (no user_id filter) — shared catalog
- **`image_styles`**: `SELECT` where `user_id IS NULL OR user_id = auth.uid()` — built-ins visible to all; custom styles visible to owner only. INSERT/UPDATE/DELETE: `USING (auth.uid() = user_id)` for custom styles
- **`carousels`**: `USING (auth.uid() = user_id)` — full CRUD, own rows only
- **`usage_tracking`**: `USING (auth.uid() = user_id)` — read own only; writes via service role only (credit deduction is server-side)
- **`stripe_webhook_events`**: service role only — no RLS SELECT for users

### Auth Flows
- Sign up → Supabase sends verification email → user lands on `/verify-email` holding page ("Check your inbox")
- Email confirmed → Supabase redirects to `/auth/callback` → server exchanges code → redirects to `/onboarding`
- Login (verified + has brand) → `/dashboard`
- Login (verified + no brand) → `/onboarding`
- Login (unverified) → back to `/verify-email` with message
- Password reset → email link → `/auth/callback?type=recovery` → `/reset-password` form

### Auth Middleware
- `middleware.ts` at project root using `@supabase/ssr` `createServerClient`
- Refreshes session on every request (required by Supabase SSR pattern)
- Protected routes matcher: `/dashboard/:path*`, `/onboarding/:path*`
- Unauthenticated → redirect to `/login`
- Authenticated + unverified → redirect to `/verify-email`
- Public routes (no middleware): `/`, `/login`, `/signup`, `/verify-email`, `/reset-password`, `/auth/callback`

### Auth Page Design
- Centered card layout on light background — clean, Resume.io-inspired
- Framer Motion fade-up animation on card mount
- Custom forms (not Supabase Auth UI) for full design control
- Inline validation errors below each field (not toasts for form errors)
- Toast for async success states (e.g., "Password reset email sent", "Verification email resent")
- No "Remember me" checkbox — Supabase session persists by default via cookie

### Profiles Trigger
- Postgres trigger on `auth.users` INSERT → auto-inserts row into `profiles` and `usage_tracking` with free plan defaults
- Eliminates need for app-level profile creation logic

### Claude's Discretion
- Exact Tailwind typography and spacing values
- Loading skeleton patterns
- Supabase client utility file structure (e.g., `lib/supabase/server.ts`, `lib/supabase/client.ts`)
- Exact error message copy

</decisions>

<specifics>
## Specific Ideas

- Design reference: Resume.io — clean centered auth forms, confident typography, generous whitespace
- Service role key is ONLY used in Route Handlers and server-side utilities. Never in Client Components or `NEXT_PUBLIC_*` env vars.
- Credit deduction and usage_tracking writes are always server-side (service role) to prevent client-side manipulation
- `stripe_webhook_events` idempotency table prevents duplicate processing on Stripe retries

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield project

### Established Patterns
- None yet — this phase establishes the patterns all subsequent phases follow

### Integration Points
- `usage_tracking` table is the credit gate for Phase 5 (Generation)
- `profiles` trigger establishes the pattern for user initialization
- RLS policies on all tables are the multi-tenancy foundation for Phases 2–7
- Auth middleware pattern established here gates all protected routes going forward

</code_context>

<deferred>
## Deferred Ideas

- OAuth login (Google/GitHub) — explicitly v2, confirmed out of scope
- Multiple brands per user — v2
- Admin dashboard — v2

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-03*
