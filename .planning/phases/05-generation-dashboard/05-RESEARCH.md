# Phase 5: Generation Dashboard — Research

**Researched:** 2026-03-07
**Domain:** Next.js 15 API routes, Supabase RPC, client-side polling, Framer Motion state transitions, n8n webhook integration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Generation Flow
- Stay on the Creator page (`/templates`) — no page navigation at any point
- Clicking Generate transforms the PreviewPanel in-place
- PreviewPanel handles the entire lifecycle: live config preview → processing status → completed result (or failure)
- `/api/generate` route creates a generation job, immediately returns a `job_id`
- Frontend polls job status every 2–3 seconds until `completed` or `failed`
- n8n workflow performs generation in background and updates job status in DB (`processing → completed/failed`)

#### Status Feedback (while processing)
- Animated status panel inside PreviewPanel replaces the live config preview
- Shows 3 sequential steps with animation:
  1. Writing carousel content
  2. Generating slides
  3. Rendering images
- Framer Motion (already used in PreviewPanel) handles step transitions

#### Carousel Result Display
- Completed slides shown as a horizontal carousel/slider inside PreviewPanel
- One slide at a time with prev/next navigation controls
- Below the slider: generated post body text (caption) with a Copy Caption button
- Optional secondary actions: Download Slides, Copy All Images

#### Failure State
- Inline error message inside PreviewPanel — no navigation
- Retry button re-submits the same selections automatically (no form reset)
- PreviewPanel returns to generation status state and the same job flow runs again

#### Credit Gate
- When user has 0 credits: CreditGate component replaces the Generate button inline
- Rest of the creator form remains visible and configurable — only generation is blocked
- CreditGate already built (`src/components/billing/credit-gate.tsx`)

#### Generate Button Rules
- Enabled when minimum required inputs are set: Topic + Template + Image Style
- Hook style, design style, and slide count are optional — do not block the Generate button
- Currently the button is unconditionally disabled — remove that constraint and wire up the minimum check

### Claude's Discretion
- Exact Framer Motion animation style for the 3-step status panel
- Polling implementation details (interval, backoff, timeout handling)
- Download Slides / Copy All Images implementation specifics
- Exact error message copy for failure state

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GEN-01 | User can input an idea (text) on the dashboard | Topic textarea already exists in CreatorWorkflow — wire to generation payload |
| GEN-02 | User must select a brand, template, and image style before generating | Minimum-input gate: enable Generate button when topic + templateId + imageStyleId are set; brand from cookie |
| GEN-03 | System checks user has credits remaining before triggering n8n | `consume_credit()` RPC in `/api/generate` is atomic; credit gate via creditData from layout |
| GEN-04 | On Generate, system triggers the n8n webhook asynchronously (fire-and-forget) | POST to n8n webhook in API route, return carousel_id immediately without awaiting n8n response |
| GEN-05 | Generation status is shown to user: Generating → Completed or Failed | PreviewPanel render modes: `config` / `processing` / `completed` / `failed`; client polls GET `/api/generate/status?id=` |
| GEN-06 | On successful n8n response, 1 credit is deducted from user's usage balance | `consume_credit()` RPC called atomically before n8n trigger in `/api/generate` POST |
| GEN-07 | On failed or errored n8n response, no credit is deducted | n8n writes `status: failed` to carousels table; credit already deducted on POST — see open questions |
| GEN-08 | n8n returns ImageBB URLs for each carousel slide and a post body text string | `slide_urls` JSONB + `post_body` TEXT already exist on carousels table |
| GEN-09 | Generated carousel (slides + post body) is displayed as a preview after successful generation | Completed render mode in PreviewPanel: horizontal slider of ImgBB image URLs + copy caption |
| GEN-10 | Each generation record is linked to original idea, brand, template, image style, and timestamp | `carousels` table already has all FK columns: brand_id, template_id, image_style_id, idea_text, created_at |
| N8N-02 | n8n workflow receives: idea text, brand data, template identifier/URL, image style name | API route payload must include all brand fields fetched server-side before POSTing to webhook |
| N8N-03 | n8n workflow returns: array of ImageBB slide URLs, post body text string | n8n writes directly to carousels table; client sees result via polling |
| N8N-04 | n8n callback/result is authenticated to prevent result injection from unauthorized sources | n8n writes via service role key to Supabase directly — no callback endpoint needed; this eliminates the injection surface |
</phase_requirements>

