# Domain Pitfalls

**Domain:** Multi-tenant SaaS carousel creator (Next.js, Supabase, Stripe, n8n, ImageBB)
**Researched:** 2026-03-03
**Confidence:** HIGH (core pitfalls from official docs + well-known production failure patterns)

---

## Critical Pitfalls

Mistakes that cause data leaks, financial loss, or full rewrites.

---

### Pitfall 1: RLS Disabled on Tables That Carry Tenant Data

**What goes wrong:** A developer creates a new Supabase table (e.g., `carousels`, `generations`, `brand_profiles`) and forgets to enable RLS. Supabase tables are created with RLS **disabled** by default. Any authenticated user can then `SELECT *` from that table and read every other tenant's data.

**Why it happens:** `supabase db push` applies schema but doesn't enforce RLS enablement unless migrations explicitly include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Developers assume enabling RLS on one table covers others.

**Consequences:** Full cross-tenant data exposure. Every user can read every other user's brand profiles, carousel history, generated images, and post body text. GDPR/data breach liability.

**Prevention:**
- Add `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;` to every migration that creates a tenant-scoped table.
- Add a Supabase linter check or CI step: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;` — this query should return empty for all tenant tables.
- Maintain a table audit checklist in the codebase: every table marked as `RLS: ENABLED` or `RLS: EXEMPT (reason)`.

**Detection:** After creating any table, run `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';` in Supabase SQL editor. `rowsecurity = false` = data leak risk.

**Phase:** Auth + DB setup (Phase 1). Re-check at every phase that adds a table.

---

### Pitfall 2: RLS Policies That Pass on Authenticated But Not Scoped to User

**What goes wrong:** Policy is written as:
```sql
CREATE POLICY "authenticated users can read" ON carousels
  FOR SELECT USING (auth.role() = 'authenticated');
```
This allows any logged-in user to read all rows. The policy must scope to `auth.uid()`:
```sql
CREATE POLICY "users read own" ON carousels
  FOR SELECT USING (auth.uid() = user_id);
```

**Why it happens:** Developers copy policy templates from docs or tutorials that omit the `user_id` constraint. The policy passes testing because the dev only tests with their own account.

**Consequences:** Every authenticated user reads every other user's carousels, brand profiles, and generation history.

**Prevention:**
- Policy template: every `USING` clause must include `auth.uid() = user_id` (or equivalent FK join).
- Write a test: create two test users in Supabase local dev, log in as user B, attempt to `SELECT` user A's rows — must return empty.

**Detection:** Multi-user integration test. Log in as a second user and query another user's resource IDs directly. Any result = policy misconfigured.

**Phase:** Phase 1 (auth/DB). Verified at Phase 2 (carousels) and Phase 3 (generation).

---

### Pitfall 3: Stripe Webhook Endpoint Reads Body as Parsed JSON

**What goes wrong:** Next.js App Router (and pages router) automatically parses the request body as JSON. Stripe's `constructEvent()` requires the **raw bytes** of the request body to verify the signature. If the body has been parsed (or re-serialized), signature verification fails with a `StripeSignatureVerificationError`, causing all webhook events to be rejected.

**Why it happens:** Developers scaffold a Next.js API route, call `req.json()` or use the default body parser, then pass the result to `stripe.webhooks.constructEvent()`. The signature won't match because JSON serialization may alter whitespace or key ordering.

**Consequences:** All Stripe webhooks silently fail. Subscription upgrades, downgrades, and renewals never update the database. Users pay but their plan stays Free forever, or cancel but keep Pro access.

**Prevention:**
```typescript
// app/api/webhooks/stripe/route.ts
export const config = { api: { bodyParser: false } }; // pages router

// App Router: use request.text() NOT request.json()
export async function POST(request: Request) {
  const body = await request.text(); // raw string preserved
  const signature = request.headers.get('stripe-signature')!;
  const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  // ...
}
```
- Never use `request.json()` in the Stripe webhook route.
- Test locally with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

