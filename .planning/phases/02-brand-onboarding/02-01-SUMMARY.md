---
phase: 02-brand-onboarding
plan: "01"
subsystem: brand-system
tags: [brand, onboarding, crud, server-actions, supabase]
dependency_graph:
  requires: [01-01, 01-02, 01-03]
  provides: [brand-crud, onboarding-wizard, brand-settings]
  affects: [dashboard, carousel-generation]
tech_stack:
  added: []
  patterns: [server-actions, useActionState, react-19-form-pattern, two-column-auth-layout]
key_files:
  created:
    - src/lib/supabase/brands.ts
    - src/app/(protected)/onboarding/actions.ts
    - src/app/(protected)/onboarding/panels.tsx
    - src/app/(protected)/settings/brand/actions.ts
    - src/app/(protected)/settings/brand/page.tsx
    - src/app/(protected)/settings/brand/new/page.tsx
    - src/app/(protected)/settings/brand/[id]/edit/page.tsx
    - src/components/brand/brand-form.tsx
  modified:
    - src/app/(protected)/onboarding/page.tsx
decisions:
  - "redirect_to hidden field pattern used in createBrandAction to support both onboarding (/dashboard) and settings/new (/settings/brand) redirect targets — avoids duplicating the action"
  - "OnboardingPanels extracted as client component so onboarding/page.tsx remains a Server Component (required for getBrands() call and redirect)"
  - "BrandForm color fields use native <input type=color> + read-only text Input side-by-side; text input is read-only to avoid form data conflicts with the color picker value"
  - "Next.js 15 async params pattern used in edit page (params: Promise<{ id: string }>) to avoid deprecation warnings"
metrics:
  duration: "4 min"
  completed_date: "2026-03-04"
  tasks_completed: 3
  files_created: 9
---

# Phase 2 Plan 1: Brand System Summary

Brand CRUD system with multi-step onboarding wizard, Supabase data helpers, Server Actions, and reusable BrandForm — all 7 brand fields captured and wired to the brands table with RLS enforcement.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Brand data helpers and Server Actions | bd8dc0b | brands.ts, onboarding/actions.ts, settings/brand/actions.ts |
| 2 | BrandForm component and onboarding wizard | 28e9f51 | brand-form.tsx, onboarding/page.tsx, onboarding/panels.tsx |
| 3 | Brand settings pages (list, edit, new) | 2ca32f0 | settings/brand/page.tsx, [id]/edit/page.tsx, new/page.tsx |

## What Was Built

### Brand Data Layer (src/lib/supabase/brands.ts)
Pure data helpers with no redirects: `getBrands`, `getBrand`, `createBrand`, `updateBrand`, `deleteBrand`. All use the server Supabase client. `createBrand` injects `user_id` from `auth.getUser()` — RLS ensures users can only access their own rows.

### Server Actions
- `createBrandAction` (onboarding/actions.ts): Session-guarded via `createBrand()` throwing on unauthenticated. Supports `redirect_to` hidden field so the same action works for both onboarding→/dashboard and settings/new→/settings/brand.
- `updateBrandAction` (settings/brand/actions.ts): Updates brand by id, revalidates /settings/brand path, redirects back to brand list.
- `deleteBrandAction` (settings/brand/actions.ts): Deletes by id, revalidates, redirects to /onboarding so user must re-create a brand.

### BrandForm (src/components/brand/brand-form.tsx)
Reusable client component with `useActionState` for React 19 form pattern. Three sections: Brand Identity (name, primary_color, secondary_color), Voice & Description (voice_guidelines, product_description, audience_description), CTA (cta_text). Color fields use native color picker + read-only hex text display. Accepts optional `brand` prop for edit mode (injects hidden `id` field) and `redirectTo` prop for the redirect_to hidden field.

### Onboarding Wizard (src/app/(protected)/onboarding/page.tsx)
Server Component that checks `getBrands()` and redirects to /dashboard if user already has a brand. Otherwise renders `OnboardingPanels` (client component for Framer Motion). Two-column layout matching the login page: zinc-950 dark left panel with bullets, white right panel with BrandForm.

### Brand Settings Pages
- `/settings/brand` — lists all brands with color swatches, created date, Edit and Delete actions. Empty state links to /onboarding.
- `/settings/brand/[id]/edit` — pre-fills BrandForm with existing brand data. Uses Next.js 15 async params.
- `/settings/brand/new` — renders BrandForm with createBrandAction and redirectTo=/settings/brand.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical structure] Extracted OnboardingPanels client component**
- **Found during:** Task 2
- **Issue:** The onboarding page needed Framer Motion animations (client-only) but also needed `getBrands()` and `redirect()` which require a Server Component. Mixing both in one file is not possible.
- **Fix:** Split into `page.tsx` (Server Component for data fetching + redirect guard) and `panels.tsx` (Client Component for Framer Motion animations and BrandForm rendering).
- **Files modified:** src/app/(protected)/onboarding/page.tsx, src/app/(protected)/onboarding/panels.tsx
- **Commit:** 28e9f51

**2. [Rule 2 - Missing critical feature] Next.js 15 async params in edit page**
- **Found during:** Task 3
- **Issue:** Next.js 15 requires `params` to be a `Promise<{id: string}>` in page components to avoid deprecation warnings and future breaking changes.
- **Fix:** Used `params: Promise<{ id: string }>` type and `await params` before accessing `id`.
- **Files modified:** src/app/(protected)/settings/brand/[id]/edit/page.tsx
- **Commit:** 2ca32f0

## Self-Check

### Files exist:
- FOUND: src/lib/supabase/brands.ts
- FOUND: src/components/brand/brand-form.tsx
- FOUND: src/app/(protected)/settings/brand/page.tsx
- FOUND: src/app/(protected)/settings/brand/[id]/edit/page.tsx
- FOUND: src/app/(protected)/onboarding/actions.ts (contains 'use server')
- FOUND: src/app/(protected)/settings/brand/actions.ts (contains 'use server')

### Commits exist:
- bd8dc0b: feat(02-01): brand data helpers and Server Actions
- 28e9f51: feat(02-01): BrandForm component and onboarding wizard
- 2ca32f0: feat(02-01): brand settings pages (list, edit, new)

### TypeScript: Zero errors (npx tsc --noEmit passes clean)

## Self-Check: PASSED