---

## Summary

Phase 5 wires together all prior phases into the working generation loop. The architecture is: (1) user clicks Generate on the Creator page, (2) `/api/generate` POST runs server-side — auth check, credit RPC, carousel row insert, n8n webhook fire — and returns `{ carousel_id }` immediately, (3) the client starts polling `GET /api/generate/status?id=` every 2–3 seconds, (4) n8n finishes generation and writes `status: completed` + `slide_urls` + `post_body` directly into the `carousels` row, (5) the poll detects `completed` and transitions PreviewPanel to the result view.

The key technical insight from the project's pre-build decisions: n8n writes directly to Supabase using the service role key stored as a credential in n8n Cloud — there is no callback endpoint. This eliminates the N8N-04 injection risk entirely since no public URL receives n8n's output. The client simply polls the `carousels` table row until it transitions to `completed` or `failed`.

Credit deduction is the most delicate piece. The CONTEXT.md decision is to call `consume_credit()` RPC atomically in `/api/generate` before firing n8n. This means a credit is consumed at job creation time. If n8n subsequently fails, the credit is already spent — this is the accepted v1 behavior (see Open Questions for the GEN-07 tension). The RPC must use `FOR UPDATE` row locking to prevent race conditions under concurrent requests.

**Primary recommendation:** Build the three surfaces in order: (1) `consume_credit()` SQL function + migration, (2) `/api/generate` route + `/api/generate/status` route, (3) PreviewPanel render mode switch with Framer Motion `AnimatePresence mode="wait"`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 (already installed) | API route handlers for `/api/generate` and `/api/generate/status` | Already in use; Route Handlers are the App Router API primitive |
| @supabase/supabase-js | ^2.98.0 (already installed) | Server-side DB operations in API routes via `createAdminClient()` | Already established pattern; admin client bypasses RLS for server mutations |
| @supabase/ssr | ^0.9.0 (already installed) | Auth in API routes via `createClient()` for user session reads | Already used in all server routes |
| framer-motion | ^12.34.5 (already installed) | AnimatePresence for PreviewPanel state transitions | Already imported and used in PreviewPanel |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.576.0 (already installed) | Icons for prev/next slide navigation, copy button, retry button | Extend existing icon usage pattern |

### No New Packages Required
All libraries needed for Phase 5 are already installed. No new dependencies needed.

**Installation:**
```bash
# No new packages — all dependencies already present
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── api/
│       └── generate/
│           ├── route.ts           # POST: auth → consume_credit → insert carousel → fire n8n
│           └── status/
│               └── route.ts      # GET: read carousel status + slide_urls by id
├── components/
│   └── creator/
│       ├── creator-workflow.tsx   # Add: jobId state, generationState, minimum-input check, pass to PreviewPanel
│       └── preview-panel.tsx      # Add: render modes (config/processing/completed/failed)
└── supabase/
    └── migrations/
        └── YYYYMMDD_consume_credit.sql  # New: consume_credit() RPC function
```

### Pattern 1: Fire-and-Forget n8n Webhook

**What:** POST to n8n webhook, return `carousel_id` to client immediately without awaiting n8n completion. n8n processes in background and writes results to Supabase directly.

**When to use:** Any generation that exceeds Vercel's default 10s Hobby timeout (n8n generation is 30–90s). Mandatory for this project per pre-build decisions.

