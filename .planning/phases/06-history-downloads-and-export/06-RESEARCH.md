# Phase 6: History, Downloads, and Export - Research

**Researched:** 2026-03-17
**Domain:** Next.js App Router server components, CORS proxy, client-side PDF generation, Clipboard API
**Confidence:** HIGH

## Summary

Phase 6 closes the value loop by giving users access to all their past carousels with download and export capabilities. Critically, a significant portion of this phase is **already implemented** in Phase 5 stub work: `/app/(protected)/history/page.tsx` and `/components/history/carousel-history.tsx` exist and cover HIST-01 through HIST-04 at a basic level. The Phase 6 work is therefore enhancement and completion — not greenfield.

The two main technical challenges are: (1) CORS-safe image downloads from ImageBB (external CDN), which requires a server-side proxy route; and (2) client-side PDF generation from a list of image URLs without a backend service. jsPDF is the standard library for the latter, loaded dynamically (no SSR) since it requires browser APIs.

The history page query needs to be extended to JOIN brands and templates tables to satisfy HIST-02 (show brand, template, image style per entry). The delete action for HIST-03 should be a Server Action using `createAdminClient()` consistent with the existing pattern for all DB mutations.

**Primary recommendation:** Extend the existing history page/component rather than rewriting. Add delete Server Action, proxy API route for downloads, and dynamic-import jsPDF for PDF export.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HIST-01 | User can view a history page listing all generated carousels | Page + component already exist at `/history`; needs metadata query enhancement |
| HIST-02 | Each entry shows: slides preview, idea, brand, template, image style, date | Current query only fetches `id, idea_text, status, slide_urls, post_body, created_at` — must add brand/template JOIN |
| HIST-03 | User can delete a carousel from their history | Not yet implemented — needs Server Action + revalidatePath |
| HIST-04 | User can copy the generated post body text to clipboard | Already implemented in `carousel-history.tsx` via `navigator.clipboard.writeText` |
| HIST-05 | User can download individual carousel slides as image files (PNG/JPG) | `handleDownloadAll` exists but fetches ImageBB URLs directly — CORS will block in most browsers; needs proxy route |
| HIST-06 | User can download the full carousel as a PDF | Not yet implemented — needs jsPDF dynamic import |
</phase_requirements>

---

## What Already Exists (Phase 5 Stub)

This is critical context for the planner — do not re-implement these.

| File | What It Does | Gap |
|------|-------------|-----|
| `src/app/(protected)/history/page.tsx` | Server component, fetches carousels, renders `<CarouselHistory>` | Query missing brand/template names |
| `src/components/history/carousel-history.tsx` | Client component, grid layout, expanded slide viewer, copy caption, download all | Download uses direct ImageBB fetch (CORS risk); no PDF; no delete |

The existing `handleDownloadAll` loops over `slide_urls` and does a raw `fetch(imagebbUrl)` from the browser. This will be blocked by CORS on ImageBB CDN in production. It must be replaced by routing downloads through the proxy.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jsPDF | ^2.5.1 | Client-side PDF creation from image data | Most widely used, no server dependency, active maintenance, works with dynamic import |
| Next.js Route Handler | (built-in, Next 16) | Server-side image proxy (`/api/download`) | Avoids CORS on ImageBB CDN; already using App Router API routes |
| `navigator.clipboard` | (browser API) | Copy post body to clipboard | Already used in existing component; HTTPS-only, with execCommand fallback |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `html2canvas` | ^1.4.1 | Render DOM to canvas for PDF | Only needed if rendering slides from DOM elements — not needed here since slides are already images |

**Note on html2canvas:** Since slides are already ImageBB image URLs (not DOM elements), there is NO need for html2canvas. jsPDF's `addImage()` method accepts a pre-fetched base64 or ArrayBuffer directly. This avoids a heavy dependency.

### Not Needed
- `react-pdf` — for rendering PDF in browser UI (not needed, users are downloading)
- `pdf-lib` — lower-level PDF manipulation (jsPDF covers this use case sufficiently)
- `file-saver` — `URL.createObjectURL` + `<a download>` pattern already works and is used in the existing component

