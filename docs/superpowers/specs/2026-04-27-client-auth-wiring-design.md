# Client Auth Wiring Design

## Context

The Voyage-Server has a fully implemented auth backend: email registration, email login, Google/Apple OAuth, session cookies, email verification, and a `/auth/me` endpoint that returns the current user. All 24 server tests pass.

The Voyage-Client has a complete login/register UI at `/login` with email forms and Google/Apple social buttons, but authentication is faked. The `loginAndRedirect()` function saves a hardcoded user object to `localStorage("voyage-user")` and redirects to `/?authenticated=1`. No API calls are made to the server.

This spec wires the client login page to the real server auth endpoints.

## Goals

- Replace fake auth with real API calls to the Voyage-Server.
- Preserve the existing app flow — all screens after login (dashboard, workspace, review, share) continue working unchanged with prototype data.
- Handle OAuth social auth via server-side redirect flow.
- Display server-side validation errors inline on the login page.
- Keep the wiring minimal: no auth guards, no auth context provider, no logout flow.

## Non-Goals

- No protected route guards (redirect unauthenticated users).
- No `AuthProvider` context wrapping the app.
- No logout button or flow.
- No email verification prompt banner.
- No agency registration wiring.
- No server-side changes.

## Approach

Create a small API client module and a `useAuth` hook. Modify the login page to call the hook instead of the fake `loginAndRedirect()`. Modify the main page to hydrate user data from the server on OAuth callback.

## File Changes

### New: `app/lib/api.js`

A thin fetch wrapper.

- Reads `NEXT_PUBLIC_API_URL` from environment, defaults to `http://localhost:4000`.
- Every request includes `credentials: "include"` so the browser sends and receives HTTP-only session cookies cross-origin.
- Every request sets `Content-Type: application/json`.
- On non-OK responses, throws an error with `code`, `message`, and `status` properties extracted from the server's `{ error: { code, message } }` response format.
- Exports a single `fetchApi(path, options)` function.

### New: `app/hooks/useAuth.js`

A React hook that provides auth operations.

Exports:

- `register({ email, password, displayName })` — calls `POST /auth/register`, saves returned user to localStorage, redirects to `/?authenticated=1`.
- `login({ email, password })` — calls `POST /auth/login`, saves returned user to localStorage, redirects to `/?authenticated=1`.
- `startOAuth(provider)` — navigates the browser to `API_URL/auth/{provider}/start`. The server handles the OAuth redirect chain and eventually redirects back to `APP_ORIGIN/?authenticated=1` with a session cookie set.
- `error` — the most recent error object (`{ message, code, status }`) or `null`.
- `loading` — boolean, true while an API call is in flight.

The hook uses the same localStorage key (`voyage-user`) that the rest of the app already reads, so no downstream changes are needed.

### Modified: `app/login/page.jsx`

Changes:

1. Import and call `useAuth()`.
2. Replace the `loginAndRedirect()` function:
   - `handleSubmit` calls `auth.register()` when `mode === "register"`, or `auth.login()` when `mode === "login"`.
   - Social button `onClick` handlers call `auth.startOAuth("google")` or `auth.startOAuth("apple")`.
3. Display `auth.error?.message` as an inline error message above the submit button.
4. Disable the submit button and show a loading indicator when `auth.loading` is true.
5. Remove the old `loginAndRedirect` function entirely.

### Modified: `app/page.jsx`

Changes:

1. In the `useEffect` that checks `?authenticated=1`, add a fallback: if `authenticatedParam === "1"` but `localStorage.getItem("voyage-user")` is absent, call `GET /auth/me` via `fetchApi` to fetch the real user and save to localStorage. This handles the OAuth callback scenario where the server set a session cookie but the client has no cached user data yet.
2. Import `fetchApi` from `./lib/api.js`.

### Modified: `.env`

Add:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Data Flows

### Email Registration

1. User fills in full name, email, password, confirm password on `/login`.
2. User clicks "Create my account".
3. `useAuth.register()` calls `POST /auth/register` with `{ email, password, displayName }`.
4. Server creates user, hashes password, creates session, sets `voyage_session` HTTP-only cookie in the response, and returns `{ user: { id, email, displayName, role, status, emailVerifiedAt, capabilities } }`.
5. Hook saves the user object to `localStorage("voyage-user")`.
6. Hook calls `router.push("/?authenticated=1")`.
7. Main page detects `?authenticated=1` and stored user, bypasses landing, shows dashboard.

### Email Login

1. User fills in email and password on `/login`.
2. User clicks "Sign in to Voyage".
3. `useAuth.login()` calls `POST /auth/login` with `{ email, password }`.
4. Server validates credentials, creates session, sets cookie, returns `{ user }`.
5. Same localStorage save and redirect as registration.

### Social Auth (Google/Apple)

1. User clicks "Continue with Google" or "Continue with Apple".
2. `useAuth.startOAuth("google")` sets `window.location.href` to `http://localhost:4000/auth/google/start`.
3. Server redirects browser to Google's OAuth consent page.
4. User consents. Google redirects to server's callback (`/auth/google/callback`).
5. Server verifies the identity token, creates/links user, creates session, sets cookie.
6. Server redirects browser to `http://localhost:3000/?authenticated=1`.
7. Client's `page.jsx` detects `?authenticated=1` but no localStorage user.
8. Client calls `GET /auth/me` (cookie is included automatically via `credentials: "include"`).
9. Server returns `{ user }`.
10. Client saves user to localStorage, bypasses landing, shows dashboard.

## Error Handling

The server returns errors in a consistent format:

```json
{ "error": { "code": "EMAIL_ALREADY_USED", "message": "That email is already registered." } }
```

Expected error scenarios on the login page:

| Scenario | Server Response | Displayed Message |
|----------|----------------|-------------------|
| Duplicate email on register | 409, `EMAIL_ALREADY_USED` | "That email is already registered." |
| Wrong email or password | 401, `INVALID_CREDENTIALS` | "Email or password is incorrect." |
| Password too short | 400, `PASSWORD_TOO_SHORT` | "Password must be at least 8 characters." |
| Validation error (bad email format) | 400, `VALIDATION_ERROR` | "Request validation failed." |
| Account disabled | 403, `USER_DISABLED` | "This account is disabled." |
| Network error | N/A | "Unable to connect. Please try again." |

The `fetchApi` wrapper catches network errors (fetch throws) and wraps them in the same error shape with code `NETWORK_ERROR`.

## CORS

The server already configures CORS with `origin: env.APP_ORIGIN` and `credentials: true`. The client's `APP_ORIGIN` defaults to `http://localhost:3000`, which matches Next.js dev server. No CORS changes needed.

## Cookie Behavior

- Server sets `voyage_session` as `HttpOnly`, `SameSite=Lax` in development, `SameSite=None; Secure` in production.
- The client never reads or writes the session cookie directly — it relies on the browser including it automatically via `credentials: "include"`.
- The `localStorage("voyage-user")` cache is a convenience mirror for the UI; the session cookie is the source of truth for auth.

## What Stays the Same

- All prototype screens (dashboard, workspace, agent kickoff, review, share) continue using hardcoded data from `app/data/prototype/`.
- The `usePrototypeState` and `useTripDashboard` hooks are unchanged.
- The `?authenticated=1` query param convention is preserved.
- The `voyage-user` localStorage key is preserved.
- No new npm dependencies required — uses native `fetch`.
