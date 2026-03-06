# Phase 3: Billing and Credits - Research

**Researched:** 2026-03-06
**Domain:** Stripe Checkout, Stripe Webhooks, Stripe Customer Portal, Supabase pg_cron, Next.js 15 Server Actions
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Credit display in header**
- Format: `FREE  2 / 3 credits` — plan badge + fraction (remaining / limit)
- Plan badge: "FREE" for free tier, "PRO" for pro tier
- Pro badge uses amber/gold color to signal premium status; FREE badge uses gray/neutral
- Color changes with urgency: amber at 1 credit remaining, red at 0 credits
- Zero state (0 credits, free tier): shows `FREE  0 / 3 credits` (in red) + an inline "Upgrade" link next to the count
- Pro users: same layout — `PRO  5 / 10 credits` — no special treatment beyond the badge color
- Placement: between BrandSwitcher and user avatar in the existing header, separated by the existing divider pattern

**Upgrade prompt (exhausted free-tier users)**
- Location: inline gate in the creator workflow — replaces the Generate button when credits = 0
- Content: lock icon + "You've used all 3 free credits. Upgrade to Pro for $29.99/month and get 10 credits." + `[Upgrade to Pro →]` button
- Note: the Generate button itself is a Phase 5 concern — this phase builds the prompt component so Phase 5 can use it
- Post-checkout redirect: back to `/templates` (the creator page, not billing or dashboard)

**Credit reset mechanism**
- Supabase scheduled Edge Function (cron job)
- Runs on the 1st of every month
- Resets `credits_remaining` to the plan limit (`credits_limit`) and updates `last_reset_at`
- Only processes free plan users (Pro credits are reset by Stripe webhook on renewal)
- Must be idempotent — running multiple times in a month must not reset credits more than once (guard: check `last_reset_at` is not already in the current month)

**Billing page (/settings/billing)**
- Dedicated page at `/settings/billing`
- Section 1 — Current Plan: plan name, credits remaining, monthly limit
- Section 2 — Upgrade Plan: "Upgrade to Pro" button that triggers Stripe Checkout Session creation
- Section 3 — Manage Billing: "Manage Billing" button that opens Stripe Customer Portal
- Pro users: Section 2 is hidden (already on Pro); Section 3 remains for cancellation/management

**Navigation — billing entry point**
- User avatar dropdown menu: Settings → Billing → navigates to `/settings/billing`
- No top-level nav item for billing — accessed via user menu only

**Stripe Checkout flow**
- Server Action or API route creates a Stripe Checkout Session and redirects user
- success_url: `/templates` (back to creator)
- cancel_url: `/settings/billing`
- Stripe Customer is created at signup via the `handle_new_user` trigger flow (or lazily on first Checkout if not yet created)

