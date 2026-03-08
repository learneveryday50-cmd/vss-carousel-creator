---
phase: 05-generation-dashboard
plan: "02"
subsystem: api
tags: [next-js, api-routes, supabase, n8n, credits, auth]

# Dependency graph
requires:
  - phase: 05-generation-dashboard
    plan: "01"
    provides: consume_credit() RPC function live in Supabase
  - phase: 01-foundation
    provides: Supabase admin client, server client, middleware auth
provides:
  - POST /api/generate — auth guard, credit deduction, carousel insert, n8n fire-and-forget
  - GET /api/generate/status — poll carousel status scoped to authenticated user
affects:
  - 05-03 (generation dashboard UI — polls GET /api/generate/status, calls POST /api/generate)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fire-and-forget fetch() without await for n8n webhook (Vercel 10s timeout constraint)"
    - "admin.rpc() for consume_credit() — service role bypasses RLS for credit mutation"
    - "Belt-and-suspenders ownership: .eq('user_id', user.id) in status route alongside RLS"
    - "401 (not 404) on unauthenticated status poll — client distinguishes auth failure from not-found"

key-files:
  created:
    - src/app/api/generate/route.ts
    - src/app/api/generate/status/route.ts
  modified: []

key-decisions:
  - "n8n fetch is fire-and-forget (no await) — Vercel Hobby timeout is 10s; generation takes 30-90s"
  - "consume_credit() called once per POST, before carousel insert — no retry logic in this route"
  - "All DB mutations use createAdminClient() (service role) — user client used only for auth.getUser()"
  - "Status route uses user's supabase client (not admin) — RLS on carousels table enforces ownership"
  - "N8N_WEBHOOK_SECRET sent as X-Webhook-Secret header (satisfies N8N-04 outbound auth requirement)"
  - "503 returned when env vars missing — distinguishes config error from runtime errors"

# Metrics
duration: 1min
completed: 2026-03-08
---

# Phase 5 Plan 02: Generate API Routes Summary

**Two Next.js App Router route handlers wiring credit deduction, Supabase carousel creation, and fire-and-forget n8n webhook dispatch into a single atomic POST with a polling GET for status.**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-08T08:50:27Z
- **Completed:** 2026-03-08T08:51:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `POST /api/generate` created with full guard chain: env vars → auth → body validation → credit deduction → data fetch → carousel insert → n8n fire-and-forget → 201 response
- `GET /api/generate/status` created with auth, id validation, and ownership-scoped carousel query
- TypeScript compiles clean with zero errors across both routes
- n8n payload includes full brand, template, and image_style objects (not just IDs) satisfying N8N-02
- X-Webhook-Secret header sent on every n8n call satisfying N8N-04
- consume_credit() called exactly once per POST (no retry/duplicate risk)

## Task Commits

Each task was committed atomically:

1. **Task 1: POST /api/generate** — `6210759` (feat) — auth guard, credit gate via consume_credit(), parallel data fetch, carousel insert, fire-and-forget n8n with full payload
2. **Task 2: GET /api/generate/status** — `a63bc50` (feat) — auth check, id param validation, user-scoped carousel query, { id, status, slide_urls, post_body } response

## Files Created/Modified

- `src/app/api/generate/route.ts` — POST handler: env validation (503), auth (401), body validation (400), consume_credit (402), parallel brand/template/image_style fetch, carousel insert, fire-and-forget n8n with X-Webhook-Secret, returns 201 { carousel_id }
- `src/app/api/generate/status/route.ts` — GET handler: auth (401), id param (400), user-scoped carousel query, returns 200 { id, status, slide_urls, post_body } or 404

## Decisions Made

- **Fire-and-forget n8n pattern:** `fetch(...).catch(...)` without `await` — Vercel Hobby plan has a 10-second serverless timeout; n8n generation pipeline runs 30-90s. Awaiting would cause the POST to timeout and fail before n8n even starts.
- **Admin client for mutations, user client for auth only:** `createAdminClient()` used for all DB reads/writes (bypasses RLS reliably). `createClient()` used only for `auth.getUser()` to verify the session cookie.
- **consume_credit() called once, no retry:** The POST route has no retry logic. If n8n fails after credit deduction, the credit is spent — this is the accepted v1 design from Plan 01 (credit refund is v2).
- **Status route uses user-scoped supabase client:** RLS on carousels table handles primary ownership enforcement; the additional `.eq('user_id', user.id)` is belt-and-suspenders for defense-in-depth.

## Deviations from Plan

None — both routes implemented exactly as specified. All guard conditions, response codes, payload shapes, and anti-patterns match the plan.

## Issues Encountered

None.

## User Setup Required

Before the generate route will function, two environment variables must be set in `.env.local` (and in Vercel dashboard for production):

```
N8N_WEBHOOK_URL=https://ovobvc.ezn8n.com/webhook/create-carousel
N8N_WEBHOOK_SECRET=<random secret matching n8n Header Auth credential>
```

Without these, `POST /api/generate` returns 503. The n8n workflow's Webhook node must have a Header Auth credential configured with header name `X-Webhook-Secret` and the same secret value.

## Next Phase Readiness

- Plan 03 (generation dashboard UI) has a clear contract:
  - `POST /api/generate` → `{ carousel_id: string }` (201)
  - `GET /api/generate/status?id=<carousel_id>` → `{ id, status, slide_urls, post_body }`
- Both routes are type-safe and will compile without modification when Plan 03 adds the UI layer
- No blockers for Plan 03

---
*Phase: 05-generation-dashboard*
*Completed: 2026-03-08*