### Installation
```bash
npm install jspdf
```

---

## Architecture Patterns

### Recommended File Structure (additions only)
```
src/
├── app/
│   ├── (protected)/
│   │   └── history/
│   │       ├── page.tsx          # EXISTS — extend query to include brand/template
│   │       └── actions.ts        # NEW — deleteCarouselAction Server Action
│   └── api/
│       └── download/
│           └── route.ts          # NEW — image proxy GET handler
└── components/
    └── history/
        └── carousel-history.tsx  # EXISTS — add delete button, PDF export, wire proxy URLs
```

### Pattern 1: Server Action for Delete (HIST-03)

**What:** Server Action using `createAdminClient()` to delete a carousel row, then `revalidatePath('/history')` to refresh the server component data.

**When to use:** All DB mutations in this project use `createAdminClient()` per the established pattern from Phase 5. The RLS policy "Users manage own carousels" covers deletion via `user_id = auth.uid()`, but admin client bypasses RLS entirely — auth check must be done manually in the action.

**Example:**
```typescript
// src/app/(protected)/history/actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function deleteCarouselAction(carouselId: string): Promise<{ error?: string }> {
  // Auth check — admin client bypasses RLS so we must verify ownership manually
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('carousels')
    .delete()
    .eq('id', carouselId)
    .eq('user_id', user.id)  // ownership guard

  if (error) return { error: error.message }
  revalidatePath('/history')
  return {}
}
```

**Alternative:** Use `createClient()` (user-scoped) and let RLS handle ownership — simpler, but inconsistent with project convention. Stick with admin + manual check.

### Pattern 2: Image Proxy Route Handler (HIST-05)

**What:** GET route that accepts an external image URL as a query param, fetches it server-side, and streams it back with `Content-Disposition: attachment` to force download.

**Why needed:** ImageBB's CDN does not send permissive CORS headers. Direct browser `fetch(imageBBUrl)` followed by `URL.createObjectURL` works inconsistently — some browsers block it, others allow it, and it breaks silently. The proxy is the reliable cross-browser solution.

**Example:**
```typescript
// src/app/api/download/route.ts
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  // Auth check — prevent unauthenticated abuse of the proxy
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  const filename = searchParams.get('filename') ?? 'slide.png'

  if (!url) return new Response('Missing url param', { status: 400 })

  // Allowlist check — only proxy ImageBB URLs
  if (!url.startsWith('https://i.ibb.co/') && !url.startsWith('https://ibb.co/')) {
    return new Response('Forbidden', { status: 403 })
  }

  const upstream = await fetch(url)
  if (!upstream.ok) return new Response('Upstream fetch failed', { status: 502 })

  const contentType = upstream.headers.get('content-type') ?? 'image/png'
  const buffer = await upstream.arrayBuffer()

  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
```

**Client call:**
```typescript
// In carousel-history.tsx — replace direct fetch with proxy
async function downloadSlide(slideUrl: string, index: number) {
  const proxyUrl = `/api/download?url=${encodeURIComponent(slideUrl)}&filename=slide-${index + 1}.png`
  const res = await fetch(proxyUrl)
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `slide-${index + 1}.png`
  a.click()
  URL.revokeObjectURL(a.href)
}
```

### Pattern 3: Client-Side PDF Generation (HIST-06)

**What:** Dynamically import jsPDF in the browser, fetch all slide images through the proxy (to avoid CORS), and `addImage()` each one to a new PDF page.

**Why dynamic import:** jsPDF uses browser APIs (`window`, `document`) and cannot run on the server. `import('jspdf')` wrapped in an async function works correctly with Next.js App Router client components.

**Why fetch through proxy:** The PDF generation code runs in the browser and needs to fetch the images as ArrayBuffers. Same CORS problem applies — use the same proxy route.

