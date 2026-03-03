# Project Research Summary

**Project:** VSS Code — SaaS Carousel Creator
**Domain:** AI-powered LinkedIn/Social Media Carousel Creator (multi-tenant SaaS)
**Researched:** 2026-03-03
**Confidence:** MEDIUM

## Executive Summary

VSS Code is a multi-tenant SaaS product that lets users generate AI-powered LinkedIn carousel slide decks from a text idea. The architecture is well-understood: Next.js App Router on Vercel, Supabase for auth and database, Stripe for subscription billing, and n8n Cloud as the external AI generation orchestrator. The product exists in an established category (Taplio, Carousel.io, AuthoredUp) and the core value proposition is speed + quality of AI-generated content with branded visual identity — not a drag-and-drop canvas editor. This scope constraint is important: resist the impulse to build a Canva clone. The AI pipeline and the generation UX are the entire product.

The recommended build approach follows a strict dependency graph: auth and database schema must come first (every feature gates on it), then brand onboarding (required before any generation), then Stripe + credits in parallel with n8n workflow migration, then the generation dashboard, then history and downloads, and finally the landing page and polish. The most dangerous phase is generation (Phase 5) — it sits at the intersection of Stripe credits, the external n8n async workflow, and the real-time status update path. The async fire-and-forget pattern for n8n is mandatory, not optional, because Vercel serverless functions will time out waiting for a 30-90 second AI generation.

The top security risks are RLS misconfiguration (cross-tenant data leaks), service role key exposure, and Stripe webhook raw body handling. All three are easy to get wrong and catastrophic to get wrong — each must be treated as a Phase 1 concern and audited at every subsequent phase. The ImageBB dependency is a known reliability risk for image persistence and should be documented as a v1 limitation with a v2 migration plan to Supabase Storage.

---

## Key Findings

### Recommended Stack

The project uses a tightly integrated, vertically-integrated stack that minimizes third-party dependencies while leveraging managed services for auth, database, payments, and AI orchestration. Every technology choice serves a specific purpose in this architecture with limited overlap.

**Core technologies:**
- **Next.js 15 + TypeScript 5 (App Router):** Full-stack framework — React Server Components for data-fetch pages, Client Components for interactive editor and forms. Zero-config Vercel deploy. Middleware handles auth guards at the CDN edge.
- **Supabase (Auth + Postgres + RLS):** Single SDK for both auth and database. Row Level Security enforces per-user data isolation at the DB level — last-line defense even if app logic has bugs. `@supabase/ssr` package is required for App Router (NOT the deprecated `@supabase/auth-helpers-nextjs`).
- **Stripe (Node SDK + Stripe.js):** Subscription billing, Checkout, and Customer Portal. Webhook handler must consume raw request body via `req.text()` — this is non-negotiable.
- **n8n Cloud:** External AI generation workflow that already exists. Receives a webhook trigger from Next.js and writes results back directly to Supabase via the REST API with a service role key. This avoids needing a Next.js callback endpoint.
- **Konva.js + react-konva:** Canvas layer for carousel preview display. Recommended over Fabric.js due to declarative React API, better TypeScript, lighter bundle. Note: the project is NOT building a drag-and-drop editor — Konva is for preview rendering, not interactive editing.
- **Zustand + TanStack Query v5:** Client state (editor/UI) and server state (data fetching) kept separate. Do not use Context API for editor state — causes full re-renders on canvas.
- **Framer Motion 11:** Slide transition animations and UI micro-interactions. Spring-based physics match the Resume.io aesthetic.
- **@react-pdf/renderer:** Server-side PDF export via React component rendering. Avoid Puppeteer on Vercel serverless (bundle size + cold start kill this approach).
- **Tailwind CSS v4 + shadcn/ui:** Utility CSS for Resume.io-style polish. shadcn is copy-pasted components (not a package), based on Radix UI for accessibility.
- **html-to-image + JSZip + file-saver:** Client-side per-frame PNG/JPEG export and zip download.

**Version verification required before implementation:** All version numbers in STACK.md are from training data (August 2025 cutoff) and must be verified on npmjs.com and official docs before coding begins. See STACK.md for full verification checklist.

### Expected Features