**Webhook handler**
- Route: `/api/stripe/webhook`
- Raw body parsing + Stripe signature verification
- Idempotency: check `stripe_webhook_events` table before processing (skip if already handled)
- Events to handle: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` (for monthly renewal credit reset on Pro)
- On subscription created/updated: update `usage_tracking` (plan, credits_limit, stripe_subscription_id, stripe_subscription_status)
- On subscription deleted/cancelled: downgrade to free (plan = 'free', credits_limit = 3, reset credits_remaining to 3)
- On invoice.paid (Pro renewal): reset credits_remaining to 10 and update last_reset_at

### Claude's Discretion
- Exact Stripe Product/Price object naming in dashboard
- Stripe webhook event retry handling details
- Exact styling of the plan badge (pill, tag, or text)
- Loading skeleton for credit display while server data fetches
- Error state if usage_tracking row is missing (should never happen post-trigger, but handle gracefully)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BILL-01 | Free tier: 3 carousel generations per month, resets on the 1st of each month | Supabase pg_cron scheduled reset function + idempotency guard on last_reset_at |
| BILL-02 | Pro tier: $29.99/month, 10 carousel generations per month, resets monthly | Stripe subscription product/price config + invoice.paid webhook to reset credits_remaining to 10 |
| BILL-03 | User can subscribe to Pro via Stripe Checkout | Server Action calls stripe.checkout.sessions.create with mode:'subscription', returns redirect to session.url |
| BILL-04 | User can manage/cancel subscription via Stripe Customer Portal | Server Action calls stripe.billingPortal.sessions.create with stripe_customer_id, returns redirect to portal URL |
| BILL-05 | Stripe webhooks update user plan and credit balance on subscription events | Route Handler at /api/stripe/webhook, raw body + signature verification, idempotency via stripe_webhook_events table |
| BILL-06 | Credit balance is visible to the user at all times (e.g. in dashboard header) | usage_tracking fetched in (protected)/layout.tsx alongside brands, passed as prop to Header via AppShell |
| BILL-07 | Users on Free tier who exhaust credits see an upgrade prompt | CreditGate component built this phase — replaces Generate button in creator workflow when credits_remaining === 0 |
</phase_requirements>

---

## Summary

Phase 3 integrates Stripe for subscription billing, implements credit tracking visibility, and wires up the monthly reset mechanism. The stack is well-established: the `stripe` npm package (server-side only) for creating Checkout Sessions and Customer Portal sessions via Server Actions, a Route Handler at `/api/stripe/webhook` for processing Stripe events, and Supabase pg_cron for free-tier monthly credit resets.

The existing database schema (`usage_tracking`, `stripe_webhook_events`) and service-role admin client are already in place from Phase 1. No new tables or schema changes are needed. The Stripe Customer ID is written to `usage_tracking.stripe_customer_id` lazily on first Checkout (or via webhook after session completes) — the `handle_new_user` trigger does not create a Stripe customer at signup because a Stripe API call in a DB trigger would be fragile.

The most critical implementation nuance is the webhook handler: the Next.js 15 App Router Route Handler must use `await req.text()` (not `req.json()`) to get the raw body for Stripe signature verification. Stripe's `constructEvent()` will fail if the body is parsed/modified before verification. All writes in the webhook use the admin (service role) client since `usage_tracking` and `stripe_webhook_events` are write-blocked for regular authenticated users by RLS design.

**Primary recommendation:** Install `stripe` (server-only), create Server Actions for Checkout and Portal redirect, implement the webhook Route Handler with `req.text()` + `constructEvent()`, schedule the cron reset via Supabase pg_cron SQL (available on all tiers including free), and fetch `usage_tracking` in `(protected)/layout.tsx` alongside existing brand data.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| stripe (npm) | ^17+ (latest: 20.4.0 as of 2026-03-06) | Stripe Node.js SDK — creates sessions, verifies webhooks, fetches customers | Official Stripe SDK; includes TypeScript types; server-only usage |
| @supabase/supabase-js | ^2.98.0 (already installed) | Admin client for webhook writes bypassing RLS | Already in project |
| next (App Router) | 16.1.6 (already installed) | Route Handler for webhook endpoint, Server Actions for session creation | Already in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.576.0 (already installed) | Lock icon for CreditGate, CreditCard icon | Credit display and upgrade prompt UI |
| server-only | ^0.0.1 (already installed) | Prevents Stripe secret key leaking to client bundles | Import in stripe utility file |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server Action for Checkout | API Route Handler | Both work; Server Action is simpler — no fetch(), automatic loading state, no CSRF concern. Use Server Action. |
| Supabase pg_cron | Vercel Cron Job | Vercel Hobby is limited to 2 cron jobs, each once-per-day only. pg_cron is available on all Supabase tiers and supports exact monthly scheduling (`0 0 1 * *`). Use pg_cron. |
| pg_cron → SQL function | pg_cron → Edge Function HTTP call | SQL function is simpler (no network hop, no auth token), sufficient for a simple UPDATE query. Use SQL function. |

**Installation:**
```bash
npm install stripe
```

Only `stripe` needs to be added. No client-side Stripe.js library is needed because this project uses Stripe Checkout (hosted by Stripe) and the Customer Portal (hosted by Stripe) — no in-page payment form elements.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   └── stripe/
│       └── server.ts          # Stripe client singleton (server-only)
├── app/
│   ├── (protected)/
│   │   ├── layout.tsx         # Add usage_tracking fetch alongside brands
│   │   ├── settings/
│   │   │   └── billing/
│   │   │       ├── page.tsx   # Billing page (server component)
│   │   │       └── actions.ts # createCheckoutSession, redirectToPortal
│   │   └── templates/
│   │       └── page.tsx       # CreditGate lives here (consumer of credits prop)
│   └── api/
│       └── stripe/
│           └── webhook/
│               └── route.ts   # POST handler — raw body, constructEvent, admin writes
├── components/
│   ├── layout/
│   │   └── header.tsx         # Add CreditBadge display (receives credits prop)
│   └── billing/
│       ├── credit-badge.tsx   # Plan pill + fraction display
│       └── credit-gate.tsx    # Upgrade prompt for exhausted free users
└── supabase/
    └── migrations/
        └── YYYYMMDD_billing_cron.sql  # pg_cron schedule for monthly reset
```