**Example:**
```typescript
// In carousel-history.tsx
async function handleDownloadPDF(slides: string[], title: string) {
  const { jsPDF } = await import('jspdf')

  // Use square format matching carousel aspect ratio
  const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: [1080, 1080] })

  for (let i = 0; i < slides.length; i++) {
    if (i > 0) doc.addPage()

    const proxyUrl = `/api/download?url=${encodeURIComponent(slides[i])}&filename=slide-${i + 1}.png`
    const res = await fetch(proxyUrl)
    const blob = await res.blob()

    // Convert blob to base64 data URL for jsPDF
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })

    doc.addImage(dataUrl, 'PNG', 0, 0, 1080, 1080)
  }

  const safeTitle = title.slice(0, 40).replace(/[^a-z0-9]/gi, '-').toLowerCase()
  doc.save(`${safeTitle}.pdf`)
}
```

**Note on `px_scaling` hotfix:** jsPDF in `px` units requires the `hotfixes: ['px_scaling']` option on the constructor if image sizes do not render correctly. Add it if needed: `new jsPDF({ ..., hotfixes: ['px_scaling'] })`.

### Pattern 4: Extended History Query with Brand/Template Names (HIST-02)

The current query in `history/page.tsx` does not fetch brand or template names. Since `brand_id` and `template_id` are now nullable (migration 022) and may hold Airtable IDs rather than UUID FK references, the join strategy needs care.

**Current carousels schema:**
- `brand_id` — nullable TEXT (Airtable record ID after migration 022, no FK)
- `template_id` — nullable TEXT (Airtable record ID, no FK)
- `idea_text` — TEXT
- `slide_urls` — JSONB (array of ImageBB URLs)
- `post_body` — TEXT
- `status` — TEXT
- `created_at` — TIMESTAMPTZ

**Implication:** Because `brand_id` and `template_id` now store Airtable record IDs (not Supabase UUIDs), there is no joinable FK to `brands` or `templates` tables. Resolving brand/template names from Airtable IDs would require Airtable API calls — expensive and unnecessary for v1.

**Recommended approach:** Store the brand name and template name as denormalized text columns on the carousel row at creation time, OR simply display what is available (`idea_text`, `created_at`, `status`, slide count) and note the metadata gap as a v2 improvement. The requirements say "brand, template, image style" in HIST-02, but the data model does not currently support resolving these from the carousel row.

**Action for planner:** Add `brand_name TEXT` and `template_name TEXT` columns to `carousels` table via a new migration, and populate them at generation time in `/api/generate/route.ts`. This closes HIST-02 cleanly without Airtable round-trips. Alternatively, if generation already has brand/template name in scope, it can be written at insert time.

### Anti-Patterns to Avoid

- **Direct ImageBB fetch from browser:** Will fail due to CORS on real CDN responses. Always route through the proxy.
- **html2canvas for PDF:** Slides are image URLs, not DOM elements. Using html2canvas adds ~400KB to the bundle with no benefit.
- **Synchronous jsPDF import at module level:** Breaks SSR. Always use `await import('jspdf')` inside an async function.
- **Using `createClient()` in delete action:** Inconsistent with project convention. Use admin client + manual ownership check.
- **Triggering all slide downloads simultaneously:** Sequential downloads with a small delay (300ms) prevent browser pop-up blockers from suppressing download prompts. The existing pattern already does this correctly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF from images | Custom canvas-to-PDF encoder | jsPDF `addImage()` | PDF byte-format complexity, cross-browser canvas inconsistencies |
| Clipboard write | Custom textarea selection hack | `navigator.clipboard.writeText()` | Already in use in existing component; works in all modern browsers on HTTPS |
| Image CORS bypass | `crossOrigin="anonymous"` img tag | Server-side proxy route | Canvas `toDataURL` after tainted canvas throws SecurityError; proxy is reliable |

---

## Common Pitfalls

### Pitfall 1: ImageBB CORS on Direct Browser Fetch
**What goes wrong:** `fetch('https://i.ibb.co/...')` in the browser returns a CORS error or opaque response. `response.blob()` either throws or returns an empty blob. The download appears to work (no JS error) but the file is 0 bytes or corrupt.
**Why it happens:** ImageBB CDN does not include `Access-Control-Allow-Origin` headers on image responses.
**How to avoid:** Route all image fetches for download through `/api/download?url=...`. The existing `handleDownloadAll` in the component does a raw fetch — this must be replaced.
**Warning signs:** Downloaded files are 0 bytes, or the download link opens the image in a new tab instead of downloading.

