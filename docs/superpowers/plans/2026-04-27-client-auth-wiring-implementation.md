# Client Auth Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the Voyage-Client login page to the real Voyage-Server auth API so registration, login, and social auth use real backend endpoints instead of faking localStorage data.

**Spec:** `docs/superpowers/specs/2026-04-27-client-auth-wiring-design.md`

**Branch:** `feature/client-auth-wiring`

---

## File Structure

- Create `app/lib/api.js`: fetch wrapper with base URL and `credentials: "include"`.
- Create `app/hooks/useAuth.js`: hook providing `register()`, `login()`, `startOAuth()`, `error`, `loading`.
- Modify `app/login/page.jsx`: replace fake auth with real hook calls and error display.
- Modify `app/page.jsx`: hydrate user from `/auth/me` on OAuth callback.
- Modify `.env`: add `NEXT_PUBLIC_API_URL`.

## Task 1: API Client Module and Environment Variable

**Files:**
- Create: `app/lib/api.js`
- Modify: `.env`

- [ ] **Step 1: Add environment variable**

Add to `.env`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

- [ ] **Step 2: Create the API client module**

Create `app/lib/api.js` with a `fetchApi(path, options)` function:

- Reads `process.env.NEXT_PUBLIC_API_URL`, defaults to `http://localhost:4000`.
- Prepends the base URL to the path.
- Sets `credentials: "include"` on every request.
- Sets `Content-Type: application/json` header by default.
- On success (`response.ok`), returns parsed JSON.
- On failure, throws an error with properties: `message` (from `data.error.message`), `code` (from `data.error.code`), and `status` (from `response.status`).
- On network failure (fetch itself throws), wraps in error with `code: "NETWORK_ERROR"` and message `"Unable to connect. Please try again."`.

- [ ] **Step 3: Verify module loads**

Run:

```powershell
npm run build
```

Expected: build succeeds (the module is valid JS that can be statically analyzed).

- [ ] **Step 4: Commit**

```powershell
git add app/lib/api.js .env
git commit -m "feat: add API client module with base URL config"
```

## Task 2: useAuth Hook

**Files:**
- Create: `app/hooks/useAuth.js`

- [ ] **Step 1: Create the useAuth hook**

Create `app/hooks/useAuth.js` with:

- `"use client"` directive at the top.
- Imports: `useState` from React, `useRouter` from `next/navigation`, `fetchApi` from `../lib/api`.
- Constant `USER_KEY = "voyage-user"` (same key the app already uses).
- Returns `{ register, login, startOAuth, error, loading }`.

`register({ email, password, displayName })`:
1. Sets `error` to `null`, `loading` to `true`.
2. Calls `fetchApi("/auth/register", { method: "POST", body: JSON.stringify({ email, password, displayName }) })`.
3. On success, saves `response.user` to `localStorage(USER_KEY)` as JSON.
4. Calls `router.push("/?authenticated=1")`.
5. On error, sets `error` state.
6. Sets `loading` to `false` in finally block.

`login({ email, password })`:
1. Same pattern as register but calls `POST /auth/login`.

`startOAuth(provider)`:
1. Reads `NEXT_PUBLIC_API_URL` from env (same default).
2. Sets `window.location.href = ${apiUrl}/auth/${provider}/start`.

- [ ] **Step 2: Verify module loads**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```powershell
git add app/hooks/useAuth.js
git commit -m "feat: add useAuth hook for login and registration"
```

## Task 3: Wire Login Page

**Files:**
- Modify: `app/login/page.jsx`

- [ ] **Step 1: Replace fake auth with useAuth hook**

Changes to `app/login/page.jsx`:

1. Add import: `import { useAuth } from "../hooks/useAuth";`
2. Inside `LoginPage` component, call `const auth = useAuth();`
3. Remove the `loginAndRedirect` function entirely.
4. Update `handleSubmit`:
   - When `mode === "register"`: call `auth.register({ email, password, displayName: fullName })`.
   - When `mode === "login"`: call `auth.login({ email, password })`.
5. Update social button `onClick` handlers:
   - Google: `() => auth.startOAuth("google")`
   - Apple: `() => auth.startOAuth("apple")`
6. Add an error display element: if `auth.error` is truthy, render a styled error message showing `auth.error.message` above the submit button. Use a CSS class `auth-error` with red-tinted styling consistent with the existing design.
7. Update the submit button:
   - Add `disabled={auth.loading}` attribute.
   - When `auth.loading` is true, change button text to "Signing in..." or "Creating account..." based on mode.

- [ ] **Step 2: Verify build**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```powershell
git add app/login/page.jsx
git commit -m "feat: wire login page to real auth API"
```

## Task 4: Hydrate User on OAuth Callback

**Files:**
- Modify: `app/page.jsx`

- [ ] **Step 1: Add user hydration for OAuth callback**

Changes to `app/page.jsx`:

1. Add import: `import { fetchApi } from "./lib/api";`
2. Modify the `useEffect` that checks `authenticatedParam`:
   - Current logic: `setShouldBypassLanding(authenticatedParam === "1" && Boolean(storedUser))`.
   - New logic: if `authenticatedParam === "1"` and `storedUser` is null/absent, call `fetchApi("/auth/me")` to fetch the real user, save to `localStorage("voyage-user")`, then set `shouldBypassLanding` to `true`.
   - Keep the existing path (storedUser already present) working as before.
   - Handle errors gracefully: if `/auth/me` fails (no valid session), do not bypass landing — the user will see the landing page and can click to login.

- [ ] **Step 2: Verify build**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```powershell
git add app/page.jsx
git commit -m "feat: hydrate user from /auth/me on OAuth callback"
```

## Task 5: Error Styling and Final Verification

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add error message styles**

Add CSS for the `.auth-error` class to `app/globals.css` in the auth section:

```css
.auth-error {
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.2);
  color: #dc2626;
  font-size: 0.85rem;
  line-height: 1.4;
  text-align: center;
  animation: fadeIn 0.2s ease;
}
```

Ensure the styling works for both light and dark themes if applicable.

- [ ] **Step 2: Run full build verification**

Run:

```powershell
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Manual smoke test**

Start both servers:

- Server: `cd Voyage-Server && npm run dev` (port 4000)
- Client: `cd Voyage-Client && npm run dev` (port 3000)

Verify:
1. Navigate to `http://localhost:3000` — landing page loads.
2. Click "Get Started" — navigates to `/login`.
3. Fill in registration form with new email/password — should call server, get real session cookie, redirect to dashboard.
4. Invalid login (wrong password) — should show inline error message.
5. Duplicate email registration — should show "That email is already registered."

- [ ] **Step 4: Commit**

```powershell
git add app/globals.css
git commit -m "feat: add auth error display styles"
```

## Self-Review

Spec coverage:

- API client with `credentials: "include"` — Task 1.
- `useAuth` hook with `register()`, `login()`, `startOAuth()` — Task 2.
- Login page wired to real endpoints — Task 3.
- OAuth callback hydration via `/auth/me` — Task 4.
- Error display styling — Task 5.
- All prototype screens unchanged — no modifications to dashboard/workspace/review/share components.
- `NEXT_PUBLIC_API_URL` environment variable — Task 1.
- `voyage-user` localStorage key preserved throughout.
