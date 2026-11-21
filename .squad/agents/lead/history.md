# Lead — History

## Core Context

- **Role:** Lead / reviewer
- **Joined:** 2026-11-21

## Learnings

### 2026-11-21 — Onboarding

#### Architecture

Two hosts, two artifacts. GitHub Pages serves the repo-root landing and legal pages at www.core-webhook.eu (`index.html`, `site.css`, `favicon.svg`, `fonts/`, `CNAME`). Cloudflare Pages serves the React/Vite portal from `admin/` at admin.core-webhook.eu (`VITE_BASE=/`, output `admin/dist`). `/admin/` on GitHub Pages is Vite source and does not boot. Do not copy `dist`, `_redirects`, or `_headers` onto the marketing root.

Login is Cognito Hosted UI with PKCE S256. The browser stores `state` and the verifier in `sessionStorage`, then `POST`s `{ code, codeVerifier, redirectUri }` to `/auth/token` with `credentials: 'include'`. The client secret stays on the server. The BFF sets httpOnly cookies (`ae_access`, `ae_id`). JSON access and refresh tokens are ignored. The callback does not set `Authorization`, because a bearer header would make the API skip `ae_access`. `GET /me` restores the display profile. Groups are labels only: `admin` is the superadmin view; any other group name is a tenant id. The API authorizes. Logout `POST`s `/auth/logout` and follows `cognitoLogoutUrl` only when it is `https` on `VITE_COGNITO_DOMAIN` and the path is `/logout`.

`admin/public/_headers` is the header review surface: CSP with `'self'` for scripts, styles, and fonts, `style-src-attr 'unsafe-inline'` for charts, `connect-src` for the two API origins, `frame-ancestors 'none'`, plus Referrer-Policy, HSTS, `nosniff`, `X-Frame-Options: DENY`, and a locked Permissions-Policy. `frame-ancestors` is header-only, which is why the portal is not on GitHub Pages. `admin/public/_redirects` is `/* /index.html 200` so `/auth/callback` and `/login` are not HTTP 404s.

The only workflow is `.github/workflows/admin-portal.yml`. The job name is `build`. It runs `npm test`, `npm run build`, and `npm run e2e` in `admin/` with placeholder Vite values on an invalid API host.

#### Conventions

Frontend owns landing markup and the portal, including the Cognito UI. Tester owns Vitest (`admin/src/**/*.test.ts`, including contrast), Playwright smoke and axe (`admin/e2e/smoke.pw.ts`), and the 320 / 768 / 1280 checks. Lead scopes the change, names the trade-off, and is the reviewer gate. Lead does not implement those surfaces and does not edit Vitest or Playwright. A missing requirement is a REJECT. Lead does not sole-review a change Lead wrote. On REJECT, name a different member to revise, or escalate to the human.

Security review uses the pinned `.cursor/skills/security-review/`. Report only high-confidence exploitable issues after tracing data flow. React text is escaped; flag `dangerouslySetInnerHTML` with attacker-controlled HTML. Link targets go through `safeNavigationUrl` (https, or http on loopback only). Palette, self-hosted Familjen Grotesk, legal wording, and the `build` job name stay as the guide and the existing decisions say. Do not restate them.

E2E mocks the API and does not call Cognito. No real credentials. Vendored skills are not auto-updated. Playwright CLI, when a visual check needs it, is `npx --yes @playwright/cli@0.1.22`, without `gh --attach`.

#### Key files

- `AGENTS.md`, `README.md` — guide and the deploy/auth contract
- `.github/workflows/admin-portal.yml` — job `build`
- `admin/public/_headers`, `admin/public/_redirects`
- `admin/src/auth/` — `cognito.ts`, `oauth.ts`, `logoutUrl.ts`, `credentials.ts`, `groups.ts`, `AuthContext.tsx`
- `admin/src/api/` — `httpClient.ts`, `token.ts`, `session.ts`, `logout.ts`, `endpoints.ts`, `ids.ts`
- `admin/src/lib/safeUrl.ts`
- `.cursor/skills/security-review/SKILL.md`, `UPSTREAM.md` (vendored pin)
- `.squad/agents/frontend/charter.md`, `.squad/agents/tester/charter.md`

#### Gotchas

- Production `npm run build` fails unless `VITE_API_BASE`, `VITE_COGNITO_DOMAIN`, and `VITE_COGNITO_CLIENT_ID` are set. `.env.development` is dev-only. A published bundle must not fall back to the demo password, which exists only while the API base is empty and the build is DEV.
- The build does not emit `dist/404.html`. Cloudflare would serve that file for the callback with HTTP 404. `_redirects` has to stay the SPA fallback.
- If an API origin changes, edit `connect-src` in `_headers`. Do not open `script-src` or `font-src` to a CDN.
- `style-src-attr 'unsafe-inline'` is for chart element styles. It is not permission for inline scripts.
- Cookie mode stores no token. `sessionStorage` holds the PKCE pair and, in mock mode only, the display session. `setBearerToken` exists; the Cognito callback does not use it.
- Resource ids are one segment `^[a-z0-9-]+$`, then URL-encoded. The portal will not request `..`.
- Panel, conversaciones, and documentos are not on the live API. With `VITE_API_BASE` set, those screens must not call the missing paths. The mock still fills them when the base is empty.