### Pitfall 2: jsPDF SSR Import
**What goes wrong:** `import jsPDF from 'jspdf'` at the top of a component file causes a build error or hydration crash because jsPDF references `window` and `document` at import time.
**Why it happens:** Next.js App Router attempts to render client components on the server during SSR. jsPDF is not SSR-safe.
**How to avoid:** Always use `const { jsPDF } = await import('jspdf')` inside the click handler function body, not at module level.
**Warning signs:** `ReferenceError: window is not defined` during build or first render.

### Pitfall 3: Airtable IDs in brand_id/template_id
**What goes wrong:** Query tries to JOIN carousels → brands on `carousels.brand_id = brands.id` but the brand_id column now holds an Airtable record ID string, not a Supabase UUID. The join returns null for all rows.
**Why it happens:** Migration 022 dropped the FK constraint. The Airtable workflow stores Airtable IDs, not Supabase UUIDs.
**How to avoid:** Do not attempt a SQL join on these columns. Use denormalized `brand_name`/`template_name` columns instead (new migration required).
**Warning signs:** Brand/template names show as blank on all history entries.

### Pitfall 4: PDF Memory with Many Slides
**What goes wrong:** Generating a PDF for a 10-slide carousel with 1080x1080 images loads ~10 high-res images into memory simultaneously. On mobile or low-memory devices, the tab may crash.
**Why it happens:** jsPDF holds all image data in memory before `doc.save()`.
**How to avoid:** Fetch slides sequentially (already done), and use reasonable image dimensions. For v1, 1080px is acceptable — document as known limitation.

### Pitfall 5: Clipboard API in Non-HTTPS Context
**What goes wrong:** `navigator.clipboard` is `undefined` in HTTP contexts (non-localhost). The copy button throws.
**Why it happens:** Clipboard API is restricted to secure contexts (HTTPS or localhost).
**How to avoid:** The existing implementation already uses try/catch. Ensure production is always HTTPS (Vercel handles this). Add a `typeof navigator !== 'undefined' && navigator.clipboard` guard.

### Pitfall 6: Delete Without Optimistic UI
**What goes wrong:** User clicks delete, nothing visible happens for 1-2 seconds (Server Action round-trip), then the page re-renders. Feels broken.
**Why it happens:** `revalidatePath` triggers a full server re-render after the Server Action completes.
**How to avoid:** Use `useOptimistic` or manage a local `deletingId` state in the client component to immediately hide the deleted card while the action completes.

---

## Code Examples

### History Page Query with Denormalized Names
```typescript
// src/app/(protected)/history/page.tsx
const { data: carousels } = user
  ? await supabase
      .from('carousels')
      .select('id, idea_text, status, slide_urls, post_body, brand_name, template_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
  : { data: [] }
```

### Migration for Denormalized Name Columns
```sql
-- New migration: add brand_name and template_name to carousels
ALTER TABLE public.carousels
  ADD COLUMN IF NOT EXISTS brand_name TEXT,
  ADD COLUMN IF NOT EXISTS template_name TEXT;
```