### Pattern 1: Stripe Client Singleton

**What:** Create the Stripe SDK client once in a server-only utility file. Never instantiate it in components or actions directly.
**When to use:** Any file that needs to call Stripe APIs.

```typescript
// src/lib/stripe/server.ts
import 'server-only'
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})
```

### Pattern 2: Server Action for Checkout Session

**What:** A `'use server'` action that creates a Checkout Session and calls `redirect()`. The form `action` attribute points to this — no client fetch needed.
**When to use:** Upgrade button on `/settings/billing` and inside the CreditGate component.

```typescript
// src/app/(protected)/settings/billing/actions.ts
'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'

export async function createCheckoutSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Read existing stripe_customer_id from usage_tracking
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  // Lazily create Stripe customer if not yet created
  let customerId = usage?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email })
    customerId = customer.id
    // Write back with admin client (bypasses RLS)
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    await admin.from('usage_tracking')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', user.id)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/templates`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  })

  redirect(session.url!)
}
```

### Pattern 3: Server Action for Customer Portal

**What:** Same pattern as Checkout — reads `stripe_customer_id`, creates portal session, redirects.
**When to use:** "Manage Billing" button on `/settings/billing`.

```typescript
// In src/app/(protected)/settings/billing/actions.ts
export async function redirectToCustomerPortal() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!usage?.stripe_customer_id) {
    redirect('/settings/billing') // No subscription to manage
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: usage.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  })

  redirect(portalSession.url)
}
```

### Pattern 4: Webhook Route Handler with Raw Body

**What:** App Router Route Handler using `req.text()` to preserve raw body for signature verification. Must use admin client for writes.
**When to use:** `/api/stripe/webhook` — POST only.

```typescript
// src/app/api/stripe/webhook/route.ts
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/server'
import { createAdminClient } from '@/lib/supabase/admin'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  // CRITICAL: Use req.text() NOT req.json() — raw body required for signature
  const body = await req.text()
  const sig = (await headers()).get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook signature failed: ${message}` }, { status: 400 })
  }

  const admin = createAdminClient()

  // Idempotency check — skip already-processed events
  const { data: existing } = await admin
    .from('stripe_webhook_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .single()

  if (existing) {
    return NextResponse.json({ received: true, skipped: true })
  }

  // Log event before processing (in case processing throws, avoids re-processing on retry)
  await admin.from('stripe_webhook_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
  })

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      await handleSubscriptionUpsert(admin, sub)
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await handleSubscriptionDeleted(admin, sub)
      break
    }
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      await handleInvoicePaid(admin, invoice)
      break
    }
  }

  return NextResponse.json({ received: true })
}
```

### Pattern 5: pg_cron Monthly Reset

**What:** A SQL migration that enables pg_cron and schedules a monthly Postgres function to reset free-tier credits.
**When to use:** Add as a Supabase migration file; apply via `supabase db push`.

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function: reset free-tier credits on the 1st of each month (idempotent)
CREATE OR REPLACE FUNCTION public.reset_free_tier_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.usage_tracking
  SET
    credits_remaining = credits_limit,
    last_reset_at = NOW(),
    updated_at = NOW()
  WHERE
    plan = 'free'
    -- Idempotency guard: only reset if last_reset_at is NOT already in current month
    AND date_trunc('month', last_reset_at) < date_trunc('month', NOW());
END;
$$;

-- Schedule: 00:00 UTC on the 1st of every month
SELECT cron.schedule(
  'reset-free-credits-monthly',
  '0 0 1 * *',
  'SELECT public.reset_free_tier_credits()'
);
```

### Pattern 6: Credit Data Flow Through Protected Layout

**What:** `usage_tracking` is fetched in `(protected)/layout.tsx` (same place brands are fetched) and passed through `AppShell` → `Header` as props. This is consistent with the existing data flow.
**When to use:** Everywhere credits need to display (header badge, billing page reads it directly via server component).

```typescript
// Addition to src/app/(protected)/layout.tsx
const { data: usage } = await supabase
  .from('usage_tracking')
  .select('plan, credits_remaining, credits_limit')
  .eq('user_id', user.id)
  .single()

