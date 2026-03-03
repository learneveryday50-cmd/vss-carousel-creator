# Phase 1: Foundation - Research

**Researched:** 2026-03-03
**Domain:** Next.js 15 App Router + @supabase/ssr + Postgres RLS + Auth flows
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Next.js 15 + TypeScript, App Router (not Pages Router)
- `@supabase/ssr` for all Supabase client instantiation — use `createServerClient` in Server Components/Route Handlers, `createBrowserClient` in Client Components. The deprecated `@supabase/auth-helpers-nextjs` is NOT used.
- Tailwind CSS for styling, Framer Motion for animations
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, never exposed to client)
- Vercel deployment config (vercel.json or project settings) — no special config needed beyond env vars
- GitHub repo connected to Vercel for auto-deploy on push to main
- Seven-table schema: `profiles`, `brands`, `templates`, `image_styles`, `carousels`, `usage_tracking`, `stripe_webhook_events` — full column definitions locked in CONTEXT.md
- RLS policies — specific USING clauses locked in CONTEXT.md
- Postgres trigger on `auth.users` INSERT auto-inserts rows into `profiles` and `usage_tracking`
- Auth flows: sign up → `/verify-email` → `/auth/callback` → `/onboarding`; login branching; password reset via `/auth/callback?type=recovery` → `/reset-password`
- `middleware.ts` at project root using `@supabase/ssr` `createServerClient`; protected routes: `/dashboard/:path*`, `/onboarding/:path*`
- Custom auth forms (not Supabase Auth UI); centered card layout; Framer Motion fade-up on card mount
- Service role key ONLY in Route Handlers and server-side utilities — never in Client Components or NEXT_PUBLIC_ env vars
- Credit deduction and usage_tracking writes are always server-side (service role)

### Claude's Discretion

- Exact Tailwind typography and spacing values
- Loading skeleton patterns
- Supabase client utility file structure (e.g., `lib/supabase/server.ts`, `lib/supabase/client.ts`)
- Exact error message copy

### Deferred Ideas (OUT OF SCOPE)

- OAuth login (Google/GitHub) — explicitly v2, confirmed out of scope
- Multiple brands per user — v2
- Admin dashboard — v2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up with email and password | Supabase `signUp()` + trigger auto-creates `profiles` + `usage_tracking`; email redirect to `/auth/callback` |
| AUTH-02 | User receives email verification after signup and must confirm before accessing dashboard | `/auth/confirm` route handler using `verifyOtp({ type, token_hash })`; middleware blocks unverified users from `/dashboard` |
| AUTH-03 | User session persists across browser refresh | `@supabase/ssr` cookie-based sessions; middleware `updateSession` refreshes on every request |
| AUTH-04 | User can reset password via email link | `resetPasswordForEmail()` → email → `/auth/confirm?type=recovery` → `/reset-password` form → `updateUser()` |
</phase_requirements>

---

## Summary

Phase 1 establishes the entire foundation that all subsequent phases depend on: Next.js 15 App Router project scaffold, the complete seven-table Postgres schema with RLS, and four auth flows (sign up, email verification, login, password reset). The schema and RLS policies are fully specified in CONTEXT.md and require no additional design decisions — the planner's job is to translate them into SQL migration tasks and verify they are correctly sequenced.

The `@supabase/ssr` package is the authoritative Supabase client library for Next.js App Router (as of 2025). It replaces the deprecated `@supabase/auth-helpers-nextjs` entirely. The critical Next.js 15 compatibility issue is that `cookies()` from `next/headers` is now async and must be awaited — the `createClient()` server function must be `async` and callers must `await` it. The middleware uses a `getAll`/`setAll` pattern (not `get`/`set`/`remove`) that properly syncs cookies on both the request and response objects. This is the most common gotcha when following outdated Supabase tutorials.