### Proxy URL Helper (client utility)
```typescript
// Usage in carousel-history.tsx
function proxyUrl(imagebbUrl: string, filename: string): string {
  return `/api/download?url=${encodeURIComponent(imagebbUrl)}&filename=${encodeURIComponent(filename)}`
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `document.execCommand('copy')` | `navigator.clipboard.writeText()` | Async, no DOM mutation needed, already in use |
| Server-side PDF (Puppeteer/headless) | Client-side jsPDF | Zero server cost, no Vercel timeout risk |
| Direct CDN fetch for download | Server proxy route | CORS-safe, works across all browsers |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Deprecated but still works as fallback. Not needed here since the app is HTTPS.
- `html2canvas` + jsPDF combination: Correct for DOM-to-PDF but overkill when source material is already image URLs.

---

## Open Questions

1. **Brand/template name denormalization**
   - What we know: `brand_id` and `template_id` are Airtable IDs with no FK to Supabase tables
   - What's unclear: Does the `/api/generate` route have the brand name and template name in scope at insert time?
   - Recommendation: Planner should check `/api/generate/route.ts` — if brand name is fetched there, add it to the INSERT. If not, fetch from Airtable before insert. Requires new migration for the columns.

2. **ImageBB URL permanence**
   - What we know: ImageBB URLs can be configured to expire at upload time; the n8n workflow uploads without an explicit expiry — likely permanent but undocumented
   - What's unclear: Whether the Airtable/n8n workflow set an expiry on uploads
   - Recommendation: Treat as permanent for v1 (per STATE.md decision). Document in code that v2 should migrate to Supabase Storage.

3. **Individual slide download vs. download all**
   - What we know: HIST-05 says "individual slides" — the existing component has "download all" only
   - What's unclear: Whether the planner intends per-slide download buttons in the expanded viewer, or just a bulk download
   - Recommendation: Add a download icon button on each slide in the expanded viewer (routes through proxy), plus keep "download all".

---

## Validation Architecture

nyquist_validation is not explicitly set to false in config.json (key is absent — treat as enabled).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test files, no jest/vitest config |
| Config file | None — Wave 0 gap |
| Quick run command | N/A until framework installed |
| Full suite command | N/A until framework installed |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HIST-01 | History page renders carousel list | smoke | manual browser check | ❌ Wave 0 |
| HIST-02 | Each entry shows brand, template, date | smoke | manual browser check | ❌ Wave 0 |
| HIST-03 | Delete removes carousel, page revalidates | manual-only | N/A — Server Action + revalidatePath | ❌ Wave 0 |
| HIST-04 | Copy button writes post_body to clipboard | manual-only | N/A — requires browser clipboard permission | ❌ Wave 0 |
| HIST-05 | Slide download returns file (not 0 bytes) | manual-only | N/A — file download requires browser | ❌ Wave 0 |
| HIST-06 | PDF export produces valid multi-page PDF | manual-only | N/A — file download requires browser | ❌ Wave 0 |

**Note:** All HIST requirements are UI/browser behaviors with no pure-logic unit-testable surface. The proxy route (`/api/download`) is the only piece with testable server logic (auth check, allowlist, upstream fetch). A unit test for that route would be the highest-value automated test if a framework is added.

### Wave 0 Gaps
- No test framework installed — all validation is manual for this phase
- If a framework is added later: `tests/api/download.test.ts` — covers proxy auth guard and allowlist

*(Wave 0 note: Given project has zero test infrastructure and all HIST behaviors require browser interaction, manual verification is the practical approach for v1. No framework install is required to proceed.)*

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `src/app/(protected)/history/page.tsx` — existing query shape
- Direct code inspection: `src/components/history/carousel-history.tsx` — existing component capabilities
- Direct code inspection: `supabase/migrations/*.sql` — confirmed brand_id/template_id nullable, no FK
- Direct code inspection: `package.json` — confirmed jsPDF not yet installed

### Secondary (MEDIUM confidence)
- [jsPDF npm](https://www.npmjs.com/package/jspdf) — current package
- [jsPDF addImage docs](https://artskydj.github.io/jsPDF/docs/module-addImage.html) — addImage API signature
- WebSearch verification: Next.js App Router proxy route pattern for image downloads — matches official pattern
- [MDN Clipboard.writeText()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText) — HTTPS requirement confirmed

### Tertiary (LOW confidence)
- ImageBB URL expiry behavior — could not find official policy documentation; treating as permanent per v1 decision in STATE.md

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — jsPDF is well-established, proxy pattern is standard Next.js
- Architecture: HIGH — based on direct codebase inspection; patterns consistent with existing project conventions
- Pitfalls: HIGH — CORS/jsPDF SSR pitfalls are verified real issues; Airtable ID FK mismatch confirmed by migration inspection
- Open questions: MEDIUM — brand/template name gap is confirmed as a real issue; resolution path is clear but depends on generate route details

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable libraries, 30-day window)
