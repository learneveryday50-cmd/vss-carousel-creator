---
phase: 05-generation-dashboard
verified: 2026-03-17T05:53:08Z
status: gaps_found
score: 4/5 success criteria verified
re_verification: false
gaps:
  - truth: "When generation fails or errors, no credit is deducted and the user sees a failure state"
    status: failed
    reason: "Credit is consumed by consume_credit() before Airtable createRecord is attempted. If createRecord throws (lines 65-70 of route.ts), the route returns 500 and the UI shows the failure state, but the credit has already been deducted. The migration comment explicitly labels this a v1 accepted design tradeoff, but it directly contradicts SC-5 as written."
    artifacts:
      - path: "src/app/api/generate/route.ts"
        issue: "consume_credit() called at line 44 before createRecord() at line 66. No credit rollback on Airtable error path (lines 67-70)."
    missing:
      - "Either: (a) refund logic after Airtable createRecord failure (call an increment_credit RPC or inline UPDATE), or (b) reorder to create the Airtable record first, then deduct the credit only on successful record creation."
  - truth: "GET /api/generate/status enforces user ownership — another user cannot poll another user's carousel"
    status: failed
    reason: "The status route uses the admin client (bypasses RLS) and queries only by airtable_record_id with no user_id filter. Any authenticated user who knows another user's Airtable record ID can poll it. Plan 02 must_have #5 explicitly requires 404 for another user's carousel."
    artifacts:
      - path: "src/app/api/generate/status/route.ts"
        issue: "Supabase query at line 24 filters only on airtable_record_id — no .eq('user_id', user.id) guard. Admin client is used, so RLS does not apply."
    missing:
      - "Add .eq('user_id', user.id) to the Supabase query at line 24, OR switch to the user (non-admin) client so RLS enforcement applies automatically."
human_verification:
  - test: "Trigger generation, watch polling steps"
    expected: "PreviewPanel displays 'Writing your content' (step 1), then 'Building your slides' (step 2), then 'Rendering your images' (step 3) as the Airtable System Message advances"
    why_human: "Requires live n8n workflow run; cannot verify Airtable System Message field progression programmatically"
  - test: "Successful generation end-to-end"
    expected: "Slide images appear in PreviewPanel carousel, post body caption is displayed with Copy Caption button, header CreditBadge shows N-1 credits after router.refresh()"
    why_human: "Requires live n8n workflow, live Airtable, and visual inspection of rendered output"
  - test: "Retry button behavior after failure"
    expected: "Clicking Retry re-submits the form without clearing topic/brand/template/design-style selections"
    why_human: "Requires manual interaction; handleRetry calls submitGeneration() without resetting form state, which looks correct in code but should be confirmed in browser"
---

# Phase 5: Generation Dashboard Verification Report

**Phase Goal:** Users can generate a branded carousel from a text idea, see live status updates, view the result as a preview, and have exactly one credit deducted only on success.
**Verified:** 2026-03-17T05:53:08Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can enter an idea, select a brand, template, and design style, then click Generate | VERIFIED | `canGenerate` in creator-workflow.tsx line 67 gates on all 4 fields; form inputs render all 4 selectors |
| 2 | User with 0 credits cannot trigger generation — endpoint rejects, no n8n call made | VERIFIED | UI: `CreditGate` replaces button when `creditsRemaining === 0` (lines 354-368). Server: `consume_credit` returns `{success:false}` → route returns 402 before any Airtable or n8n call |
| 3 | After clicking Generate, user sees a "Generating" status indicator without blocking | VERIFIED | `handleGenerate` → `submitGeneration` fires `fetch` async; `setGenerationState('loading')` immediately; modal overlay with `PreviewPanel mode="processing"` renders without blocking navigation |
| 4 | When generation completes, carousel preview is displayed and 1 credit is deducted | VERIFIED* | Polling loop detects `status=completed` → sets `slideUrls`/`postBody` → `previewMode='completed'` → PreviewPanel shows slide carousel + caption. Credit deducted at job-start (v1 design, not at success). *See note below. |
| 5 | When generation fails or errors, no credit is deducted and the user sees a failure state | FAILED | Credit IS deducted before Airtable createRecord. If createRecord fails, 500 is returned, UI shows `PreviewPanel mode="failed"` with Retry — but credit is gone. |

**Score:** 4/5 success criteria verified (SC-5 fails; SC-4 is partially hedged — credit deducts at job start, not on success)