**Detection:** Stripe Dashboard > Webhooks > recent deliveries shows `400` errors with "No signatures found matching the expected signature for payload" message.

**Phase:** Phase 2 (Stripe integration). Must be correct from day one.

---

### Pitfall 4: Stripe Webhook Events Processed Without Idempotency Guard

**What goes wrong:** Stripe retries webhook events if your endpoint returns a non-2xx response or times out. Without idempotency guards, the same `customer.subscription.updated` event can fire 3+ times, incrementing credits multiple times or creating duplicate subscription records.

**Why it happens:** Developers handle the event logic then return 200, but if the database write takes too long or throws, the endpoint returns 500 and Stripe retries. Each retry re-runs the credit grant logic.

**Consequences:** Users receive 3x the credits they should have. Double-billing effects if refund/cancel logic runs multiple times.

**Prevention:**
```sql
CREATE TABLE stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT now()
);
```
```typescript
// Before processing any event:
const { error } = await supabase
  .from('stripe_webhook_events')
  .insert({ event_id: event.id });

if (error?.code === '23505') {
  // Duplicate — already processed, return 200 silently
  return new Response('Already processed', { status: 200 });
}
// ... process event ...
```

**Detection:** Run Stripe CLI replay: `stripe events resend evt_xxx`. If credits are granted twice, idempotency is broken.

**Phase:** Phase 2 (Stripe integration).

---

### Pitfall 5: Credit Double-Spend via Race Condition

**What goes wrong:** Two concurrent generation requests from the same user both pass the credit check (`credits_remaining > 0`) before either decrements the counter. Both proceed, consuming 2 credits when only 1 remains — or worse, spending below zero.

**Why it happens:** The check-then-decrement pattern is two separate operations:
```typescript
const { data } = await supabase.from('user_credits').select('credits_remaining').single();
if (data.credits_remaining > 0) {
  // Race window here — another request passes this check simultaneously
  await supabase.from('user_credits').update({ credits_remaining: data.credits_remaining - 1 });
}
```

**Consequences:** Free tier users generate unlimited carousels. Revenue loss. Inconsistent credit state.

