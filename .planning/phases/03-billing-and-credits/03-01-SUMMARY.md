---
phase: 03-billing-and-credits
plan: 01
subsystem: payments
tags: [stripe, pg_cron, postgres, billing, credits]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Supabase schema with usage_tracking table (plan/credits_remaining/credits_limit/last_reset_at)
provides:
  - Stripe Node.js SDK singleton at src/lib/stripe/server.ts (server-only, secret key guarded)
  - pg_cron migration that resets free-tier credits on the 1st of each month
  - .env.local.example with all four required Stripe environment variables
affects: [03-02-webhooks, 03-03-billing-ui, 05-ai-generation]

# Tech tracking
tech-stack:
  added: [stripe@^20.4.0]
  patterns: [server-only singleton for external SDK, SECURITY DEFINER + empty search_path for pg functions]

key-files:
  created:
    - src/lib/stripe/server.ts
    - supabase/migrations/20260306000008_billing_cron.sql
  modified:
    - .env.local.example

key-decisions:
  - "Stripe singleton uses import 'server-only' guard to prevent secret key from reaching client bundle"
  - "reset_free_tier_credits uses SECURITY DEFINER SET search_path = '' — bypasses RLS on usage_tracking (SELECT-only for users) and prevents search_path injection"
  - "Idempotency via date_trunc('month', last_reset_at) < date_trunc('month', NOW()) — second cron fire in same month is a no-op"
  - "Only plan='free' rows reset by cron; Pro credits reset by invoice.paid webhook in Plan 02"
  - "Migration applied pending manual apply — supabase CLI not linked to remote project"

patterns-established:
  - "Server-only singletons: import 'server-only' + throw if env var missing + export const"
  - "pg functions touching usage_tracking: SECURITY DEFINER SET search_path = '' pattern required"

requirements-completed: [BILL-01, BILL-02, BILL-05]

# Metrics
duration: 5min
completed: 2026-03-06
---

# Phase 3 Plan 01: Billing Infrastructure Summary

**Stripe SDK singleton (server-only, import-guarded) + pg_cron monthly free-tier credit reset with SECURITY DEFINER idempotency**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-06T09:51:36Z
- **Completed:** 2026-03-06T09:56:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Installed stripe@^20.4.0 and created src/lib/stripe/server.ts as the single instantiation point — import 'server-only' prevents accidental client exposure
- Created pg_cron migration with SECURITY DEFINER + empty search_path + date_trunc idempotency guard for free-tier monthly credit reset
- Documented all four required Stripe env vars in .env.local.example

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Stripe SDK and create server-only singleton** - `ac05dd8` (feat)
2. **Task 2: Create pg_cron migration for monthly free-tier credit reset** - `27b3407` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/lib/stripe/server.ts` - Server-only Stripe client singleton; imports 'server-only', throws if STRIPE_SECRET_KEY missing, exports `stripe` const
- `supabase/migrations/20260306000008_billing_cron.sql` - pg_cron migration: enables extension, defines reset_free_tier_credits() with SECURITY DEFINER, schedules at 0 0 1 * *
- `.env.local.example` - Added STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRO_PRICE_ID, NEXT_PUBLIC_APP_URL
- `package.json` / `package-lock.json` - stripe@^20.4.0 added

## Decisions Made
- `import 'server-only'` guard on stripe singleton ensures Next.js build fails if client component tries to import it — no runtime secret exposure possible
- `SECURITY DEFINER SET search_path = ''` on `reset_free_tier_credits()` — the usage_tracking table has SELECT-only RLS for authenticated users, so function needs definer privileges to UPDATE; empty search_path prevents injection
- `date_trunc('month', last_reset_at) < date_trunc('month', NOW())` — the idempotency guard makes cron retries safe; last_reset_at is set at signup (always a prior month on first cron run)
- Only `plan = 'free'` rows are touched by cron; Pro plan reset is handled by `invoice.paid` webhook in Plan 02

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

`supabase db push` failed with "Access token not provided" — CLI not linked to remote Supabase project. Migration file is on disk and ready to apply via `supabase db push` after running `supabase login`, or by pasting into Supabase Dashboard SQL Editor. Noted in SUMMARY as planned fallback (plan specified this scenario).

## User Setup Required

Before Plans 02/03 can be tested, you need to configure Stripe and apply the migration:

**1. Apply the pg_cron migration:**
```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```
Or paste `supabase/migrations/20260306000008_billing_cron.sql` into Supabase Dashboard → SQL Editor.

**Note:** pg_cron must be enabled on your Supabase plan. If not available, the monthly reset will require a Vercel Cron Job fallback (see STATE.md blocker).

**2. Add environment variables to .env.local:**
- `STRIPE_SECRET_KEY` — Stripe Dashboard → Developers → API keys → Secret key (use sk_test_ for dev)
- `STRIPE_WEBHOOK_SECRET` — Stripe Dashboard → Developers → Webhooks → Add endpoint → Signing secret
- `STRIPE_PRO_PRICE_ID` — Stripe Dashboard → Products → Create "VSS Pro" $29.99/month recurring → copy Price ID
- `NEXT_PUBLIC_APP_URL` — http://localhost:3000 for dev

**3. Dashboard configuration:**
- Create Stripe Product "VSS Pro" with $29.99/month recurring price (test mode)
- Configure Customer Portal: Stripe Dashboard → Settings → Billing → Customer Portal → Save settings
- Create webhook endpoint pointing to `/api/stripe/webhook`, subscribe to: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`

## Next Phase Readiness
- `src/lib/stripe/server.ts` is ready to import in Plans 02 (webhooks) and 03 (billing UI)
- Migration on disk — needs to be applied to Supabase before webhook Plan 02 functions can update usage_tracking
- All four Stripe env vars documented for user to provision

---
*Phase: 03-billing-and-credits*
*Completed: 2026-03-06*
