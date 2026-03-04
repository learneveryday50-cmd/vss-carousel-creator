---
phase: 02-brand-onboarding
verified: 2026-03-04T00:00:00Z
status: human_needed
score: 5/5 must-haves verified
human_verification:
  - test: "Complete onboarding flow as a new user"
    expected: "After signing up and confirming email, user lands on /onboarding, fills in all 7 brand fields (name, primary_color, secondary_color, voice_guidelines, product_description, audience_description, cta_text), submits form, and is redirected to /dashboard"
    why_human: "Cannot run the app or interact with Supabase auth + DB from CLI; redirect flow and form submission require a live browser session"
  - test: "Edit brand profile from settings"
    expected: "Navigate to /settings/brand, click Edit on a brand, modify fields, submit — changes appear in brand list and dashboard brand card"
    why_human: "Requires live Supabase DB read/write round-trip and browser navigation"
  - test: "Template gallery visibility — 5 templates selectable"
    expected: "Navigate to /templates; 5 template cards visible in a responsive grid. Each card shows name, description, placeholder thumbnail, and a Select/Selected indicator. Clicking a card selects it with ring-2 ring-zinc-900 highlight."
    why_human: "Data lives in Supabase (seeded via SQL Editor); cannot verify row count or UI rendering without a live session"
  - test: "4 built-in image styles visible and selectable"
    expected: "Navigate to /templates; StyleSelector shows exactly 4 cards in a 2x2 grid labeled 'Technical Annotation & Realism', 'Notebook', 'Whiteboard Diagram', 'Comic Strip Storyboard'. Each has a distinct inline SVG icon. Clicking selects with dark background."
    why_human: "Built-in data is seeded in Supabase; requires live session to confirm rows exist after migration was applied"
  - test: "Add a custom image style"
    expected: "On /templates, type a name in the 'Style name...' input and click Add. The new style appears in the Custom styles list as a deletable pill. Clicking the X removes it."
    why_human: "Requires live Supabase insert + revalidatePath response visible in browser; cannot verify DB write from CLI"
  - test: "Brand switcher cookie persistence"
    expected: "Select a different brand via the header dropdown; reload the page. The same brand is still selected (cookie persists 30 days). Brand name and color swatch in header match the selected brand."
    why_human: "Cookie behavior requires a browser session; cannot verify httpOnly cookie round-trip from CLI"
  - test: "Sidebar navigation active state and disabled items"
    expected: "Sidebar shows Dashboard (active when at /dashboard), Templates, Brand. Billing and Generate items are rendered as non-clickable text with 'Phase 3' and 'Phase 5' labels. No hover/active styles on disabled items."
    why_human: "usePathname active state and visual disabled rendering require browser rendering"
---

# Phase 2: Brand Onboarding Verification Report

**Phase Goal:** Users can define their brand identity and select from available templates and image styles — all required inputs are in place before generation can proceed
**Verified:** 2026-03-04
**Status:** human_needed — all automated checks pass, human UI/integration testing required
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | New user is guided through brand onboarding and can create a brand profile (name, primary/secondary colors, voice guidelines, product description, audience description, CTA text) before reaching the dashboard | ? NEEDS HUMAN | Code path verified: onboarding/page.tsx checks getBrands() → redirects to /dashboard if brand exists, else renders OnboardingPanels with BrandForm containing all 7 fields → createBrandAction saves to Supabase → redirects to /dashboard. Live flow requires human. |
| 2 | User can edit their brand profile after onboarding at any time | ? NEEDS HUMAN | Code path verified: /settings/brand lists brands with Edit links → /settings/brand/[id]/edit pre-fills BrandForm with brand data → updateBrandAction saves changes → revalidatePath + redirect. Live DB round-trip requires human. |
| 3 | 5-6 carousel templates are visible and selectable in the UI, each with a distinct front cover, content pages, and CTA page (placeholder assets acceptable) | ? NEEDS HUMAN | TemplateGallery + TemplateCard fully implemented and wired to getTemplates(). DB schema has cover_url, content_url, cta_url columns (all null placeholders — acceptable per criteria). Seed SQL inserts 5 templates idempotently. Whether seed was successfully applied to live Supabase requires human confirmation. |
| 4 | 4 built-in image styles are visible and selectable (Technical Annotation & Realism, Notebook, Whiteboard Diagram, Comic Strip Storyboard) | ? NEEDS HUMAN | StyleSelector renders builtIns (is_custom=false) in 2x2 grid with per-style inline SVG icons for all 4 exact names. Seed SQL inserts all 4 styles. DB confirmation and UI rendering requires human. |
| 5 | User can add a custom image style name beyond the 4 built-in options | ? NEEDS HUMAN | AddCustomStyleForm in StyleSelector calls createCustomStyleAction via useActionState, which calls createCustomStyle() → Supabase insert with is_custom=true + user_id. Wiring confirmed in code. Live DB write requires human. |

