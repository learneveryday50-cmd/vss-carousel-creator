# Architecture Patterns

**Project:** VSS Carousel Creator
**Domain:** Multi-tenant SaaS with external AI generation workflow
**Researched:** 2026-03-03
**Confidence:** MEDIUM (training data; web verification denied during research session)

---

## Recommended Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                          │
│  Next.js App Router — React Server Components + Client Islands   │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS (Vercel Edge/Node)                     │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ App Router   │  │ Route Handlers│  │ Middleware           │   │
│  │ (RSC Pages)  │  │ /api/*       │  │ (Auth session check) │   │
│  └──────┬───────┘  └──────┬───────┘  └─────────────────────┘   │
│         │                 │                                        │
└─────────┼─────────────────┼────────────────────────────────────-┘
          │                 │
     ┌────▼─────┐    ┌──────▼─────────────────────────────────┐
     │ Supabase │    │         External Services                │
     │  Client  │    │  ┌──────────┐  ┌──────────────────────┐ │
     │ (server) │    │  │  Stripe  │  │  n8n Cloud Workflow   │ │
     └────┬─────┘    │  │ Webhooks │  │  (webhook trigger)   │ │
          │          │  └──────────┘  └──────────┬───────────┘ │
          │          └───────────────────────────┼─────────────┘
          ▼                                      │
┌─────────────────────┐                         │ returns
│  SUPABASE (Postgres) │◄────────────────────────┘ {slide_urls, post_text}
│                      │
│  Auth (JWT)          │
│  Postgres + RLS      │
│  Realtime (optional) │
└─────────────────────┘
                                 ┌───────────────┐
                                 │   ImageBB CDN  │
                                 │ (image hosting)│
                                 │  via n8n only  │
                                 └───────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Next.js App Router (RSC)** | Renders pages server-side; reads Supabase directly using service-role or anon key with session | Supabase (read), Route Handlers |
| **Next.js Route Handlers (`/api/*`)** | Mutation endpoints: trigger generation, handle webhooks, manage credits | Supabase (write), n8n, Stripe |
| **Next.js Middleware** | Validates Supabase session cookie on every request; redirects unauthenticated users | Supabase Auth (session verify) |
| **Supabase Auth** | Manages user identity, JWT sessions, email verification | Next.js (via `@supabase/ssr`), Postgres (auth schema) |
| **Supabase Postgres + RLS** | Stores all application data; enforces per-user isolation at DB level | Next.js (via supabase-js), n8n (via Supabase webhook/API) |
| **Stripe** | Subscription billing, plan management, credit allocation | Next.js Route Handler `/api/stripe/webhook` |
| **n8n Cloud Workflow** | Receives generation request, runs AI image generation, uploads to ImageBB, returns slide URLs + post text | Next.js Route Handler `/api/generate` (trigger), Supabase (result storage via n8n HTTP node or via Next.js callback) |
| **ImageBB CDN** | Hosts generated carousel slide images | n8n (upload), Browser (display via stored URLs) |

---

## Data Flow

### 1. Authentication Flow

```
Browser → POST /auth/login (Supabase Auth UI or custom form)
       → Supabase Auth validates credentials
       → Issues JWT stored in HttpOnly cookie (via @supabase/ssr)
       → Next.js Middleware reads cookie on each request
       → Protected routes accessible
```

### 2. Generation Flow (Critical Path)

```
Browser
  → POST /api/generate  {idea, brand_id, template_id, image_style}
      │
      ├─ Authenticate: verify Supabase session (server-side)
      ├─ Authorize: check user has credits > 0
      ├─ Deduct 1 credit (optimistic, with DB transaction)
      ├─ INSERT carousels row with status='pending'
      │
      ├─ POST n8n Webhook URL {idea, brand, template, image_style, carousel_id, callback_url}
      │     │
      │     └─ n8n Cloud:
      │           → AI image generation (per slide)
      │           → Upload each image to ImageBB
      │           → Assemble post body text
      │           → POST callback_url or direct Supabase update
      │
      └─ Return {carousel_id, status: 'pending'} to browser

Browser polls GET /api/carousels/{id} or uses Supabase Realtime
  → When status='complete': display slide URLs + post text
```

**n8n result delivery options (pick one):**

Option A — n8n calls back to Next.js:
```
n8n → POST /api/n8n/callback  {carousel_id, slide_urls[], post_text, status}
    → Route Handler validates shared secret header
    → UPDATE carousels SET status='complete', slide_urls=..., post_text=...
```

Option B — n8n writes directly to Supabase via HTTP node (simpler):
```
n8n → Supabase REST API  PATCH /carousels/{carousel_id}
    → Uses service-role key stored in n8n credentials (never exposed to browser)
    → status='complete', slide_urls=..., post_text=...
```

**Recommendation: Option B** — fewer moving parts, n8n already talks to Supabase in existing workflow.

### 3. Stripe Webhook Flow

```
Stripe Event (checkout.session.completed, customer.subscription.updated,
              customer.subscription.deleted, invoice.payment_succeeded)
  → POST /api/stripe/webhook
      │
      ├─ Verify Stripe-Signature header (stripe.webhooks.constructEvent)
      ├─ Identify user by customer.metadata.user_id or customer email
      │
      ├─ checkout.session.completed     → SET plan='pro', credits=10
      ├─ invoice.payment_succeeded      → RESET credits=10 (monthly renewal)
      ├─ customer.subscription.deleted  → SET plan='free', credits=3
      └─ customer.subscription.updated  → Reflect plan change
      │
      └─ UPDATE users/subscriptions table in Supabase
```

---

## Supabase Schema Design for Multi-Tenancy

### RLS Strategy: User-Scoped Isolation

Every table that contains user data has a `user_id UUID` column that references `auth.users(id)`. RLS policies use `auth.uid()` to enforce that users can only access their own rows.

### Core Tables

```sql
-- Extended user profile (supplements auth.users)
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'free',       -- 'free' | 'pro'
  credits     INTEGER NOT NULL DEFAULT 3,
  credits_reset_at TIMESTAMPTZ,                   -- next monthly reset date
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Brands (one user can have multiple brands)
CREATE TABLE public.brands (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  colors      JSONB,        -- {primary: '#hex', secondary: '#hex', accent: '#hex'}
  voice       TEXT,         -- voice/tone guidelines
  product_info TEXT,
  audience_info TEXT,
  cta_text    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own brands"
  ON public.brands FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Templates (global, read-only for users — no RLS user filter)
CREATE TABLE public.templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  slide_count INTEGER DEFAULT 6,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- No RLS needed — templates are public/global (read-only)
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates are publicly readable"
  ON public.templates FOR SELECT USING (true);

-- Image styles (global, same pattern as templates)
CREATE TABLE public.image_styles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,           -- 'Technical/Realism', 'Notebook', etc.
  description TEXT,
  is_custom   BOOLEAN DEFAULT false,   -- system styles vs user-defined
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL for system styles
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.image_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System styles readable by all"
  ON public.image_styles FOR SELECT
  USING (is_custom = false OR auth.uid() = user_id);

CREATE POLICY "Users can CRUD own custom styles"
  ON public.image_styles FOR ALL
  USING (is_custom = true AND auth.uid() = user_id)
  WITH CHECK (is_custom = true AND auth.uid() = user_id);

-- Carousels (generation history)
CREATE TABLE public.carousels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id    UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  image_style_id UUID REFERENCES public.image_styles(id) ON DELETE SET NULL,
  idea        TEXT NOT NULL,            -- raw user input
  status      TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'complete' | 'failed'
  slide_urls  TEXT[],                  -- ImageBB URLs returned by n8n
  post_text   TEXT,                    -- generated post body
  error_message TEXT,                  -- if status='failed'
  created_at  TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.carousels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own carousels"
  ON public.carousels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own carousels"
  ON public.carousels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- n8n updates via service role key — bypasses RLS, so no UPDATE policy needed for users
-- If users need to delete: add DELETE policy
```

### Service Role vs Anon Key Usage

| Operation | Key Used | Why |
|-----------|----------|-----|
| Browser → Supabase Auth | Anon key | Public auth operations |
| RSC page data reads | Server-side with session (anon + JWT) | User context, RLS applies |
| Route Handler mutations | Server-side with session | User context, RLS applies |
| n8n → Supabase (write results) | Service role key | Bypasses RLS; stored in n8n secrets only |
| Stripe webhook handler | Service role key | Admin operation, no user session available |
| Credit deduction | Service role key in Route Handler | Needs atomic transaction |

**Critical rule:** The service role key MUST only exist in server-side code (Route Handlers, Server Actions). Never in client components or exposed to the browser.

---

## n8n Webhook Request/Response Shape

### Inbound Request (Next.js → n8n)

```typescript
// POST {N8N_WEBHOOK_URL}
// Headers: { 'Content-Type': 'application/json', 'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET }

interface N8NGenerationRequest {
  carousel_id: string;          // UUID — used to write back results
  idea: string;                 // User's raw topic/idea
  brand: {
    name: string;
    colors: {
      primary: string;
      secondary: string;
      accent?: string;
    };
    voice: string;
    product_info: string;
    audience_info: string;
    cta_text: string;
  };
  template: {
    id: string;
    name: string;
    slide_count: number;
  };
  image_style: {
    id: string;
    name: string;               // 'Technical/Realism' | 'Notebook' | 'Whiteboard Diagram' | 'Comic Strip Storyboard' | custom
  };
  // Included only if using Option A (callback pattern)
  callback_url?: string;        // https://yourdomain.com/api/n8n/callback
}
```

### Outbound (n8n writes to Supabase directly — Option B)

```
n8n HTTP Node: PATCH {SUPABASE_URL}/rest/v1/carousels?id=eq.{carousel_id}
Headers:
  apikey: {SUPABASE_SERVICE_ROLE_KEY}
  Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
  Content-Type: application/json
  Prefer: return=minimal

Body:
{
  "status": "complete",
  "slide_urls": ["https://i.ibb.co/...", "https://i.ibb.co/..."],
  "post_text": "Generated LinkedIn post text...",
  "completed_at": "2026-03-03T12:00:00Z"
}
```

### n8n Webhook Secret Validation (Next.js side)

```typescript
// /api/generate/route.ts
const webhookSecret = req.headers.get('x-webhook-secret');
// Outbound: we send the secret TO n8n
// Inbound (callback): we validate n8n sends it back

// For n8n callback pattern (/api/n8n/callback):
if (req.headers.get('x-n8n-secret') !== process.env.N8N_CALLBACK_SECRET) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## Next.js App Router Structure

```
app/
├── (marketing)/              # Route group — landing page, no auth required
│   ├── page.tsx              # Landing page
│   └── layout.tsx
│
├── (auth)/                   # Route group — auth pages
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── verify-email/page.tsx
│
├── (app)/                    # Route group — protected app
│   ├── layout.tsx            # Auth guard (middleware + layout check)
│   ├── onboarding/page.tsx   # Brand setup wizard
│   ├── dashboard/page.tsx    # Main generate UI
│   ├── history/page.tsx      # Carousel history
│   ├── carousel/[id]/page.tsx# Carousel preview/download
│   └── settings/
│       ├── page.tsx          # Account/billing settings
│       └── billing/page.tsx  # Stripe portal
│
└── api/
    ├── generate/route.ts         # Trigger n8n generation
    ├── n8n/callback/route.ts     # n8n result callback (Option A)
    ├── stripe/
    │   ├── webhook/route.ts      # Stripe webhook handler
    │   └── create-portal/route.ts # Stripe billing portal session
    └── carousels/
        └── [id]/route.ts         # Poll generation status

middleware.ts                 # Supabase session validation on all (app) routes
```

---

## Stripe Webhook Handling Architecture

```typescript
// /api/stripe/webhook/route.ts

export async function POST(req: Request) {
  const body = await req.text();  // raw body required for signature verification
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceRoleClient(); // bypasses RLS

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      // SET plan='pro', stripe_customer_id, stripe_subscription_id
      // RESET credits=10
      break;
    }
    case 'invoice.payment_succeeded': {
      // Monthly renewal — reset credits
      // Find user by stripe_customer_id → reset credits to plan limit
      break;
    }
    case 'customer.subscription.deleted': {
      // Downgrade to free
      // SET plan='free', credits=3 (or whatever remaining)
      break;
    }
  }

  return Response.json({ received: true });
}

// CRITICAL: Disable body parsing for this route
export const config = { api: { bodyParser: false } };
// In App Router: use req.text() directly (shown above) — bodyParser config not needed
```

---

## Patterns to Follow

### Pattern 1: Server Component Data Fetching (No Client Waterfalls)

RSC pages fetch data directly using Supabase server client. No client-side fetch on initial load.

```typescript
// app/(app)/history/page.tsx
import { createServerClient } from '@/lib/supabase/server';

export default async function HistoryPage() {
  const supabase = await createServerClient();
  const { data: carousels } = await supabase
    .from('carousels')
    .select('*, brands(name), templates(name)')
    .order('created_at', { ascending: false });

  return <CarouselHistoryList carousels={carousels} />;
}
// RLS automatically scopes to the authenticated user
```

### Pattern 2: Optimistic Credit Deduction with Rollback

Deduct credit before n8n call. Roll back if n8n fails to respond.

```typescript
// /api/generate/route.ts
// 1. Check credits > 0
// 2. BEGIN: deduct 1 credit + INSERT carousel with status='pending'
// 3. Trigger n8n webhook (fire-and-forget — n8n writes back async)
// 4. Return carousel_id immediately
// If n8n fails to respond within timeout: mark status='failed', restore credit
```

### Pattern 3: Supabase Realtime for Generation Status

Use Supabase Realtime to push status updates to browser when n8n completes, instead of polling.

```typescript
// Client component — CarouselStatusPoller.tsx
const channel = supabase
  .channel('carousel-status')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'carousels',
    filter: `id=eq.${carouselId}`
  }, (payload) => {
    if (payload.new.status === 'complete') {
      router.push(`/carousel/${carouselId}`);
    }
  })
  .subscribe();
```

### Pattern 4: Middleware Auth Guard

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createServerClient(/* ... */);
  const { data: { session } } = await supabase.auth.getSession();

  const isAppRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                     request.nextUrl.pathname.startsWith('/history') ||
                     request.nextUrl.pathname.startsWith('/carousel') ||
                     request.nextUrl.pathname.startsWith('/settings') ||
                     request.nextUrl.pathname.startsWith('/onboarding');

  if (isAppRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Exposing Service Role Key to Client

**What:** Using `SUPABASE_SERVICE_ROLE_KEY` in a client component or in `NEXT_PUBLIC_*` env vars.
**Why bad:** Any user can read the key in browser devtools; bypasses all RLS; full DB access.
**Instead:** Service role key only in Route Handlers and Server Actions. Browser uses anon key + session JWT.

### Anti-Pattern 2: Trusting n8n Callback Without Secret Validation

**What:** `/api/n8n/callback` accepts any POST without verifying the caller is n8n.
**Why bad:** Anyone can mark carousels as complete with fake URLs.
**Instead:** Shared secret in header (`X-N8N-Secret`), validated before processing. Or use Option B (n8n → Supabase directly with service role key) to remove the callback surface entirely.

### Anti-Pattern 3: Writing RLS Policies That Use Joins for Authorization

**What:** Complex RLS policies that join across tables to check ownership.
**Why bad:** Performance degrades at scale; hard to debug; easy to introduce holes.
**Instead:** Denormalize `user_id` onto every table that needs it. Simple `auth.uid() = user_id` policies.

### Anti-Pattern 4: Not Using Raw Body in Stripe Webhook

**What:** Parsing JSON body before Stripe signature verification.
**Why bad:** Stripe signature is computed over the raw request body. If Next.js parses JSON first, the raw string changes and verification always fails.
**Instead:** `const body = await req.text()` before any parsing. Then verify, then parse.

### Anti-Pattern 5: Blocking on n8n in the Generate API Route

**What:** `await fetch(N8N_WEBHOOK_URL)` and waiting for the full generation result.
**Why bad:** n8n generation takes 30-120 seconds; Vercel serverless functions time out at 10-60s on Hobby tier.
**Instead:** Fire-and-forget POST to n8n (don't await full result). Return immediately with `carousel_id`. n8n writes back async. Browser polls or uses Realtime.

### Anti-Pattern 6: No Database Indexes on `user_id`

**What:** RLS policies scan full tables without indexes.
**Why bad:** Every query does a full table scan, even with RLS active.
**Instead:**
```sql
CREATE INDEX idx_carousels_user_id ON public.carousels(user_id);
CREATE INDEX idx_brands_user_id ON public.brands(user_id);
CREATE INDEX idx_carousels_status ON public.carousels(status) WHERE status = 'pending';
```

---

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| DB queries | Supabase free tier fine | Supabase Pro, add indexes | Read replicas, connection pooling (pgBouncer) |
| n8n generation | n8n Cloud Starter fine | n8n Cloud Pro, queue management | n8n queuing or dedicated workers |
| Image storage | ImageBB free tier | Watch rate limits; add CDN fallback | Evaluate S3/Cloudflare R2 |
| Stripe webhooks | Single handler fine | Add idempotency keys, retry logic | Queue-based processing |
| Vercel functions | Hobby tier | Pro tier for 60s timeouts | Edge functions for auth checks |

---

## Build Order (Dependency Graph)

The following order respects dependencies — each phase builds on what came before.

```
Phase 1: Foundation — Auth + DB Schema
  ├─ Supabase project setup
  ├─ All table creation + RLS policies
  ├─ Indexes
  ├─ Next.js project init (App Router + TypeScript)
  ├─ Supabase client setup (@supabase/ssr)
  ├─ Middleware auth guard
  └─ Sign up / login / email verification pages

Phase 2: Brand Onboarding
  ├─ REQUIRES: Phase 1 (auth, brands table)
  ├─ Brand creation form
  └─ Brand read/update/delete

Phase 3: Stripe + Credits
  ├─ REQUIRES: Phase 1 (profiles table with plan/credits)
  ├─ Stripe Products/Prices configured in dashboard
  ├─ Checkout session creation
  ├─ /api/stripe/webhook handler
  └─ Credit display in UI

Phase 4: n8n Workflow Migration
  ├─ REQUIRES: Phase 1 (carousels table), Phase 2 (brands)
  ├─ Migrate n8n: Airtable nodes → Supabase HTTP nodes
  ├─ Test n8n → Supabase write path
  └─ Test webhook trigger from Postman/curl

Phase 5: Generate Dashboard
  ├─ REQUIRES: Phase 2 (brands), Phase 3 (credits), Phase 4 (n8n ready)
  ├─ /api/generate Route Handler
  ├─ Dashboard UI (idea input, brand/template/style selectors)
  ├─ Supabase Realtime listener for status updates
  └─ Carousel preview page

Phase 6: History + Download
  ├─ REQUIRES: Phase 5 (carousels table populated)
  ├─ History list page
  ├─ Individual carousel page
  ├─ Slide image download
  ├─ PDF export (jsPDF or Puppeteer)
  └─ Copy post text to clipboard

Phase 7: Landing Page + Polish
  ├─ REQUIRES: All phases functional
  ├─ Marketing landing page (Resume.io aesthetic)
  ├─ Animations
  └─ Final template URLs swap-in
```

---

## Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-only, never NEXT_PUBLIC_

# Stripe
STRIPE_SECRET_KEY=                  # Server-only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=              # Server-only
STRIPE_PRO_PRICE_ID=                # Server-only

# n8n
N8N_WEBHOOK_URL=                    # Server-only
N8N_WEBHOOK_SECRET=                 # Shared secret we send to n8n
N8N_CALLBACK_SECRET=                # Shared secret n8n sends back (if using callback option)

# App
NEXT_PUBLIC_APP_URL=                # For callback URLs, Stripe redirect
```

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Next.js App Router patterns | MEDIUM-HIGH | Training data; App Router patterns stable since Next.js 13/14 |
| Supabase RLS policies | MEDIUM-HIGH | Core RLS syntax stable; `auth.uid()` pattern well-established |
| `@supabase/ssr` middleware pattern | MEDIUM | Package name and API may have minor version changes; verify on setup |
| Stripe webhook raw body handling | HIGH | This is a Stripe hard requirement, extremely stable |
| n8n HTTP node behavior | MEDIUM | n8n Cloud behavior based on training; verify node availability in your plan |
| Supabase Realtime for status updates | MEDIUM | Feature stable but subscription filter syntax evolves; check current docs |

## Sources

- Training data: Next.js App Router documentation (stable through Aug 2025 cutoff)
- Training data: Supabase RLS documentation and @supabase/ssr package
- Training data: Stripe webhook best practices
- Training data: n8n HTTP Request node patterns
- Web verification: Denied during this research session — validate key integration points against current official docs before build
