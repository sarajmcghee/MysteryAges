# GitHub OAuth Architecture (Heroku API + GitHub Pages Frontend)

## Endpoints

### `GET /auth/github/login?redirect=<frontend-url>`
- Validates `redirect` against `REDIRECT_ALLOWLIST`/`FRONTEND_ORIGIN`.
- Creates one-time OAuth `state` with TTL.
- Sets `pl_oauth_state` cookie (HttpOnly, Secure, SameSite=Lax).
- Redirects to GitHub OAuth authorize URL.

### `GET /auth/github/callback?code=<code>&state=<state>`
- Validates callback `state` against cookie + server record.
- Exchanges code for token and loads GitHub `/user`.
- Hard denies all users except `sarajmcghee` (or `ALLOWED_GITHUB_LOGIN`).
- On allow: creates server session, sets `pl_session` cookie, redirects to original frontend redirect.
- On deny: clears auth cookies and redirects with `?auth=denied`.

### `GET /auth/session`
- Reads `pl_session` cookie and server session.
- Returns:
  - `{ "authenticated": false }` or
  - `{ "authenticated": true, "user": { "id", "login", "name", "avatarUrl" } }`

### `POST /auth/logout`
- Requires request `Origin` to match `FRONTEND_ORIGIN`.
- Deletes server session and clears cookies.
- Returns `{ "ok": true }`.

## Session + Cookies
- Session is server-side and opaque (`pl_session` stores only random id).
- `pl_session` cookie:
  - `HttpOnly=true`
  - `Secure=true`
  - `SameSite=None`
  - `Path=/`
- `pl_oauth_state` cookie:
  - `HttpOnly=true`
  - `Secure=true`
  - `SameSite=Lax`
  - `Path=/auth/github/callback`

## CSRF/State
- OAuth login uses one-time state in both cookie and server store.
- Callback requires match: query state == cookie state == stored record.
- State is deleted immediately after callback attempt.
- Logout validates `Origin` to mitigate cross-site POSTs.

## Env Vars
- `PORT`
- `NODE_ENV`
- `FRONTEND_ORIGIN`
- `REDIRECT_ALLOWLIST` (optional CSV)
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL`
- `ALLOWED_GITHUB_LOGIN` (set to `sarajmcghee`)
- `SESSION_SECRET`
- `SESSION_TTL_SECONDS`
- `OAUTH_STATE_TTL_SECONDS`

## Sequence
1. Frontend calls `GET /auth/session`.
2. If unauthenticated, frontend navigates to `GET /auth/github/login?redirect=<frontend-url>`.
3. API sets `pl_oauth_state` and redirects to GitHub.
4. GitHub redirects browser to `/auth/github/callback?code&state`.
5. API validates state, fetches GitHub user, applies allowlist deny rule.
6. If allowed, API sets `pl_session` and redirects back to frontend.
7. Frontend calls `GET /auth/session` and becomes authenticated.
8. Logout calls `POST /auth/logout`, API clears session + cookie.
