# Phase 3: Billing and Credits - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Stripe Checkout, webhooks, Customer Portal, and credit system. Users are on a plan, credits are tracked and visible in the header at all times, Stripe events reliably update plan state via webhooks, and the generation endpoint will have a working credit gate to enforce. Covers BILL-01 through BILL-07. Does not include generation UI or credit deduction on generation (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Credit display in header
- Format: `FREE  2 / 3 credits` — plan badge + fraction (remaining / limit)
- Plan badge: "FREE" for free tier, "PRO" for pro tier
- Pro badge uses amber/gold color to signal premium status; FREE badge uses gray/neutral
- Color changes with urgency: amber at 1 credit remaining, red at 0 credits
- Zero state (0 credits, free tier): shows `FREE  0 / 3 credits` (in red) + an inline "Upgrade" link next to the count
- Pro users: same layout — `PRO  5 / 10 credits` — no special treatment beyond the badge color
- Placement: between BrandSwitcher and user avatar in the existing header, separated by the existing divider pattern

### Upgrade prompt (exhausted free-tier users)
- Location: inline gate in the creator workflow — replaces the Generate button when credits = 0
- Content: lock icon + "You've used all 3 free credits. Upgrade to Pro for $29.99/month and get 10 credits." + `[Upgrade to Pro →]` button
- Note: the Generate button itself is a Phase 5 concern — this phase builds the prompt component so Phase 5 can use it
- Post-checkout redirect: back to `/templates` (the creator page, not billing or dashboard)

### Credit reset mechanism
- Supabase scheduled Edge Function (cron job)
- Runs on the 1st of every month
- Resets `credits_remaining` to the plan limit (`credits_limit`) and updates `last_reset_at`
- Only processes free plan users (Pro credits are reset by Stripe webhook on renewal)
- Must be idempotent — running multiple times in a month must not reset credits more than once (guard: check `last_reset_at` is not already in the current month)

### Billing page (/settings/billing)
- Dedicated page at `/settings/billing`
- Section 1 — Current Plan: plan name, credits remaining, monthly limit
- Section 2 — Upgrade Plan: "Upgrade to Pro" button that triggers Stripe Checkout Session creation
- Section 3 — Manage Billing: "Manage Billing" button that opens Stripe Customer Portal
- Pro users: Section 2 is hidden (already on Pro); Section 3 remains for cancellation/management

### Navigation — billing entry point
- User avatar dropdown menu: Settings → Billing → navigates to `/settings/billing`
- No top-level nav item for billing — accessed via user menu only

### Stripe Checkout flow
- Server Action or API route creates a Stripe Checkout Session and redirects user
- success_url: `/templates` (back to creator)
- cancel_url: `/settings/billing`
- Stripe Customer is created at signup via the `handle_new_user` trigger flow (or lazily on first Checkout if not yet created)

### Webhook handler
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

</decisions>

<specifics>
## Specific Ideas

- The upgrade prompt replaces the Generate button inline — user fills in all their inputs and only hits the wall at the final step, which maximizes intent before the upsell
- Header layout stays consistent between Free and Pro — only the badge label and color change, not the structure

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/layout/header.tsx`: accepts server-fetched props (brands, selectedBrandId, userEmail) — credit data follows the same pattern, fetched in `src/app/(protected)/layout.tsx` and passed down
- `src/components/ui/button.tsx`: existing Button component for Upgrade CTA
- `src/components/ui/card.tsx`: existing Card component for billing page sections
- `src/lib/supabase/admin.ts`: service role client already exists — needed for webhook handler writes to `usage_tracking` and `stripe_webhook_events`
- `src/lib/supabase/server.ts`: server client pattern used throughout — same pattern for reading usage_tracking in layout

### Established Patterns
- Server Actions in `src/app/(protected)/*/actions.ts` — Checkout Session creation follows this pattern
- Layout data fetching: `src/app/(protected)/layout.tsx` fetches brands server-side and passes to AppShell — credit data adds to this same fetch
- Route groups: `(protected)` for authenticated pages — `/settings/billing` goes here

### Integration Points
- `usage_tracking` table: already exists with `plan`, `credits_remaining`, `credits_limit`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status`, `last_reset_at`
- `stripe_webhook_events` table: already exists for idempotency — no schema changes needed
- `handle_new_user` trigger: already creates `usage_tracking` row on signup with `plan=free, credits=3, limit=3` — Stripe Customer ID gets written back after Checkout
- Header component: credit badge slots in between BrandSwitcher divider and user avatar

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-billing-and-credits*
*Context gathered: 2026-03-06*
