---
phase: 08-supabase-storage-migration
plan: "02"
status: complete
completed: "2026-03-20"
duration_min: ~30
files_modified: 2
---

# Summary: 08-02 — Download Route + History Component

## What Was Built

- **Download route** `src/app/api/download/route.ts`: Extended allowlist to accept Supabase Storage URLs (`NEXT_PUBLIC_SUPABASE_URL/storage/v1/object/public/carousel-slides/`) in addition to ImageBB URLs. Security maintained — arbitrary URLs still return 403.
- **Carousel history** `src/components/history/carousel-history.tsx`: Renamed `proxyUrl` parameter from `imagebbUrl` to `slideUrl` — function already routed all URLs through the proxy correctly, rename clarifies it handles both URL types.

## Verification

- New carousels (Supabase Storage URLs) appear in /history with slides loading correctly
- Download button works for new carousels
- Legacy ImageBB carousels unaffected
- TypeScript compiles without errors

## Key Decisions

- All URLs (Supabase Storage and ImageBB) routed through `/api/download` proxy — consistent `Content-Disposition: attachment` header, filename control, and auth guard
- n8n workflow body parameters configured: `record_id`, `status`, `slide_urls` (from `Merge1` node), `post_body` (from `Body & Carousel Prompts` node)

## Requirements Met

- STORE-03: Legacy carousels with ImageBB URLs still load and download correctly
- STORE-04: New carousels with Supabase Storage URLs download correctly through /api/download