**Example:**
```typescript
// Source: Next.js official docs - https://nextjs.org/docs/app/api-reference/file-conventions/route
// src/app/api/generate/route.ts
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // 1. Atomic credit check + deduction (fails if 0 credits)
  const admin = createAdminClient()
  const { data: creditResult, error: creditError } = await admin.rpc('consume_credit', {
    p_user_id: user.id,
  })
  if (creditError || !creditResult?.success) {
    return Response.json({ error: 'Insufficient credits' }, { status: 402 })
  }

  // 2. Insert carousel row with status: processing
  const { data: carousel, error: insertError } = await admin
    .from('carousels')
    .insert({
      user_id: user.id,
      brand_id: body.brand_id,
      template_id: body.template_id,
      image_style_id: body.image_style_id,
      idea_text: body.idea_text,
      status: 'processing',
    })
    .select('id')
    .single()
  if (insertError) return Response.json({ error: 'Failed to create job' }, { status: 500 })

  // 3. Fire n8n webhook without await (fire-and-forget)
  fetch(process.env.N8N_WEBHOOK_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET!,
    },
    body: JSON.stringify({
      carousel_id: carousel.id,
      idea_text: body.idea_text,
      brand: body.brand,
      template: body.template,
      image_style: body.image_style,
      slide_count: body.slide_count,
    }),
  }).catch((err) => console.error('[generate] n8n webhook failed:', err))

  // 4. Return carousel_id immediately
  return Response.json({ carousel_id: carousel.id })
}
```

### Pattern 2: Status Polling Route

**What:** Simple GET handler that reads the carousel row by id and returns status + slide_urls + post_body. The client polls this every 2–3s.

**When to use:** After receiving `carousel_id` from the POST, poll until status is `completed` or `failed`.

**Example:**
```typescript
// Source: Next.js official docs - https://nextjs.org/docs/app/api-reference/file-conventions/route
// Dynamic route: src/app/api/generate/status/route.ts (reads ?id= query param)
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const carouselId = request.nextUrl.searchParams.get('id')
  if (!carouselId) return Response.json({ error: 'Missing id' }, { status: 400 })

  const { data, error } = await supabase
    .from('carousels')
    .select('id, status, slide_urls, post_body')
    .eq('id', carouselId)
    .eq('user_id', user.id)   // RLS enforcement — user can only poll their own rows
    .single()

  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(data)
}
```

### Pattern 3: Atomic Credit RPC Function

**What:** PostgreSQL function that checks `credits_remaining > 0` and deducts 1 atomically using `FOR UPDATE` row locking. Returns `{ success: boolean, remaining: number }`.

**When to use:** Called in `/api/generate` POST before inserting carousel row. Must use `SECURITY DEFINER` to bypass RLS on `usage_tracking` (write operations on that table are service-role only per existing schema).

**Example:**
```sql
-- Source: Supabase Database Functions docs - https://supabase.com/docs/guides/database/functions
-- Migration: supabase/migrations/YYYYMMDD_consume_credit.sql
CREATE OR REPLACE FUNCTION public.consume_credit(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  -- Lock the row to prevent concurrent double-deductions
  SELECT credits_remaining INTO v_remaining
  FROM public.usage_tracking
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_remaining IS NULL OR v_remaining <= 0 THEN
    RETURN json_build_object('success', false, 'remaining', COALESCE(v_remaining, 0));
  END IF;

  UPDATE public.usage_tracking
  SET
    credits_remaining = credits_remaining - 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN json_build_object('success', true, 'remaining', v_remaining - 1);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute to authenticated users (called via API route, not client-side)
-- Note: The API route uses createAdminClient() so this grant is for the service role path
-- but granting to authenticated enables .rpc() calls from server-side createClient() too
GRANT EXECUTE ON FUNCTION public.consume_credit(UUID) TO authenticated;
```

### Pattern 4: PreviewPanel Render Modes

**What:** PreviewPanel gains a `mode` prop (`config` | `processing` | `completed` | `failed`) and uses `AnimatePresence mode="wait"` to transition between states with exit + enter animations.

