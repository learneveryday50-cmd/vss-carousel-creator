# Technology Stack

**Project:** VSS Code — SaaS Carousel Creator
**Researched:** 2026-03-03
**Research mode:** Ecosystem (Stack dimension)
**Confidence note:** All tool access (WebSearch, WebFetch, Read, Bash, Context7) was denied in this session. All findings are from training data (cutoff: August 2025). Every version number and library recommendation MUST be verified against official docs before coding begins. Confidence levels reflect this constraint honestly.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x (verify: nextjs.org) | Full-stack React framework | App Router with React Server Components enables server-side data fetching close to DB, reducing round-trips. Middleware for auth guards. Built-in API routes handle Stripe webhooks. Vercel-native — zero-config deploy. |
| TypeScript | 5.x | Type safety across full stack | Shared types between DB schema (via Supabase generated types), API contracts, and UI components. Eliminates runtime type errors on webhook payloads, which are notoriously easy to mishandle. |
| React | 19.x (bundled with Next.js 15) | UI rendering | Required by Next.js. React 19 concurrent features help with canvas/animation performance. |

**Confidence:** MEDIUM — Next.js 15 and React 19 were released/stable as of late 2024. Version numbers need official confirmation.

---

### Authentication & Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @supabase/supabase-js | 2.x | Database client, auth client | Single SDK for auth + DB queries. RLS enforced at DB level — even if app logic has bugs, data is isolated by tenant. Realtime subscriptions available for collaborative features later. |
| @supabase/ssr | 0.x (verify: supabase.com/docs) | Next.js App Router SSR integration | Required for cookie-based session management in App Router. The older `@supabase/auth-helpers-nextjs` is deprecated — do NOT use it. This package handles createServerClient and createBrowserClient correctly. |
| supabase (CLI) | latest | DB migrations, type generation | `supabase gen types typescript` generates DB types that flow into your TypeScript codebase. Run in CI to catch schema drift. |

**Confidence:** MEDIUM — `@supabase/ssr` was the recommended package as of mid-2024. Verify it hasn't been superseded.

**RLS Pattern for Multi-Tenancy:**
```sql
-- Every user-owned table follows this pattern
ALTER TABLE carousels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own rows" ON carousels
  FOR ALL USING (auth.uid() = user_id);

-- For org-based tenancy (if added later):
CREATE POLICY "Org members see org rows" ON carousels
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );
```

**Key pattern:** Store `user_id` (and optionally `org_id`) on every table. Never rely on app-level filtering alone. RLS is your last line of defense.

---

### Payments

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| stripe (Node SDK) | 16.x (verify: npmjs.com/package/stripe) | Stripe API client | Official SDK. Use for creating checkout sessions, managing subscriptions, fetching customer data. |
| @stripe/stripe-js | 4.x (verify) | Stripe.js browser client | Required for Stripe Elements or Payment Element in the browser. Load via `loadStripe()` — never import the full SDK server-side in client components. |

**Confidence:** LOW on exact versions — verify on npm before installing.

**Stripe Webhook Handler Pattern (Next.js App Router):**
```typescript
// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Pin API version — verify current date version
});

export async function POST(req: Request) {
  const body = await req.text(); // MUST be raw text, not parsed JSON
  const sig = headers().get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      // Provision access
      break;
    case 'customer.subscription.updated':
      // Update plan in DB
      break;
    case 'customer.subscription.deleted':
      // Revoke access
      break;
  }

  return new Response(null, { status: 200 });
}

// CRITICAL: Disable body parsing for webhook routes
export const config = {
  api: { bodyParser: false }, // Next.js Pages Router syntax — App Router handles this differently
};
```

**App Router note:** In App Router, `req.text()` bypasses automatic JSON parsing. No special config needed — but you MUST call `req.text()` before any other body access.

**n8n webhook handoff pattern:** When Stripe fires an event you want to forward to n8n Cloud, make a `fetch()` call to your n8n webhook URL inside the switch block. Use `waitUntil` (Vercel edge) or fire-and-forget with error logging. Do not let n8n failures fail the Stripe webhook response — Stripe will retry.

---

