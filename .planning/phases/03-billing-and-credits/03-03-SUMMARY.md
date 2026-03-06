---
phase: 03-billing-and-credits
plan: "03"
subsystem: payments
tags: [stripe, supabase, next.js, server-actions, react]

requires:
  - phase: 03-01
    provides: Stripe SDK singleton (src/lib/stripe/server.ts), usage_tracking table schema
  - phase: 03-02
    provides: Stripe webhook handler (plan, credits_remaining, credits_limit updated via webhook)

provides:
  - CreditBadge component showing plan pill + credit fraction in every protected page header
  - CreditGate component — upgrade prompt for exhausted free users (ready for Phase 5 integration)
  - /settings/billing page with Current Plan, Upgrade, and Manage Billing sections
  - createCheckoutSession Server Action — lazy Stripe customer creation + Checkout Session redirect
  - redirectToCustomerPortal Server Action — Stripe Customer Portal session redirect
  - Avatar dropdown with Billing link in header

affects:
  - phase-05-generation (CreditGate gates the Generate button when credits = 0)

tech-stack:
  added: [shadcn/ui dropdown-menu]
  patterns:
    - Credit data fetched once in protected layout, threaded through AppShell -> Header as creditData prop
    - Server Actions for Stripe integration (lazy customer creation pattern)
    - form action={serverAction} pattern for Stripe Checkout and Portal redirects

key-files:
  created:
    - src/components/billing/credit-badge.tsx
    - src/components/billing/credit-gate.tsx
    - src/app/(protected)/settings/billing/page.tsx
    - src/app/(protected)/settings/billing/actions.ts
    - src/components/ui/dropdown-menu.tsx
  modified:
    - src/app/(protected)/layout.tsx
    - src/components/layout/app-shell.tsx
    - src/components/layout/header.tsx

key-decisions:
  - "creditData fetched in protected layout (server component) and prop-drilled to Header — avoids redundant DB calls per component"
  - "CreditBadge placed between BrandSwitcher divider and avatar group in header — per CONTEXT.md locked decision"
  - "Billing accessible via avatar dropdown only — no sidebar nav entry per CONTEXT.md locked decision"
  - "Lazy Stripe customer creation — only on first Checkout click, not at signup, to avoid orphaned Stripe customers"

patterns-established:
  - "Props pipeline: Server Layout fetches -> AppShell passes -> Header renders"
  - "Lazy Stripe customer creation: check usage_tracking.stripe_customer_id before creating"
  - "Server Action + form action= pattern for Stripe redirects (avoids client-side API calls)"

requirements-completed: [BILL-03, BILL-04, BILL-06, BILL-07]

duration: 2min
completed: 2026-03-06
---

# Phase 3 Plan 03: Credit UI, Billing Page, and Stripe Actions Summary

**CreditBadge in header (amber/gray plan pill, red/amber/gray count), CreditGate upgrade prompt, /settings/billing page, and Stripe Checkout/Portal Server Actions wired end-to-end**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-06T09:55:52Z
- **Completed:** 2026-03-06T09:57:52Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Credit data pipeline from Supabase usage_tracking through protected layout -> AppShell -> Header -> CreditBadge rendering on every protected page
- Avatar circle converted to shadcn DropdownMenu with Billing link; billing accessible via user avatar only (per locked decision)
- CreditGate component built and ready for Phase 5 to gate the Generate button at 0 credits
- /settings/billing page with all three sections: Current Plan, Upgrade to Pro (hidden for Pro users), Manage Billing
- createCheckoutSession and redirectToCustomerPortal Server Actions with lazy Stripe customer creation

## Task Commits

Each task was committed atomically:

1. **Task 1: Credit data flow — layout, AppShell, Header, CreditBadge, avatar dropdown** - `57378bb` (feat)
2. **Task 2: CreditGate component, billing page, billing actions** - `824bf71` (feat)

## Files Created/Modified

- `src/components/billing/credit-badge.tsx` - Plan pill + credit fraction display; red at 0, amber at 1, gray otherwise; inline Upgrade link for free users at 0
- `src/components/billing/credit-gate.tsx` - Lock icon + upgrade message + Stripe Checkout form; gates Generate button in Phase 5
- `src/app/(protected)/settings/billing/page.tsx` - Server component billing page; 3 sections; Upgrade section hidden for Pro
- `src/app/(protected)/settings/billing/actions.ts` - createCheckoutSession and redirectToCustomerPortal Server Actions
- `src/components/ui/dropdown-menu.tsx` - shadcn dropdown-menu component (installed to enable avatar dropdown)
- `src/app/(protected)/layout.tsx` - Added usage_tracking fetch; passes creditData to AppShell
- `src/components/layout/app-shell.tsx` - Added CreditData interface and creditData prop; threads through to Header
- `src/components/layout/header.tsx` - Renders CreditBadge between BrandSwitcher and avatar; avatar replaced with DropdownMenu trigger

## Decisions Made

- creditData fetched in protected server layout once and prop-drilled to Header — avoids redundant DB calls per protected page component
- Billing navigation is via avatar dropdown only — no sidebar entry (per CONTEXT.md locked decision from Phase 3 planning)
- Lazy Stripe customer creation pattern: stripe_customer_id only created on first Checkout click, preventing orphaned Stripe customers for users who never upgrade
- form action={serverAction} pattern used for both Checkout and Portal (not client-side API calls) — keeps Stripe secret key server-only

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing shadcn dropdown-menu component**
- **Found during:** Task 1 (header avatar dropdown)
- **Issue:** src/components/ui/dropdown-menu.tsx did not exist; plan required DropdownMenu for avatar click
- **Fix:** Ran `npx shadcn@latest add dropdown-menu --yes` to install the component
- **Files modified:** src/components/ui/dropdown-menu.tsx
- **Verification:** TypeScript compiled cleanly after install
- **Committed in:** 57378bb (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — missing UI component)
**Impact on plan:** Required for implementation; no scope creep.

## Issues Encountered

None — all tasks completed in a single pass.

## User Setup Required

None - no additional external service configuration required beyond what was set up in Plans 01 and 02 (STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_ID, NEXT_PUBLIC_APP_URL already needed).

## Next Phase Readiness

- Credit badge visible on every protected page — billing UI complete
- /settings/billing accessible via avatar dropdown — upgrade flow wired end-to-end
- CreditGate component ready for Phase 5 to import and render when credits = 0
- Phase 3 (Billing) is now fully complete — all 3 plans done (Stripe SDK, Webhooks, Credit UI)
- Phase 4 (AI generation / n8n) is the next phase

---
*Phase: 03-billing-and-credits*
*Completed: 2026-03-06*
