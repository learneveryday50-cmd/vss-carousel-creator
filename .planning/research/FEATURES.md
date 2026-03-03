# Feature Landscape

**Domain:** LinkedIn/Social Media Carousel Creator SaaS (AI-powered)
**Researched:** 2026-03-03
**Confidence note:** Web search and WebFetch tools were unavailable during this session. Findings are based on training-data knowledge of tools in this category (Taplio, Carousel.io, Canva, Postly, Slidesgo carousel export, AuthoredUp, Lempod) cross-referenced with PROJECT.md requirements. Confidence is MEDIUM for category patterns (well-established space), LOW for specific competitor feature details.

---

## Table Stakes

Features users expect from any carousel creation tool. Missing = product feels incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Email/password auth with email verification | Industry-standard security expectation | Low | Supabase Auth handles this — already in scope |
| Persistent login sessions | Users rage-quit if they log out on refresh | Low | Supabase session management |
| Brand identity storage (name, colors, fonts) | Every serious creator works with consistent brand; re-entering brand info per generation is a dealbreaker | Medium | Multi-field form; stored per user in DB |
| At least 5 template options | Users expect visual variety; 1-2 templates signals toy product | Medium | 5-6 templates in scope as placeholders first |
| AI content generation from a text idea | This IS the product — absence is fatal | High | Core n8n workflow |
| Carousel preview before download | Users must see output before committing to download | Medium | Slide-by-slide preview display |
| Download individual slides as images | Minimum viable export — users need files | Low | Already in scope (PNG/JPEG per slide) |
| Carousel history / past generations | Users return to repurpose content; no history = content is "lost" | Medium | History list with idea, brand, template, style metadata |
| Copy generated post text to clipboard | LinkedIn post body is half the value; one-click copy is expected | Low | Simple clipboard API call |
| Clear usage/credit indicator | Users need to know how many generations they have left | Low | Header badge or dashboard widget showing X/N credits remaining |
| Billing / plan management self-serve | Users expect to upgrade, downgrade, or cancel without contacting support | Medium | Stripe Customer Portal covers most of this |
| Responsive web UI | Creators check their tools on laptop and sometimes tablet | Medium | Next.js responsive design |
| Onboarding flow for brand setup | First-time users land confused without guided brand input | Medium | Multi-step wizard: brand name → colors → voice → audience → CTA |
| Error states and loading indicators | AI generation takes time; spinners and errors are expected polish | Low | UX states for pending, success, failure |

---

## Differentiators

Features that set a product apart. Not universally expected, but drive retention and word-of-mouth when done well.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Image style selection (e.g., Realism, Notebook, Comic, Whiteboard) | Unique visual identity per carousel — makes content feel distinctive, not template-cookie-cutter | High | 4 built-in styles + user-defined custom styles already in scope |
| AI-generated images matched to slide content | Carousel images that actually illustrate the content, not stock photos | High | Core of the n8n workflow — major differentiator vs text-only tools |
| Sub-60-second generation time | Speed is a killer feature; if it's fast, users talk about it | High | Dependent on n8n + ImageBB pipeline performance |
| Custom image style input (user-defined) | Power users define their aesthetic; builds loyalty | Medium | "Custom style" text prompt passed to n8n |
| Voice guidelines stored in brand profile | AI content reflects user's tone (casual, authoritative, inspirational) — not generic | Medium | Brand onboarding field; fed into prompt as context |
| PDF download of full carousel | Share-ready document, useful for client pitches and repurposing | Medium | PDF compilation of all slides |
| Per-generation metadata in history | Idea, brand, template, and style recorded per generation — enables exact reproduction | Medium | History table with full generation params |
| Clean "Resume.io-style" UI aesthetic | SaaS design quality signals product quality; builds trust faster than feature lists | Medium | Light theme, animations, confident typography |
| Free tier with 3 credits/month | Lowers acquisition barrier; users can try before committing to $29.99/month | Low | Already in scope |
| Audience and product context in brand profile | AI knows who the carousel is for — outputs are more targeted | Medium | Additional brand onboarding fields; improves generation quality |
| CTA text stored per brand | Brand's call-to-action auto-populates on the CTA slide — saves repeated editing | Low | Simple field in brand profile |

