# Phase 5: Generation Dashboard - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can trigger carousel generation from the Creator page, see live async status updates inside the PreviewPanel, view the completed result (real slide images + post body text), and have exactly one credit deducted only on success. Failed generations do not cost credits. No navigation away from the Creator page at any point.

</domain>

<decisions>
## Implementation Decisions

### Generation Flow
- Stay on the Creator page (`/templates`) — no page navigation at any point
- Clicking Generate transforms the PreviewPanel in-place
- PreviewPanel handles the entire lifecycle: live config preview → processing status → completed result (or failure)
- `/api/generate` route creates a generation job, immediately returns a `job_id`
- Frontend polls job status every 2–3 seconds until `completed` or `failed`
- n8n workflow performs generation in background and updates job status in DB (`processing → completed/failed`)

### Status Feedback (while processing)
- Animated status panel inside PreviewPanel replaces the live config preview
- Shows 3 sequential steps with animation:
  1. Writing carousel content
  2. Generating slides
  3. Rendering images
- Framer Motion (already used in PreviewPanel) handles step transitions

### Carousel Result Display
- Completed slides shown as a horizontal carousel/slider inside PreviewPanel
- One slide at a time with prev/next navigation controls
- Below the slider: generated post body text (caption) with a Copy Caption button
- Optional secondary actions: Download Slides, Copy All Images

### Failure State
- Inline error message inside PreviewPanel — no navigation
- Retry button re-submits the same selections automatically (no form reset)
- PreviewPanel returns to generation status state and the same job flow runs again

### Credit Gate
- When user has 0 credits: CreditGate component replaces the Generate button inline
- Rest of the creator form remains visible and configurable — only generation is blocked
- CreditGate already built (`src/components/billing/credit-gate.tsx`)

### Generate Button Rules
- Enabled when minimum required inputs are set: Topic + Template + Image Style
- Hook style, design style, and slide count are optional — do not block the Generate button
- Currently the button is unconditionally disabled — remove that constraint and wire up the minimum check

### Claude's Discretion
- Exact Framer Motion animation style for the 3-step status panel
- Polling implementation details (interval, backoff, timeout handling)
- Download Slides / Copy All Images implementation specifics
- Exact error message copy for failure state

</decisions>

<specifics>
## Specific Ideas

- The PreviewPanel right column is the single surface for all generation states — it should feel like a seamless transformation, not a separate component swapping in
- Status steps should feel progressive (step 1 completes, step 2 starts, etc.) — not all three showing simultaneously
- Retry should be silent and fast — user shouldn't have to re-configure anything

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PreviewPanel` (`src/components/creator/preview-panel.tsx`): The target surface — already uses `AnimatePresence` + Framer Motion. Will gain new render modes: `config` (current) | `processing` | `completed` | `failed`
- `CreatorWorkflow` (`src/components/creator/creator-workflow.tsx`): Owns all selector state + Generate button. Will need to: track `jobId` + `generationState`, wire up minimum-input check, pass state down to PreviewPanel
- `CreditGate` (`src/components/billing/credit-gate.tsx`): Drop-in replacement for Generate button when credits = 0. Already styled and wired to Stripe Checkout
- `createClient` / `createAdminClient`: Established Supabase client pattern for the `/api/generate` route
- Framer Motion `AnimatePresence`: Already imported in PreviewPanel — use for step transitions and state transitions

### Established Patterns
- Server Actions for mutations (billing/actions.ts, brand/actions.ts) — API route is appropriate here since it needs to return `job_id` to the client
- `usage_tracking` table already fetched in `layout.tsx` and passed as `creditData` to AppShell — credit data is already available; use it to gate the Generate button client-side
- `carousels` table: has `status` column (`pending` / `processing` / `completed` / `failed`) and `slide_urls` JSONB — this IS the job table, no separate jobs table needed
- Atomic credit check via `consume_credit()` RPC — call this in `/api/generate` before firing n8n, not client-side

### Integration Points
- New route: `src/app/api/generate/route.ts` — POST handler: auth check → `consume_credit()` RPC → insert `carousels` row with `status: processing` → POST to n8n webhook → return `{ carousel_id }`
- n8n webhook URL: stored in env (`N8N_WEBHOOK_URL` or similar)
- Polling: client calls `GET /api/generate/status?id={carousel_id}` (or direct Supabase query from client) every 2–3s
- On `completed`: `slide_urls` JSONB contains ImgBB URLs; `post_body` column contains caption text
- Credit deduction: `consume_credit()` RPC is called atomically in the API route before triggering n8n — failed n8n calls must not double-deduct (idempotency on the RPC)

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-generation-dashboard*
*Context gathered: 2026-03-07*