### Hosting & Deployment

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | N/A (platform) | Hosting, edge middleware, CDN | Zero-config Next.js deploys. Preview deployments per PR. Edge middleware runs auth checks at CDN level before page render. Serverless functions handle Stripe webhooks with automatic scaling. |
| Vercel Environment Variables | N/A | Secrets management | Store `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `N8N_WEBHOOK_URL`. Use separate values per environment (preview/production). |

**Confidence:** HIGH — Vercel+Next.js is the canonical deployment target.

---

### UI & Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x (verify — v4 released early 2025) | Utility CSS | Fastest way to implement Resume.io-style polished UI. Tailwind v4 uses a CSS-first config and Vite-based engine — significantly faster builds. |
| shadcn/ui | latest | Accessible UI primitives | Not a package — it's copy-pasted components into your codebase. Based on Radix UI + Tailwind. Gives you dialogs, dropdowns, tooltips without fighting accessibility. Fully customizable for Resume.io aesthetic. |
| Radix UI | (bundled via shadcn) | Headless accessible primitives | Used under shadcn. Do not import separately unless adding primitives not in shadcn. |
| lucide-react | 0.4x+ (verify) | Icons | Consistent icon set used by shadcn/ui. Do not mix with heroicons or react-icons. |

**Confidence:** MEDIUM — Tailwind v4 version needs confirmation; shadcn is version-independent.

**Resume.io aesthetic pattern:** Clean whitespace, subtle shadows (`shadow-sm`), medium font weights, muted color palette with a single brand accent. Use CSS variables for brand colors in Tailwind config so the theme is swappable per plan tier.

---

### Carousel Editor (Canvas Layer)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Fabric.js | 6.x (verify) | Canvas-based editor | De facto standard for drag-drop canvas editors in browser. Handles object selection, scaling, rotation, text editing on canvas. Has React wrapper (`fabric` + manual canvas ref management) or use `react-fabric-fiber` if available. |
| OR: Konva.js + react-konva | 9.x / 19.x (verify) | Alternative canvas framework | More React-native API. Better TypeScript types than Fabric. Lighter weight. Choose Konva if you want React-style declarative canvas. Choose Fabric if you want an out-of-the-box editor feature set. |

**Recommendation: Konva.js + react-konva** for this project because:
1. React-declarative API fits App Router's component model
2. Better TypeScript support
3. Lighter bundle than Fabric
4. Fabric's "batteries included" editor features aren't needed — you're building custom carousel UX, not a generic editor

**Confidence:** MEDIUM — verify Konva v9 is current and react-konva is maintained.

---

### Animation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Framer Motion | 11.x (verify) | UI animations, transitions | Best-in-class React animation library. Use for: slide transitions between carousel frames, modal/drawer enter/exit, hover states on cards. Resume.io uses smooth, spring-based transitions — Framer Motion's spring physics match this aesthetic. |
| CSS transitions (Tailwind) | N/A | Micro-interactions | Use Tailwind's `transition`, `duration-*`, `ease-*` for simple hover states. Reserve Framer Motion for complex sequences. Do not use both on the same element. |

**What NOT to use:**
- React Spring: More complex API for same outcome as Framer Motion in a Next.js context
- GreenSock (GSAP): Licensing issues for commercial SaaS on free tier; overkill for UI transitions
- Animate.css: CSS-only, no React integration, not customizable enough

**Confidence:** MEDIUM — Framer Motion 11 was current as of mid-2024. Verify latest.

---

### PDF Generation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @react-pdf/renderer | 3.x (verify) | Generate PDF carousels server-side | Renders React components to PDF. Best option for carousel export because your carousel is already built as React components — you can share layout logic between screen render and PDF export. No headless browser needed. |
| OR: Puppeteer (headless Chrome) | 22.x (verify) | Screenshot-to-PDF | More accurate pixel rendering of your actual canvas output. Use if @react-pdf/renderer struggles with canvas elements or custom fonts. Expensive on Vercel (large Lambda size, slow cold starts). |

**Recommendation: @react-pdf/renderer** as first approach. Fall back to a dedicated PDF microservice (separate server with Puppeteer) only if layout fidelity is unacceptable. Do NOT run Puppeteer on Vercel serverless functions as the primary path — bundle size and cold start will hurt.

**PDF download pattern:**
```typescript
// app/api/export/pdf/route.ts
import { renderToStream } from '@react-pdf/renderer';
import { CarouselPDF } from '@/components/pdf/CarouselPDF';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const carouselId = searchParams.get('id');

  // Fetch carousel data server-side (uses service role to bypass RLS for own data)
  const carousel = await getCarouselById(carouselId, userId);

  const stream = await renderToStream(<CarouselPDF carousel={carousel} />);

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="carousel-${carouselId}.pdf"`,
    },
  });
}
```

