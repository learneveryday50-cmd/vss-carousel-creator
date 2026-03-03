---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [nextjs, supabase, typescript, tailwind, shadcn, framer-motion, ssr, middleware]

# Dependency graph
requires: []
provides:
  - Next.js 16 (Next.js 15 API compatible) project scaffold with TypeScript, Tailwind CSS, App Router
  - "@supabase/ssr async server client with await cookies() pattern"
  - "@supabase/ssr browser client for Client Components"
  - "Supabase admin client (service role, server-only)"
  - "Middleware updateSession with route guards for /dashboard and /onboarding"
  - "Route groups: (auth) centered layout, (protected) shell layout"
  - "Placeholder dashboard and onboarding pages"
  - "AuthCard Framer Motion fade-up wrapper component"
  - "shadcn/ui: button, input, label, card components"
affects: [02, 03, 04, 05, 06, 07]

# Tech tracking
tech-stack:
  added:
    - next@16.1.6 (Next.js 15 API compatible)
    - react@19.2.3
    - "@supabase/ssr@0.9.0"
    - "@supabase/supabase-js@2.98.0"
    - framer-motion@12.34.5
    - server-only@0.0.1
    - tailwindcss@4
    - shadcn@3.8.5
    - typescript@5
  patterns:
    - "Async server client: export async function createClient() with await cookies()"
    - "Cookie API: getAll/setAll (not get/set/remove) for Supabase SSR compatibility"
    - "Route groups: (auth) for unauthenticated pages, (protected) for guarded pages"
    - "Middleware: updateSession with getUser() never getSession() for security"
    - "Admin client: server-only import guard + SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix)"

key-files:
  created:
    - src/lib/supabase/server.ts
    - src/lib/supabase/client.ts
    - src/lib/supabase/admin.ts
    - src/lib/supabase/middleware.ts
    - middleware.ts
    - src/app/(auth)/layout.tsx
    - src/app/(protected)/layout.tsx
    - src/app/(protected)/dashboard/page.tsx
    - src/app/(protected)/onboarding/page.tsx
    - src/components/auth/auth-card.tsx
    - .env.local.example
  modified:
    - package.json

key-decisions:
  - "Scaffolded into temp directory then moved files — create-next-app conflicts with existing .claude/ and .planning/ directories"
  - "Used --base-color zinc for shadcn init to match design spec (New York style)"
  - "Force-added .env.local.example to git despite .gitignore — it is a template, not secrets"
  - "Middleware email_confirmed_at guard added for /verify-email redirect — plan specified this logic in Task 2 description though pattern omitted it"

patterns-established:
  - "Async server client: all server-side Supabase calls use async createClient() with await cookies()"
  - "getUser() only: middleware and server components use getUser(), never getSession() (security requirement)"
  - "Route guards in middleware: isProtected check redirects unauthenticated users to /login"
  - "server-only guard: admin.ts first line is import 'server-only' to prevent accidental client import"

requirements-completed:
  - AUTH-03

# Metrics
duration: 7min
completed: 2026-03-03
---

# Phase 1 Plan 01: Project Scaffold and Supabase Client Utilities Summary

**Next.js 16 project with @supabase/ssr async server/browser/admin clients, route groups (auth)/(protected), middleware session guards using getUser(), and AuthCard Framer Motion wrapper**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-03T15:14:06Z
- **Completed:** 2026-03-03T15:21:06Z
- **Tasks:** 2
- **Files modified:** 34 (24 scaffold + 10 new)

## Accomplishments

- Scaffolded Next.js 16 (Next.js 15 API) project with TypeScript, Tailwind CSS 4, ESLint, App Router, src/ directory layout
- Installed and configured @supabase/ssr with correct async server client pattern (await cookies() — Next.js 15 breaking change handled)
- Created four Supabase client utilities: server (async), browser, admin (server-only), and middleware updateSession with route guards
- Established route group structure: (auth) for login/register pages, (protected) for /dashboard and /onboarding with middleware redirect protection
- Added AuthCard Framer Motion fade-up wrapper used by all auth forms in Plan 03
- Initialized shadcn/ui with zinc base color; added button, input, label, card components

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project and install dependencies** - `d6744a7` (chore)
2. **Task 2: Create Supabase client utilities and route structure** - `e495a6f` (feat)