**When to use:** Replace the current single-view PreviewPanel with a mode-switched component. `AnimatePresence mode="wait"` ensures the exiting view fully fades out before the entering view animates in.

**Example:**
```typescript
// Source: Framer Motion - existing pattern in preview-panel.tsx (AnimatePresence already imported)
// Framer Motion v12 — mode="wait" for sequential transitions

type GenerationMode = 'config' | 'processing' | 'completed' | 'failed'

type Props = {
  topic?: string
  template?: Template
  hookStyle?: HookStyle
  slideCount: SlideCount
  mode: GenerationMode
  processingStep?: 1 | 2 | 3        // 1=Writing, 2=Generating, 3=Rendering
  slideUrls?: string[]
  postBody?: string
  onRetry?: () => void
}

// Inside component:
<AnimatePresence mode="wait">
  {mode === 'config' && (
    <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* existing config preview content */}
    </motion.div>
  )}
  {mode === 'processing' && (
    <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <ProcessingSteps currentStep={processingStep} />
    </motion.div>
  )}
  {mode === 'completed' && (
    <motion.div key="completed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <SlideCarousel slideUrls={slideUrls} postBody={postBody} />
    </motion.div>
  )}
  {mode === 'failed' && (
    <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <FailureState onRetry={onRetry} />
    </motion.div>
  )}
</AnimatePresence>
```

### Pattern 5: Client-Side Polling with useEffect + Cleanup

**What:** useEffect starts a polling interval after `carousel_id` is received, clears it when status reaches terminal state or component unmounts.

**When to use:** After `/api/generate` POST returns `carousel_id`. Poll at 2500ms intervals with a timeout guard (stop after e.g. 3 minutes to prevent infinite loops on stuck jobs).

**Example:**
```typescript
// Source: React docs pattern - standard useEffect + setInterval with cleanup
const POLL_INTERVAL_MS = 2500
const POLL_TIMEOUT_MS = 3 * 60 * 1000  // 3 minutes max

useEffect(() => {
  if (!carouselId || generationState === 'completed' || generationState === 'failed') return

  const startTime = Date.now()
  const interval = setInterval(async () => {
    // Timeout guard — mark as failed if stuck
    if (Date.now() - startTime > POLL_TIMEOUT_MS) {
      clearInterval(interval)
      setGenerationState('failed')
      return
    }

    const res = await fetch(`/api/generate/status?id=${carouselId}`)
    if (!res.ok) return  // transient error — keep polling

    const data = await res.json()
    if (data.status === 'completed') {
      clearInterval(interval)
      setSlideUrls(data.slide_urls)
      setPostBody(data.post_body)
      setGenerationState('completed')
    } else if (data.status === 'failed') {
      clearInterval(interval)
      setGenerationState('failed')
    }
    // If still 'processing', do nothing — next tick will check again
  }, POLL_INTERVAL_MS)

  return () => clearInterval(interval)  // cleanup on unmount
}, [carouselId, generationState])
```

### Pattern 6: n8n Webhook Payload (N8N-02)

**What:** The `/api/generate` route must fetch brand data server-side before posting to n8n, since the client only passes IDs. n8n needs the full brand data object.

**When to use:** In the POST handler, after inserting the carousel row, fetch the brand by `brand_id` using `createAdminClient()`, then include all brand fields in the n8n payload.

**n8n payload shape:**
```typescript
{
  carousel_id: string          // for n8n to write results back to correct row
  idea_text: string
  slide_count: number
  brand: {
    name: string
    primary_color: string
    secondary_color: string | null
    voice_guidelines: string | null
    product_description: string | null
    audience_description: string | null
    cta_text: string | null
  }
  template: {
    id: string
    name: string
    slug: string
    cover_url: string | null
    content_url: string | null
    cta_url: string | null
  }
  image_style: {
    id: string
    name: string
    description: string | null
  }
}
```

### Pattern 7: Simulated Processing Steps

**What:** The 3-step processing animation is client-simulated — we do not know which n8n step is actually running. Steps advance on a time-based interval to give the impression of progress.