Features research is based on category analysis of Taplio, Carousel.io, AuthoredUp, and Canva carousel tooling (MEDIUM confidence, live product verification unavailable).

**Must have (table stakes):**
- Email/password auth with email verification and persistent sessions
- Brand identity storage (name, colors, voice, audience, CTA) — weak brand profile = generic AI output = churn
- At least 5 templates and 4 image style options
- AI content generation from a text idea (the core product)
- Carousel preview before download
- Individual slide download as PNG/JPEG
- Carousel history with full generation metadata
- Copy generated post text to clipboard
- Credit usage indicator (remaining/total)
- Self-serve billing and plan management via Stripe Customer Portal
- Onboarding wizard for brand setup — required before first generation
- Loading states and error states for all async operations

**Should have (differentiators):**
- AI-generated images matched to slide content (not stock photos) — major differentiator vs text-only tools
- Sub-60-second generation time — speed is a word-of-mouth trigger
- Custom image style input (user-defined prompt)
- Voice guidelines in brand profile fed into AI prompt as context
- PDF download of full carousel
- Per-generation metadata snapshot in history (enables exact reproduction)
- Resume.io-style visual quality — design signals product trust
- Free tier with 3 credits/month — acquisition funnel

**Defer to v2+:**
- Custom image style (user-defined): validate demand for built-in 4 styles first
- Auto-posting to LinkedIn/social media: OAuth + API compliance is a different product dimension
- Team/agency plans with seat management
- Real-time collaboration
- Analytics and post performance tracking
- Mobile native app
- Content calendar / scheduling

**Feature dependency chain:** Auth gates everything. Brand onboarding gates generation. Generation gates preview, history, and credits. Credits gate Stripe. History gates downloads.

### Architecture Approach

The architecture is a standard Next.js + Supabase SaaS pattern with one meaningful external dependency: n8n Cloud as the AI generation orchestrator. The key architectural decision is the async generation pattern — the Next.js `/api/generate` route fires a POST to n8n, immediately returns a `carousel_id` to the browser, and n8n writes results directly to Supabase when complete. The browser uses Supabase Realtime to detect the status change. This avoids Vercel serverless timeout entirely.

**Major components:**

1. **Next.js App Router (Vercel)** — Renders pages server-side using RSC with Supabase server client; Client Components for carousel preview, generation form, and auth forms; Middleware for auth guard on all protected routes; Route Handlers for API endpoints
2. **Supabase (Postgres + Auth + RLS)** — Five core tables: `profiles`, `brands`, `templates`, `image_styles`, `carousels`. RLS policy on every tenant-scoped table using `auth.uid() = user_id`. Service role key only used server-side. `pg_cron` for monthly credit reset.
3. **Stripe (Checkout + Webhooks + Customer Portal)** — Webhook handler on raw body at `/api/stripe/webhook`. Idempotency table (`stripe_webhook_events`) prevents duplicate event processing. Stripe Customer created eagerly on signup, not lazily on upgrade.
4. **n8n Cloud Workflow** — Triggered via POST webhook from Next.js. Receives brand, template, style, idea. Runs AI image generation, uploads to ImageBB, generates post text, then PATCHes Supabase `carousels` table directly via REST API using service role key.
5. **ImageBB CDN** — Image hosting for generated slides. Known reliability risk on free tier. Canonical URLs stored in Supabase; migration to Supabase Storage recommended for v2.

### Critical Pitfalls

The pitfalls research has HIGH overall confidence — these are well-documented production failure patterns, not theoretical risks.

