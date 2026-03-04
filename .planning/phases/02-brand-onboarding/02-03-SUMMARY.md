---
phase: 02-brand-onboarding
plan: "03"
subsystem: ui
tags: [next.js, react, cookies, server-actions, sidebar, lucide-react]

requires:
  - phase: 02-brand-onboarding plan 01
    provides: brands table, getBrands(), Brand type, brand CRUD actions
  - phase: 02-brand-onboarding plan 02
    provides: templates table, getTemplates(), getImageStyles(), catalog helpers

provides:
  - Persistent protected layout shell with sidebar + header wrapping all protected routes
  - Brand switcher component that sets selected_brand_id cookie via Server Action
  - Dashboard overview page showing active brand, template count, and style count
  - Middleware protection for /templates and /settings routes

affects:
  - phase-03-payments (uses protected layout, expects brand context cookie)
  - phase-05-generation (uses brand switcher selection, disables Generate button until ready)

tech-stack:
  added: []
  patterns:
    - "selected_brand_id cookie resolved in layout — all protected pages inherit selected brand without re-reading cookie"
    - "Client NavItem inside Server Sidebar — usePathname() active state detection without making the whole Sidebar a Client Component"
    - "BrandSwitcher uses hidden form submit pattern so brand switching works without JavaScript hydration delay"

key-files:
  created:
    - src/app/(protected)/dashboard/actions.ts
    - src/components/brand/brand-switcher.tsx
    - src/components/layout/sidebar.tsx
    - src/components/layout/header.tsx
  modified:
    - src/app/(protected)/layout.tsx
    - src/app/(protected)/dashboard/page.tsx
    - src/lib/supabase/middleware.ts

key-decisions:
  - "Brand cookie resolved once in protected layout — child pages receive selectedBrandId as prop pattern avoids multiple cookie reads per render"
  - "Sidebar is a Client Component (uses usePathname for active state) — acceptable because it is always rendered on the client anyway and avoids a NavItem wrapper file"
  - "BrandSwitcher click-outside via useEffect + mousedown — no shadcn Popover dependency to keep bundle lean"

patterns-established:
  - "Cookie resolution pattern: cookies().get('selected_brand_id')?.value → find in brands array → fallback to brands[0]"
  - "Two-column layout: flex min-h-screen → w-60 sidebar + flex-1 column (header + main)"
  - "Disabled nav item: href='#' with cursor-not-allowed and Phase N label for future features"

requirements-completed: [BRAND-01, BRAND-02, BRAND-03, TMPL-01, TMPL-02, STYLE-01]

duration: 15min
completed: 2026-03-04
---

# Phase 2 Plan 03: Dashboard Shell Summary

**Sidebar nav + header with cookie-persisted brand switcher, and dashboard overview page showing active brand, template count, and style summary**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-04T15:52:48Z
- **Completed:** 2026-03-04T16:07:54Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Full two-column dashboard shell with w-60 dark sidebar and white header wrapping all protected routes
- Brand switcher dropdown persists selected brand via httpOnly `selected_brand_id` cookie (30-day, sameSite lax) using Server Action
- Dashboard overview page with 3 summary cards (Active Brand + color swatch, Template count, Image style count) and disabled Generate CTA
- Middleware updated to protect /templates and /settings in addition to /dashboard and /onboarding

## Task Commits

1. **Task 1: Brand switcher Server Action and component** - `3e696d8` (feat)
2. **Task 2: Sidebar, Header, and updated protected layout** - `d6143f6` (feat)
3. **Task 3: Dashboard overview page** - `43497b9` (feat)

## Files Created/Modified

- `src/app/(protected)/dashboard/actions.ts` - setBrandAction Server Action: sets selected_brand_id cookie
- `src/components/brand/brand-switcher.tsx` - Client Component dropdown with brand list and hidden form submit pattern
- `src/components/layout/sidebar.tsx` - Left sidebar with NavItem client sub-component for usePathname active state
- `src/components/layout/header.tsx` - Top header with BrandSwitcher and user avatar/email
- `src/app/(protected)/layout.tsx` - Full two-column shell: reads brands + cookie, passes to Header
- `src/app/(protected)/dashboard/page.tsx` - Dashboard overview: active brand card, template card, style card, CTA block
- `src/lib/supabase/middleware.ts` - isProtected extended to include /templates and /settings

## Decisions Made

- Brand cookie resolved once in protected layout, not re-read per page — all child pages receive selectedBrandId via the layout's Header prop
- Sidebar is a Client Component (entire file) because NavItem needs usePathname() — simpler than a Server Sidebar + Client NavItem file split
- BrandSwitcher uses click-outside detection via useEffect + mousedown event rather than shadcn Popover — keeps dependencies lean

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Dashboard shell is complete; all protected pages now have sidebar + header context
- Brand switcher selection persists across refreshes via cookie
- Phase 3 (Billing/Stripe) can build inside the protected layout without changes
- Phase 5 (Generation) — Generate button is visible but disabled with "Unlocks in Phase 5" label, ready to enable

---
*Phase: 02-brand-onboarding*
*Completed: 2026-03-04*