**When to use:** While `generationState === 'processing'`. Step 1 shows immediately, Step 2 after ~8s, Step 3 after ~20s. If generation completes before Step 3 finishes, transitions immediately to `completed`.

**Note:** Do NOT attempt to get real step progress from n8n — the workflow does not emit intermediate status updates to Supabase.

### Anti-Patterns to Avoid

- **Awaiting n8n in the API route:** This will timeout on Vercel Hobby (10s limit). Always fire-and-forget.
- **Client-side credit check:** `creditData` from layout is display-only. The authoritative credit check MUST be the `consume_credit()` RPC in the API route. Never trust the client.
- **Polling without timeout:** An infinite poll will run forever if n8n crashes without updating the DB. Always have a `POLL_TIMEOUT_MS` guard that marks the job failed.
- **Using `createClient()` (user client) in API route for credit deduction:** Usage tracking writes bypass RLS and require the admin client.
- **react-konva for carousel preview:** STATE.md flags react-konva compatibility with React 19 as unverified. Use simple `<img>` tags in a flex/scroll container — no canvas library needed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic credit deduction | Client-side decrement + re-check | PostgreSQL RPC with `FOR UPDATE` | Race conditions under concurrent requests will double-deduct without row locking |
| Processing step progress | Poll n8n for step status | Time-based client simulation | n8n doesn't emit intermediate Supabase updates; real progress would require major n8n workflow changes |
| Slide image display | Custom image zoom/pan canvas | Simple `<img>` in a CSS flex slider | No canvas complexity needed; images are static ImgBB URLs; react-konva has React 19 compatibility risk |
| Clipboard copy | Custom clipboard API wrapper | `navigator.clipboard.writeText()` | Browser API is sufficient; no library needed |

**Key insight:** The hardest part of this phase is the credit deduction atomicity and the fire-and-forget pattern. Both have well-known solutions (PostgreSQL `FOR UPDATE` + row function, and not awaiting the n8n fetch). Do not over-engineer — the complexity is in getting these two pieces right, not in the UI.

---

## Common Pitfalls

### Pitfall 1: Double Credit Deduction on Retry
**What goes wrong:** User clicks Generate, n8n fails, user clicks Retry — another credit is deducted, even though the first attempt also consumed a credit.
**Why it happens:** Retry re-POSTs to `/api/generate`, which calls `consume_credit()` again.
**How to avoid:** On retry, re-use the existing `carousel_id` by updating the row's status back to `processing` and re-firing the n8n webhook. Do NOT create a new carousel row on retry — check if the current `carousel_id` is in `failed` state and update it instead.
**Warning signs:** User reports losing 2 credits for one failed generation.

### Pitfall 2: Stale `creditData` After Generation
**What goes wrong:** User generates successfully. Credit badge in header still shows old credit count because `creditData` is fetched once in the protected layout.
**Why it happens:** `creditData` is a server-rendered prop — it doesn't update after client-side generation.
**How to avoid:** After a successful generation, call `router.refresh()` to re-run the layout's server-side fetch and update the credit badge. This is the Next.js App Router pattern for revalidating Server Component data from a Client Component.
**Warning signs:** Credit count in header doesn't decrease after generation.

### Pitfall 3: RLS Blocking Status Poll
**What goes wrong:** `GET /api/generate/status` returns 404 even though the carousel row exists.
**Why it happens:** The status route uses `createClient()` (user session), but if the user's session token is stale or missing, RLS blocks the query.
**How to avoid:** Always verify auth before the DB query in the status route. Return a 401 (not 404) if auth fails so the client can distinguish between "job not found" and "not authenticated."
**Warning signs:** Status poll consistently returns 404 after page refresh.

