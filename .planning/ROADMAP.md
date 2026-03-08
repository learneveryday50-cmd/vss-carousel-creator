# Roadmap: VSS Carousel Creator

## Overview

Build a multi-tenant SaaS platform that turns a raw text idea into a branded LinkedIn carousel in under a minute. The delivery order is dictated entirely by dependency: auth gates everything, brand data gates generation, billing/credits gate the generation endpoint, the n8n pipeline migration gates generation UI, and the generation dashboard is the core value loop that history and downloads depend on. Marketing and polish come last because they carry no technical risk and cannot be finalized until the product is functional.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Auth, database schema with RLS, and project scaffolding — everything else gates on this (completed 2026-03-04)
- [x] **Phase 2: Brand Onboarding** - Brand profile creation/edit, template catalog, and image style options — required inputs for generation (completed 2026-03-04)
- [x] **Phase 3: Billing and Credits** - Stripe Checkout, webhooks, Customer Portal, and credit system — must gate generation before dashboard is built (completed 2026-03-06)
- [ ] **Phase 4: n8n Workflow Migration** - Migrate existing n8n workflow from Airtable output to Supabase — unblocks generation UI
- [ ] **Phase 5: Generation Dashboard** - Core value loop: async generation, Realtime status, credit gate, post-success credit deduction, and carousel preview
- [ ] **Phase 6: History, Downloads, and Export** - Carousel history page, slide downloads, PDF export, and copy post text — retention driver
- [ ] **Phase 7: Landing Page and Polish** - Public marketing page, animations, and UI polish — no technical risk, executes last

## Phase Details

### Phase 1: Foundation
**Goal**: Users can create accounts, verify email, and access a secured application with a complete multi-tenant database schema enforcing RLS at the database level
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. User can sign up with email and password and receives a verification email
  2. User must confirm email before the dashboard is accessible — unverified users are redirected
  3. User session persists across browser refresh and tab close/reopen
  4. User can reset a forgotten password via an email link and set a new one
  5. All database tables have RLS enabled and enforce per-user data isolation — no user can query another user's rows
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Next.js 15 scaffold, @supabase/ssr client utilities (server/browser/admin), Framer Motion AuthCard, route group structure
- [ ] 01-02-PLAN.md — Seven-table Postgres schema with RLS policies on all tables, handle_new_user trigger for auto-profile creation
- [ ] 01-03-PLAN.md — Auth flows: signup, email verify, login redirect routing, password reset, middleware session guard

### Phase 2: Brand Onboarding
**Goal**: Users can define their brand identity and select from available templates and image styles — all required inputs are in place before generation can proceed
**Depends on**: Phase 1
**Requirements**: BRAND-01, BRAND-02, BRAND-03, TMPL-01, TMPL-02, TMPL-03, STYLE-01, STYLE-02, STYLE-03
**Success Criteria** (what must be TRUE):
  1. New user is guided through brand onboarding and can create a brand profile (name, primary/secondary colors, voice guidelines, product description, audience description, CTA text) before reaching the dashboard
  2. User can edit their brand profile after onboarding at any time
  3. 5-6 carousel templates are visible and selectable in the UI, each with a distinct front cover, content pages, and CTA page (placeholder assets acceptable)
  4. 4 built-in image styles are visible and selectable (Technical Annotation & Realism, Notebook, Whiteboard Diagram, Comic Strip Storyboard)
  5. User can add a custom image style name beyond the 4 built-in options
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Brand CRUD (multi-step onboarding wizard, create/edit/delete brand, Server Actions, /settings/brand pages)
- [x] 02-02-PLAN.md — Template & Style catalog (seed 5 templates + 4 built-in styles, TemplateGallery, StyleSelector, custom style creation)
- [x] 02-03-PLAN.md — Dashboard shell + Brand Switcher (sidebar nav, header, cookie-based brand selection, dashboard overview page)

### Phase 3: Billing and Credits
**Goal**: Users are on a plan, credits are tracked and visible, Stripe events reliably update plan state, and the generation endpoint will have a working credit gate to enforce
**Depends on**: Phase 1
**Requirements**: BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06, BILL-07
**Success Criteria** (what must be TRUE):
  1. Free-tier user has 3 credits/month visible in the dashboard header at all times
  2. User can upgrade to Pro ($29.99/month, 10 credits/month) via Stripe Checkout and the plan change is reflected immediately after the webhook is processed
  3. User can manage or cancel their subscription via the Stripe Customer Portal link
  4. Monthly credit reset occurs on the 1st of each month — credits are restored to the plan limit
  5. Free-tier user who has exhausted all 3 credits sees an upgrade prompt instead of the Generate button
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — Stripe SDK singleton (`src/lib/stripe/server.ts`), pg_cron migration for monthly free-tier credit reset, env var documentation
- [ ] 03-02-PLAN.md — Webhook Route Handler (`/api/stripe/webhook`): raw body + signature verification, idempotency, subscription event processing with admin writes
- [ ] 03-03-PLAN.md — Credit UI: usage_tracking data flow through layout → AppShell → Header → CreditBadge, CreditGate component, `/settings/billing` page with Checkout + Portal Server Actions, sidebar Billing nav entry

