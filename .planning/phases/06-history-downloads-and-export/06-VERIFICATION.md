---
phase: 06-history-downloads-and-export
verified: 2026-03-18T00:00:00.000Z
status: gaps_found
score: 3/13 success criteria verified
re_verification: false
gaps:
  - truth: "Each carousel card shows brand name, template name, and design style name when available"
    status: failed
    reason: "carousel-history.tsx Carousel type and render logic have not been updated — no brand_name/template_name/design_style_name fields or pill tags"
    artifacts: [src/components/history/carousel-history.tsx]
    missing: []
  - truth: "User can delete a carousel and it disappears from the list immediately (optimistic UI)"
    status: failed
    reason: "actions.ts does not exist; no deleteCarouselAction; no delete button in carousel-history.tsx"
    artifacts: []
    missing: [src/app/(protected)/history/actions.ts]
  - truth: "New carousels generated after this plan have brand_name, template_name, and design_style_name populated"
    status: failed
    reason: "generate/route.ts body type and INSERT have not been updated to accept/write name fields; creator-workflow.tsx POST body does not include name fields"
    artifacts: [src/app/api/generate/route.ts, src/components/creator/creator-workflow.tsx]
    missing: [supabase/migrations/20260317000023_carousels_denormalized_names.sql]
  - truth: "User can click a download button on an individual slide in the expanded viewer and receive a non-zero PNG file"
    status: failed
    reason: "No per-slide download button in carousel-history.tsx; /api/download route does not exist"
    artifacts: []
    missing: [src/app/api/download/route.ts]
  - truth: "User can click Download All Slides and receive sequential PNG downloads for every slide (CORS-safe via proxy)"
    status: failed
    reason: "handleDownloadAll still fetches ImageBB URLs directly — no proxy route exists, CORS will block in production"
    artifacts: [src/components/history/carousel-history.tsx]
    missing: [src/app/api/download/route.ts]
  - truth: "User can click Download PDF and receive a multi-page PDF where each page is one carousel slide at 1080x1080"
    status: failed
    reason: "No handleDownloadPDF function; jsPDF not installed; /api/download route does not exist"
    artifacts: []
    missing: [src/app/api/download/route.ts]
human_verification:
  - test: "History page renders — idea text, date, slide count, status badge visible"
    expected: "Grid of carousel cards with metadata"
    why_human: "Requires authenticated browser session at /history"
  - test: "Brand/template/design style name pills appear on cards with populated names"
    expected: "Colored pill tags below idea text"
    why_human: "Requires live DB data and authenticated browser"
  - test: "Delete button removes carousel optimistically"
    expected: "Card disappears immediately, does not return after 2s"
    why_human: "Requires interactive browser testing"
  - test: "Per-slide and bulk PNG downloads deliver non-zero files"
    expected: "Valid PNG images, not 0 bytes"
    why_human: "Requires authenticated browser + completed carousel with slide_urls"
  - test: "PDF export generates a valid multi-page PDF"
    expected: "PDF with one 1080x1080 slide per page"
    why_human: "Requires authenticated browser + completed carousel"
  - test: "Unauthenticated /api/download returns 401"
    expected: "401 Unauthorized in incognito tab"
    why_human: "Requires browser network test"
---

# Phase 06: History, Downloads, and Export — Verification Report

## Goal Achievement

Phase 6 has **not been executed**. The `.continue-here.md` confirms `task: 0, status: planned`. All 6 tasks remain unstarted. The code is in the same state it was when Phase 5 closed.

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can navigate to /history and see all their past carousels in a grid | PARTIAL | history/page.tsx exists (Phase 5 stub) and renders a grid — but only basic fields |
| 2 | Each carousel card shows idea text, creation date, slide count, and status | VERIFIED | carousel-history.tsx renders `idea_text`, `created_at`, `slides.length`, status badge (Phase 5) |
| 3 | Each carousel card shows brand name, template name, and design style name when available | FAILED | Carousel type has no name fields; no pill tags rendered |
| 4 | User can delete a carousel and it disappears from the list immediately (optimistic UI) | FAILED | No `deleteCarouselAction`, no delete button, no optimistic state |
| 5 | New carousels generated have brand_name, template_name, design_style_name populated | FAILED | generate route INSERT unchanged; creator-workflow POST body unchanged; migration missing |
| 6 | User can copy post body text to clipboard from any carousel card | VERIFIED | `handleCopy` + `stripMarkdown` present — but lacks the HTTPS guard from Plan 02 Task 2 |
| 7 | User can click a download button on an individual slide and receive a non-zero PNG | FAILED | No per-slide download button exists |
| 8 | User can click Download All Slides and receive sequential CORS-safe PNG downloads | FAILED | `handleDownloadAll` still fetches ImageBB URLs directly — not proxied |
| 9 | User can click Download PDF and receive a multi-page 1080x1080 PDF | FAILED | No `handleDownloadPDF`, jsPDF not installed, no proxy route |