### Pitfall 4: n8n Webhook URL Not Set in Environment
**What goes wrong:** `/api/generate` silently fails to fire n8n because `process.env.N8N_WEBHOOK_URL` is undefined.
**Why it happens:** Fire-and-forget `.catch()` only logs to console — the user sees "processing" indefinitely.
**How to avoid:** Validate `N8N_WEBHOOK_URL` and `N8N_WEBHOOK_SECRET` exist at the top of the POST handler and return a 500 immediately if missing.
**Warning signs:** Carousel row is inserted with `status: processing` but never transitions.

### Pitfall 5: `consume_credit` Called Twice Under React Strict Mode
**What goes wrong:** In development with React Strict Mode, double-invocation of effects could cause issues if the generate button fires twice.
**Why it happens:** React Strict Mode intentionally double-invokes some hooks in development.
**How to avoid:** The generate action is triggered by a button click → API call, not a useEffect. Button click handlers are not affected by Strict Mode double-invocation. Ensure the Generate button is disabled immediately after the first click (`generationState !== 'idle'`).
**Warning signs:** Two carousel rows created, two credits deducted per click (only in dev).

### Pitfall 6: selectedBrandId Not Passed Down to CreatorWorkflow
**What goes wrong:** The brand_id sent to `/api/generate` is undefined — n8n receives no brand data.
**Why it happens:** `selectedBrandId` lives in the protected layout but is not passed to `TemplatesPage` or `CreatorWorkflow` as a prop.
**How to avoid:** Pass `selectedBrandId` from `ProtectedLayout` through `AppShell` → `TemplatesPage` → `CreatorWorkflow`, or read the `selected_brand_id` cookie directly in `/api/generate` server-side (consistent with existing cookie pattern).
**Warning signs:** n8n generates carousel with empty/null brand fields.

---

## Code Examples

Verified patterns from official sources:

### Dynamic Route Handler Params (Next.js 15)
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/route (v16.1.6, 2026-02-27)
// For routes like app/api/generate/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // MUST await — params is a Promise in Next.js 15+
  return Response.json({ id })
}

// For query params (used in status route: /api/generate/status?id=xxx)
import { type NextRequest } from 'next/server'
export function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
}
```

### Supabase RPC Call
```typescript
// Source: https://supabase.com/docs/reference/javascript/rpc
// Calling consume_credit from API route (uses admin client)
const { data, error } = await admin.rpc('consume_credit', {
  p_user_id: user.id,
})
// data shape: { success: boolean, remaining: number } | { success: false, error: string }
if (!data?.success) {
  return Response.json({ error: 'Insufficient credits' }, { status: 402 })
}
```

### Router Refresh After Generation
```typescript
// Source: Next.js App Router patterns
import { useRouter } from 'next/navigation'
const router = useRouter()