For the auth callback, Supabase now uses `verifyOtp({ type, token_hash })` for email confirmation and password recovery — NOT `exchangeCodeForSession(code)` which is for OAuth PKCE flows. The `token_hash` + `type` arrive as query parameters at `/auth/confirm`. The Supabase dashboard email templates must be configured to point to `[SiteURL]/auth/confirm?token_hash={{ .TokenHash }}&type=email` (and `type=recovery` for password resets). The Postgres trigger for auto-creating profile rows requires `SECURITY DEFINER set search_path = ''` because the `supabase_auth_admin` role lacks permission to write to `public.*` tables.

**Primary recommendation:** Scaffold in the order — Next.js project → env vars → Supabase client utilities → database schema migration → RLS policies → Postgres trigger → middleware → auth route handlers → auth pages. Each step is a dependency for the next; do not re-order.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.x | Full-stack React framework | App Router RSC + edge middleware; locked decision |
| typescript | 5.x | Type safety | Included by default in create-next-app |
| @supabase/ssr | 0.8.0 (stable), 0.9.0-rc.6 (pre-release) | Server + browser Supabase clients for App Router | Only officially supported SSR package; auth-helpers deprecated |
| @supabase/supabase-js | 2.98.0 | Supabase JS SDK (dependency of @supabase/ssr) | Core SDK used by @supabase/ssr internally |
| tailwindcss | 4.x | Utility CSS | Locked decision; included in create-next-app |
| framer-motion | 12.x (or `motion` pkg) | UI animations | Locked decision; fade-up on auth card mount |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | latest CLI | Copy-paste accessible UI components | Auth form inputs, buttons, cards — only add components as needed |
| server-only | latest | Prevents admin client from being imported client-side | Import in lib/supabase/admin.ts to enforce server boundary |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @supabase/ssr | @supabase/auth-helpers-nextjs | auth-helpers is deprecated — do not use |
| framer-motion pkg | `motion` pkg | motion is the renamed successor to framer-motion; either works but `motion` is the future; both require `"use client"` |
| Custom auth forms | Supabase Auth UI | Auth UI is less flexible; locked decision is custom forms |

**Installation:**
```bash
# 1. Scaffold project
npx create-next-app@latest vss-carousel --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 2. Supabase
npm install @supabase/ssr @supabase/supabase-js

# 3. Animation
npm install framer-motion

# 4. shadcn (run after project exists)
npx shadcn@latest init
# React 19 peer dep conflict with shadcn components — use:
npx shadcn@latest add button input label card --legacy-peer-deps
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Route group — auth layout (centered card)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── verify-email/page.tsx
│   │   └── reset-password/page.tsx
│   ├── auth/
│   │   └── confirm/route.ts     # Handles email verify + password reset callback
│   ├── (protected)/             # Route group — authenticated layout
│   │   ├── dashboard/page.tsx
│   │   └── onboarding/page.tsx
│   └── layout.tsx               # Root layout
├── lib/
│   └── supabase/
│       ├── client.ts            # createBrowserClient — Client Components only
│       ├── server.ts            # createServerClient (async) — Server Components / Route Handlers
│       └── admin.ts             # createClient with service role — Route Handlers only
middleware.ts                    # Session refresh on every request
```

### Pattern 1: Supabase Server Client (Next.js 15)

**What:** Async server client using `await cookies()` — required by Next.js 15 breaking change
**When to use:** In all Server Components, Server Actions, and Route Handlers

```typescript
// src/lib/supabase/server.ts
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies() // MUST be awaited in Next.js 15

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — ignorable when middleware handles refresh
          }
        },
      },
    }
  )
}
```

### Pattern 2: Supabase Browser Client

**What:** Client-side Supabase client for Client Components
**When to use:** In any file with `"use client"` directive