---

## Anti-Features

Features to explicitly NOT build in v1. These are common scope creep traps in this category.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Auto-posting to LinkedIn/social media | Requires OAuth for LinkedIn, adds compliance surface (LinkedIn API restrictions), complex scheduling logic — wrong priority | Let users copy text + download images and post manually |
| In-browser carousel editor (drag-and-drop) | Canva and Figma already own this space; building a drag-and-drop editor is a 3-6 month detour | Commit to AI-generated output only; templates handle layout |
| Real-time collaboration / multi-user workspaces | Adds auth complexity, conflict resolution, and UX surface area with near-zero v1 demand | Single-user accounts; revisit post-PMF |
| Mobile app (iOS/Android) | Web-first is correct; native apps double the codebase and delay launch | Responsive web UI is sufficient for v1 |
| Team/agency plans with seat management | Complex billing, permissions, and brand sharing — solves a problem v1 users don't have yet | Solo accounts only; consider post-traction |
| Content calendar / scheduling | Requires LinkedIn API, scheduling infra, and reliability guarantees — a different product | Out of scope; users manage posting themselves |
| Analytics (post performance tracking) | Requires LinkedIn API integration and a data pipeline — a separate product dimension | Not in v1; focus on creation, not analytics |
| Built-in image editing (crop, filters, overlays) | Image output quality comes from the AI/n8n pipeline, not post-processing | Trust the generated output; if quality is wrong, fix the prompt/template |
| Canva/Figma integration | API integration complexity, design tool dependency — adds fragility | Self-contained product; no external design tool dependency |
| White-label / custom domains per tenant | Infrastructure overhead, DNS management, cert provisioning — not needed at this scale | Single domain for all users in v1 |
| Lifetime deals (LTD) | Creates perverse incentives and unsustainable cash flow expectations for a recurring-cost product | Monthly subscription (Free + Pro) only |

---

## Feature Dependencies

```
Auth (signup + login) → Everything else (all features gate on auth)

Brand onboarding → Generation (brand profile required to generate carousel)
Brand onboarding → History display (brand shown per-generation in history)

Generation → Carousel preview (preview depends on generation completing)
Generation → History (history entry written on generation complete)
Generation → Credit deduction (credits consumed on generation trigger)

Credit system → Free tier restriction (gating logic depends on credit count)
Credit system → Stripe subscription (Pro plan unlocks higher credit ceiling)

Stripe subscription → Plan management UI (users need to see and change their plan)
Stripe webhooks → Credit reset logic (monthly reset triggered by Stripe renewal events)

History → Download (re-download from history requires stored image URLs)
History → Copy post text (stored post body retrieved from history)

Template selection → Generation (template choice passed to n8n as a parameter)
Image style selection → Generation (style choice passed to n8n as a parameter)
```

---

## MVP Recommendation

Prioritize (ship in this order):

1. Auth + brand onboarding — gates everything; users cannot generate without a brand profile
2. Generation core (n8n webhook trigger + response handling) — this IS the product
3. Carousel preview + credit system — users must see output and understand usage limits
4. Download (individual slides + PDF) + copy post text — completes the core value loop
5. History — strong retention driver; users return when they can repurpose past generations
6. Billing (Stripe subscription + Customer Portal) — required for Pro tier monetization

Defer to post-v1:

- Custom image style (user-defined): powerful differentiator but adds prompt-engineering complexity; ship the 4 built-in styles first and validate demand for custom
- Advanced brand fields (audience, product, CTA text): ship minimal brand form first (name + colors + voice), expand fields based on output quality feedback
- PDF download: lower priority than individual slide downloads; add after core loop is validated

---

## Onboarding Flow Detail

The onboarding flow deserves specific attention because it directly determines generation quality. A weak brand profile produces generic AI output, which is the primary churn trigger in this category.