**Prevention:** Use a single atomic SQL statement with a conditional update:
```sql
-- Supabase RPC function (atomic):
CREATE OR REPLACE FUNCTION consume_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  updated_rows INT;
BEGIN
  UPDATE user_credits
  SET credits_remaining = credits_remaining - 1,
      updated_at = now()
  WHERE user_id = p_user_id
    AND credits_remaining > 0;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
```typescript
const { data: success } = await supabase.rpc('consume_credit', { p_user_id: userId });
if (!success) throw new Error('No credits remaining');
```
The `WHERE credits_remaining > 0` predicate inside a single `UPDATE` is atomic at the Postgres level — no race condition.

**Detection:** Simulate concurrency: fire two simultaneous fetch requests to your generation endpoint in a browser console. Both should not succeed when credits_remaining = 1.

**Phase:** Phase 3 (generation endpoint). This is the highest-risk single point.

---

### Pitfall 6: n8n Webhook Timeout Causes Orphaned Generation Records

**What goes wrong:** The n8n carousel generation workflow takes 30–90 seconds (AI image generation is slow). The Next.js API route that triggers n8n and awaits the response will time out. Vercel serverless functions have a default 10-second timeout (Hobby plan) or configurable on Pro (up to 60s on most runtimes, 5 minutes on Edge). If the request times out, the generation record is created but never updated with results — stuck in "pending" forever.

**Why it happens:** Developers test locally (no timeout) and don't discover the Vercel timeout until production.

**Consequences:** Users see a spinner that never resolves. Credit was consumed but no carousel delivered. Generation stuck in `status: 'pending'` in DB forever. No retry mechanism.

**Prevention:**
- Use a fire-and-forget async pattern: Next.js route triggers n8n webhook and immediately returns `{ status: 'generating', generation_id }` to the client.
- n8n workflow POSTs results back to a separate Next.js callback endpoint (`/api/generations/callback`) when complete.
- Client polls `GET /api/generations/{id}` (or uses Supabase Realtime subscription) to detect completion.
- Set `status` column: `pending` → `completed` | `failed`. Surface failures to the user.
- Set a generation timeout: if status is still `pending` after 3 minutes, mark as `failed` and refund the credit.

**Detection:** Monitor Supabase `generations` table for rows with `status = 'pending'` older than 5 minutes.

**Phase:** Phase 3 (generation architecture). Must design async from the start — retrofitting this is painful.

---

### Pitfall 7: ImageBB URLs Expiring Silently

**What goes wrong:** ImageBB free tier images can expire or be deleted. ImageBB is a free image hosting service with no SLA — images uploaded via the free API can be deleted after a period of inactivity or if the account is flagged. The project stores ImageBB URLs in Supabase but has no fallback if those URLs return 404.

**Why it happens:** ImageBB appears reliable during development (images are fresh). In production, older carousel images become inaccessible weeks or months later.

**Consequences:** Carousel history shows broken images. Downloaded PDFs have empty image slots. Users can't access older work they paid for.

**Prevention:**
- When n8n returns ImageBB URLs, immediately proxy-download the image bytes in the callback handler and store them in Supabase Storage (free tier: 1GB). Store the Supabase Storage URL as the canonical URL, keep ImageBB URL as fallback metadata.
- Alternatively: accept the risk for v1 (MVP), document the limitation, and plan Supabase Storage migration for v2. Flag this as a known limitation in the codebase with a TODO.
- If staying with ImageBB only for v1: set a `expires_at` field on generation records; warn users in the UI that images older than X days may not be available.

**Detection:** Pick a generation from 30+ days ago. Attempt to load the ImageBB URL. 404 = problem.

**Phase:** Phase 3 (generation storage). Decision must be made before launch, even if migration is deferred.

---

### Pitfall 8: PDF Generation Memory Exhaustion on Serverless

**What goes wrong:** Generating a PDF from 6–10 carousel slide images (each potentially 1–2MB) using Puppeteer or a canvas-based library in a Vercel serverless function will exhaust the 1024MB default memory limit. Puppeteer itself requires ~150MB overhead before any content loads.

**Why it happens:** PDF generation feels lightweight in development (runs on a beefy dev machine). Serverless functions have hard memory caps.

**Consequences:** 500 errors on PDF download. Users who paid for Pro can't download their work.

**Prevention:**
- Use `jsPDF` + `html2canvas` on the client side (browser) instead of server-side Puppeteer. The browser has no memory limit constraint from our side — the user's machine handles it.
- Client-side approach: fetch image URLs, draw them onto canvas elements in a hidden div, then use `jsPDF.addImage()` for each slide.
- If server-side PDF is required: use a lightweight PDF library (`pdf-lib`) that doesn't spawn a browser process. Fetch image buffers via HTTP, embed directly — no headless browser needed.
- Avoid Puppeteer entirely in serverless unless using a dedicated service (e.g., Browserless.io).

**Detection:** Test PDF generation with the maximum expected slide count (10 slides) in a Vercel preview deployment. Check function logs for memory limit errors.

**Phase:** Phase 4 (download features). Design client-side from the start.

---

### Pitfall 9: Supabase RLS Policy Performance Degrading Under Load

**What goes wrong:** RLS policies that use subqueries or JOINs (e.g., checking membership through a join table) run for every row scanned, not just rows returned. A policy like:
```sql
USING (
  auth.uid() IN (
    SELECT user_id FROM team_memberships WHERE team_id = carousels.team_id
  )
)
```
...runs a subquery for every row in the table scan. At thousands of rows, this causes full table scans on every query.

**For this project specifically:** The simpler `auth.uid() = user_id` pattern avoids this — but the pitfall emerges if developers add features like "share with team" or copy a more complex policy template.

**Why it happens:** Developers don't realize RLS policies add a `WHERE` clause to every query at the executor level, and subqueries inside policies don't benefit from the outer query's indexes.

**Consequences:** Queries that take 5ms at 100 rows take 5000ms at 100,000 rows. App becomes unusable at scale.

**Prevention:**
- Keep RLS policies simple: `auth.uid() = user_id` on every tenant table.
- Add a composite index: `CREATE INDEX idx_carousels_user_id ON carousels(user_id);` — this makes the RLS filter fast.
- If sharing features are added later: use a materialized lookup or Supabase's `auth.jwt()` claims approach instead of subquery policies.
- Use `EXPLAIN ANALYZE` on key queries in Supabase SQL editor to verify index usage.

**Detection:** Run `EXPLAIN ANALYZE SELECT * FROM carousels WHERE true;` (letting RLS filter). Check if plan shows `Seq Scan` vs `Index Scan`. Seq scan = policy is slow.

**Phase:** Phase 1 (DB schema design). Add indexes alongside RLS from the start.

---

### Pitfall 10: n8n Callback Endpoint Not Authenticated

**What goes wrong:** The Next.js callback endpoint that receives results from n8n (`/api/generations/callback`) accepts POST requests from n8n and writes to the database. If this endpoint has no authentication, any external actor can POST fake generation results, inject arbitrary content into users' carousel history, or mark failed generations as succeeded.

**Why it happens:** Developers focus on the "happy path" flow and don't consider that callback URLs are publicly accessible.

**Consequences:** Malicious actors can fabricate carousel results for any user. Content injection. Credit bypass (marking generations as complete without consuming n8n resources).

**Prevention:**
- Use a shared secret: n8n sends a header `X-Callback-Secret: <value>` with every result POST. The Next.js endpoint verifies this header against `process.env.N8N_CALLBACK_SECRET`.
- Generate a per-generation token: when creating the generation record, generate a UUID token. Pass it to n8n as part of the webhook payload. n8n echoes it back in the callback. Verify it matches the DB record before updating.
- The second approach (per-generation token) is more robust — it also prevents replay attacks.

**Detection:** Attempt to POST to `/api/generations/callback` without the secret header from `curl`. Should return 401, not 200.

**Phase:** Phase 3 (generation architecture).

---

### Pitfall 11: Stripe Customer ID Not Stored on Signup

**What goes wrong:** On user signup, developers don't create a Stripe Customer immediately. Instead, they create the Customer lazily when the user first clicks "Upgrade." If the webhook `customer.subscription.updated` fires before the app has stored the `stripe_customer_id` on the user record, the webhook handler can't correlate the Stripe event to a Supabase user — and either errors out or creates a phantom user.

**Why it happens:** Lazy customer creation seems simpler at signup. Webhook correlation breaks because Stripe knows the customer but the app doesn't.

**Consequences:** Stripe events arrive with a `customer` ID that maps to no user in the database. Subscriptions not updated. Users in broken state (paying but on Free).

**Prevention:**
- Create a Stripe Customer on every user signup (in the `authStateChange` callback or a Supabase database trigger/edge function on `auth.users` insert).
- Store `stripe_customer_id` in the `user_profiles` table immediately.
- Webhook handler always looks up user by `stripe_customer_id` — this field must exist before any webhook can fire.

**Detection:** Sign up a new user. Check `user_profiles` table — `stripe_customer_id` should be populated immediately, before any subscription activity.

**Phase:** Phase 2 (Stripe + auth integration).

---

### Pitfall 12: Monthly Credit Reset Not Running or Running Multiple Times

**What goes wrong:** Monthly credit reset is typically implemented as a Supabase cron job (pg_cron) or a Vercel cron function. If the job fails silently, credits never reset and users exhaust their monthly allowance permanently. If the job fires multiple times (misconfigured schedule, duplicate trigger), users get 20 credits when they should get 10.

**Why it happens:** Cron jobs are fire-and-forget with no built-in retry-or-once-only guarantee. Timezone mismatches cause double-firing near month boundaries.

**Consequences:** Users permanently locked out on Free tier (no reset). Or users game the system with excess credits.

**Prevention:**
- Track last reset date: `last_reset_at TIMESTAMPTZ` on `user_credits`. Only reset if `last_reset_at < date_trunc('month', now())`.
- Make the reset idempotent: `UPDATE user_credits SET credits_remaining = plan_limit, last_reset_at = now() WHERE last_reset_at < date_trunc('month', now())`.
- Log every reset execution with row count affected.
- Use Supabase `pg_cron` (runs inside Postgres, more reliable than Vercel cron for DB operations):
  ```sql
  SELECT cron.schedule('monthly-credit-reset', '0 0 1 * *', $$
    UPDATE user_credits
    SET credits_remaining = plan_monthly_limit,
        last_reset_at = now()
    WHERE last_reset_at < date_trunc('month', now());
  $$);
  ```

**Detection:** Manually trigger the reset function twice in sequence. Second run should affect 0 rows.

**Phase:** Phase 2 (credit system).

---

### Pitfall 13: Supabase Service Role Key Exposed in Client-Side Code

**What goes wrong:** The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS policies entirely. If this key is used in client-side code (or accidentally included in Next.js `NEXT_PUBLIC_` environment variables), every browser request has god-mode database access.

**Why it happens:** Developers use the service role key to work around RLS during development, then forget to switch back. Or they copy the service role key into a `NEXT_PUBLIC_` variable for convenience.

**Consequences:** Complete database exposure. Any user can read, write, or delete any row in any table.

**Prevention:**
- `SUPABASE_SERVICE_ROLE_KEY` must only appear in server-side code (API routes, server components, Edge Functions).
- Never prefix it `NEXT_PUBLIC_`.
- Create a lint rule or pre-commit hook: `grep -r 'SUPABASE_SERVICE_ROLE_KEY' app/` should return zero results in client components.
- Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for all client-side Supabase clients.
- Server-side admin client created separately:
  ```typescript
  // lib/supabase-admin.ts — only imported in server files
  import { createClient } from '@supabase/supabase-js';
  export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // never NEXT_PUBLIC_
  );
  ```

**Detection:** Search codebase for `SUPABASE_SERVICE_ROLE_KEY`. Any match in `app/` client components = critical vulnerability.

**Phase:** Phase 1 (project setup). Enforce from day one, re-audit at every phase.

---

## Moderate Pitfalls

Mistakes that cause bugs, degraded UX, or rework — but not security breaches.

---

### Pitfall 14: n8n Workflow Receives No Error Signal Back to App

**What goes wrong:** n8n errors (AI API rate limit, image generation failure, timeout) don't reach the Next.js app. The generation record stays `pending` forever. No error is shown to the user, and the credit is not refunded.

**Prevention:**
- Add an error branch to the n8n workflow that POSTs to the callback endpoint with `{ status: 'failed', error_code: 'ai_rate_limit' }`.
- On `status: 'failed'`, refund the credit atomically: `UPDATE user_credits SET credits_remaining = credits_remaining + 1 WHERE user_id = p_user_id`.
- Show a clear error message to the user with a retry option.

**Phase:** Phase 3 (generation workflow).

---

### Pitfall 15: Carousel History Missing Brand/Template Snapshot

**What goes wrong:** The carousel history table stores `brand_id`, `template_id`, and `image_style_id` as foreign keys. When a user edits their brand or a template changes, historical records now display the current (mutated) values instead of what was used at generation time.

**Prevention:**
- Store a JSON snapshot of the brand, template, and image style at generation time: `brand_snapshot JSONB`, `template_snapshot JSONB`.
- FK references for filtering/display; snapshots for historical accuracy.

**Phase:** Phase 3 (DB schema for generations).

---

### Pitfall 16: Stripe Plan Downgrade Not Enforced on Active Credits

**What goes wrong:** A Pro user (10 credits/month) downgrades to Free (3 credits/month) mid-month. They have 8 credits remaining. The Stripe webhook fires `customer.subscription.updated` but the app only updates the plan field — it doesn't cap their current balance to the Free tier limit.

**Prevention:**
- On plan downgrade webhook: `UPDATE user_credits SET credits_remaining = LEAST(credits_remaining, 3), plan = 'free' WHERE stripe_customer_id = $1`.
- The `LEAST()` function ensures credits don't exceed the new tier's limit.

**Phase:** Phase 2 (Stripe subscription management).

---

### Pitfall 17: Supabase Anon Key Used for Server-Side Operations That Need User Context

**What goes wrong:** Server-side API routes use the anon Supabase client (not the user's session). RLS policies require `auth.uid()` to return the user's ID. With the anon client, `auth.uid()` returns null — all RLS policies that check `auth.uid() = user_id` block the query, returning empty results or errors.

**Why it happens:** Developers create one global `supabaseClient` and use it everywhere — both on client (where auth session is attached) and on server (where it isn't).

**Prevention:**
- Server-side API routes must create an authenticated Supabase client using the user's JWT from the request:
  ```typescript
  import { createServerClient } from '@supabase/ssr';
  // Pass cookies from the request to preserve auth session
  const supabase = createServerClient(url, anonKey, { cookies: { ... } });
  ```
- Use `@supabase/ssr` package for Next.js App Router — this handles cookie-based session forwarding correctly.

**Phase:** Phase 1 (project setup). Getting this wrong means every server-side query fails silently.

---

### Pitfall 18: Image Download Broken by CORS on ImageBB URLs

**What goes wrong:** Browser-initiated downloads of ImageBB URLs fail silently because ImageBB doesn't set permissive CORS headers. `fetch()` from the browser to an ImageBB URL returns a CORS error. The download button does nothing.

**Prevention:**
- Proxy image downloads through a Next.js API route: `GET /api/download/image?url=<encoded>`. The server fetches from ImageBB (no CORS restriction server-side) and streams the response with `Content-Disposition: attachment`.
- Validate the URL in the proxy to prevent open redirect abuse: check that the URL matches `https://i.ibb.co/*` before fetching.