**Score:** 5/5 truths have complete code implementations — all pending human verification of live DB + UI behavior

---

## Required Artifacts

### Plan 02-01 Artifacts (Brand System)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/supabase/brands.ts` | getBrands, getBrand, createBrand, updateBrand, deleteBrand | VERIFIED | All 5 exports present. createBrand injects user_id from auth.getUser(). updateBrand uses updated_at. deleteBrand uses RLS-scoped delete. |
| `src/app/(protected)/onboarding/actions.ts` | createBrandAction Server Action | VERIFIED | 'use server' directive present. All 7 fields captured from FormData. Supports redirect_to hidden field pattern. Redirects to /dashboard by default. |
| `src/app/(protected)/settings/brand/page.tsx` | Brand management page listing all brands | VERIFIED | Calls getBrands(), renders brand list with color swatches, Edit/Delete actions, empty state. 83 lines of real implementation. |
| `src/components/brand/brand-form.tsx` | Reusable BrandForm used by onboarding and settings | VERIFIED | 'use client', useActionState, all 7 fields in 3 sections, color picker + read-only hex, edit mode via brand prop, redirectTo prop, error display. 183 lines. |
| `src/app/(protected)/settings/brand/actions.ts` | updateBrandAction + deleteBrandAction | VERIFIED | 'use server', both actions present, updateBrand + revalidatePath, deleteBrand + redirect to /onboarding. |
| `src/app/(protected)/settings/brand/[id]/edit/page.tsx` | Edit page with pre-filled BrandForm | VERIFIED | getBrand(id), redirect if not found, BrandForm with brand + updateBrandAction + "Update brand" label. Next.js 15 async params pattern. |
| `src/app/(protected)/settings/brand/new/page.tsx` | New brand page from settings | VERIFIED | createBrandAction with redirectTo="/settings/brand". |
| `src/app/(protected)/onboarding/panels.tsx` | Client component for Framer Motion layout | VERIFIED | Two-column Framer Motion layout with dark left panel, bullets, BrandForm on right. redirectTo="/dashboard" passed to BrandForm. |

### Plan 02-02 Artifacts (Templates & Styles)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260304000002_catalog_seed.sql` | Seed SQL for 5 templates + 4 built-in image styles | VERIFIED | Idempotent INSERT with ON CONFLICT DO NOTHING for templates, WHERE NOT EXISTS for styles. All 5 template slugs and all 4 exact style names present. |
| `src/lib/supabase/catalog.ts` | getTemplates, getImageStyles, createCustomStyle, deleteCustomStyle | VERIFIED | All 4 exports present with correct typing. getTemplates filters is_active=true, ordered by sort_order. getImageStyles orders built-ins first. createCustomStyle sets is_custom=true + user_id. |
| `src/components/templates/template-card.tsx` | TemplateCard with slug-keyed descriptions and ring selection | VERIFIED | DESCRIPTIONS map for all 5 slugs. Placeholder thumbnail (aspect-[4/3] zinc-100 div + SVG icon). ring-2 ring-zinc-900 for selected state. Select/Selected indicator. |
| `src/components/templates/template-gallery.tsx` | Responsive grid, controlled + uncontrolled selection | VERIFIED | Controlled/uncontrolled pattern with internalSelectedId fallback. grid-cols-1/sm:2/lg:3. Maps templates to TemplateCards. |
| `src/components/image-styles/style-selector.tsx` | Built-in 2x2 grid + custom style creation | VERIFIED | Filters built-ins/customs correctly. 2x2 grid for built-ins with per-style inline SVG icons for all 4 exact names. AddCustomStyleForm with createCustomStyleAction via useActionState. DeleteStyleForm wired. |
| `src/app/(protected)/templates/actions.ts` | createCustomStyleAction + deleteCustomStyleAction | VERIFIED | 'use server', both actions present, wired to catalog.ts helpers, revalidatePath('/templates'). |
| `src/app/(protected)/templates/page.tsx` | Server Component rendering both galleries | VERIFIED | Promise.all([getTemplates(), getImageStyles()]), renders TemplateGallery + StyleSelector with divider. max-w-5xl layout. |