**Score: 2.5/9 truths** (2 fully verified, 1 partial from Phase 5 baseline, 6 failed)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260317000023_carousels_denormalized_names.sql` | ADD COLUMN brand_name, template_name, design_style_name | **MISSING** | Last migration is `20260315000022_carousels_nullable_fks.sql` |
| `src/app/api/generate/route.ts` | Contains `brand_name` in body type + INSERT | **FAILED** | Body type only has `brand_id, template_id, design_style_id, idea_text`; INSERT has no name fields |
| `src/components/creator/creator-workflow.tsx` | POST body includes `brand_name, template_name, design_style_name` | **FAILED** | POST body only sends `brand_id, template_id, design_style_id, idea_text` |
| `src/app/(protected)/history/actions.ts` | Exports `deleteCarouselAction` | **MISSING** | File does not exist |
| `src/app/(protected)/history/page.tsx` | SELECT includes `brand_name, template_name, design_style_name` | **FAILED** | SELECT is `id, idea_text, status, slide_urls, post_body, created_at` — missing all 3 name columns |
| `src/components/history/carousel-history.tsx` | Extended Carousel type + delete UI + metadata pills | **FAILED** | Original Phase 5 state — no new fields, no delete button, no metadata pills |
| `src/app/api/download/route.ts` | GET handler with auth guard + i.ibb.co allowlist | **MISSING** | File does not exist |
| `src/components/history/carousel-history.tsx` (Plan 02) | proxyUrl helper + PDF export + per-slide download | **FAILED** | handleDownloadAll still direct-fetches; no PDF export; no per-slide button |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `creator-workflow.tsx` | `/api/generate` | POST body has `brand_name.*template_name.*design_style_name` | **FAILED** | Pattern not found — POST body only has IDs |
| `generate/route.ts` | `carousels` table | INSERT has `brand_name` | **FAILED** | INSERT has no name fields at line 78–86 |
| `history/page.tsx` | `carousels` table | SELECT has `brand_name.*template_name.*design_style_name` | **FAILED** | SELECT at line 12–14 missing all 3 name columns |
| `carousel-history.tsx` | `history/actions.ts` | calls `deleteCarouselAction` | **FAILED** | Import missing; actions.ts missing |
| `carousel-history.tsx` | `/api/download` | `proxyUrl` helper with `/api/download?url=` | **FAILED** | No proxyUrl function; download route missing |
| `download/route.ts` | ImageBB CDN | `fetch(url)` with i.ibb.co allowlist | **FAILED** | Route does not exist |

---

## Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|-------------|-------------|--------|----------|
| HIST-01: /history page renders all user carousels with RLS scoping | 06-01 | PARTIAL | Page exists from Phase 5; server query works but missing name columns |
| HIST-02: Each card shows metadata (idea text, date, slide count, status, names) | 06-01 | FAILED | Name columns not in query or component; names not written at generation time |
| HIST-03: Delete button removes carousel optimistically + Server Action revalidates | 06-01 | FAILED | No delete action file; no delete button in component |
| HIST-04: Copy button writes markdown-stripped post_body to clipboard | 06-02 | PARTIAL | handleCopy exists but no HTTPS guard added per Plan 02 Task 2 |
| HIST-05: Individual slide + bulk downloads route through /api/download proxy | 06-02 | FAILED | No proxy route; handleDownloadAll fetches ImageBB directly |
| HIST-06: Export as PDF generates multi-page 1080×1080 PDF with jsPDF | 06-02 | FAILED | No PDF function; jsPDF not installed |

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/components/history/carousel-history.tsx:64` | `navigator.clipboard.writeText` without HTTPS guard | Low | Silently fails on HTTP localhost; will throw in some browsers |
| `src/components/history/carousel-history.tsx:72` | `fetch(slides[i])` direct ImageBB URL in browser | High | CORS-blocked in production; downloads silently fail |