**Note on SC-4:** The migration comment in `20260307000010_consume_credit.sql` line 7-9 explicitly states: "v1 behavior: credit is deducted at job creation time before n8n fires. If n8n subsequently fails, the credit is already spent. This is the accepted v1 design." This is a known product decision, not a code bug. However it means the phase goal's phrase "exactly one credit deducted only on success" is not fully met — n8n failure consumes a credit. This was accepted in Phase 4/5 planning but is worth flagging for product awareness.

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260307000010_consume_credit.sql` | consume_credit() RPC with FOR UPDATE | VERIFIED | 47 lines; SECURITY DEFINER; SELECT … FOR UPDATE; GRANT to authenticated + service_role |
| `supabase/migrations/20260314000021_carousels_airtable_id.sql` | airtable_record_id column + index | VERIFIED | ADD COLUMN IF NOT EXISTS airtable_record_id TEXT UNIQUE; index created |
| `src/app/api/generate/route.ts` | POST handler: auth → consume_credit → Airtable → n8n | VERIFIED | 104 lines; all 6 steps present and substantive; no stubs |
| `src/app/api/generate/status/route.ts` | GET handler: poll carousel status | VERIFIED (with gap) | 89 lines; Supabase cache check + Airtable fallback; missing user_id ownership filter |
| `src/components/creator/creator-workflow.tsx` | State machine + polling loop + 4-mode UI | VERIFIED | 556 lines; GenerationState type; useEffect polling; all 4 states handled |
| `src/components/creator/preview-panel.tsx` | 4-mode panel: config/processing/completed/failed | VERIFIED | 505 lines; AnimatePresence with all 4 modes; slide nav; copy/download; retry button |
| `src/components/billing/credit-gate.tsx` | 0-credit gate component | VERIFIED | 26 lines; shows upgrade CTA; wired into creator-workflow at line 354 |
| `src/app/(protected)/history/page.tsx` | History page with carousels list | VERIFIED | 29 lines; server component; queries carousels; passes to CarouselHistory |
| `src/components/history/carousel-history.tsx` | CarouselHistory client component | VERIFIED | 193 lines; grid layout; status badges; expand/collapse; slide nav; copy/download |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `creator-workflow.tsx` | `POST /api/generate` | `fetch('/api/generate', { method: 'POST' })` | WIRED | Line 82; response `record_id` stored in state at line 98-99 |
| `creator-workflow.tsx` | `GET /api/generate/status` | `fetch('/api/generate/status?id=${carouselId}')` | WIRED | Line 132; polling useEffect at lines 119-157 |
| `creator-workflow.tsx` | `PreviewPanel` | `mode={previewMode}` prop | WIRED | Lines 376, 406-416; previewMode computed at lines 159-163; `completed`/`failed`/`processing` all pass through correctly |
| `generate/route.ts` | `consume_credit()` | `admin.rpc('consume_credit', { p_user_id: user.id })` | WIRED | Line 44; result checked at line 48 |
| `generate/route.ts` | Airtable createRecord | `createRecord(AIRTABLE_TABLES.ideas, ideaFields)` | WIRED | Line 66; record.id used in Supabase insert and n8n URL |
| `generate/route.ts` | n8n webhook | `fetch(webhookUrl)` fire-and-forget | WIRED | Lines 91-100; N8N_WEBHOOK_URL env var set in .env.local |
| `generate/status/route.ts` | `public.carousels` | `admin.from('carousels').select().eq('airtable_record_id', recordId)` | PARTIAL | Line 24-28; ownership not enforced — no `user_id` filter |
| `generate/status/route.ts` | Airtable getRecord | `getRecord(AIRTABLE_TABLES.ideas, recordId)` | WIRED | Line 41; System Message parsed to derive step/completion |
| `templates/page.tsx` | `CreatorWorkflow` | `<CreatorWorkflow brands={...} creditData={creditData} />` | WIRED | Line 63-69; usage_tracking queried at line 24-26 |
| `history/page.tsx` | `CarouselHistory` | `<CarouselHistory carousels={carousels ?? []} />` | WIRED | Line 26; carousels queried from supabase at lines 10-17 |

---

## Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|-------------|------------|--------|----------|
| GEN-01 (user can initiate generation) | 05-03 | SATISFIED | canGenerate + handleGenerate + POST /api/generate |
| GEN-02 (0-credit guard in UI) | 05-03 | SATISFIED | CreditGate component replaces button |
| GEN-03 (0-credit guard server-side) | 05-01 | SATISFIED | consume_credit() returns {success:false} → 402 |
| GEN-04 (non-blocking generation) | 05-02 | SATISFIED | fire-and-forget n8n, polling loop, async state machine |
| GEN-05 (processing status indicator) | 05-03 | SATISFIED | PreviewPanel processing mode with 3 animated step cards |
| GEN-06 (atomic credit deduction) | 05-01 | SATISFIED | FOR UPDATE row lock in consume_credit() |
| GEN-07 (no double-deduction) | 05-01 | SATISFIED | FOR UPDATE prevents concurrent deductions |
| GEN-08 (preview on completion) | 05-03 | SATISFIED | PreviewPanel completed mode: slide carousel + caption |
| GEN-09 (failure state) | 05-03 | SATISFIED | PreviewPanel failed mode with Retry button |
| GEN-10 (status API) | 05-02 | SATISFIED | GET /api/generate/status polling Airtable + Supabase cache |
| N8N-02 (fire webhook) | 05-02 | SATISFIED | fire-and-forget fetch() with N8N_WEBHOOK_URL |
| N8N-03 (pass idea data) | 05-02 | SATISFIED | ideaFields includes Idea, Brand Voice, Template, Design Style |
| N8N-04 (return carousel id) | 05-02 | SATISFIED | returns { record_id } which client uses for polling |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/api/generate/route.ts` | 68-70 | Credit deducted before Airtable call; 500 returned on failure with no refund | Blocker | SC-5 violated: credit consumed when Airtable createRecord fails |
| `src/app/api/generate/status/route.ts` | 24-28 | Admin client query with no user_id filter | Warning | Auth bypass: any authenticated user can poll another user's carousel status by guessing/knowing their Airtable record ID |
| `src/components/creator/creator-workflow.tsx` | 375-383 | Right panel PreviewPanel always receives `mode="config"` hardcoded | Info | The static sidebar preview never transitions — it always shows the config preview, not the live generation state. The generation overlay modal (lines 388-419) handles the live state correctly. Not a functional bug but may confuse users. |