// Pass to AppShell → Header:
// creditsRemaining: usage?.credits_remaining ?? 0
// creditsLimit: usage?.credits_limit ?? 3
// plan: usage?.plan ?? 'free'
```

### Anti-Patterns to Avoid

- **Using `req.json()` in the webhook handler:** Parsing the body as JSON before calling `constructEvent()` breaks signature verification because the raw bytes change. Always use `req.text()`.
- **Instantiating `new Stripe()` in components or actions:** Creates a new TCP connection on every request. Use the singleton from `src/lib/stripe/server.ts`.
- **Writing to `usage_tracking` from a regular Supabase client:** The table has SELECT-only RLS for authenticated users. All writes (webhook, checkout callback, portal session) must use `createAdminClient()` with the service role key.
- **Using Vercel Cron for the monthly reset:** Vercel Hobby plan allows max 2 cron jobs, each triggered at most once per day. It cannot run a true monthly schedule. Use Supabase pg_cron instead.
- **Checking `stripe_customer_id` after `customer.subscription.created`:** The customer ID on the subscription object is the Stripe customer ID — use `sub.customer as string` to look up the `usage_tracking` row, not `user_id`. You must store the customer→user mapping to resolve events.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Webhook signature verification | Custom HMAC comparison | `stripe.webhooks.constructEvent()` | Stripe's method handles timestamp tolerance (5 min default), encoding edge cases, and key rotation |
| Customer Portal UI | Custom subscription management page | Stripe Customer Portal (hosted) | Handles invoice history, payment method updates, cancellation flows, proration — months of work |
| Checkout payment form | Custom card input with Stripe Elements | Stripe Checkout (hosted) | PCI compliance, 3D Secure, Apple/Google Pay, localization all handled by Stripe |
| Idempotency for webhooks | In-memory tracking | `stripe_webhook_events` Postgres table | Memory is not shared across serverless invocations; the table already exists in the schema |
| Credit reset scheduling | Polling from app | Supabase pg_cron SQL function | pg_cron runs inside Postgres — no network latency, no cold start, guaranteed execution even when app is idle |

**Key insight:** Stripe's hosted surfaces (Checkout, Portal) eliminate the largest compliance and UX risks. The only custom UI needed is: the credit badge in the header, the credit gate in the creator, and the billing page (which is mostly read-only display + two CTA buttons).

---

## Common Pitfalls

### Pitfall 1: Webhook Signature Failure from Parsed Body

**What goes wrong:** The webhook handler returns 400 "No signatures found matching the expected signature" even when the secret is correct.
**Why it happens:** The developer used `await req.json()` or some middleware parsed the body. Stripe signs the exact raw bytes of the request body — any transformation (parsing, re-serialization, whitespace changes) invalidates the signature.
**How to avoid:** Always `const body = await req.text()` as the very first read of the request body in the webhook route.
**Warning signs:** `constructEvent()` throws `Stripe.errors.StripeSignatureVerificationError` in production but not in local testing (where you may not be verifying signatures).

### Pitfall 2: Customer ID Lookup in Webhook

**What goes wrong:** You receive `customer.subscription.created` but cannot find which user to update because you only have the Stripe customer ID, not the Supabase user ID.
**Why it happens:** The subscription object contains `customer` (Stripe ID) and `metadata`, not a Supabase user ID unless you add it.
**How to avoid:** Either (a) look up `usage_tracking` by `stripe_customer_id` column — the schema already has this column — or (b) add `metadata: { userId: user.id }` when creating the Checkout Session. Option (a) is already supported by the existing schema.
**Warning signs:** Webhook handler logs "user not found" or silently fails to update `usage_tracking`.

### Pitfall 3: Vercel Deployment Protection Blocking Webhooks

**What goes wrong:** Stripe webhook deliveries return 401 in production even though the handler code is correct.
**Why it happens:** Vercel Deployment Protection requires authentication on all routes by default, which blocks incoming Stripe POST requests.
**How to avoid:** In Vercel project settings, add the webhook path (`/api/stripe/webhook`) to the "Excluded paths from Protection" list (or disable Deployment Protection for the route).
**Warning signs:** Stripe Dashboard shows 401 responses for all webhook delivery attempts.

### Pitfall 4: Double-Processing Webhooks on Retry

**What goes wrong:** A webhook event is processed twice — user gets upgraded twice, or credits reset twice.
**Why it happens:** Stripe retries events if it doesn't receive a 2xx within a few seconds. If processing is slow (Supabase round trip), Stripe may retry before the first attempt completes.
**How to avoid:** Insert into `stripe_webhook_events` before processing (not after). This way, a concurrent retry finds the record and skips. The table has a UNIQUE constraint on `stripe_event_id`.
**Warning signs:** Users report double credits or multiple upgrade emails.

### Pitfall 5: Stripe Customer Portal Not Configured in Dashboard

**What goes wrong:** `stripe.billingPortal.sessions.create()` throws "No default configuration exists" or the portal shows no subscription management options.
**Why it happens:** The Customer Portal requires an explicit configuration in the Stripe Dashboard (Settings → Billing → Customer Portal) that defines what users can do (cancel, update payment, view invoices).
**How to avoid:** Before testing the portal, configure it in the Stripe Dashboard for both test and live modes.
**Warning signs:** `stripe.billingPortal.sessions.create()` throws a Stripe error, or the portal URL loads but shows nothing useful.

### Pitfall 6: pg_cron Extension Not Enabled

**What goes wrong:** `SELECT cron.schedule(...)` throws "schema 'cron' does not exist".
**Why it happens:** The pg_cron extension must be enabled before using it.
**How to avoid:** Add `CREATE EXTENSION IF NOT EXISTS pg_cron;` at the top of the migration, or enable it via the Supabase Dashboard (Database → Extensions → pg_cron toggle).
**Warning signs:** Migration fails immediately on the `cron.schedule` call.

---

## Code Examples

Verified patterns from official sources:

### Stripe Checkout Session (subscription mode)
```typescript
// Source: https://docs.stripe.com/checkout/quickstart
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  customer: customerId,
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/templates`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
})
redirect(session.url!)
```

