---
phase: 03-billing-and-credits
verified: 2026-03-06T12:00:00Z
status: human_needed
score: 14/14 automated must-haves verified
human_verification:
  - test: "Subscribe to Pro via Upgrade button on /settings/billing"
    expected: "Stripe-hosted Checkout page opens with VSS Pro $29.99/month; after payment, user is redirected to /templates and credit badge shows PRO 10/10"
    why_human: "Requires live/test Stripe credentials and a running server to trigger the Server Action and follow the redirect"
  - test: "Open Manage Billing via avatar dropdown > Billing page > Manage Billing button"
    expected: "Stripe Customer Portal opens; after returning, billing page reflects any changes"
    why_human: "Requires a stripe_customer_id already set on usage_tracking (only populated after first Checkout) and live Stripe credentials"
  - test: "Simulate invoice.paid webhook event via Stripe CLI (stripe trigger invoice.paid)"
    expected: "Pro user credits_remaining resets to 10 in usage_tracking; credit badge updates on next page load"
    why_human: "Requires Stripe CLI and a linked webhook endpoint; cannot verify DB write without live test environment"
  - test: "Free user at 0 credits sees Upgrade link in header and CreditGate renders correctly"
    expected: "CreditBadge shows red '0 / 3 credits' with inline 'Upgrade' link; CreditGate shows lock icon, upgrade message, and working form button"
    why_human: "Requires seeding usage_tracking with credits_remaining=0 and plan=free in a running app; visual verification needed"
---

# Phase 03: Billing and Credits — Verification Report

**Phase Goal:** Implement Stripe billing integration with credit system — Stripe server client, webhook handler for subscription lifecycle events, credit badge/gate UI components, and /settings/billing page with Checkout and Portal actions.
**Verified:** 2026-03-06T12:00:00Z
**Status:** human_needed — all automated checks pass; 4 items require live environment or running app
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Stripe SDK importable from a single server-only singleton; never reaches client bundle | VERIFIED | `src/lib/stripe/server.ts` — `import 'server-only'` on line 1, `export const stripe = new Stripe(...)` on line 8; env guard throws if `STRIPE_SECRET_KEY` is missing |
| 2  | Free-tier credits reset on the 1st of each month via pg_cron (idempotent) | VERIFIED | `supabase/migrations/20260306000008_billing_cron.sql` — `reset_free_tier_credits()` function with `date_trunc` idempotency guard; `cron.schedule('reset-free-credits-monthly', '0 0 1 * *', ...)` |
| 3  | All required environment variables documented in .env.local.example | VERIFIED | `.env.local.example` lines 11-15: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `NEXT_PUBLIC_APP_URL` all present |
| 4  | POST /api/stripe/webhook verifies Stripe signature and returns 400 on bad signature | VERIFIED | `route.ts` line 21: `stripe.webhooks.constructEvent(body, sig, webhookSecret)` in try/catch; catch block returns `NextResponse.json({...}, { status: 400 })` |
| 5  | Duplicate webhook events silently skipped (idempotency) | VERIFIED | `route.ts` lines 30-38: SELECT from `stripe_webhook_events` before processing; INSERT with UNIQUE constraint catch also returns skipped |
| 6  | Subscription lifecycle events update usage_tracking via admin client | VERIFIED | `route.ts` lines 52-101: switch on event.type handles `customer.subscription.created/updated` (pro upgrade), `customer.subscription.deleted` (free downgrade), `invoice.paid` (credit reset); all via `createAdminClient()` |
| 7  | Credit balance visible in header on every protected page | VERIFIED | `layout.tsx` fetches `usage_tracking`, passes `creditData` to `AppShell`; `app-shell.tsx` threads it to `Header`; `header.tsx` renders `<CreditBadge>` between BrandSwitcher and avatar |
| 8  | Badge color: amber for PRO, gray for FREE; count: red at 0, amber at 1, gray otherwise | VERIFIED | `credit-badge.tsx` lines 13-16: `badgeClass` toggles amber-100/amber-700 vs gray-100/gray-500; `countClass` toggles red-600 / amber-600 / gray-600 |
| 9  | Zero-credit free-tier user sees inline Upgrade link in header | VERIFIED | `credit-badge.tsx` lines 29-33: `{isZero && plan === 'free' && <Link href="/settings/billing">Upgrade</Link>}` |
| 10 | CreditGate renders upgrade prompt (lock icon + message + button) for exhausted free users | VERIFIED | `credit-gate.tsx` — Lock icon, upgrade message, `<form action={createCheckoutSession}>` button; `'use client'` directive present |
| 11 | User can navigate to /settings/billing via avatar dropdown | VERIFIED | `header.tsx` lines 64-87: `DropdownMenu` with `DropdownMenuItem asChild` wrapping `<Link href="/settings/billing">` with CreditCard icon |
| 12 | Billing page shows current plan, credits remaining/limit, Upgrade (hidden for Pro), Manage Billing | VERIFIED | `billing/page.tsx` — 3 Card sections; Upgrade section inside `{!isPro && (...)}` guard |
| 13 | Upgrade button triggers Stripe Checkout Session | VERIFIED | `billing/actions.ts` lines 8-42: `createCheckoutSession` — lazy customer creation, `stripe.checkout.sessions.create(...)`, `redirect(session.url!)` |
| 14 | Manage Billing button opens Stripe Customer Portal | VERIFIED | `billing/actions.ts` lines 44-68: `redirectToCustomerPortal` — `stripe.billingPortal.sessions.create(...)`, `redirect(portalSession.url)` |