---

## Human Verification Required

### 1. End-to-end Generation Flow

**Test:** Enter a topic, select brand, design style, and template, then click Generate. Observe the PreviewPanel modal.
**Expected:** Modal appears immediately with processing state showing Step 1 active. As n8n progresses, steps advance to 2 then 3. On completion, slide images render with prev/next navigation, post body caption renders, Copy Caption button works, header CreditBadge shows one fewer credit.
**Why human:** Requires live n8n + Airtable + network; cannot verify image rendering or step progression programmatically.

### 2. Retry Button Preserves Form State

**Test:** Trigger a generation that fails (or wait for timeout), then click Retry.
**Expected:** topic, brand, design style, and template remain selected. A new generation job starts immediately without user needing to re-fill the form.
**Why human:** `handleRetry` calls `submitGeneration()` without resetting topic/templateId/designId/activeBrandId — looks correct in code but needs browser confirmation.

### 3. CreditBadge Refresh After Generation

**Test:** Generate a carousel successfully. Watch the credit badge in the header.
**Expected:** After `router.refresh()` fires on success (line 142), the header CreditBadge updates from N to N-1 without a full page reload.
**Why human:** Next.js `router.refresh()` behavior depends on layout caching strategy; requires visual confirmation.

---

## Gaps Summary

Two gaps block full goal achievement:

**Gap 1 — Credit consumed on Airtable failure (SC-5 blocker):** The generate route deducts a credit at step 3 (line 44) before the Airtable record is created at step 4 (line 66). If Airtable throws, the route returns 500 and the UI correctly shows the failure state — but the credit is gone. The fix is either to (a) create the Airtable record first and only deduct the credit on success, or (b) add a credit refund call in the catch block. The migration comment explicitly flags this as a v1 tradeoff, so the team is aware — but it remains in violation of SC-5 as written.

**Gap 2 — Status route missing user ownership check (security):** The GET /api/generate/status route uses the admin Supabase client and queries only by `airtable_record_id` with no `user_id` filter. This means any authenticated user who obtains another user's Airtable record ID can poll their carousel status. Plan 02 must_have #5 explicitly required 404 enforcement. The fix is a single `.eq('user_id', user.id)` added to both the Supabase cache query and ideally a verification step before the Airtable poll.

Both gaps are surgical single-line-or-few-line fixes. The rest of the phase is fully implemented, substantive, and wired.

---

_Verified: 2026-03-17T05:53:08Z_
_Verifier: Claude (gsd-verifier)_
