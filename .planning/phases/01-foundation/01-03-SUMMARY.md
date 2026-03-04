---
phase: 01-foundation
plan: 03
subsystem: auth
tags: [nextjs, supabase, auth, server-actions, useActionState, react19, framer-motion, ssr, middleware]

# Dependency graph
requires:
  - phase: 01-01
    provides: "AuthCard component, shadcn components (Input/Button/Label), Supabase server client, route group (auth), middleware with email_confirmed_at guard"
  - phase: 01-02
    provides: "brands table (for signInAction brand-check redirect), profiles + usage_tracking (auto-provisioned by handle_new_user trigger on signup)"
provides:
  - "signUpAction Server Action — signUp with emailRedirectTo, redirects to /verify-email"
  - "signInAction Server Action — signInWithPassword + brands table check, redirects to /dashboard or /onboarding"
  - "requestPasswordResetAction + updatePasswordAction Server Actions"
  - "GET /auth/confirm — verifyOtp token exchange for email verification and password recovery"
  - "signup page with email + password form, AuthCard fade-up animation"
  - "login page with email + password form, forgot password link, AuthCard fade-up animation"
  - "verify-email static confirmation page with AuthCard animation"
  - "reset-password page with two-state form (request reset vs set new password), recovery session detection"
affects: [02, 03, 04, 05, 06, 07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useActionState (React 19) for Server Action error feedback in Client Components"
    - "Server Actions must accept (prevState, formData) signature for useActionState compatibility"
    - "Two-state page: server component detects recovery session via getUser(), renders appropriate client form"
    - "verifyOtp({ type, token_hash }) — NOT exchangeCodeForSession() — for email OTP verification"
    - "reset-password page split into request-reset-form.tsx and update-password-form.tsx for clean separation"

key-files:
  created:
    - src/app/auth/confirm/route.ts
    - src/app/(auth)/signup/actions.ts
    - src/app/(auth)/signup/page.tsx
    - src/app/(auth)/login/actions.ts
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/verify-email/page.tsx
    - src/app/(auth)/reset-password/actions.ts
    - src/app/(auth)/reset-password/page.tsx
    - src/app/(auth)/reset-password/request-reset-form.tsx
    - src/app/(auth)/reset-password/update-password-form.tsx
  modified:
    - src/app/(auth)/signup/actions.ts (added prevState param for useActionState)
    - src/app/(auth)/login/actions.ts (added prevState param for useActionState)
    - src/app/(auth)/reset-password/actions.ts (added prevState param for useActionState)

key-decisions:
  - "Server Actions use (prevState, formData) signature — required by React 19 useActionState; prevState prefixed with _ to satisfy TypeScript unused variable rules"
  - "reset-password page split into two client form components (request-reset-form.tsx, update-password-form.tsx) — page.tsx is a Server Component that detects recovery session via getUser() and conditionally renders the appropriate form"
  - "verify-email page is purely static — resend email flow deferred (requires email in session/query param, adds complexity, plan marked as optional)"
  - "Login error shown as a banner (not inline per field) — login cannot identify which field is wrong"

patterns-established:
  - "Pattern: useActionState with Server Actions — actions accept (prevState: S, formData: FormData) => Promise<S>"
  - "Pattern: Session-conditional rendering — Server Component calls getUser(), passes result as props or renders different Client Components based on auth state"
  - "Pattern: Client-side form validation before submission — update-password-form uses onSubmit to validate confirm passwords match before allowing formAction"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

# Metrics
duration: 20min
completed: 2026-03-04
---

# Phase 1 Plan 03: Auth Flows — Sign Up, Email Verify, Login, Password Reset Summary

**Supabase auth flows with React 19 useActionState Server Actions, verifyOtp token exchange, brand-check login routing, and two-state password reset page with recovery session detection**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-03-04T05:48:06Z
- **Completed:** 2026-03-04T06:08:00Z
- **Tasks:** 2 of 3 complete (Task 3 = human-verify checkpoint, awaiting manual test)
- **Files modified:** 10 created, 3 modified (action signature update)

## Accomplishments

- Four Server Actions implementing all auth flows: signUp (with emailRedirectTo), signInWithPassword (with brand-check redirect), requestPasswordReset, and updatePassword
- GET /auth/confirm route handler using verifyOtp — handles both email confirmation (type=email) and password recovery (type=recovery) in one route
- Four auth pages all using AuthCard Framer Motion fade-up animation
- reset-password page detects recovery session server-side via getUser() and renders appropriate form state
- npm run build passes with zero errors; npx tsc --noEmit passes with zero errors
- No deprecated patterns: no auth-helpers, no getSession(), no exchangeCodeForSession()

## Task Commits

Each task was committed atomically:

1. **Task 1: Create auth route handler and Server Actions** - `e0fba4d` (feat)
2. **Task 2: Build auth page UI** - `d09918b` (feat)

**Plan metadata:** (pending — after human verification checkpoint)

## Files Created/Modified

- `src/app/auth/confirm/route.ts` - Token exchange handler using verifyOtp for both email and recovery types
- `src/app/(auth)/signup/actions.ts` - signUpAction with emailRedirectTo pointing to /auth/confirm
- `src/app/(auth)/signup/page.tsx` - Sign up form with useActionState error display
- `src/app/(auth)/login/actions.ts` - signInAction with brands table check for /dashboard vs /onboarding redirect
- `src/app/(auth)/login/page.tsx` - Login form with forgot password link and banner error display
- `src/app/(auth)/verify-email/page.tsx` - Static email confirmation page with envelope icon
- `src/app/(auth)/reset-password/actions.ts` - requestPasswordResetAction + updatePasswordAction
- `src/app/(auth)/reset-password/page.tsx` - Server component detecting recovery session, conditionally rendering forms
- `src/app/(auth)/reset-password/request-reset-form.tsx` - Email form with success state inline message
- `src/app/(auth)/reset-password/update-password-form.tsx` - New password form with client-side confirm-match validation

## Decisions Made

- **prevState signature:** React 19 useActionState requires Server Actions to accept `(prevState: S, formData: FormData)` — added `_prevState` parameter to all four Server Actions. The `_` prefix satisfies TypeScript's no-unused-vars rule.
- **Two-form split for reset-password:** The page component is a Server Component that calls `getUser()` to detect recovery session, then renders either `<RequestResetForm />` or `<UpdatePasswordForm />`. This avoids client-side session detection and keeps session reads on the server.
- **Resend email deferred:** The plan marked the resend email feature as optional ("If too complex, skip it"). Since it requires storing email in query params or retrieving from session, it was deferred. The page instructs users to check spam or contact support.
- **Login error as banner:** Per plan spec, login errors are shown as a full-width banner below the form fields rather than inline per field.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Server Action signature updated for useActionState compatibility**
- **Found during:** Task 2 (auth page UI build) — TypeScript check
- **Issue:** `useActionState<S, P>(action, initial)` requires action signature `(state: S, payload: P) => S | Promise<S>`. Original Server Actions only accepted `(formData: FormData)`, causing TS2345 type errors on all four pages.
- **Fix:** Added `_prevState: ActionState` as first parameter to all four Server Actions (`signUpAction`, `signInAction`, `requestPasswordResetAction`, `updatePasswordAction`). TypeScript check then passes with zero errors.
- **Files modified:** `src/app/(auth)/signup/actions.ts`, `src/app/(auth)/login/actions.ts`, `src/app/(auth)/reset-password/actions.ts`
- **Verification:** `npx tsc --noEmit` — zero errors after fix
- **Committed in:** `d09918b` (Task 2 commit — action files re-staged with page files)

---

**Total deviations:** 1 auto-fixed (1 type bug)
**Impact on plan:** Required fix for correct TypeScript compilation. No behavior change — the prevState is ignored at runtime.

## Issues Encountered

- None beyond the useActionState signature fix documented above.

## User Setup Required

**Before testing, configure Supabase Email Templates:**

1. Authentication > Email Templates > Confirm signup URL:
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding`
2. Authentication > Email Templates > Reset Password URL:
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`
3. Authentication > URL Configuration > Site URL: `http://localhost:3000`
4. Authentication > URL Configuration > Redirect URLs: Add `http://localhost:3000/**`

## Awaiting Human Verification

Task 3 is a blocking checkpoint requiring manual end-to-end testing of all five auth flows:
1. Sign up + email verify → /onboarding
2. Login routing (has brand → /dashboard, no brand → /onboarding)
3. Protected route guard (unauthenticated → /login)
4. Password reset end-to-end
5. Unverified user guard → /verify-email

Run `npm run dev` and follow verification steps in 01-03-PLAN.md Task 3. Reply "auth verified" when all flows pass.

## Next Phase Readiness

- Auth routes fully implemented — all four flows built and type-safe
- build and tsc both pass with zero errors
- Awaiting human verification of live auth flows before marking phase complete

## Self-Check: PASSED

All 10 required files found. Both task commits (e0fba4d, d09918b) verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-03-04 (pending checkpoint verification)*