**Confidence:** MEDIUM — @react-pdf/renderer v3 was stable as of 2024. Verify version and Next.js App Router compatibility.

---

### Image Download Utilities

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| html-to-image | 1.x (verify) | Export carousel frames as PNG/JPEG | Renders DOM nodes to image. Use for single-frame export (right-click save, download button). Works client-side — no server round-trip needed. |
| jszip | 3.x | Bundle multiple images | When user downloads all carousel frames, zip them client-side with JSZip and trigger a single download. |
| file-saver | 2.x | Trigger browser file download | `saveAs(blob, 'carousel.zip')` — clean API for triggering downloads from blob/stream. |

**Pattern for multi-frame image download:**
```typescript
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

async function downloadAllFrames(frameRefs: React.RefObject<HTMLDivElement>[]) {
  const zip = new JSZip();

  for (let i = 0; i < frameRefs.length; i++) {
    const dataUrl = await toPng(frameRefs[i].current!, { pixelRatio: 2 });
    const base64 = dataUrl.split(',')[1];
    zip.file(`frame-${i + 1}.png`, base64, { base64: true });
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'carousel-frames.zip');
}
```

**Note:** `html-to-image` has known issues with:
- Web fonts not loaded (use `fontEmbedCSS` option)
- External images blocked by CORS (proxy images through your own domain)
- Canvas elements (use `toCanvas()` then convert)

**Confidence:** MEDIUM — these libraries were stable as of 2024 but verify active maintenance.

---

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | 4.x (verify) | Client-side editor state | Carousel editor needs complex client state: selected element, undo/redo history, drag state, clipboard. Zustand is simpler than Redux, no boilerplate, works well with React 19. Do NOT put editor state in React Server Components — it's inherently client state. |
| React Query / TanStack Query | 5.x (verify) | Server state, data fetching | Handles caching, refetching, optimistic updates for carousel list, user data, subscription status. Plays well with Supabase client. Use alongside Zustand (server state vs client state — different concerns). |

**What NOT to use:**
- Redux Toolkit: Too much boilerplate for a carousel editor. Zustand achieves the same with 90% less code.
- Jotai: Good alternative to Zustand but smaller ecosystem. Zustand is more documented for canvas editor patterns.
- Context API for editor state: Will cause full re-renders on every state change, killing canvas performance.

**Confidence:** MEDIUM — Zustand 4 and TanStack Query 5 were stable as of 2024.

---

### Forms

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React Hook Form | 7.x (verify) | Form handling | Used for: onboarding forms, workspace settings, billing info. Zero re-renders on keypress — important for perceived performance. |
| Zod | 3.x (verify) | Schema validation | Validate form inputs AND webhook payloads AND API request bodies. Single validation library across the stack. Integrates with React Hook Form via `@hookform/resolvers`. |

**Confidence:** MEDIUM — these were stable current versions as of 2024.

---

### Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vitest | 2.x (verify) | Unit + integration tests | Faster than Jest, native ESM support, compatible with Vite-based tooling. Test Stripe webhook handlers, RLS policies (via Supabase local emulator), Zod schemas. |
| Playwright | 1.4x (verify) | E2E tests | Test critical user flows: sign up, create carousel, upgrade plan, download PDF. Run against Vercel preview deployments in CI. |
| @testing-library/react | 16.x (verify) | Component tests | Test UI components in isolation. Use with Vitest. |

**Confidence:** LOW — testing library versions change frequently. Verify all before installing.

---

