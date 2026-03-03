---
phase: 01-foundation
plan: 02
subsystem: database
tags: [postgres, supabase, rls, row-level-security, migrations, triggers, multi-tenancy]

# Dependency graph
requires:
  - phase: 01-01
    provides: Next.js scaffold and Supabase client setup (SUPABASE_URL, SUPABASE_ANON_KEY)
provides:
  - "7-table Postgres schema: profiles, brands, templates, image_styles, carousels, usage_tracking, stripe_webhook_events"
  - "RLS enabled and configured on all 7 tables with 8 policies"
  - "handle_new_user trigger auto-provisions profiles + usage_tracking on signup"
  - "Multi-tenancy foundation for all subsequent phases"
affects:
  - 01-03 (auth flows depend on profiles + usage_tracking existing before trigger fires)
  - 02-brand-management (reads/writes brands table)
  - 03-carousel-generation (reads/writes carousels table)
  - 04-n8n-integration (service role writes to carousels + usage_tracking)
  - 05-payments (writes to usage_tracking via service role)
  - 06-realtime (subscribes to carousels table changes)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "(SELECT auth.uid()) RLS pattern: evaluated once per statement, not per row — avoids N re-evaluations"
    - "SECURITY DEFINER SET search_path = '' on trigger functions to prevent privilege escalation"
    - "Service role bypass: usage_tracking and stripe_webhook_events have no user write policies — mutations go through service role (n8n) only"

key-files:
  created:
    - supabase/migrations/20260303000001_schema.sql
  modified: []

key-decisions:
  - "(SELECT auth.uid()) used in all RLS policies instead of auth.uid() — prevents per-row function re-evaluation, consistent with RESEARCH.md Pattern 7"
  - "usage_tracking has SELECT-only RLS policy — no INSERT/UPDATE/DELETE for authenticated role; service role (n8n) bypasses RLS for credit operations"
  - "stripe_webhook_events has zero RLS policies (intentionally) — completely inaccessible to any non-service-role connection"
  - "handle_new_user trigger uses SECURITY DEFINER SET search_path='' — required to insert into public.profiles from auth schema context without privilege escalation"

patterns-established:
  - "Pattern: All user-owned tables use FOR ALL policy with USING + WITH CHECK on user_id = (SELECT auth.uid())"
  - "Pattern: Shared catalog tables (templates) use SELECT-only policy with USING (true)"
  - "Pattern: Mixed-ownership tables (image_styles) use 4 separate policies (SELECT/INSERT/UPDATE/DELETE) with user_id IS NULL guard for built-ins"

requirements-completed: [AUTH-01, AUTH-02]

# Metrics
duration: 2min
completed: 2026-03-03
---

# Phase 01 Plan 02: Database Schema Migration Summary

**Seven-table Postgres schema with RLS policies and handle_new_user auto-provisioning trigger — multi-tenancy foundation for all phases**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-03T16:24:25Z
- **Completed:** 2026-03-03T16:26:00Z
- **Tasks:** 1 of 2 automated tasks complete (Task 2 is human-verify checkpoint)
- **Files modified:** 1

## Accomplishments
- Single migration file with all 7 CREATE TABLE statements using exact column definitions from CONTEXT.md
- RLS enabled on all 7 tables with 8 policies covering all access patterns
- handle_new_user SECURITY DEFINER trigger auto-creates profiles + usage_tracking rows atomically on user signup
- image_styles supports mixed ownership (built-ins with user_id=NULL + user customs) via 4 separate policies

## Task Commits

Each task was committed atomically:

1. **Task 1: Write complete schema migration SQL file** - `c25f7a6` (feat)

**Plan metadata:** (pending — after human verification checkpoint)

## Files Created/Modified
- `supabase/migrations/20260303000001_schema.sql` - Complete DDL: 7 tables, RLS enable, 8 policies, handle_new_user trigger

## Decisions Made
- Used `(SELECT auth.uid())` pattern throughout all RLS policies — evaluated once per statement not per row, following RESEARCH.md Pattern 7 recommendation for performance
- `stripe_webhook_events` has no policies at all — service role only, zero user access surface by design
- `usage_tracking` SELECT-only for authenticated role — credit mutations enforced through service role to prevent client-side manipulation
- `handle_new_user` uses `SECURITY DEFINER SET search_path = ''` — required for cross-schema insert from auth to public without privilege escalation

## Deviations from Plan

None - plan executed exactly as written. All table definitions match CONTEXT.md interfaces block verbatim.

## Issues Encountered
- `grep -c "ENABLE ROW LEVEL SECURITY"` returns 8 (not 7) because the SECTION 2 comment header also contains the phrase. All 7 ALTER TABLE statements are present and correct — the extra count is from the comment-only line at line 101.

## User Setup Required

**Manual verification required.** Apply the migration to your Supabase project:

1. Open Supabase Dashboard > SQL Editor
2. Copy and paste `supabase/migrations/20260303000001_schema.sql`
3. Click Run — verify no errors
4. Run verification queries:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
   -- Expected: 7 rows, all rowsecurity = true

   SELECT trigger_name, event_object_table FROM information_schema.triggers
   WHERE trigger_name = 'on_auth_user_created';
   -- Expected: 1 row

   SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;
   -- Expected: 0 rows
   ```
5. Test trigger: Create a test user in Authentication > Users, then verify:
   ```sql
   SELECT * FROM public.profiles LIMIT 5;
   SELECT * FROM public.usage_tracking LIMIT 5;
   -- Expected: row for test user in both tables, plan='free', credits_remaining=3
   ```
6. Reply "schema applied" to resume plan execution.

## Next Phase Readiness
- Migration file is ready to apply to Supabase
- Auth flows (Plan 03) require profiles + usage_tracking tables to exist — apply migration before running Plan 03
- Once trigger is verified, all subsequent phases can write to these tables

---
*Phase: 01-foundation*
*Completed: 2026-03-03*