**Plan metadata:** (docs commit — to be added)

## Files Created/Modified

- `package.json` - Updated name; includes next, @supabase/ssr, @supabase/supabase-js, framer-motion, server-only
- `.env.local.example` - Template with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL
- `src/lib/supabase/client.ts` - Browser client using createBrowserClient from @supabase/ssr
- `src/lib/supabase/server.ts` - Async server client with await cookies() and getAll/setAll cookie API
- `src/lib/supabase/admin.ts` - Service role admin client (server-only guard, SUPABASE_SERVICE_ROLE_KEY)
- `src/lib/supabase/middleware.ts` - updateSession with getUser() route guards for /dashboard and /onboarding
- `middleware.ts` - Root middleware delegating to updateSession with static asset exclusion matcher
- `src/app/(auth)/layout.tsx` - Centered card layout for auth pages
- `src/app/(protected)/layout.tsx` - Shell layout for dashboard/onboarding
- `src/app/(protected)/dashboard/page.tsx` - Placeholder dashboard page
- `src/app/(protected)/onboarding/page.tsx` - Placeholder onboarding page
- `src/components/auth/auth-card.tsx` - Framer Motion fade-up wrapper for auth forms

## Decisions Made

- **Temp directory workaround:** create-next-app refuses to scaffold into a directory with existing files (.claude/, .planning/). Scaffolded into vss-temp/, copied files over, removed temp directory. No functional impact.
- **shadcn zinc color:** Used `--base-color zinc` flag to match plan's design spec (New York style). `--yes` alone prompted interactively.
- **Force-added .env.local.example:** The generated .gitignore excludes `*.local` files. Since .env.local.example is a template (not secrets), it was force-added with `git add -f`.
- **Email confirmation guard added:** The middleware pattern in the plan's Task 2 description explicitly called for a `/verify-email` redirect when `!user.email_confirmed_at` — added this guard even though the `<interfaces>` pattern comment left it out.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Scaffolded via temp directory due to create-next-app conflict**
- **Found during:** Task 1 (scaffold step)
- **Issue:** create-next-app exits with error when directory contains .claude/ and .planning/ subdirectories
- **Fix:** Scaffolded into C:/Users/APC/Downloads/vss-temp, copied all files to project root, removed temp directory
- **Files modified:** All scaffold files (package.json, tsconfig.json, next.config.ts, src/, etc.)
- **Verification:** npm run build completes successfully
- **Committed in:** d6744a7 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking workaround)
**Impact on plan:** Workaround was necessary for scaffolding. All planned artifacts delivered as specified.

## Issues Encountered

- `npx shadcn@latest add ... --legacy-peer-deps` flag not recognized by shadcn CLI 3.8.5. Ran without the flag — installed successfully without conflicts (React 19 compatibility resolved in shadcn 3.x).

## User Setup Required

Before running the application, copy `.env.local.example` to `.env.local` and fill in values from the Supabase Dashboard:

```bash
cp .env.local.example .env.local
```

Required values:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (Dashboard > Project Settings > API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-only, never expose to client)
- `NEXT_PUBLIC_SITE_URL` — Set to `http://localhost:3000` for local dev

## Next Phase Readiness

- Next.js project scaffold complete — all subsequent plans can import from src/lib/supabase/
- Supabase client patterns established — Plans 02, 03, 04, 05 all import createClient from server.ts or client.ts
- Route groups ready — Plan 03 (auth pages) will add pages under src/app/(auth)/
- AuthCard component ready — Plan 03 auth forms will use AuthCard for consistent fade-up animation
- shadcn components available — button, input, label, card ready for auth form and onboarding UI

## Self-Check: PASSED

All 12 required files found. Both task commits (d6744a7, e495a6f) verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-03-03*