```typescript
// src/lib/supabase/client.ts
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Pattern 3: Supabase Admin Client (Service Role)

**What:** Server-only admin client that bypasses RLS — for usage_tracking writes and credit ops
**When to use:** Route Handlers only. Never in Client Components. Import `server-only` to enforce.

```typescript
// src/lib/supabase/admin.ts
import 'server-only'
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // NO NEXT_PUBLIC_ prefix
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}
```

### Pattern 4: Middleware — Session Refresh + Route Protection

**What:** Refreshes Supabase session tokens on every request; redirects unprotected access
**When to use:** Exactly once, at `middleware.ts` project root

```typescript
// middleware.ts
// Source: GitHub gist from Supabase auth examples
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

```typescript
// src/lib/supabase/middleware.ts
// Source: https://gist.github.com/joshcoolman-smc/be4de3c3896fe8d4a0e5559c82f915fb
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Must update BOTH request and response cookies
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ALWAYS use getUser() — never getSession() — to validate auth server-side
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isProtected =
    pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')
  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth/')

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect verified+authenticated users away from auth pages
  if (isAuthRoute && user) {
    // Note: brand check (onboarding vs dashboard) requires DB query — do in page component
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}
```

### Pattern 5: Auth Callback Route Handler

**What:** Handles email confirmation and password reset token exchange
**When to use:** A single route handler at `app/auth/confirm/route.ts`

```typescript
// src/app/auth/confirm/route.ts
// Source: https://supabase.com/ui/docs/nextjs/password-based-auth
import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const _next = searchParams.get('next')
  const next = _next?.startsWith('/') ? _next : '/'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,   // 'email' for signup confirmation, 'recovery' for password reset
      token_hash,
    })

    if (!error) {
      // For type='email': next defaults to '/onboarding'
      // For type='recovery': next should be '/reset-password'
      redirect(next)
    } else {
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`)
    }
  }

  redirect('/auth/error?error=Missing+token')
}
```

**Supabase dashboard config required:**
- Authentication > Email Templates > Confirm signup: change URL to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding`
- Authentication > Email Templates > Reset password: change URL to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`
- Authentication > URL Configuration > Site URL: set to production URL on deploy
- Authentication > URL Configuration > Redirect URLs: add `http://localhost:3000/**` for dev

### Pattern 6: Postgres Trigger for Auto-Profile Creation

**What:** Database trigger that fires after every new auth.users INSERT
**When to use:** Run once as SQL migration; handles profiles + usage_tracking creation atomically

```sql
-- Source: https://supabase.com/docs/guides/auth/managing-user-data
-- SECURITY DEFINER is REQUIRED: supabase_auth_admin cannot write to public.* without it
-- set search_path = '' prevents search path injection attacks

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Auto-create profile row
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());

  -- Auto-create usage_tracking row with free plan defaults
  INSERT INTO public.usage_tracking (
    user_id,
    plan,
    credits_remaining,
    credits_limit,
    period_start,
    last_reset_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'free',
    3,
    3,
    date_trunc('month', NOW()),
    NOW(),
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Pattern 7: RLS Policy Syntax

**What:** Exact SQL for enabling RLS and creating policies for all seven tables
**When to use:** Run in order after table CREATE statements

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security

-- Enable RLS on every user-scoped table (MUST be explicit — off by default)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- profiles: own row only
CREATE POLICY "Users manage own profile"
  ON public.profiles FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- brands: own rows only
CREATE POLICY "Users manage own brands"
  ON public.brands FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- templates: SELECT for all authenticated (shared catalog, no user_id filter)
CREATE POLICY "Templates visible to all authenticated"
  ON public.templates FOR SELECT
  TO authenticated
  USING (true);

-- image_styles: built-ins (user_id IS NULL) visible to all; custom styles own-only
CREATE POLICY "image_styles SELECT: built-ins + own custom"
  ON public.image_styles FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR (SELECT auth.uid()) = user_id);

CREATE POLICY "image_styles INSERT: own custom only"
  ON public.image_styles FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "image_styles UPDATE: own custom only"
  ON public.image_styles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "image_styles DELETE: own custom only"
  ON public.image_styles FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- carousels: own rows only
CREATE POLICY "Users manage own carousels"
  ON public.carousels FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- usage_tracking: users read own row; writes via service role only
CREATE POLICY "Users read own usage"
  ON public.usage_tracking FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
-- No INSERT/UPDATE/DELETE policy for authenticated role — service role bypasses RLS

-- stripe_webhook_events: no user access — service role only
-- (No policies created = no access for anon/authenticated roles)
```