### Developer Tooling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ESLint | 9.x | Linting | Use flat config format (ESLint 9+). Include `eslint-config-next` and `@typescript-eslint`. |
| Prettier | 3.x | Code formatting | Consistent formatting. Configure with `prettier-plugin-tailwindcss` to auto-sort Tailwind classes. |
| Husky + lint-staged | latest | Pre-commit hooks | Run ESLint + Prettier on staged files before commit. Prevents bad code from entering main. |
| stripe CLI | latest | Local webhook testing | `stripe listen --forward-to localhost:3000/api/webhooks/stripe` — essential for testing webhooks locally. |
| Supabase CLI | latest | Local DB + auth | `supabase start` runs a local Postgres + Auth + Studio. Test RLS policies before deploying. |

**Confidence:** MEDIUM on ESLint 9 flat config being stable.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Auth | Supabase Auth | Clerk | Already using Supabase for DB — adding Clerk creates a second auth system. Supabase Auth covers needs. Clerk is better if you need org management out-of-the-box, but RLS handles our multi-tenancy. |
| Auth | Supabase Auth | NextAuth.js | NextAuth needs its own session DB or adapter. Supabase SSR package handles Next.js App Router auth correctly. NextAuth adds complexity without benefit here. |
| Canvas | Konva + react-konva | Fabric.js | Fabric has heavier bundle, weaker TypeScript, more imperative API. Konva's React model fits App Router better. |
| Canvas | Konva + react-konva | tldraw | tldraw is a full whiteboard SDK, not suited for structured carousel creation. Too opinionated. |
| PDF | @react-pdf/renderer | Puppeteer | Puppeteer requires headless Chrome — too large for Vercel serverless. Reserve for a dedicated export microservice if needed. |
| PDF | @react-pdf/renderer | jsPDF | jsPDF is lower-level (draw commands). @react-pdf/renderer lets you use JSX layout, sharing more code with your screen components. |
| Styling | Tailwind CSS v4 | CSS Modules | CSS Modules require more boilerplate for responsive design. Tailwind's utility classes match Resume.io's design system pace. |
| Styling | Tailwind CSS v4 | Styled Components / Emotion | CSS-in-JS adds runtime overhead, complicates RSC (server components can't use CSS-in-JS that requires client context). Tailwind is static CSS — works in RSC. |
| State | Zustand | Redux Toolkit | 10x more boilerplate, no meaningful benefit for this project scale. |
| State | TanStack Query | SWR | TanStack Query v5 has better TypeScript, more features (mutations, optimistic updates), larger ecosystem. SWR is simpler but underpowered for full SaaS data layer. |
| Database | Supabase (Postgres) | PlanetScale / Neon | Already chosen Supabase for auth — using Supabase DB avoids managing two database connections, two billing accounts. RLS is a first-class Postgres feature. |
| ORM | None (Supabase client) | Prisma | Supabase's generated TypeScript types + query builder are sufficient. Adding Prisma creates a migration conflict with Supabase's migration system. Use Supabase migrations directly. |

---

## Installation

```bash
# Core framework
npx create-next-app@latest vss-carousel --typescript --tailwind --app --src-dir --import-alias "@/*"

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Stripe
npm install stripe @stripe/stripe-js

# UI components (shadcn init — interactive CLI)
npx shadcn@latest init

# Canvas editor
npm install konva react-konva

# Animation
npm install framer-motion

# State management
npm install zustand @tanstack/react-query

# PDF export
npm install @react-pdf/renderer

# Image download
npm install html-to-image jszip file-saver
npm install -D @types/file-saver

# Forms + validation
npm install react-hook-form zod @hookform/resolvers

# Dev tooling
npm install -D vitest @testing-library/react @testing-library/jest-dom playwright
npm install -D eslint-config-next @typescript-eslint/eslint-plugin prettier prettier-plugin-tailwindcss
npm install -D husky lint-staged
```

**CRITICAL before running:** Verify every package version on npmjs.com. The versions in this file are training-data estimates from August 2025 cutoff. Run `npm outdated` after install and check for breaking changes in major version bumps.

---

## Key Architecture Decisions

### Next.js App Router Structure

```
app/
  (auth)/
    login/page.tsx
    signup/page.tsx
  (dashboard)/
    layout.tsx          ← Auth guard middleware + Supabase session
    dashboard/page.tsx
    carousels/
      page.tsx          ← List view (Server Component — data fetch)
      [id]/
        page.tsx        ← Editor (Client Component — canvas)
        edit/page.tsx
  api/
    webhooks/
      stripe/route.ts   ← Stripe webhook (raw body required)
      n8n/route.ts      ← Incoming from n8n if needed
    export/
      pdf/route.ts      ← PDF generation
  layout.tsx            ← Root layout, providers
```

### Server vs Client Component Split

| Component | Type | Reason |
|-----------|------|--------|
| Carousel list page | Server Component | Fetches from Supabase, no interactivity |
| Carousel editor | Client Component | Canvas, drag-drop, undo/redo |
| Pricing page | Server Component | Static content, fetch Stripe prices |
| Checkout button | Client Component | Calls Stripe.js |
| Auth forms | Client Component | Form state, React Hook Form |
| Dashboard layout | Server Component | Auth check in layout.tsx |

### Supabase Client Pattern (App Router)

```typescript
// lib/supabase/server.ts — for Server Components and API routes
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

// lib/supabase/client.ts — for Client Components
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// lib/supabase/admin.ts — for server-only operations (bypass RLS)
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // NEVER expose to client
);
```

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...           # Safe to expose (RLS protects)
SUPABASE_SERVICE_ROLE_KEY=eyJ...               # NEVER expose — server only

STRIPE_SECRET_KEY=sk_...                       # Server only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...      # Safe to expose
STRIPE_WEBHOOK_SECRET=whsec_...               # Server only

N8N_WEBHOOK_URL=https://your-n8n.cloud/webhook/...  # Server only

NEXT_PUBLIC_APP_URL=https://yourdomain.com    # Used for Stripe redirect URLs
```

---

## Verification Required Before Implementation

The following MUST be verified against official docs before coding begins:

1. **Next.js version** — Is 15.x still latest? Any breaking changes since August 2025?
   - Source: https://nextjs.org/blog
2. **@supabase/ssr version and API** — Has the `createServerClient` API changed?
   - Source: https://supabase.com/docs/guides/auth/server-side/nextjs
3. **Stripe Node SDK version** — What's the current API version string?
   - Source: https://stripe.com/docs/upgrades
4. **Tailwind CSS v4** — Is v4 the current stable version? What changed from v3?
   - Source: https://tailwindcss.com/blog
5. **Konva / react-konva** — Is react-konva maintained and compatible with React 19?
   - Source: https://github.com/konvajs/react-konva
6. **@react-pdf/renderer** — Does v3 work in Next.js 15 App Router API routes?
   - Source: https://github.com/diegomura/react-pdf
7. **Framer Motion** — Any breaking changes? Is it compatible with React 19?
   - Source: https://www.framer.com/motion/
8. **html-to-image** — Is the library actively maintained? Any Canvas support issues?
   - Source: https://github.com/bubkoo/html-to-image

---

## Sources

**IMPORTANT: No external sources were verified in this research session.**

All recommendations derive from training data (knowledge cutoff: August 2025). The following are the official sources that MUST be consulted before implementation:

- Next.js docs: https://nextjs.org/docs
- Supabase + Next.js guide: https://supabase.com/docs/guides/auth/server-side/nextjs
- Stripe Node SDK: https://stripe.com/docs/api?lang=node
- Stripe webhooks: https://stripe.com/docs/webhooks
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/docs
- Konva.js: https://konvajs.org/docs
- react-konva: https://konvajs.org/docs/react/
- Framer Motion: https://www.framer.com/motion/
- @react-pdf/renderer: https://react-pdf.org/
- TanStack Query: https://tanstack.com/query/latest
- Zustand: https://docs.pmnd.rs/zustand

**Confidence summary:**
- Stack architecture decisions: MEDIUM (patterns are stable, versions need verification)
- Specific version numbers: LOW (cannot verify without tool access)
- Code patterns (Supabase SSR, Stripe webhook): MEDIUM (official patterns, but API surface may have changed)