### Recommended Multi-Step Brand Onboarding Wizard

| Step | Fields | Purpose |
|------|--------|---------|
| 1. Brand basics | Brand name, primary color, secondary color | Visual identity for templates |
| 2. Voice & tone | Voice guidelines (free text, 2-3 sentences), tone selector (optional: Professional / Casual / Inspirational / Educational) | AI content tone |
| 3. Audience & product | Target audience description, product/service description | AI content relevance |
| 4. Call to action | CTA text (e.g., "Follow for more", "DM me to learn more") | Auto-populate CTA slide |
| 5. Confirmation | Preview of brand summary, "Generate my first carousel" CTA | Converts immediately after setup |

**Complexity:** Medium. This is a standard multi-step form. No unusual technical risk. Main risk is user drop-off between steps — keep each step to 2-3 fields maximum.

---

## Credit System Detail

| Tier | Credits/Month | Price | Reset |
|------|--------------|-------|-------|
| Free | 3 | $0 | Monthly (calendar month) |
| Pro | 10 | $29.99/month | Monthly (Stripe renewal date) |

**Key UX decisions:**
- Show remaining credits prominently on dashboard (e.g., "2 of 3 generations remaining this month")
- Soft wall when credits = 0: show upgrade prompt, not a generic error
- Hard wall: block the Generate button when credits = 0 with "Upgrade to Pro" CTA
- Credits reset on Stripe `invoice.paid` webhook event (Pro) or on calendar month boundary (Free, handled by scheduled function)

**Complexity:** Medium. The logic itself is simple (decrement on generation, reset on schedule). The complexity is in the Stripe webhook handling and edge cases (failed payments, mid-month upgrades, downgrade timing).

---

## History / Library Management Detail

| Attribute stored per generation | Purpose |
|--------------------------------|---------|
| Original idea text | Context for repurposing |
| Brand used | Know which brand profile was active |
| Template used | Reproduce same visual style |
| Image style used | Reproduce same image aesthetic |
| Slide image URLs (ImageBB) | Re-download without regenerating |
| Generated post body text | Re-copy without regenerating |
| Timestamp | Chronological ordering |
| Credit cost | Transparency |

**Key UX decisions:**
- History is a list, not a gallery (list is faster to build, sufficient for v1)
- Each history item expands or links to a detail view with all metadata + re-download + re-copy actions
- No deletion in v1 (adds confirmation UX complexity; storage cost is negligible since images are on ImageBB)
- No search/filter in v1 (adds query complexity; revisit when users have 20+ generations)

**Complexity:** Medium. Standard CRUD read path. Main consideration is the data schema design — get it right up front to avoid migration later.

---

## Download / Export Detail

| Export type | Format | Complexity | Notes |
|-------------|--------|------------|-------|
| Individual slide | JPEG/PNG | Low | Direct link to ImageBB URL — may just be an anchor download link |
| Full carousel PDF | PDF | Medium | Client-side PDF compilation (e.g., jsPDF or pdf-lib) from slide image URLs |
| Post body text | Clipboard copy | Low | navigator.clipboard.writeText() |

**Key decisions:**
- Individual slide download: if ImageBB URLs are public and direct-linkable, this is a simple `<a href download>` — no server involvement needed
- PDF: compile slides client-side to avoid server-side PDF generation complexity; jsPDF is well-supported and sufficient for image-only PDFs
- No watermark on downloads in v1 (watermarks require image processing; adds complexity without validated need)

**Complexity:** Low-Medium overall. PDF generation is the only non-trivial piece.

---

## Sources

- Project context: `.planning/PROJECT.md` (authoritative for in-scope decisions)
- Domain knowledge: Training data knowledge of Taplio, Carousel.io, AuthoredUp, Canva carousel, Postly (as of August 2025 knowledge cutoff) — MEDIUM confidence for category patterns
- Note: Web search, WebFetch were unavailable during this research session. Competitor-specific feature details are based on training data, not live verification. Treat competitor comparisons as MEDIUM confidence and validate against live products before making competitive claims.