### Plan 02-03 Artifacts (Dashboard Shell)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/layout/sidebar.tsx` | Left sidebar with navigation links | VERIFIED | 'use client', lucide-react icons, NavItem with usePathname active detection, all 5 nav items (Dashboard, Templates, Brand, Billing disabled, Generate disabled), w-60 bg-zinc-950 layout. |
| `src/components/layout/header.tsx` | Top header with BrandSwitcher | VERIFIED | h-14 white header, BrandSwitcher + user email + initials avatar. Props: brands, selectedBrandId, userEmail. |
| `src/components/brand/brand-switcher.tsx` | Brand switcher dropdown persisting via cookie | VERIFIED | 'use client', useState open, useEffect click-outside, form+hidden-input submit pattern for each brand calling setBrandAction, "Manage brands" link, color swatches. |
| `src/app/(protected)/dashboard/actions.ts` | setBrandAction sets selected_brand_id cookie | VERIFIED | 'use server', httpOnly cookie, 30-day maxAge, sameSite lax, revalidatePath('/dashboard'). |
| `src/app/(protected)/layout.tsx` | Full two-column shell with Sidebar + Header | VERIFIED | getUser() safety redirect, getBrands(), cookie resolution with fallback to brands[0], flex min-h-screen layout. Sidebar + Header + main with bg-zinc-50. |
| `src/app/(protected)/dashboard/page.tsx` | Dashboard with 3 summary cards + CTA block | VERIFIED | Active brand card with color swatch, template count card, style count (built-in + custom), disabled Generate CTA with "Unlocks in Phase 5" label. |
| `src/lib/supabase/middleware.ts` | isProtected includes /templates and /settings | VERIFIED | pathname.startsWith('/templates') and pathname.startsWith('/settings') both present in isProtected check. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `onboarding/actions.ts` | `brands.ts` | `createBrand()` | WIRED | createBrand imported and called on line 3/12 |
| `onboarding/page.tsx` | `/dashboard` | `redirect('/dashboard')` after brand creation | WIRED | redirect in createBrandAction at line 25 via redirect_to pattern; OnboardingPanels passes redirectTo="/dashboard" to BrandForm |
| `template-gallery.tsx` | `catalog.ts` | `getTemplates()` | WIRED | Import via Template type from catalog.ts; getTemplates() called in templates/page.tsx which passes result as prop |
| `style-selector.tsx` | `catalog.ts` | `getImageStyles()` | WIRED | Import via ImageStyle type from catalog.ts; getImageStyles() called in templates/page.tsx |
| `brand-switcher.tsx` | `selected_brand_id cookie` | `setBrandAction sets cookie` | WIRED | setBrandAction imported from dashboard/actions, used as form action. Cookie name 'selected_brand_id' confirmed in actions.ts line 9. |
| `layout.tsx` | `sidebar.tsx` | `import Sidebar` | WIRED | Sidebar imported line 5, rendered line 33 |
| `style-selector.tsx` | `templates/actions.ts` | `createCustomStyleAction via useActionState` | WIRED | Imported line 5, used in AddCustomStyleForm line 90 |

---

## Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|---------|
| BRAND-01 | 02-01, 02-03 | User can create a single brand profile during onboarding | SATISFIED | createBrandAction + onboarding wizard with getBrands() guard implemented. REQUIREMENTS.md shows [x]. |
| BRAND-02 | 02-01, 02-03 | Brand profile includes all 7 fields | SATISFIED | BrandForm captures all 7 fields. brands.ts BrandInput type includes all 7. REQUIREMENTS.md shows [x]. |
| BRAND-03 | 02-01, 02-03 | User can edit brand profile after onboarding | SATISFIED | /settings/brand + /settings/brand/[id]/edit fully implemented. REQUIREMENTS.md shows [x]. |
| TMPL-01 | 02-02, 02-03 | 5-6 carousel templates available (placeholder assets acceptable) | SATISFIED | 5 templates seeded in migration. TemplateGallery renders them. REQUIREMENTS.md shows [x]. |
| TMPL-02 | 02-02 | Each template has front cover page, content pages, and CTA page | SATISFIED (structure only) | DB schema has cover_url, content_url, cta_url columns. Seed inserts all as null (placeholder). Per criteria "placeholder assets acceptable" this is satisfied at schema level. TemplateCard renders a single placeholder thumbnail — distinct page preview is not shown in UI, but criteria says placeholder acceptable. REQUIREMENTS.md shows [x]. |
| TMPL-03 | 02-02 (claimed) | Template assets hosted as URLs and passed to n8n at generation time | NOT SATISFIED IN PHASE 2 | This requires n8n integration (Phase 4/5). cover_url/content_url/cta_url are all null. REQUIREMENTS.md shows [ ] "Pending." Plan 02-02 claimed this requirement but it cannot be satisfied until generation is built. This is correctly deferred — no gap for Phase 2 goal. |
| STYLE-01 | 02-02, 02-03 | 4 built-in image styles available | SATISFIED | All 4 styles seeded (Technical Annotation & Realism, Notebook, Whiteboard Diagram, Comic Strip Storyboard). StyleSelector renders all 4 with named SVG icons. REQUIREMENTS.md shows [x]. |
| STYLE-02 | 02-02 (claimed) | User can add custom image style names | SATISFIED (code only) | AddCustomStyleForm + createCustomStyleAction + createCustomStyle() fully wired. REQUIREMENTS.md shows [ ] "Pending" — checkbox not updated. Code is present and wired. Human verification needed to confirm live DB write. |
| STYLE-03 | 02-02 (claimed) | Selected style name passed to n8n at generation time | NOT SATISFIED IN PHASE 2 | Requires n8n integration (Phase 5). StyleSelector captures selection in state but passes nothing to n8n. REQUIREMENTS.md shows [ ] "Pending." Plan 02-02 claimed this but it cannot be satisfied until Phase 5 generation form exists. Correctly deferred. |

### Requirements Notes

**TMPL-03 and STYLE-03 discrepancy:** Plan 02-02 lists TMPL-03, STYLE-03 in its `requirements` field and the 02-02-SUMMARY.md claims `requirements-completed: [TMPL-01, TMPL-02, TMPL-03, STYLE-01, STYLE-02, STYLE-03]`. However TMPL-03 (assets passed to n8n) and STYLE-03 (style passed to n8n) are fundamentally Phase 5 concerns — the n8n webhook doesn't exist in Phase 2. REQUIREMENTS.md correctly marks both as `Pending` with unchecked boxes. This is a SUMMARY overclaim, not a codebase gap. Phase 2's role for these requirements is to build the data layer and selection UI — complete — while the actual passing to n8n is Phase 5.

**STYLE-02 checkbox mismatch:** REQUIREMENTS.md shows STYLE-02 as `[ ]` (Pending) but the code fully implements custom style creation. The checkbox was not updated after 02-02 completed. The implementation is present; the REQUIREMENTS.md traceability checkbox is stale.

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/components/brand/brand-form.tsx` | `placeholder=` attribute on input fields | Info | These are HTML input placeholder text attributes, not implementation placeholders. False positive from grep. |
| `src/components/templates/template-card.tsx` | `// Thumbnail placeholder` comment | Info | Intentional — success criteria explicitly says "placeholder assets acceptable" for v1. The placeholder is the design intent, not an incomplete implementation. |
| None | No `return null`, empty `{}` returns, `TODO`, `FIXME`, or `console.log` stubs found in any Phase 2 component | — | Clean |

No blocker or warning-level anti-patterns found.

---

