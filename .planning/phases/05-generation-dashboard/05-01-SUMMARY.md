---
phase: 05-generation-dashboard
plan: "01"
subsystem: database
tags: [postgres, supabase, rpc, credits, plpgsql, security-definer]

# Dependency graph
requires:
  - phase: 03-billing-and-credits
    provides: usage_tracking table with credits_remaining column and RLS policy
  - phase: 01-foundation
    provides: Supabase project, schema migrations, admin client setup
provides:
  - consume_credit(UUID) PostgreSQL RPC function with atomic FOR UPDATE row locking
  - Credit deduction returns { success: boolean, remaining: number } JSON
affects:
  - 05-02 (generate API route — calls admin.rpc('consume_credit', { p_user_id }))
  - 05-03 (generation dashboard — reads credit state after deduction)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SECURITY DEFINER SET search_path = '' on all credit-mutation functions (matches billing_cron pattern)"
    - "FOR UPDATE row lock inside BEGIN block for atomic check-then-deduct"
    - "GRANT EXECUTE to both authenticated and service_role for flexibility"

key-files:
  created:
    - supabase/migrations/20260307000010_consume_credit.sql
  modified: []

key-decisions:
  - "consume_credit() deducts credit at job creation time (before n8n fires) — if n8n fails the credit is already spent; credit refund on failure is v2 concern"
  - "FOR UPDATE row lock prevents concurrent double-deduction (race-condition-safe)"
  - "Unknown user_id returns { success: false, remaining: 0 } — no error thrown, matches API route's expected shape"
  - "EXCEPTION handler catches all other errors and returns { success: false } rather than propagating — API route treats any failure as insufficient credits"

patterns-established:
  - "Credit gate pattern: API route calls consume_credit() FIRST, only proceeds with n8n call if success: true"
  - "Atomic RPC pattern: DB function owns check+deduct in one transaction with row lock"

requirements-completed:
  - GEN-03
  - GEN-06
  - GEN-07

# Metrics
duration: 5min
completed: 2026-03-08
---

# Phase 5 Plan 01: consume_credit() RPC Summary

**Atomic PostgreSQL credit-deduction function with FOR UPDATE row lock, SECURITY DEFINER, and { success, remaining } JSON return shape for the Phase 5 generation API.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-08T08:47:15Z
- **Completed:** 2026-03-08T08:52:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- `consume_credit(UUID)` function created in Supabase with SECURITY DEFINER to bypass RLS on usage_tracking (write-protected table)
- FOR UPDATE row lock prevents race-condition double-deductions when concurrent generation requests arrive simultaneously
- Function was created, applied (`npx supabase db push`), and committed in the same session as Phase 04 completion (commit `d8e2ccc`)
- Dry-run verification confirms no migration syntax errors and function is live in Supabase

## Task Commits

Each task was committed atomically:

1. **Task 1: Write consume_credit() migration** - `d8e2ccc` (feat) — committed as part of Phase 04 wrap-up commit that included this migration alongside the n8n workflow v3 and image_styles schema changes

**Plan metadata:** (created in this session)

## Files Created/Modified
- `supabase/migrations/20260307000010_consume_credit.sql` — `consume_credit(UUID)` function: atomic credit check + deduction, SECURITY DEFINER, FOR UPDATE row lock, GRANT to authenticated + service_role

## Decisions Made
- **v1 credit-on-failure behavior:** Credit is deducted at job creation time before n8n fires. If n8n subsequently fails, the credit is already spent. This is the accepted v1 design per research phase resolution — credit refund logic is a v2 concern, not in scope for Phase 5.
- **EXCEPTION handler shape:** Catches all SQLERRM errors and returns `{ success: false, error: string }` rather than propagating. The API route in Plan 02 can treat any failure as insufficient credits and surface a generic error to the user.
- **Dual GRANT:** Both `authenticated` and `service_role` receive EXECUTE grant so the API route can call via either `createClient()` (user context) or `createAdminClient()` (service role bypass).

## Deviations from Plan

None — the migration file was already created and applied in this session prior to formal 05-01 plan execution (created during Phase 04 n8n workflow migration completion). The file matches the plan specification exactly:
- SECURITY DEFINER SET search_path = '' (matches billing_cron pattern)
- FOR UPDATE row lock for concurrent safety
- GRANT EXECUTE to authenticated and service_role
- v1 credit-on-failure behavior documented in migration comment

`npx supabase db push --dry-run` returned no errors, confirming the migration applied cleanly to Supabase.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required beyond what was already applied when the migration was pushed to Supabase.

## Next Phase Readiness
- `consume_credit()` is live in Supabase — Plan 02 can call `admin.rpc('consume_credit', { p_user_id: user.id })` immediately
- Return shape `{ success: boolean, remaining: number }` matches Plan 02's expected error handling interface
- No blockers for Plan 02 (generate API route) or Plan 03 (generation dashboard UI)

---
*Phase: 05-generation-dashboard*
*Completed: 2026-03-08*
