# Requirements: VSS Carousel Creator

**Defined:** 2026-03-03
**Core Value:** Turn a raw idea into a branded, ready-to-post LinkedIn carousel in under a minute — without ever opening a design tool.

---

## v1.0 Requirements (Complete)

All v1.0 requirements fulfilled — auth, brand onboarding, billing/credits, n8n generation pipeline, carousel history, downloads, PDF export, landing page.

---

## v2.0 Requirements — Supabase Storage Migration

**Milestone goal:** Replace ImageBB with Supabase Storage for all new carousel slides. n8n is untouched — interception happens in the generation-done webhook server-side.

### STORE-01 — Supabase Storage bucket

A public Supabase Storage bucket named `carousel-slides` exists. Public reads allowed; authenticated writes via service role only.

**Acceptance:** Test image uploaded via service role is publicly readable at its Supabase Storage URL.

---

### STORE-02 — Webhook re-uploads images to Supabase Storage

When n8n fires `POST /api/webhook/generation-done` with `slide_urls` (ImageBB URLs), the route downloads each image from ImageBB and uploads to Supabase Storage before writing to the carousels table. Stored `slide_urls` contains Supabase Storage URLs, not ImageBB URLs.

**Acceptance:** After a new generation, `slide_urls` in the carousels table contains `https://<project>.supabase.co/storage/v1/object/public/carousel-slides/...` URLs.

---

### STORE-03 — Legacy carousel slides still load

Pre-migration carousels retain their ImageBB `slide_urls`. The download proxy (`/api/download`) continues to serve them.

**Acceptance:** /history with old carousels shows slides loading correctly. No broken images on legacy records.

---

### STORE-04 — Download route updated for Supabase Storage URLs

`/api/download` allowlist updated to accept Supabase Storage URLs in addition to ImageBB URLs.

**Acceptance:** Clicking download on a new Supabase-hosted slide downloads the correct image.

---

### STORE-05 — Webhook fallback on upload failure

If a Supabase Storage upload fails for any slide, the webhook falls back to storing the original ImageBB URL for that slide. No generation is lost.

**Acceptance:** Webhook responds within 30s for a 5-slide carousel. Partial upload failures degrade gracefully — affected slides use ImageBB fallback URL.

---

## Out of Scope (v2.0)

- Bulk migration of existing ImageBB URLs — legacy proxy handles them
- Changing n8n workflow in any way
- Signed (private) Supabase Storage URLs — public bucket sufficient
- Credit refund on failed generation — v3
- Any new features beyond storage migration