1. **RLS disabled on new tables** — Supabase creates tables with RLS off by default. Every migration that creates a tenant-scoped table MUST include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Add a CI check: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false` should return empty. *Phase 1 + every phase that adds a table.*

2. **Stripe webhook raw body consumed before signature verification** — Using `req.json()` instead of `req.text()` breaks signature verification. All Stripe events silently fail: upgrades, renewals, cancellations never update the DB. Users pay but stay on Free forever. *Use `await request.text()` — no exceptions.* *Phase 3.*

3. **Credit race condition on concurrent generation** — Check-then-decrement is two operations; concurrent requests both pass the check. Prevention: atomic SQL RPC `consume_credit(user_id)` with `UPDATE ... WHERE credits_remaining > 0` in a single statement. *Phase 5.*

4. **n8n async timeout causing orphaned pending records** — Generation takes 30-90s; Vercel default timeout is 10s on Hobby. Must use fire-and-forget + Supabase Realtime status polling. Credit refund required if generation reaches `failed` status after timeout. *Phase 5.*

5. **Supabase service role key exposed to client** — Never prefix with `NEXT_PUBLIC_`. Never import `supabase-admin.ts` from client components. Add a pre-commit grep: `grep -r 'SUPABASE_SERVICE_ROLE_KEY' app/` must return zero results. *Phase 1 + ongoing audit.*

6. **Stripe Customer not created on signup** — Lazy creation breaks webhook correlation. Webhook handler can't find the user by `stripe_customer_id` if it was never stored. Create a Stripe Customer in the signup handler and store `stripe_customer_id` immediately. *Phase 3.*

7. **ImageBB URL expiry** — Free-tier images can disappear without notice. Store Supabase Storage copy on n8n callback, or document as known v1 limitation. *Decision required before launch.*

---

## Implications for Roadmap

Based on the dependency graph in ARCHITECTURE.md and the feature priority order in FEATURES.md, the following 7-phase structure is strongly recommended. This matches the build order derived from architecture research.

### Phase 1: Foundation — Auth, DB Schema, and Project Setup

**Rationale:** Every single feature gates on auth and the database schema. Schema decisions made here (RLS policies, indexes, column design) are costly to change later. Getting this phase wrong creates security vulnerabilities (RLS misconfiguration, service role key exposure) that are catastrophic to fix post-launch.

**Delivers:** Working sign up / login / email verification flow, complete database schema with all tables and RLS policies, Supabase client setup (server + browser + admin clients), Next.js App Router structure with route groups, auth middleware guard, all environment variables wired.

**Features addressed:** Email/password auth, persistent login sessions, auth redirect flows.

**Pitfalls to avoid:** RLS disabled on tables (P1), service role key in client code (P13), anon key used server-side without session context (P17), auth email redirect URL not configured (P19).

**Research flag:** Standard patterns — well-documented Next.js + Supabase setup. Skip additional research phase.

---

### Phase 2: Brand Onboarding Wizard

**Rationale:** Brand data is required input for generation. Cannot build the generation UI until the brand profile exists. The onboarding wizard is also the first UX impression — doing it well sets the quality signal for the entire product.

**Delivers:** Multi-step brand creation form (name, colors, voice, audience, CTA), brand read/update, redirect to dashboard after completion.

**Features addressed:** Brand identity storage, voice guidelines, audience/product context, CTA text, onboarding flow for brand setup.

**Pitfalls to avoid:** Store brand data with full schema — brand fields will be passed verbatim to n8n, so missing fields at this phase cause generation quality problems later.

**Research flag:** Standard CRUD + multi-step form patterns. Skip additional research phase.

---

### Phase 3: Stripe Billing and Credit System

**Rationale:** Credits are required to gate generation. The credit system and Stripe integration must exist before the generation dashboard can enforce limits. Stripe Customer must be created at signup (Phase 1 creates the user but Stripe Customer creation belongs here as a Phase 1/3 bridge — hook it to signup event).

**Delivers:** Stripe Products and Prices configured, Checkout Session creation endpoint, `/api/stripe/webhook` handler (with raw body + idempotency table), `stripe_webhook_events` table, credit display in header, Stripe Customer Portal link, plan upgrade/downgrade handling.

**Features addressed:** Billing/plan management self-serve, credit usage indicator, Free vs Pro plan enforcement.

**Pitfalls to avoid:** Raw body webhook (P3), idempotency guard (P4), Stripe Customer on signup (P11), plan downgrade credit cap with `LEAST()` (P16), monthly reset idempotency with `last_reset_at` (P12), Stripe test/live key confusion (P21).

**Research flag:** Stripe webhook integration has well-known patterns. Skip additional research phase. Verify current Stripe API version string before implementation.

---

### Phase 4: n8n Workflow Migration

**Rationale:** The existing n8n workflow writes to Airtable. Before generation can work, it must write to Supabase instead. This is a migration phase — no new UI — but it unblocks Phase 5 entirely. Test n8n → Supabase write path in isolation before building the UI around it.

**Delivers:** n8n workflow nodes updated to use Supabase HTTP nodes instead of Airtable nodes, tested carousel record creation via n8n, tested status update (pending → complete), n8n webhook secret configured.

**Features addressed:** Internal pipeline — no user-visible features delivered here.

**Pitfalls to avoid:** n8n callback endpoint unauthenticated (P10) — if using callback pattern, add secret header validation. Recommend Option B (n8n writes directly to Supabase) to eliminate this attack surface. n8n MCP live-edit risk (P20) — duplicate workflow before editing.

**Research flag:** n8n HTTP node behavior needs verification against current n8n Cloud plan. Recommend a targeted research spike on the Supabase REST API PATCH syntax and n8n credential storage for service role key before implementation.

---

### Phase 5: Generation Dashboard and Carousel Preview

**Rationale:** This is the core product loop. All previous phases are prerequisites. This phase is the highest-risk phase technically — it crosses the async n8n boundary, real-time status updates, credit deduction, and the carousel preview display.

**Delivers:** `/api/generate` Route Handler (auth check, atomic credit deduction via `consume_credit()` RPC, fire-and-forget n8n POST, returns `carousel_id`), generation dashboard UI (idea input, brand selector, template selector, image style selector), Supabase Realtime listener for generation status, carousel preview page with slide display.

**Features addressed:** AI content generation (core), carousel preview, credit deduction, template selection, image style selection (4 built-in styles), loading/error states.

**Pitfalls to avoid:** Credit race condition atomic RPC (P5), n8n timeout async pattern (P6), n8n error signal back to app with credit refund (P14), brand/template snapshot stored at generation time (P15).

**Research flag:** Supabase Realtime subscription filter syntax evolves — verify current docs for `postgres_changes` filter before implementation. This is the phase most likely to benefit from a research spike.

---

### Phase 6: History, Downloads, and Export

**Rationale:** History is a strong retention driver — users return to repurpose past content. Downloads complete the core value loop (you generated it, now take it). This phase requires Phase 5 to have populated the `carousels` table.

**Delivers:** Carousel history list page (server-rendered, RLS-scoped), individual carousel detail page (preview + metadata), individual slide download (PNG/JPEG via proxy route to avoid CORS), full carousel PDF export (client-side with jsPDF, NOT Puppeteer), copy post text to clipboard.

**Features addressed:** Carousel history, re-download, re-copy post text, PDF download.

**Pitfalls to avoid:** CORS blocking ImageBB downloads — server-side proxy route required (P18). PDF memory exhaustion — use client-side jsPDF, not server Puppeteer (P8). ImageBB URL expiry — document limitation and decide on Supabase Storage migration timeline (P7).

**Research flag:** jsPDF + image embedding for multi-slide PDFs is a standard pattern. Skip additional research phase. Verify html-to-image Canvas support issues before implementing frame capture.

---

### Phase 7: Landing Page and UI Polish

**Rationale:** Marketing page and animations come last — they can only be finalized once the product is functional and design decisions are locked. Resume.io-style polish is a differentiator but not a blocker.

**Delivers:** Marketing landing page (pricing section, feature highlights, CTA to signup), Framer Motion slide transitions, final template thumbnails and visual polish, mobile-responsive layout verification.

**Features addressed:** Resume.io aesthetic, free tier acquisition funnel.

**Pitfalls to avoid:** No new security pitfalls. Be careful not to introduce client-side state management in what should be static pages.

**Research flag:** Standard Next.js marketing page + Framer Motion patterns. Skip additional research phase.

---

### Phase Ordering Rationale

- **Auth before everything:** Authentication is a dependency of all other features. There is no shortcut.
- **Brand before generation:** The n8n workflow requires brand fields. A generation endpoint without brand data produces useless output.
- **Stripe before generation dashboard:** The generation endpoint must enforce credit limits. Credits depend on the Stripe subscription state.
- **n8n migration in isolation (Phase 4):** Testing the n8n → Supabase pipeline without UI noise de-risks the hardest external integration. Problems discovered here are far cheaper to fix than mid-Phase 5.
- **Generation before history:** History has nothing to show until at least one generation completes.
- **Downloads after history:** Individual carousel pages are built as part of history — download actions live on those pages.
- **Polish last:** Aesthetic work does not deliver functional value and should not be on the critical path.

---

### Research Flags

**Phases needing deeper research before planning:**
- **Phase 4 (n8n migration):** Current n8n Cloud plan capabilities, Supabase REST API PATCH syntax for array fields (`slide_urls TEXT[]`), service role key credential storage in n8n — these need verification against live docs.
- **Phase 5 (Generation + Realtime):** Supabase Realtime `postgres_changes` filter syntax has evolved; verify current subscription API before coding.

**Phases with standard patterns (safe to plan without additional research):**
- **Phase 1** (Next.js + Supabase App Router setup): Extremely well-documented.
- **Phase 2** (Brand onboarding form): Standard multi-step form CRUD.
- **Phase 3** (Stripe webhooks): Stripe docs are authoritative and stable on raw body requirement.
- **Phase 6** (Downloads): jsPDF + image export are stable patterns.
- **Phase 7** (Landing page + Framer Motion): Standard patterns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Architecture patterns are stable and correct; specific version numbers are training-data estimates and MUST be verified on npmjs.com before installation. No web access was available during research. |
| Features | MEDIUM | Category patterns (table stakes, differentiators) are well-established. Competitor-specific feature details are from training data, not live product analysis. |
| Architecture | MEDIUM-HIGH | Core patterns (Supabase RLS, Stripe webhook raw body, Next.js App Router structure, n8n fire-and-forget) are stable and well-documented. `@supabase/ssr` API surface may have minor version changes — verify. |
| Pitfalls | HIGH | Security pitfalls (RLS, service role key, Stripe signature) are from official documentation and well-known production failure modes. Async timeout behavior and ImageBB reliability are MEDIUM confidence. |

**Overall confidence:** MEDIUM — sufficient to begin Phase 1 and 2 with confidence. Phase 4 and Phase 5 warrant targeted research spikes before implementation begins.

### Gaps to Address

- **Package versions:** Every version number in STACK.md must be verified before `npm install`. Run `npm outdated` post-install and investigate major version bumps.
- **`@supabase/ssr` API:** Verify `createServerClient` and middleware pattern against current Supabase docs before writing any auth code.
- **Supabase `pg_cron` on free tier:** Research whether `pg_cron` requires Supabase Pro plan. If yes, monthly credit reset must use a Vercel Cron Job instead — with idempotency guard (`last_reset_at`).
- **n8n Cloud plan capabilities:** Verify HTTP Request node availability, webhook timeout behavior, and service role key credential storage on the active n8n Cloud plan tier.
- **ImageBB URL expiry policy:** Check current ImageBB free API terms on image retention before deciding whether to build Supabase Storage fallback in v1 or defer.
- **Vercel timeout limits by plan:** Verify current Hobby vs Pro function timeout limits to confirm fire-and-forget is mandatory, not optional.
- **Konva / react-konva React 19 compatibility:** Verify react-konva is actively maintained and compatible with React 19 before committing to it for the preview layer.

---

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` — Authoritative project scope and requirements
- Stripe webhook documentation patterns (training data) — raw body requirement is officially documented and extremely stable
- Supabase RLS documentation patterns (training data) — `auth.uid()` pattern is core Supabase functionality
- Postgres atomic UPDATE semantics — SQL standard, high confidence
- Vercel serverless timeout limits — publicly documented platform constraint

### Secondary (MEDIUM confidence)
- Next.js App Router documentation (training data through August 2025) — App Router patterns stable since Next.js 13/14
- `@supabase/ssr` package documentation (training data) — API may have minor version changes since cutoff
- n8n Cloud HTTP node behavior (training data) — verify against current n8n docs
- Category feature analysis: Taplio, Carousel.io, AuthoredUp, Canva carousel (training data) — live verification not possible during research session

### Tertiary (LOW confidence)
- All specific version numbers (Next.js 15, Konva 9, Framer Motion 11, etc.) — training data estimates, must be verified on npmjs.com
- ImageBB free tier image retention behavior — community-reported, check current ToS
- Supabase `pg_cron` free tier availability — verify in Supabase dashboard before relying on it

---
*Research completed: 2026-03-03*
*Ready for roadmap: yes*
