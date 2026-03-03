# VSS Carousel Creator

## What This Is

A multi-tenant SaaS platform that transforms text ideas into branded LinkedIn/social media carousels using AI generation via n8n workflows. Users sign up, define their brand identity, choose a template and image style, then generate polished carousel content — returned as downloadable images and ready-to-copy post text. No design tools required.

## Core Value

Turn a raw idea into a branded, ready-to-post LinkedIn carousel in under a minute — without ever opening a design tool.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Marketing landing page with Resume.io-inspired design, modern minimalist light theme, animations
- [ ] User sign up with email/password + email verification via Supabase Auth
- [ ] User login + persistent sessions
- [ ] Brand onboarding: name, colors, voice guidelines, product/audience info, CTA text
- [ ] Dashboard: input idea, select brand, template, and image style, then Generate
- [ ] Credit system: Free tier (3/month), Pro tier ($29.99/month, 10/month), monthly reset
- [ ] Stripe subscription management + webhooks for plan changes and renewals
- [ ] n8n webhook trigger on Generate — sends idea, brand, template, image style
- [ ] n8n returns ImageBB slide URLs + post body text stored in Supabase
- [ ] Carousel preview display after generation
- [ ] Carousel history: view all generations with original idea, brand, template, image style
- [ ] Download individual carousel slides as images
- [ ] Download full carousel as PDF
- [ ] Copy generated post body text to clipboard
- [ ] 5–6 carousel templates (placeholder designs now, finalize later) — each with front cover, content pages, CTA page
- [ ] 4 built-in image styles + user-defined custom styles (Technical/Realism, Notebook, Whiteboard Diagram, Comic Strip Storyboard)
- [ ] Migrate existing n8n workflow from Airtable → Supabase using n8n MCP

### Out of Scope

- Auto-posting to social media — user downloads/copies and posts manually
- Mobile app — web-first
- Real-time collaboration or multi-user workspaces — single-user per account for v1
- Self-hosting n8n — using n8n Cloud only
- Custom domain per tenant — not needed for v1

## Context

- Existing n8n Cloud workflow already generates carousel images (stored on ImageBB) and post text (stored in Airtable) — migration to Supabase is a key early task
- n8n MCP (GitHub-based) will be used to inspect and edit the n8n workflow programmatically
- Templates are visual overlays/styles applied during n8n image generation — assets will be placeholder URLs initially, final URLs provided later
- Images are hosted on ImageBB (free tier) as part of the n8n workflow — no separate image storage needed on our side
- Design reference: Resume.io — clean, confident, modern minimalist light theme with tasteful animations
- Supabase RLS (Row Level Security) enforces multi-tenant data isolation

## Constraints

- **Tech Stack**: Next.js + TypeScript, Supabase (auth + DB), Stripe, n8n Cloud, Vercel — no deviation
- **Image Storage**: ImageBB via n8n — we do not store image files ourselves
- **Templates**: Placeholder assets for v1; final designs swapped in later via URL update
- **n8n**: Existing workflow must be adapted (not rebuilt) using n8n MCP
- **Design**: Light theme only, Resume.io aesthetic, animations required — no dark mode for v1
- **Credits**: Monthly reset (not lifetime) — Free: 3/month, Pro: 10/month at $29.99

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + TypeScript | Standard for Supabase + Vercel stack, App Router for server components | — Pending |
| Supabase RLS for multi-tenancy | Row-level security enforces isolation at DB level without custom middleware | — Pending |
| ImageBB via n8n for image storage | Already working in existing workflow, zero extra cost | — Pending |
| Credit-based usage tracking (not seat-based) | Predictable for users, clean Stripe integration | — Pending |
| Placeholder templates first | Unblocks build without waiting for final design assets | — Pending |
| n8n MCP for workflow migration | Programmatic editing of existing workflow rather than manual rebuilding | — Pending |

---
*Last updated: 2026-03-03 after initialization*