### Webhook Raw Body + Signature Verification
```typescript
// Source: https://docs.stripe.com/webhooks + Next.js App Router discussion #48885
const body = await req.text()  // NOT req.json()
const sig = (await headers()).get('stripe-signature')!
const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
```

### Customer Portal Session
```typescript
// Source: https://docs.stripe.com/customer-management/integrate-customer-portal
const portalSession = await stripe.billingPortal.sessions.create({
  customer: stripeCustomerId,
  return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
})
redirect(portalSession.url)
```

### pg_cron Monthly Schedule
```sql
-- Source: https://supabase.com/docs/guides/functions/schedule-functions
-- Cron expression: 0 0 1 * * = midnight UTC on the 1st of every month
SELECT cron.schedule(
  'reset-free-credits-monthly',
  '0 0 1 * *',
  'SELECT public.reset_free_tier_credits()'
);
```

### CreditBadge Component Structure (Header placement)
```typescript
// Slot between BrandSwitcher divider and user avatar
// props: plan: 'free' | 'pro', creditsRemaining: number, creditsLimit: number
function CreditBadge({ plan, creditsRemaining, creditsLimit }) {
  const isZero = creditsRemaining === 0
  const isLow = creditsRemaining === 1

  const badgeClass = plan === 'pro'
    ? 'bg-amber-100 text-amber-700'      // gold for Pro
    : 'bg-gray-100 text-gray-500'        // neutral for Free

  const countClass = isZero
    ? 'text-red-600'
    : isLow
    ? 'text-amber-600'
    : 'text-gray-600'

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${badgeClass}`}>
        {plan === 'pro' ? 'PRO' : 'FREE'}
      </span>
      <span className={`font-medium tabular-nums ${countClass}`}>
        {creditsRemaining} / {creditsLimit}
      </span>
      <span className="text-gray-400 text-xs">credits</span>
      {isZero && plan === 'free' && (
        <a href="/settings/billing" className="text-xs text-amber-600 hover:underline ml-1">
          Upgrade
        </a>
      )}
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router `bodyParser: false` config export | App Router `req.text()` — no config needed | Next.js 13+ App Router | Simpler webhook handler; no config export required |
| API Route for Checkout (pages router) | Server Action with `redirect()` | Next.js 13+ | No fetch(), automatic loading state, cleaner code |
| Manual Stripe customer lookup in webhook | Store `stripe_customer_id` in `usage_tracking` | Current best practice | The existing schema already has this column — look up by `stripe_customer_id` in webhook events |
| Stripe SDK v14 and below | stripe@17+ (current: 20.4.0, API version 2026-02-25) | 2025-2026 | SDK major version bumps; always use latest for TypeScript types and API coverage |