---

## Human Verification Required

### 1. History page renders correctly
**Test:** Navigate to `/history` while authenticated
**Expected:** Grid of carousel cards with idea text, date, slide count, and status badge
**Why human:** Requires authenticated browser session; page exists from Phase 5 so may already work at baseline

### 2. Brand/template/design style pills visible after Phase 6 execution
**Test:** Generate a new carousel after Phase 6 is executed, then navigate to /history
**Expected:** Colored pill tags (gray=brand, amber=template, blue=design style) under the idea text
**Why human:** Requires live DB write + browser verification

### 3. Delete removes carousel optimistically
**Test:** Click "Delete" on any card
**Expected:** Card disappears immediately (optimistic), does not reappear after 2 seconds
**Why human:** Requires interactive browser testing

### 4. Per-slide PNG download delivers non-zero file
**Test:** Expand a carousel, navigate slides, click download icon
**Expected:** PNG file downloads, opens as valid image, not 0 bytes
**Why human:** Requires browser + network + completed carousel with slide_urls

### 5. Download All — CORS-safe proxy
**Test:** Click "Download all N slides"
**Expected:** N PNG files download sequentially via /api/download proxy; files are valid
**Why human:** CORS behavior can only be verified in a real browser context

### 6. PDF export
**Test:** Click "Export as PDF" in expanded viewer
**Expected:** Button shows "Generating PDF…", .pdf file downloads, file has correct number of pages
**Why human:** Requires browser + live jsPDF execution

### 7. Proxy unauthenticated guard
**Test:** In incognito, navigate to `/api/download?url=https://i.ibb.co/example.png&filename=test.png`
**Expected:** 401 Unauthorized
**Why human:** Requires incognito browser test

---

## Gaps Summary

**Phase 6 has not been executed at all.** All 6 tasks remain at status `planned`. The gap is not surgical — the entire phase needs to be run.

### What needs to happen (in order):

**Wave 1 — Plan 06-01 (4 tasks):**

1. **Task 1 — DB migration** (`supabase/migrations/20260317000023_carousels_denormalized_names.sql`):
   Create and apply the migration adding `brand_name`, `template_name`, `design_style_name TEXT` columns to `carousels`.

2. **Task 2 — Wire generate route** (`src/app/api/generate/route.ts` + `src/components/creator/creator-workflow.tsx`):
   - Extend route body type and INSERT to accept/write the 3 name fields
   - Extend creator-workflow POST body to derive names from props arrays and include them

3. **Task 3 — History page + delete action** (`src/app/(protected)/history/page.tsx` + `src/app/(protected)/history/actions.ts`):
   - Create `actions.ts` with `deleteCarouselAction`
   - Update SELECT in `page.tsx` to include `brand_name, template_name, design_style_name`

4. **Task 4 — Update CarouselHistory component** (`src/components/history/carousel-history.tsx`):
   - Extend Carousel type with 3 new fields
   - Add optimistic delete state + handleDelete
   - Add metadata pill tags
   - Add delete button

**Wave 2 — Plan 06-02 (2 tasks):**

5. **Task 5 — Install jsPDF + proxy route** (`src/app/api/download/route.ts`):
   - `npm install jspdf`
   - Create authenticated proxy route with i.ibb.co allowlist

6. **Task 6 — Update CarouselHistory for downloads/PDF** (`src/components/history/carousel-history.tsx`):
   - Add `proxyUrl` helper
   - Replace `handleDownloadAll` to use proxy
   - Add `handleDownloadPDF` with jsPDF dynamic import
   - Add per-slide download icon in viewer
   - Add "Export as PDF" button
   - Add HTTPS guard to `handleCopy`

**To execute:** Run `/gsd:execute-phase 6` (after `/clear` for a fresh context window).

---

_Verified: 2026-03-18T00:00:00.000Z_
_Verifier: Claude (gsd-verifier)_
