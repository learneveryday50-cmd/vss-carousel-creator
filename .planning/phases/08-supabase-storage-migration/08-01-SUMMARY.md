---
phase: 08-supabase-storage-migration
plan: "01"
status: complete
completed: "2026-03-19"
duration_min: ~15
files_modified: 2
---

# Summary: 08-01 — Storage Bucket + Webhook Re-upload

## What Was Built

- **SQL migration** `20260319000024_storage_bucket.sql`: Creates `carousel-slides` public storage bucket with public read policy. Applied via `supabase db push`.
- **generation-done webhook** `src/app/api/webhook/generation-done/route.ts`: Updated with `uploadSlideToStorage` helper that downloads each ImageBB slide and re-uploads to Supabase Storage before writing `slide_urls` to the DB. Per-slide fallback to ImageBB URL on failure. Parallel uploads via `Promise.all`.

## Verification

- `SELECT id, name, public FROM storage.buckets WHERE id = 'carousel-slides'` → returns row (bucket confirmed in Supabase)
- TypeScript compiles without errors

## Key Decisions

- `upsert: true` on storage upload — webhook retries won't fail on duplicate paths
- `Promise.all` runs all slide uploads in parallel — fast for 5-slide carousels
- Helper catches its own errors and returns ImageBB URL as fallback — `Promise.all` never rejects

## Requirements Met

- STORE-01: `carousel-slides` bucket exists and is public
- STORE-02: New carousels write Supabase Storage URLs to `slide_urls`
- STORE-05: Per-slide fallback on upload failure