**Deprecated/outdated:**
- `headers().get(...)` (sync): Next.js 15 made `headers()` async — use `await headers()` then `.get(...)`.
- `bodyParser: false` config export: Only valid in Pages Router (`pages/api/*`). App Router Route Handlers (`app/api/*`) never parse body automatically — no config needed.

---

## Open Questions

1. **Stripe Customer creation at signup vs. lazily**
   - What we know: The `handle_new_user` Postgres trigger creates `usage_tracking` but does NOT create a Stripe customer (calling Stripe API from a DB trigger would be fragile and add latency to every signup).
   - What's unclear: Whether to create the customer eagerly on first page load of `/settings/billing` or lazily only when user clicks "Upgrade".
   - Recommendation: Create lazily in the `createCheckoutSession` Server Action — only users who click Upgrade need a Stripe customer. This minimizes Stripe API calls and avoids creating Stripe customers for users who never subscribe.

2. **Stripe Product and Price ID environment variables**
   - What we know: The Checkout Session needs a Price ID (`STRIPE_PRO_PRICE_ID`). This must be created manually in the Stripe Dashboard.
   - What's unclear: The exact price ID is not known until the developer creates the product in Stripe Dashboard.
   - Recommendation: Plan must include a Wave 0 task to create the Stripe Product ("VSS Pro") and Price ($29.99/month recurring) in the Stripe test dashboard, then copy the price ID to `.env.local`.

3. **Supabase pg_cron plan tier**
   - What we know: Multiple sources confirm pg_cron is available on the Supabase free tier (confirmed by GitHub discussion #37405 and April 2025 guide). The `STATE.md` noted this as a blocker to verify.
   - What's unclear: The Supabase free tier resource limits (CPU/memory) may affect cron execution if the DB is under load.
   - Recommendation: Use pg_cron. The monthly reset is a trivially simple UPDATE on a small table — resource concern is negligible.

4. **Vercel Deployment Protection for webhook endpoint**
   - What we know: Vercel's Deployment Protection can block incoming Stripe webhook requests with 401.
   - What's unclear: Whether this project has Deployment Protection enabled in Vercel settings.
   - Recommendation: Add a verification task in the plan to check Vercel project settings and add `/api/stripe/webhook` to bypass list if protection is active.

---

## Sources

### Primary (HIGH confidence)
- [Stripe Checkout Quickstart](https://docs.stripe.com/checkout/quickstart?client=next) — session creation, mode options, redirect pattern
- [Stripe Webhooks](https://docs.stripe.com/webhooks) — signature verification, idempotency, raw body requirement
- [Stripe Customer Portal](https://docs.stripe.com/customer-management/integrate-customer-portal) — portal session creation, required parameters, dashboard configuration
- [Stripe API Reference — Portal Sessions](https://docs.stripe.com/api/customer_portal/sessions/create) — required fields: `customer`, `return_url`
- [Supabase Schedule Functions](https://supabase.com/docs/guides/functions/schedule-functions) — pg_cron setup, `cron.schedule()` syntax
- [Supabase pg_cron Docs](https://supabase.com/docs/guides/database/extensions/pg_cron) — extension setup, SQL syntax

### Secondary (MEDIUM confidence)
- [Pedro Alonso — Stripe + Next.js 15 Complete 2025 Guide](https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/) — Server Action patterns for Checkout and Portal, webhook handler structure, verified against official Stripe docs
- [GitHub Discussion #48885 — Stripe Webhook in Next.js](https://github.com/vercel/next.js/discussions/48885) — confirms `req.text()` approach for App Router webhooks
- [GitHub Discussion #37405 — pg_cron and free tier](https://github.com/orgs/supabase/discussions/37405) — confirms pg_cron available on free tier

### Tertiary (LOW confidence)
- stripe@20.4.0 version from newreleases.io search result — version should be verified with `npm view stripe version` before installing

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Stripe SDK, pg_cron, and all patterns verified via official Stripe docs and Supabase docs
- Architecture: HIGH — Patterns are consistent with existing project conventions (Server Actions, admin client, layout data fetching)
- Pitfalls: HIGH — Webhook raw body issue verified by multiple official sources; other pitfalls are well-documented Stripe gotchas

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (Stripe API evolves; pg_cron is stable; check stripe npm version before installing)