### Pattern 8: Framer Motion in App Router

**What:** Framer Motion requires `"use client"` — wrap animated elements in a Client Component
**When to use:** Auth card fade-up, any animated UI element

```typescript
// src/components/auth/auth-card.tsx
"use client"

import { motion } from "framer-motion"

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8"
    >
      {children}
    </motion.div>
  )
}
```

**Note on package naming:** As of 2025, `framer-motion` (v12.x) and the `motion` package are functionally equivalent. The motion package is the renamed successor. Either can be installed. Both require `"use client"`. Import from `"framer-motion"` or `"motion/react"` respectively.

### Anti-Patterns to Avoid

- **Using `getSession()` on the server:** Only `getUser()` makes a network call to validate the token. `getSession()` only checks expiry and existence — not cryptographic validity.
- **Not awaiting `cookies()`:** In Next.js 15, `cookies()` is async. Forgetting `await` causes a runtime error that only surfaces at build time, not in development.
- **Using `get`/`set`/`remove` cookie API:** The old individual-cookie API is replaced with `getAll`/`setAll`. Use only `getAll`/`setAll` in both middleware and server client.
- **Creating `NextResponse.next()` a second time in middleware without copying cookies:** If you create a fresh response after checking auth, you must copy Supabase cookies from `supabaseResponse` to the new response. Easiest fix: always return the `supabaseResponse` object as-is.
- **Using `exchangeCodeForSession(code)` for email confirmation:** That's for OAuth PKCE. Email confirmation uses `verifyOtp({ type, token_hash })`.
- **Trigger function without SECURITY DEFINER:** The auth system's database role cannot write to `public.*` — the trigger function will silently fail and block signups.
- **RLS left disabled on new tables:** Supabase creates tables with RLS off by default. Every migration must include the explicit `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statement.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session refresh on every request | Custom JWT refresh logic | `updateSession` pattern with `@supabase/ssr` | Token rotation, clock skew, cookie sync across request/response handled automatically |
| Multi-table insert on user signup | App-level signup handler that inserts profiles | Postgres trigger `on_auth_user_created` | Atomic — if the INSERT fails, the user is also not created; no orphaned auth users |
| Per-user data isolation | Application-layer WHERE clauses | RLS policies | RLS is enforced at the DB layer — app bugs cannot leak data even if query filters are wrong |
| Email delivery, verification links | Custom email sender | Supabase Auth built-in email | SMTP configuration, bounce handling, link expiry all handled; just configure the template |
| Password hashing/storage | Custom auth | Supabase Auth | bcrypt, secure token generation, PKCE flow — all handled |
| Cookie-based auth session storage | localStorage auth tokens | `@supabase/ssr` cookie handling | localStorage is not available in SSR and is XSS-vulnerable |

**Key insight:** The entire auth stack (email, sessions, tokens, cookie rotation) is delegated to Supabase Auth. The application layer only handles redirects, UI states, and business rules (which page to go to after login).

---

## Common Pitfalls

### Pitfall 1: Next.js 15 `cookies()` is Async

**What goes wrong:** `createClient()` in `server.ts` uses `cookies()` synchronously (copied from a Next.js 14 tutorial). In development it appears to work. In production build it throws or behaves incorrectly.
**Why it happens:** Next.js 15 made `cookies()`, `headers()`, and `draftMode()` from `next/headers` async as a breaking change.
**How to avoid:** Make `createClient()` async, add `await` before `cookies()`, and `await` the `createClient()` call at every usage site.
**Warning signs:** TypeScript errors about `Promise<CookieStore>` not matching expected type; auth state inconsistency only in prod.

### Pitfall 2: RLS Disabled on New Tables

**What goes wrong:** A table is created without enabling RLS. All authenticated users can read all rows across all tenants.
**Why it happens:** Supabase (and Postgres) create tables with RLS off by default. RLS must be explicitly enabled per table.
**How to avoid:** Every migration that creates a user-scoped table MUST include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` immediately after the `CREATE TABLE` statement.
**Warning signs:** Run the audit query: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false` — should return only `templates` (shared catalog) and `stripe_webhook_events`. Any other table here is a security breach.

### Pitfall 3: Trigger Fails and Blocks Signups

**What goes wrong:** The `handle_new_user` trigger function has a bug (e.g., missing column, wrong type). Every new user signup throws a 500 error.
**Why it happens:** Triggers are database-level — errors in the trigger function propagate up and roll back the entire `INSERT INTO auth.users` transaction.
**How to avoid:** Test the trigger function by manually calling it with a fake UUID before connecting it to the email flow. Always include `RETURN NEW` at the end.
**Warning signs:** Signups return a generic error; the Supabase auth logs show trigger function errors.

### Pitfall 4: Middleware Returns a New Response Without Supabase Cookies

**What goes wrong:** Middleware checks auth, creates a `new NextResponse()` for a redirect, but loses the Supabase session cookies set during `updateSession`. Session is lost on the next request.
**Why it happens:** Supabase sets cookies on the `supabaseResponse` object. If you return a different response object, those cookies are not included.
**How to avoid:** Always return the `supabaseResponse` object. For redirects, clone `request.nextUrl`, modify the path, and return `NextResponse.redirect(url)` — this does not need Supabase cookies because the redirect itself doesn't require them (the next request will refresh the session). The critical thing is that the successful non-redirect response returns `supabaseResponse`.

### Pitfall 5: Service Role Key Exposed to Client

**What goes wrong:** `SUPABASE_SERVICE_ROLE_KEY` is prefixed with `NEXT_PUBLIC_` or is imported in a Client Component. The key is leaked in the browser bundle.
**Why it happens:** Developers use `NEXT_PUBLIC_` for all env vars for convenience, or accidentally import `admin.ts` from a client file.
**How to avoid:** (1) Never prefix service role key with `NEXT_PUBLIC_`. (2) Add `import 'server-only'` at the top of `lib/supabase/admin.ts` — Next.js will throw a build error if this file is imported client-side.
**Warning signs:** Run `grep -r "SUPABASE_SERVICE_ROLE_KEY" src/app/` — any result in a non-API route file is a breach.

### Pitfall 6: Supabase Email Redirect URL Not Configured

**What goes wrong:** After signup, the verification email link points to `localhost:3000/auth/confirm` even in production. Or the link points to the raw Supabase confirmation URL which uses a different exchange mechanism than the project's `/auth/confirm` route.
**Why it happens:** The default Supabase email templates use `{{ .ConfirmationURL }}` which points to the Supabase-hosted confirmation flow. The `@supabase/ssr` pattern requires the email to point to your own route handler.
**How to avoid:** In Supabase dashboard, update email templates to use `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` (and `type=recovery` for password reset). Set the Site URL in URL Configuration. Add `http://localhost:3000/**` to Redirect URLs for dev.
**Warning signs:** Clicking verification email redirects to a blank Supabase page or returns an auth error.

