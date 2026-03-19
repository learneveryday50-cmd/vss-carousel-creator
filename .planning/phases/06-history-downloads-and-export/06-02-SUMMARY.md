---
phase: 06-history-downloads-and-export
plan: "02"
status: complete
completed_at: 2026-03-18
---

# Plan 06-02 Summary — Download Proxy, Per-Slide Download, PDF Export

## What was built

2 tasks completed across 2 files:

1. **`/api/download` proxy route** (`src/app/api/download/route.ts`) — Authenticated GET handler that proxies ImageBB image URLs server-side to avoid browser CORS restrictions. Auth guard returns 401 for unauthenticated requests. i.ibb.co/ibb.co allowlist returns 403 for non-ImageBB URLs. Returns image bytes with `Content-Disposition: attachment` header. `Cache-Control: private, max-age=3600`.

2. **CarouselHistory updates** (`src/components/history/carousel-history.tsx`) — All changes additive to Plan 01 work:
   - `proxyUrl()` module-level helper encodes ImageBB URL as `/api/download?url=...` query param
   - `handleDownloadAll` replaced to route through proxy instead of direct ImageBB fetch
   - `handleDownloadPDF` added — dynamic `import('jspdf')`, fetches slides via proxy, converts each blob to dataUrl via FileReader, builds 1080×1080 multi-page PDF, saves with slug filename
   - Per-slide download icon button added in the slide navigation row (between prev arrow and slide counter)
   - "Export as PDF" button added after "Download all" button, with `exportingPdf` loading state
   - `handleCopy` updated with `navigator.clipboard` HTTPS guard

## Decisions

- jsPDF installed as `^4.2.1` — dynamic import inside click handler to avoid SSR issues
- Proxy route uses `private` Cache-Control — responses are user-specific (auth gated)
- Per-slide download icon placed between left chevron and counter to keep the nav row balanced

## Verification

- Human verified: per-slide download, bulk download, PDF export, copy caption all working
- Unauthenticated `/api/download` returns 401
- `npx tsc --noEmit` passes with zero errors
