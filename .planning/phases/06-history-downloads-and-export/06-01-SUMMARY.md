---
phase: 06-history-downloads-and-export
plan: "01"
status: complete
completed_at: 2026-03-18
---

# Plan 06-01 Summary — DB Migration, Generate Route Wiring, History Page, Delete Action

## What was built

4 tasks completed across 6 files:

1. **DB migration** (`supabase/migrations/20260317000023_carousels_denormalized_names.sql`) — Added `brand_name`, `template_name`, `design_style_name` TEXT columns to `carousels` table. Applied via `supabase db push`.

2. **Generate route wiring** (`src/app/api/generate/route.ts`, `src/components/creator/creator-workflow.tsx`) — Route now accepts and writes the three name fields at carousel INSERT time. Creator workflow derives names from props arrays (`brands`, `templates`, `designStyles`) and passes them in the POST body.

3. **History page query** (`src/app/(protected)/history/page.tsx`) — SELECT extended to include `brand_name`, `template_name`, `design_style_name`.

4. **Delete Server Action** (`src/app/(protected)/history/actions.ts`) — `deleteCarouselAction` with `createClient()` auth check, `createAdminClient()` + `.eq('user_id', user.id)` ownership guard, and `revalidatePath('/history')`.

5. **CarouselHistory component** (`src/components/history/carousel-history.tsx`) — Extended `Carousel` type with three new fields. Added optimistic delete state (`localCarousels`, `deletingId`). Added metadata pill tags (gray for brand, amber for template, blue for design style). Added delete button with loading state.

## Decisions

- `brand_name`/`template_name`/`design_style_name` are optional in generate route body — backward compatible with any client that doesn't send them
- Optimistic delete restores list on server error via `setLocalCarousels(carousels)` fallback

## Verification

- Human verified: history page renders, metadata pills display on new generations, delete works with optimistic UI
- `npx tsc --noEmit` passes with zero errors across all touched files
