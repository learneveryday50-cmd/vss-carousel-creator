---
phase: 05-generation-dashboard
plan: "03"
subsystem: ui
tags: [next-js, react, framer-motion, polling, credit-gate, generation-ui]

# Dependency graph
requires:
  - phase: 05-generation-dashboard
    plan: "02"
    provides: POST /api/generate and GET /api/generate/status routes
  - phase: 03-billing-and-credits
    provides: CreditGate component, usage_tracking table, creditsRemaining

provides:
  - PreviewPanel four-mode component (config/processing/completed/failed) with AnimatePresence transitions
  - CreatorWorkflow generation state machine with polling loop and credit gate
  - TemplatesPage server-side credit and brand data fetch

affects:
  - End-to-end carousel generation UX: topic → generate → polling → slide viewer

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Four-mode render pattern: mode prop selects which AnimatePresence child renders, key={mode} drives transitions"
    - "submitGeneration() separated from handleGenerate() to allow handleRetry() to bypass idle-state guard safely (React 18 batching fix)"
    - "Client-side step advancement via setTimeout (8s/20s) since n8n does not emit step-level progress events"
    - "Polling cleanup: clearInterval + clearTimeout in useEffect return to prevent memory leaks on unmount/terminal state"

key-files:
  created: []
  modified:
    - src/components/creator/preview-panel.tsx
    - src/components/creator/creator-workflow.tsx
    - src/app/(protected)/templates/page.tsx

key-decisions:
  - "submitGeneration() does not guard on generationState — this allows handleRetry() to call it directly without hitting the idle guard that handleGenerate() uses (React 18 automatic batching stale-closure fix)"
  - "Failed mode error message does not mention credit deduction — v1 accepts credit-on-failure; refund is v2"
  - "TemplatesPage reads selected_brand_id cookie directly (consistent with layout.tsx pattern) rather than prop-drilling through AppShell"
  - "Spinner implemented as nested motion.div with rotate animation rather than CSS animate-spin to stay within Framer Motion"

patterns-established:
  - "Mode-keyed AnimatePresence: wrap all mode variants in AnimatePresence mode='wait'; give each motion.div a key={mode} so exit plays before enter"
  - "Retry-safe async helpers: separate the POST logic into a helper that does not read potentially-stale state; guards live only in the entry-point handler"

requirements-completed: [GEN-01, GEN-02, GEN-05, GEN-08, GEN-09]

# Metrics
duration: 3min
completed: 2026-03-08
---

# Phase 5 Plan 03: Generation Dashboard UI Summary

**Four-mode PreviewPanel (config/processing/completed/failed) with Framer Motion transitions wired to a polling CreatorWorkflow state machine that drives the full generate-to-slide-viewer UX.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-08T08:54:45Z
- **Completed:** 2026-03-08T08:58:09Z
- **Tasks:** 2 of 3 (Task 3 is human-verify checkpoint — pending)
- **Files modified:** 3

## Accomplishments

- PreviewPanel extended with `mode` prop supporting config/processing/completed/failed render modes, all wrapped in `AnimatePresence mode="wait"` for cross-fade transitions
- CreatorWorkflow wired with full generation state machine: idle → loading → processing → completed/failed, with polling every 2.5s, 3-minute timeout, and step advancement timers
- CreditGate replaces Generate button when `creditsRemaining === 0`; Generate button enabled only when topic + templateId + imageId are all set
- `handleRetry()` calls `submitGeneration()` directly (not `handleGenerate()`) to bypass the idle-state guard — avoiding React 18 batching stale-closure silent-failure
- TemplatesPage updated to read `selected_brand_id` cookie and `usage_tracking` server-side and pass `selectedBrandId` + `creditData` to CreatorWorkflow
- TypeScript compiles clean (zero errors) across all three files

## Task Commits

Each task was committed atomically:

1. **Task 1: Transform PreviewPanel into four-mode component** — `11ef502` (feat) — four render modes, AnimatePresence, processing steps, completed carousel viewer, failed state with retry
2. **Task 2: Wire CreatorWorkflow generation state, polling, and credit gate** — `dd8a010` (feat) — state machine, submitGeneration/handleGenerate/handleRetry, polling useEffect, credit gate, TemplatesPage data fetch

## Files Created/Modified

- `src/components/creator/preview-panel.tsx` — Extended to four-mode component: config (existing), processing (3 animated steps), completed (slide carousel + Copy Caption), failed (XCircle + Retry button)
- `src/components/creator/creator-workflow.tsx` — Generation state machine, submitGeneration helper, handleGenerate/handleRetry, polling useEffect with cleanup, CreditGate integration, PreviewPanel prop pass-through
- `src/app/(protected)/templates/page.tsx` — Server-side read of selected_brand_id cookie + usage_tracking query, creditData prop passed to CreatorWorkflow

## Decisions Made

- **submitGeneration/handleGenerate separation:** `submitGeneration()` contains the POST logic without an idle-guard. `handleGenerate()` guards on `generationState === 'idle'`. `handleRetry()` calls `submitGeneration()` directly so React 18 automatic batching cannot leave `generationState` stale and cause a silent no-op.
- **Failed mode: no credit mention:** Error message is generic ("Something went wrong. Please try again."). v1 design accepts that a credit is consumed even if n8n fails — refund is v2. Mentioning credits in the error would be confusing since the user already accepted this in the credit gate.
- **Client-side step advancement:** n8n does not emit step-level progress events. Step timers (8s/20s) are purely cosmetic UX — they do not represent actual n8n pipeline state.
- **TemplatesPage direct cookie read:** Reads `selected_brand_id` cookie directly (same pattern as `layout.tsx`) rather than prop-drilling through AppShell children, keeping the component boundary clean.

## Deviations from Plan

None — both tasks implemented exactly as specified. All guard conditions, state transitions, polling logic, cleanup patterns, and component interfaces match the plan.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required for these UI changes. The API routes (Plan 02) already require `N8N_WEBHOOK_URL` and `N8N_WEBHOOK_SECRET`.

## Next Phase Readiness

- Plan 03 human-verify checkpoint (Task 3) is pending — user must verify the end-to-end generation flow works in browser
- After checkpoint approval, the plan is complete and Phase 5 is done
- No code changes required after checkpoint — it is purely a verification step

---
*Phase: 05-generation-dashboard*
*Completed: 2026-03-08*