**Score: 14/14 automated truths verified**

---

### Required Artifacts

| Artifact | Provides | Exists | Substantive | Wired | Status |
|----------|----------|--------|-------------|-------|--------|
| `src/lib/stripe/server.ts` | Stripe client singleton (server-only) | Yes | Yes — 11 lines, `import 'server-only'`, env guard, `export const stripe` | Yes — imported by `webhook/route.ts` and `billing/actions.ts` | VERIFIED |
| `supabase/migrations/20260306000008_billing_cron.sql` | pg_cron monthly reset for free-tier credits | Yes | Yes — 31 lines, `reset_free_tier_credits()` function + `cron.schedule` call | Yes — standalone migration, applied to DB on push | VERIFIED |
| `.env.local.example` | Stripe env var documentation | Yes | Yes — all 4 Stripe vars present | Yes — referenced in Plan 01 tasks | VERIFIED |
| `src/app/api/stripe/webhook/route.ts` | Stripe webhook Route Handler | Yes | Yes — 107 lines, POST export, 4 event types, idempotency | Yes — standalone API route at `/api/stripe/webhook` | VERIFIED |
| `src/components/billing/credit-badge.tsx` | CreditBadge — plan pill + credit fraction | Yes | Yes — 37 lines, full conditional rendering, exports `CreditBadge` | Yes — imported and rendered in `header.tsx` | VERIFIED |
| `src/components/billing/credit-gate.tsx` | CreditGate — upgrade prompt for exhausted users | Yes | Yes — 27 lines, Lock icon, message, form action, exports `CreditGate` | Yes — exported and ready for Phase 5; imports `createCheckoutSession` | VERIFIED |
| `src/app/(protected)/settings/billing/page.tsx` | Billing settings page (server component) | Yes | Yes — 99 lines, 3 Card sections, Pro-gated Upgrade | Yes — reachable at `/settings/billing` via layout route group | VERIFIED |
| `src/app/(protected)/settings/billing/actions.ts` | createCheckoutSession, redirectToCustomerPortal | Yes | Yes — 69 lines, both Server Actions, lazy customer creation, Stripe API calls | Yes — imported by billing page and credit-gate | VERIFIED |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/stripe/server.ts` | `process.env.STRIPE_SECRET_KEY` | `new Stripe()` constructor | WIRED | Line 8: `new Stripe(process.env.STRIPE_SECRET_KEY, ...)` |
| `supabase/migrations/20260306000008_billing_cron.sql` | `public.usage_tracking` | `UPDATE WHERE plan = 'free'` | WIRED | Lines 13-20: `UPDATE public.usage_tracking ... WHERE plan = 'free' AND date_trunc(...)` |
| `src/app/api/stripe/webhook/route.ts` | `src/lib/stripe/server.ts` | `import { stripe }` | WIRED | Line 4: `import { stripe } from '@/lib/stripe/server'`; line 21: `stripe.webhooks.constructEvent(...)` |
| `src/app/api/stripe/webhook/route.ts` | `stripe_webhook_events` table | `admin.from('stripe_webhook_events').insert()` | WIRED | Lines 30-34 (SELECT check) and lines 43-46 (INSERT before processing) |
| `src/app/api/stripe/webhook/route.ts` | `usage_tracking` table | `admin.from('usage_tracking').update().eq('stripe_customer_id', ...)` | WIRED | Lines 57-66 (subscription events), lines 93-99 (invoice.paid) |
| `src/app/(protected)/layout.tsx` | `usage_tracking` table | `supabase.from('usage_tracking').select('plan, credits_remaining, credits_limit')` | WIRED | Lines 30-34: select with `.eq('user_id', user.id).single()` |
| `src/components/layout/app-shell.tsx` | `src/components/layout/header.tsx` | `creditData` props passed through | WIRED | `app-shell.tsx` line 33: `creditData={creditData}` on Header |
| `src/app/(protected)/settings/billing/actions.ts` | `src/lib/stripe/server.ts` | `import { stripe }` — `stripe.checkout.sessions.create` | WIRED | Line 6: `import { stripe } from '@/lib/stripe/server'`; line 33: `stripe.checkout.sessions.create(...)` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| BILL-01 | 03-01 | Free tier: 3 generations/month, resets on the 1st | SATISFIED | pg_cron migration resets `credits_remaining = credits_limit` for `plan = 'free'` rows; `credits_limit` default is 3 |
| BILL-02 | 03-01 | Pro tier: $29.99/month, 10 generations/month, resets monthly | SATISFIED | `invoice.paid` webhook handler resets `credits_remaining = 10` for Pro users; `createCheckoutSession` uses `STRIPE_PRO_PRICE_ID`; `credits_limit` set to 10 on subscription created |
| BILL-03 | 03-03 | User can subscribe to Pro via Stripe Checkout | SATISFIED (human verify) | `createCheckoutSession` Server Action creates Stripe Checkout Session and redirects; wired in billing page and CreditGate forms |
| BILL-04 | 03-03 | User can manage/cancel via Stripe Customer Portal | SATISFIED (human verify) | `redirectToCustomerPortal` Server Action creates Portal session and redirects; wired in billing page Manage Billing form |
| BILL-05 | 03-02 | Webhooks update plan and credits on subscription events | SATISFIED | Webhook route handles 4 events: subscription.created/updated (pro upgrade), subscription.deleted (free downgrade), invoice.paid (credit reset) |
| BILL-06 | 03-03 | Credit balance visible at all times | SATISFIED | `creditData` fetched in protected layout and threaded to CreditBadge in header on every protected page |
| BILL-07 | 03-03 | Free tier users who exhaust credits see upgrade prompt | SATISFIED | CreditBadge shows inline Upgrade link at 0 credits for free users; CreditGate component ready to gate Generate button in Phase 5 |

All 7 requirement IDs (BILL-01 through BILL-07) are accounted for. No orphaned requirements found.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

No TODO/FIXME/placeholder comments, empty return stubs, or console.log-only handlers found in any phase 03 files.

---

### Notable Implementation Deviations (Auto-fixed)

**Stripe SDK v20+ compatibility fix (Plan 02):**
The plan specified `invoice.subscription` to detect subscription invoices, but Stripe SDK v20+ removed this field. The executor correctly used `invoice.parent?.type !== 'subscription_details'` instead. This is verified in `route.ts` line 89. The behavior is semantically equivalent and TypeScript-correct.

---

### Human Verification Required

#### 1. Stripe Checkout flow end-to-end

**Test:** On a running dev server with valid `STRIPE_SECRET_KEY` and `STRIPE_PRO_PRICE_ID` set, log in, navigate to `/settings/billing`, and click "Upgrade to Pro"
**Expected:** Browser redirects to Stripe-hosted Checkout page with VSS Pro $29.99/month; completing payment redirects to `/templates`; credit badge updates to `PRO 10/10` after webhook fires
**Why human:** Requires live Stripe test credentials, a running Next.js server, and a registered webhook endpoint — cannot simulate redirect chain programmatically

#### 2. Customer Portal flow end-to-end

**Test:** As a Pro subscriber (with `stripe_customer_id` set), click "Manage Billing" on `/settings/billing`
**Expected:** Stripe Customer Portal opens showing subscription details; returning redirects back to `/settings/billing`
**Why human:** Requires an existing Stripe customer record and live credentials; portal session URL is ephemeral

#### 3. invoice.paid webhook credit reset

**Test:** Run `stripe trigger invoice.paid` via Stripe CLI (with `stripe listen --forward-to localhost:3000/api/stripe/webhook` active), with a Pro user's `stripe_customer_id` in `usage_tracking`
**Expected:** `credits_remaining` resets to 10 in `usage_tracking`; `last_reset_at` updates; credit badge reflects new count on next page load
**Why human:** Requires Stripe CLI, linked webhook secret, and seeded DB — cannot verify DB write without test environment

#### 4. Zero-credit free-user visual state

**Test:** Set a test user's `credits_remaining = 0` and `plan = 'free'` in Supabase, then load any protected page
**Expected:** Credit badge shows red `0 / 3 credits` with inline amber "Upgrade" link; navigating to the creator's Generate area should show CreditGate's lock icon, upgrade message, and button
**Why human:** CreditGate is not yet wired into the Generate button (that is Phase 5 scope) — confirm badge behavior requires running app with seeded data; CreditGate integration into generator is a future step

---

### Gaps Summary

No blocking gaps found. All 14 automated must-haves pass: all artifacts exist, are substantive (non-stub implementations), and are wired. All 7 requirement IDs are satisfied by real code. The 4 human verification items are standard integration tests requiring a live environment and do not indicate code defects.

**One forward dependency to note:** CreditGate is built and exported but not yet integrated into the creator workflow's Generate button — this is intentional (Phase 5 scope) and not a gap for Phase 3.

---

_Verified: 2026-03-06T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
