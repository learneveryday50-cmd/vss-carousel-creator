# Requirements: VSS Carousel Creator

**Defined:** 2026-03-03
**Core Value:** Turn a raw idea into a branded, ready-to-post LinkedIn carousel in under a minute — without ever opening a design tool.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User receives email verification after signup and must confirm before accessing dashboard
- [x] **AUTH-03**: User session persists across browser refresh
- [x] **AUTH-04**: User can reset password via email link

### Brand

- [x] **BRAND-01**: User can create a single brand profile during onboarding
- [x] **BRAND-02**: Brand profile includes: name, primary/secondary colors, voice guidelines, product description, audience description, CTA text
- [x] **BRAND-03**: User can edit their brand profile after onboarding

### Templates

- [x] **TMPL-01**: 5–6 carousel templates are available for selection (placeholder assets for v1, final designs swapped in later)
- [x] **TMPL-02**: Each template has a front cover page, consistent content pages, and a CTA page
- [ ] **TMPL-03**: Template assets are hosted as URLs (either self-hosted or user-provided) and passed to n8n at generation time

### Image Styles

- [x] **STYLE-01**: 4 built-in image styles available: Technical Annotation & Realism, Notebook, Whiteboard Diagram, Comic Strip Storyboard
- [ ] **STYLE-02**: User can add custom image style names beyond the 4 built-in options
- [ ] **STYLE-03**: Selected image style name is passed to n8n at generation time

### Generation

- [ ] **GEN-01**: User can input an idea (text) on the dashboard
- [ ] **GEN-02**: User must select a brand, a carousel template, and an image style before generating
- [ ] **GEN-03**: System checks user has credits remaining before triggering n8n — users with 0 credits cannot generate
- [ ] **GEN-04**: On Generate, system triggers the n8n webhook asynchronously (fire-and-forget)
- [ ] **GEN-05**: Generation status is shown to user: Generating → Completed or Failed
- [ ] **GEN-06**: On successful n8n response, 1 credit is deducted from user's usage balance
- [ ] **GEN-07**: On failed or errored n8n response, no credit is deducted
- [ ] **GEN-08**: n8n returns ImageBB URLs for each carousel slide and a post body text string
- [ ] **GEN-09**: Generated carousel (slides + post body) is displayed as a preview after successful generation
- [ ] **GEN-10**: Each generation record is linked to: original idea, brand, template, image style, and timestamp

### History & Library

- [ ] **HIST-01**: User can view a history page listing all generated carousels
- [ ] **HIST-02**: Each history entry shows: carousel slides preview, original idea, brand, template, image style, generation date
- [ ] **HIST-03**: User can delete a carousel from their history
- [ ] **HIST-04**: User can copy the generated post body text to clipboard from history
- [ ] **HIST-05**: User can download individual carousel slides as image files (PNG/JPG)
- [ ] **HIST-06**: User can download the full carousel as a PDF

### Billing & Credits

- [ ] **BILL-01**: Free tier: 3 carousel generations per month, resets on the 1st of each month
- [ ] **BILL-02**: Pro tier: $29.99/month, 10 carousel generations per month, resets monthly
- [ ] **BILL-03**: User can subscribe to Pro via Stripe Checkout
- [ ] **BILL-04**: User can manage/cancel subscription via Stripe Customer Portal
- [ ] **BILL-05**: Stripe webhooks update user plan and credit balance on subscription events (created, updated, cancelled, renewed)
- [ ] **BILL-06**: Credit balance is visible to the user at all times (e.g. in dashboard header)
- [ ] **BILL-07**: Users on Free tier who exhaust credits see an upgrade prompt

### n8n Integration

- [ ] **N8N-01**: Existing n8n Cloud workflow is migrated from Airtable output nodes to Supabase output nodes using the n8n MCP
- [ ] **N8N-02**: n8n workflow receives: idea text, brand data (name, colors, voice, product, audience, CTA), template identifier/URL, image style name
- [ ] **N8N-03**: n8n workflow returns: array of ImageBB slide URLs, post body text string
- [ ] **N8N-04**: n8n callback/result is authenticated to prevent result injection from unauthorized sources

### Marketing

- [ ] **MKT-01**: Public landing page with strong copy, Resume.io-inspired design, modern minimalist light theme, and animations
- [ ] **MKT-02**: Landing page includes CTAs to sign up for Free and Pro tiers

## v2 Requirements

### Authentication

- **AUTH-V2-01**: OAuth login (Google, GitHub) — adds complexity, not needed for v1

### Brand

- **BRAND-V2-01**: Multiple brand profiles per user — needed for agency use case, deferred

### Generation

- **GEN-V2-01**: Regenerate a carousel with modified inputs from history

### Notifications

- **NOTF-V2-01**: Email notification when generation completes (for slow generations)

### Admin

- **ADMIN-V2-01**: Admin dashboard for usage analytics and user management

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auto-posting to social media | Not part of core value; users post manually |
| Drag-and-drop carousel editor | Product is AI-generation, not a canvas editor |
| Mobile app | Web-first for v1 |
| Real-time collaboration / team workspaces | Single-user per account for v1 |
| Self-hosted n8n | Using n8n Cloud only |
| Video or animated carousels | Static images only for v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete (01-01) |
| AUTH-04 | Phase 1 | Complete |
| BRAND-01 | Phase 2 | Complete |
| BRAND-02 | Phase 2 | Complete |
| BRAND-03 | Phase 2 | Complete |
| TMPL-01 | Phase 2 | Complete |
| TMPL-02 | Phase 2 | Complete |
| TMPL-03 | Phase 2 | Pending |
| STYLE-01 | Phase 2 | Complete |
| STYLE-02 | Phase 2 | Pending |
| STYLE-03 | Phase 2 | Pending |
| BILL-01 | Phase 3 | Pending |
| BILL-02 | Phase 3 | Pending |
| BILL-03 | Phase 3 | Pending |
| BILL-04 | Phase 3 | Pending |
| BILL-05 | Phase 3 | Pending |
| BILL-06 | Phase 3 | Pending |
| BILL-07 | Phase 3 | Pending |
| N8N-01 | Phase 4 | Pending |
| GEN-01 | Phase 5 | Pending |
| GEN-02 | Phase 5 | Pending |
| GEN-03 | Phase 5 | Pending |
| GEN-04 | Phase 5 | Pending |
| GEN-05 | Phase 5 | Pending |
| GEN-06 | Phase 5 | Pending |
| GEN-07 | Phase 5 | Pending |
| GEN-08 | Phase 5 | Pending |
| GEN-09 | Phase 5 | Pending |
| GEN-10 | Phase 5 | Pending |
| N8N-02 | Phase 5 | Pending |
| N8N-03 | Phase 5 | Pending |
| N8N-04 | Phase 5 | Pending |
| HIST-01 | Phase 6 | Pending |
| HIST-02 | Phase 6 | Pending |
| HIST-03 | Phase 6 | Pending |
| HIST-04 | Phase 6 | Pending |
| HIST-05 | Phase 6 | Pending |
| HIST-06 | Phase 6 | Pending |
| MKT-01 | Phase 7 | Pending |
| MKT-02 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 42 total
- Mapped to phases: 42
- Unmapped: 0 (corrected from prior count of 39 — recount verified 42 listed requirements)

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 — traceability expanded to individual rows, count corrected to 42*