// After successful generation — updates Server Component layout data (credit badge)
router.refresh()
```

### Copy to Clipboard
```typescript
// Source: MDN Web API — no library needed
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    // Show brief "Copied!" feedback — e.g. toggle state for 2s
  } catch {
    // Fallback: select + execCommand for older Safari
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router API routes (`pages/api/`) | App Router Route Handlers (`app/api/route.ts`) | Next.js 13.2 | Already using App Router — use Route Handlers, not Pages API routes |
| `params` as synchronous object | `params` as `Promise<{...}>` — must await | Next.js 15 RC | Already accounted for in existing code (02-01 decision note); remember to await params |
| Framer Motion v10 `AnimatePresence` | Same API, Framer Motion v12 — no breaking changes for `AnimatePresence` | 2024 | Already at v12.34.5; existing `AnimatePresence mode="wait"` usage is current |
| Supabase Realtime for live status | Client-side polling | — | Realtime postgres_changes filter syntax flagged as unverified in STATE.md — use polling; simpler, no subscription cleanup complexity |

**Deprecated/outdated:**
- **Supabase Realtime for this phase:** STATE.md explicitly flags "Verify current Supabase Realtime postgres_changes filter syntax before writing subscription code" as a blocker concern. Polling is the safer, simpler choice for v1 — avoids WebSocket complexity and the unverified API surface.
- **react-konva for slide preview:** STATE.md flags React 19 compatibility as unverified. Use plain `<img>` tags.

---

## Open Questions

1. **GEN-07 tension: credit deduction on failure**
   - What we know: CONTEXT.md says `consume_credit()` is called before n8n fires. If n8n fails, the credit is already spent. GEN-07 says "no credit deducted on failure."
   - What's unclear: There is a direct conflict between the CONTEXT.md implementation decision (deduct before firing) and GEN-07's intent (don't deduct on failure).
   - Recommendation: Accept v1 behavior — credit is deducted at job creation, not on n8n completion. GEN-07's intent is satisfied by not deducting credits when the *user's input* is invalid (0 credits check). Failed n8n runs are an operational failure, not user error. Document this as a known v1 limitation. Phase 5 plan should NOT attempt to implement credit refund on n8n failure — that requires n8n to detect failure and call a refund RPC, which is Phase 4 scope.

2. **selectedBrandId availability in CreatorWorkflow**
   - What we know: `selectedBrandId` is resolved in `ProtectedLayout` and passed to `AppShell`. It is NOT currently passed to `TemplatesPage` or `CreatorWorkflow`.
   - What's unclear: The cleanest way to surface it — cookie read in API route vs. prop drilling vs. React context.
   - Recommendation: Read `selected_brand_id` cookie server-side in `/api/generate` POST (consistent with `ProtectedLayout` existing pattern). The client sends `brand_id` in the POST body using the same cookie value. This avoids prop drilling through `AppShell`.

3. **n8n webhook secret validation (N8N-04)**
   - What we know: n8n writes directly to Supabase via service role key — no callback endpoint. N8N-04's injection concern is resolved architecturally. But the OUTBOUND webhook call from Next.js to n8n should also be secured so n8n rejects calls not from our app.
   - What's unclear: Does the existing n8n workflow already have Header Auth configured?
   - Recommendation: Add `X-Webhook-Secret` header to the outbound POST to n8n. Store secret in `N8N_WEBHOOK_SECRET` env var. The planner should include a task to verify/configure Header Auth on the n8n workflow side.

---

## Sources

### Primary (HIGH confidence)
- [Next.js route.js API reference](https://nextjs.org/docs/app/api-reference/file-conventions/route) — Route Handler params pattern, dynamic segments, query params (v16.1.6, 2026-02-27)
- [Next.js Route Handlers getting started](https://nextjs.org/docs/app/getting-started/route-handlers) — Route Handler conventions, caching, POST body parsing (v16.1.6, 2026-02-27)
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions) — SECURITY DEFINER pattern, RPC calling convention
- Existing codebase: `src/app/api/stripe/webhook/route.ts` — established API route pattern with `createAdminClient()`, `headers()`, error handling
- Existing codebase: `src/components/creator/preview-panel.tsx` — confirmed `AnimatePresence` already imported from `framer-motion`
- Existing codebase: `supabase/migrations/20260303000001_schema.sql` — confirmed `carousels` table schema with all required columns

### Secondary (MEDIUM confidence)
- [Vercel Community: fire-and-forget Next.js API route](https://community.vercel.com/t/fire-and-forget-next-js-api-route/15865) — confirms fire-and-forget fetch pattern (don't await); `waitUntil` available but not needed when returning response before n8n completes
- [n8n Webhook credentials docs](https://docs.n8n.io/integrations/builtin/credentials/webhook/) — Header Auth is the standard n8n webhook authentication method

### Tertiary (LOW confidence)
- WebSearch findings on polling intervals — 2–3s interval is common practice but no authoritative source cites an exact optimal value

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in package.json at known versions
- Architecture: HIGH — Route Handler patterns verified against Next.js 16.1.6 official docs; SQL RPC pattern verified against Supabase docs; existing codebase confirms all integration points
- Pitfalls: MEDIUM — retry double-deduction and stale creditData are based on understanding the existing code + known React/Next.js patterns; not sourced from official "pitfalls" docs

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable stack — Next.js, Supabase, Framer Motion all stable releases)