**Phase:** Phase 4 (download features).

---

## Minor Pitfalls

Annoying but recoverable.

---

### Pitfall 19: Supabase Auth Email Verification Redirect URL Not Set

**What goes wrong:** Supabase sends email verification links. If `NEXT_PUBLIC_SITE_URL` is not configured in Supabase Auth settings, the redirect goes to `localhost:3000` in production emails. Users in production click the link and land on localhost (which doesn't exist for them).

**Prevention:** Set Site URL and Redirect URLs in Supabase Dashboard > Auth > URL Configuration before going live. Include both the Vercel preview URL pattern and the production URL.

**Phase:** Phase 1 (auth setup).

---

### Pitfall 20: n8n MCP Workflow Edits Affecting Production Immediately

**What goes wrong:** The n8n MCP tool is used to inspect and edit the n8n workflow. Any edits made through n8n MCP apply to the live workflow immediately — there is no staging/preview workflow concept in n8n Cloud free tier.

**Prevention:**
- Before any MCP edit, duplicate the workflow in n8n Cloud (manual UI action). Keep the duplicate as a backup.
- Make MCP edits in small incremental steps. Test each change before proceeding.
- Document the pre-edit workflow state (export JSON via n8n MCP before making changes).

**Phase:** Phase 1 (n8n migration).

---

### Pitfall 21: Stripe Test/Live Mode Key Confusion

**What goes wrong:** Developers use live-mode Stripe keys in a development environment, creating real charges on test interactions. Or they deploy with test-mode keys, and no real subscriptions process.

**Prevention:**
- Environment variable naming convention: `STRIPE_SECRET_KEY` must be `sk_test_...` in `.env.local` and `sk_live_...` in Vercel production environment variables.
- Add a startup check: log `Stripe mode: ${process.env.STRIPE_SECRET_KEY?.startsWith('sk_test') ? 'TEST' : 'LIVE'}` on app boot.

**Phase:** Phase 2 (Stripe setup).

---

### Pitfall 22: Free Tier Always Lands on Paid Plan After Stripe Webhook

**What goes wrong:** When a user creates an account, they have no Stripe subscription. If the app's initial user creation logic or a stale webhook fires `customer.subscription.deleted`, the user's plan is set to `null` instead of defaulting back to `free`.

**Prevention:**
- Default plan on user creation: `INSERT INTO user_credits (user_id, plan, credits_remaining) VALUES ($1, 'free', 3)`.
- `subscription.deleted` webhook handler: set plan to `'free'`, credits to `0` (used their month), reset at next monthly cycle.

**Phase:** Phase 2 (Stripe + user model).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| DB schema creation | RLS not enabled on new tables | Add `ENABLE ROW LEVEL SECURITY` to every table migration |
| Auth + Supabase setup | Service role key in client code | Enforce server-only import at project setup |
| Auth + Supabase setup | Server routes missing user session context | Use `@supabase/ssr` for all server-side clients |
| Stripe integration | Webhook body parser consuming raw bytes | Use `request.text()` not `request.json()` in webhook route |
| Stripe integration | Stripe Customer not created on signup | Create Stripe Customer in signup handler, store immediately |
| Stripe integration | Plan downgrade not capping credits | Use `LEAST()` on credit update in downgrade webhook |
| Credit system | Race condition on concurrent generation | Use atomic SQL RPC `consume_credit()` function |
| Credit system | Monthly reset double-firing | Idempotent reset guarded by `last_reset_at` |
| Generation architecture | n8n timeout causing pending forever | Async fire-and-forget + callback endpoint + polling |
| Generation architecture | Callback endpoint unauthenticated | Per-generation token verification |
| Generation architecture | n8n errors not surfacing | Error branch in n8n workflow POSTing failed status + credit refund |
| Generation DB schema | Brand/template snapshot not stored | Store JSON snapshots at generation time |
| Download features | CORS blocking ImageBB downloads | Server-side proxy download route |
| Download features | PDF memory exhaustion | Client-side PDF generation with jsPDF, not Puppeteer |
| Image storage | ImageBB URL expiry | Proxy to Supabase Storage on callback receipt (or document limitation) |

---

## Sources

**Confidence note:** External web tools (WebSearch, WebFetch) were not available in this environment. All findings are drawn from production knowledge of:
- Supabase RLS documentation patterns and known failure modes (HIGH confidence — well-documented in official Supabase docs)
- Stripe webhook integration requirements — raw body requirement is officially documented and a known critical gotcha (HIGH confidence)
- Next.js App Router serverless constraints — Vercel timeout limits are publicly documented (HIGH confidence)
- Postgres atomic UPDATE semantics — SQL standard behavior (HIGH confidence)
- n8n Cloud architecture and webhook patterns — based on n8n documentation patterns (MEDIUM confidence — specific timeout behaviors should be verified against current n8n Cloud docs)
- ImageBB free tier reliability — based on community-reported behavior and free tier hosting limitations (MEDIUM confidence — verify current ImageBB ToS)
- PDF generation memory in serverless — known Puppeteer serverless limitation (HIGH confidence)

**For validation:** When web access is available, verify:
1. Current Vercel serverless timeout limits by plan (check vercel.com/docs/functions/runtimes)
2. Current ImageBB free API terms regarding image retention
3. Supabase `pg_cron` availability on free tier (may require Pro plan)