### Pitfall 7: Double `getUser()` Call (Performance)

**What goes wrong:** Middleware calls `getUser()` and then the protected page also calls `getUser()` — two round-trips to the Supabase Auth server per page load.
**Why it happens:** Supabase recommends calling `getUser()` in the page to protect it, even after middleware has validated the session.
**How to avoid:** The middleware sets a cookie with the validated session that the server client reads. The page-level `getUser()` call reads from the refreshed cookie and does NOT make an extra network call in most cases (it uses the cached claims). This is acceptable. Advanced optimization: pass user ID in request headers from middleware and read it in the page without calling `getUser()` again.
**Warning signs:** Slow page loads; monitoring shows doubled auth API calls.

---

## Code Examples

Verified patterns from official and verified community sources:

### Sign Up Action (Server Action)

```typescript
// src/app/(auth)/signup/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUpAction(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?type=email&next=/onboarding`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/verify-email')
}
```

### Sign In Action

```typescript
// src/app/(auth)/login/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signInAction(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: error.message }
  }

  // Check if user has a brand — determines redirect target
  const { data: brand } = await supabase
    .from('brands')
    .select('id')
    .single()

  redirect(brand ? '/dashboard' : '/onboarding')
}
```

### Password Reset Request

```typescript
// src/app/(auth)/reset-password/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function requestPasswordResetAction(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get('email') as string,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?type=recovery&next=/reset-password`,
    }
  )

  if (error) {
    return { error: error.message }
  }
  return { success: true }
}
```

### Password Update (After Recovery)

```typescript
// Called from /reset-password page — user is now authenticated via token
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updatePasswordAction(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: error.message }
  }
  redirect('/dashboard')
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2023 | auth-helpers is deprecated; ssr is the only supported approach |
| `createClientComponentClient` | `createBrowserClient` from `@supabase/ssr` | 2023 | Renamed and simplified API |
| `createRouteHandlerClient` | `createServerClient` from `@supabase/ssr` | 2023 | One function for all server contexts |
| `get`/`set`/`remove` cookie API | `getAll`/`setAll` cookie API | 2024 | Batch cookie operations prevent missed updates |
| `cookies()` synchronous | `await cookies()` | Next.js 15 (2024) | Breaking change — must await in all server utilities |
| `getSession()` on server | `getUser()` on server | 2023 | `getUser()` validates JWT with Auth server; `getSession()` does not |
| `{{ .ConfirmationURL }}` in email templates | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` | 2023 | Required for @supabase/ssr OTP verification pattern |
| `framer-motion` package | `motion` package (v12+) | 2024 | Renamed successor; `framer-motion` still works but `motion` is the future |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (new format `sb_publishable_xxx`) | 2024-2025 | Transition period; both work. New projects can still use `ANON_KEY` naming — backward compatible until at least 2026 |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Officially deprecated; do not use in any new code
- `supabase.auth.getSession()` on the server: Security vulnerability — does not validate JWT signature
- `createMiddlewareClient` from auth-helpers: Replaced by `createServerClient` from `@supabase/ssr`

---

## Open Questions

1. **Env var naming: ANON_KEY vs PUBLISHABLE_KEY**
   - What we know: Supabase is migrating to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (format `sb_publishable_xxx`). Legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` still works in 2025-2026. No hard cutoff date confirmed.
   - What's unclear: Whether new Supabase project dashboards show "Anon Key" or "Publishable Key" in the UI for existing projects.
   - Recommendation: Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` as the env var name for consistency with locked decision in CONTEXT.md. If the Supabase dashboard shows only a publishable key, map it to this env var. Both values work with `@supabase/ssr`.

2. **Supabase dashboard email template path: `/auth/callback` vs `/auth/confirm`**
   - What we know: Supabase docs show the route at `app/auth/confirm/route.ts` (using `verifyOtp`). CONTEXT.md specifies `/auth/callback`.
   - What's unclear: Whether `/auth/callback` or `/auth/confirm` should be the canonical path — both are valid file system paths.
   - Recommendation: Use `/auth/confirm` as the route handler path (matches current Supabase docs pattern). Update middleware to treat `/auth/confirm` as a public route. The CONTEXT.md reference to `/auth/callback` is conceptual — the actual implementation uses `/auth/confirm`.

3. **Middleware: verifying email status for the "unverified user → /verify-email" redirect**
   - What we know: Middleware can call `getUser()` to check if a user is logged in. Supabase returns `user.email_confirmed_at` on the user object.
   - What's unclear: Whether checking `email_confirmed_at` in middleware is performant enough (it adds a field check to every middleware call).
   - Recommendation: Check `user.email_confirmed_at` in middleware for the `/dashboard` and `/onboarding` routes. If null, redirect to `/verify-email`. This is a field check on the already-fetched user object — no extra DB call.

---

## Sources

### Primary (HIGH confidence)

- [Supabase SSR Next.js guide](https://supabase.com/docs/guides/auth/server-side/nextjs) — middleware, client creation patterns, Next.js 15 async cookies
- [Supabase Creating SSR Client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — `getAll`/`setAll` cookie API, server/browser client patterns
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) — `CREATE POLICY` syntax, USING vs WITH CHECK, service role bypass
- [Supabase Managing User Data](https://supabase.com/docs/guides/auth/managing-user-data) — trigger function with SECURITY DEFINER, `handle_new_user` pattern
- [Supabase Password-Based Auth UI Docs](https://supabase.com/ui/docs/nextjs/password-based-auth) — auth/confirm route handler with `verifyOtp({ type, token_hash })`
- [Supabase API Keys Guide](https://supabase.com/docs/guides/api/api-keys) — publishable key format, transition period, backward compatibility
- [Supabase Migration from Auth Helpers](https://supabase.com/docs/guides/troubleshooting/how-to-migrate-from-supabase-auth-helpers-to-ssr-package-5NRunM) — `getAll`/`setAll` middleware pattern verified

### Secondary (MEDIUM confidence)

- [GitHub Gist: Supabase Auth Middleware](https://gist.github.com/joshcoolman-smc/be4de3c3896fe8d4a0e5559c82f915fb) — complete `updateSession` function with `getAll`/`setAll` — cross-verified with official docs
- [Supabase Postgres Triggers Guide](https://supabase.com/docs/guides/database/postgres/triggers) — trigger CREATE syntax, NEW variable access
- [Next.js Installation Docs](https://nextjs.org/docs/app/getting-started/installation) — `create-next-app` flags
- [shadcn/ui Next.js Installation](https://ui.shadcn.com/docs/installation/next) — `npx shadcn@latest init`, React 19 peer deps flag
- [Motion/Framer Motion v12](https://motion.dev/docs/react-upgrade-guide) — `motion/react` import, `"use client"` requirement, React 19 support
- [Adrian Murage: Service Role in Next.js](https://adrianmurage.com/posts/supabase-service-role-secret-key/) — admin client pattern, server-only directive

### Tertiary (LOW confidence)

- [@supabase/ssr version 0.8.0](https://www.npmjs.com/package/@supabase/ssr) — version number from search result; verify on npm before install
- [@supabase/supabase-js version 2.98.0](https://www.npmjs.com/package/@supabase/supabase-js) — version number from search result; verify on npm before install
- [framer-motion version 12.34.3](https://www.npmjs.com/package/framer-motion) — version number from search result; verify on npm before install

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `@supabase/ssr`, Next.js 15 App Router, and Tailwind CSS are all stable and well-documented; versions flagged as LOW should be verified on npm before install
- Architecture patterns: HIGH — server/browser client split, `getAll`/`setAll` cookie API, `updateSession` middleware, `verifyOtp` callback, and trigger SECURITY DEFINER are all verified against official Supabase docs
- RLS syntax: HIGH — `CREATE POLICY` SQL verified against official Supabase RLS documentation
- Trigger syntax: HIGH — `SECURITY DEFINER set search_path = ''` pattern verified against official Supabase user management docs
- Pitfalls: HIGH — all pitfalls are verified against official docs or confirmed GitHub issues (async cookies, getSession vs getUser, trigger errors blocking signups, cookie sync in middleware)

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (30 days — stable APIs, but @supabase/ssr is pre-1.0 and may have minor releases)