### Phase 4: n8n Workflow Migration
**Goal**: The existing n8n Cloud workflow writes generation results to Supabase instead of Airtable, and the end-to-end pipeline (webhook trigger → AI generation → Supabase write) is verified in isolation before the generation UI is built around it
**Depends on**: Phase 1
**Requirements**: N8N-01
**Success Criteria** (what must be TRUE):
  1. Triggering the n8n webhook with a test payload results in a carousel record being created or updated in the Supabase carousels table (not Airtable)
  2. n8n can authenticate to Supabase using a service role key stored as an n8n credential (key is never exposed to any client or logged)
  3. A duplicate of the original workflow exists as a backup before any edits are made via n8n MCP
**Plans**: 1 plan

Plans:
- [ ] 04-01-PLAN.md — n8n workflow migration (backup original workflow JSON, create Supabase service role Header Auth credential, replace Airtable output nodes with HTTP Request nodes, end-to-end smoke test via PATCH to carousels table)

### Phase 5: Generation Dashboard
**Goal**: Users can generate a branded carousel from a text idea, see live status updates, view the result as a preview, and have exactly one credit deducted only on success — failed generations do not cost credits
**Depends on**: Phase 2, Phase 3, Phase 4
**Requirements**: GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, GEN-06, GEN-07, GEN-08, GEN-09, GEN-10, N8N-02, N8N-03, N8N-04
**Success Criteria** (what must be TRUE):
  1. User can enter an idea, select a brand, select a template, and select an image style, then click Generate
  2. User with 0 credits cannot trigger generation — the endpoint rejects the request and no n8n call is made
  3. After clicking Generate, user sees a "Generating" status indicator without the page blocking or timing out
  4. When generation completes successfully, the carousel preview (slide images + post body text) is displayed and exactly 1 credit is deducted from the user's balance
  5. When generation fails or errors, no credit is deducted and the user sees a failure state
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md — consume_credit() PostgreSQL RPC migration (atomic FOR UPDATE credit deduction, SECURITY DEFINER, race-condition-safe)
- [ ] 05-02-PLAN.md — Generation API routes (POST /api/generate: auth + consume_credit + insert carousel + fire-and-forget n8n; GET /api/generate/status: poll carousel by id)
- [ ] 05-03-PLAN.md — Generation UI (CreatorWorkflow: generation state machine, polling loop, credit gate; PreviewPanel: config/processing/completed/failed render modes with Framer Motion AnimatePresence)

### Phase 6: History, Downloads, and Export
**Goal**: Users can browse all their past carousels, re-download slides, export a full PDF, and copy post text — closing the full value loop and giving users a reason to return
**Depends on**: Phase 5
**Requirements**: HIST-01, HIST-02, HIST-03, HIST-04, HIST-05, HIST-06
**Success Criteria** (what must be TRUE):
  1. User can navigate to a history page listing all their generated carousels with slide preview, original idea, brand, template, image style, and date
  2. User can delete a carousel entry from their history
  3. User can copy the post body text of any historical carousel to clipboard
  4. User can download individual carousel slides as PNG/JPG files
  5. User can download a full carousel as a PDF containing all slides
**Plans**: TBD

Plans:
- [ ] 06-01: History page (server-rendered, RLS-scoped carousel list, entry metadata display, delete action)
- [ ] 06-02: Downloads and export (server-side proxy route for ImageBB slide downloads to avoid CORS, client-side PDF generation, copy-to-clipboard post text)

### Phase 7: Landing Page and Polish
**Goal**: The product has a public marketing presence that converts visitors to sign-ups, and the entire application meets the Resume.io-quality visual bar with animations
**Depends on**: Phase 6
**Requirements**: MKT-01, MKT-02
**Success Criteria** (what must be TRUE):
  1. Public landing page is live with product copy, pricing comparison (Free vs Pro), and CTAs that link to the sign-up flow
  2. Landing page uses the Resume.io aesthetic: modern minimalist light theme, clean typography, tasteful animations
  3. All interactive UI elements across the app have loading states, error states, and smooth transitions powered by Framer Motion
**Plans**: TBD

Plans:
- [ ] 07-01: Landing page (hero, features, pricing section, sign-up CTAs, Resume.io aesthetic)
- [ ] 07-02: UI polish (Framer Motion slide transitions, loading/error states audit, mobile-responsive layout verification)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

Note: Phases 2, 3, and 4 all depend on Phase 1 but not on each other. Phase 3 and Phase 4 can be worked in parallel after Phase 1 completes. Phase 2 should precede Phase 3/4 since brand data drives generation quality decisions.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete   | 2026-03-04 |
| 2. Brand Onboarding | 3/3 | Complete   | 2026-03-04 |
| 3. Billing and Credits | 3/3 | Complete   | 2026-03-06 |
| 4. n8n Workflow Migration | 0/1 | Not started | - |
| 5. Generation Dashboard | 1/3 | In Progress|  |
| 6. History, Downloads, and Export | 0/2 | Not started | - |
| 7. Landing Page and Polish | 0/2 | Not started | - |