## Human Verification Required

### 1. Complete Onboarding Flow

**Test:** As a fresh user (no brands), navigate to `/onboarding`. Fill in: Brand name = "Test Brand", click the primary color picker and select a color, fill in voice guidelines, product description, audience description, and CTA text. Click "Create brand."
**Expected:** Form submits, user is redirected to `/dashboard`. Dashboard shows "Welcome, [email prefix]" heading and an "Active brand" card showing "Test Brand" with the selected color swatch.
**Why human:** Auth session + Supabase DB write + Next.js redirect chain cannot be verified from CLI.

### 2. Edit Brand After Onboarding

**Test:** From dashboard or sidebar, navigate to `/settings/brand`. Click "Edit" on the brand created above. Change the brand name to "Updated Brand". Click "Update brand."
**Expected:** Redirect to `/settings/brand`. Updated brand name appears in the list. Dashboard header brand switcher also shows the updated name.
**Why human:** Requires live DB round-trip and UI re-render.

### 3. Template Gallery — 5 Templates Selectable

**Test:** Navigate to `/templates`. Observe the "Choose a template" section.
**Expected:** 5 template cards visible in a responsive grid: "Hook → Insight → CTA", "Problem → Solution", "Step-by-Step Guide", "Story Thread", "Case Study". Each has a placeholder thumbnail (gray box with stacked rectangles icon), a name, a description, and a "Select" indicator. Clicking a card highlights it with a dark ring and shows "Selected" with a checkmark.
**Why human:** Data requires Supabase seed was applied; rendering requires browser.

### 4. 4 Built-In Image Styles Visible and Selectable

**Test:** On `/templates`, scroll to "Choose an image style". Observe the "Built-in styles" section.
**Expected:** Exactly 4 cards in a 2x2 grid with labels: "Technical Annotation & Realism" (crosshair icon), "Notebook" (lined notebook icon), "Whiteboard Diagram" (connected nodes icon), "Comic Strip Storyboard" (4-panel grid icon). Clicking a card shows selected dark background state.
**Why human:** Requires seed applied to live Supabase + browser rendering.

### 5. Add a Custom Image Style

**Test:** On `/templates`, in the "Custom styles" section, type "Watercolor Sketch" into the "Style name..." input and click "Add."
**Expected:** "Watercolor Sketch" appears as a new pill below the built-ins with an X button. The input clears. Clicking X removes the pill.
**Why human:** Requires live Supabase insert, revalidatePath, and browser re-render.

### 6. Brand Switcher Persistence

**Test:** If multiple brands exist — create a second brand at `/settings/brand/new`. Return to dashboard. In the header, click the brand dropdown. Select the second brand.
**Expected:** Header shows the new brand's name and color swatch. Reload the page. Brand selection persists (cookie is httpOnly, 30-day maxAge).
**Why human:** Cookie persistence requires browser session; httpOnly cookies not inspectable from CLI.

### 7. Sidebar Navigation and Disabled Items

**Test:** Navigate between /dashboard, /templates, and /settings/brand via sidebar links.
**Expected:** Active page shows highlighted nav item (text-white bg-white/10). "Billing · Phase 3" and "Generate · Phase 5" items are visually distinct (dimmer, no hover effect, not clickable).
**Why human:** usePathname active state and visual disabled state require browser rendering.

---

## Gaps Summary

No automated gaps found. All 22 key artifact files exist, are substantive (not stubs), and are wired correctly. All 8 task commits verified in git history. TypeScript compilation passes with zero errors.

The two requirements marked as not-satisfied in Phase 2 (TMPL-03, STYLE-03) are correctly deferred to Phase 5 — they require n8n integration which does not yet exist. These are not Phase 2 gaps.

One stale REQUIREMENTS.md checkbox (STYLE-02 shows `[ ]` but implementation is complete) is a documentation inconsistency, not a code gap.

Phase goal — "Users can define their brand identity and select from available templates and image styles — all required inputs are in place before generation can proceed" — is fully implemented in code. Human verification is required to confirm the live Supabase seed was applied and the UI renders correctly end-to-end.

---

_Verified: 2026-03-04_
_Verifier: Claude (gsd-verifier)_
