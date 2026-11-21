# Frontend — History

## Core Context

- **Role:** Frontend Developer
- **Joined:** 2026-11-21

## Learnings

### 2026-11-21 — Onboarding

#### Architecture

- Two surfaces, two hosts. GitHub Pages serves the repo-root landing (`index.html`, `site.css`, `favicon.svg`, `fonts/`) at www.core-webhook.eu. The portal is `admin/` (React, Vite, Tailwind) on Cloudflare Pages at admin.core-webhook.eu. Do not publish `admin/dist` over the marketing root.
- The landing is static. The WhatsApp sample in `index.html` is canned script; it does not call a backend. "Entrar" points at `https://admin.core-webhook.eu/login`.
- Router: `admin/src/App.tsx`. Public routes are `/login` and `/auth/callback`. Authenticated `Shell` children are `/` (Panel), `/conversaciones`, `/sin-respuesta`, `/conocimiento`, `/ajustes`, and `/organizaciones` (superadmin only). Basename comes from `import.meta.env.BASE_URL`. `admin/vite.config.ts` defaults `VITE_BASE` to `/admin/`; the production subdomain build uses `/`. Dev and preview redirect `/` to that base.
- `AuthProvider` (`admin/src/auth/AuthContext.tsx`) wraps the app. Cognito Hosted UI plus PKCE S256 lives in `cognito.ts` and `oauth.ts`. The callback posts `{ code, codeVerifier, redirectUri }` to `POST /auth/token`. The client secret stays on the server. The session is httpOnly cookies (`credentials: 'include'`), then `GET /me`. `groups.ts` maps group `admin` to a superadmin label. That label is display-only.
- An empty `VITE_API_BASE` uses `createMockAdminApi`. A set base uses `createHttpAdminApi`. `AdminProvider` loads tenants before `Shell`.
- No migrations in the repo.

#### Conventions

- Palette is locked in `site.css` and `admin/src/index.css`, and checked by `admin/src/theme.contrast.test.ts`: ivory `#fffbeb`, teal `#0f766e`, ink `#1c1917`. Orange `#f97316` is only the main action (`.cta`, `.btn-accent`) with near-black text. White on orange fails WCAG AA.
- Familjen Grotesk is self-hosted: `fonts/familjen-grotesk-latin.woff2`, copied to `admin/src/fonts/`. `@font-face` is weight 400–700, Latin `unicode-range`. No CDN.
- User-facing copy is plain Spanish (`lang="es"`). GitHub text is English. The product name stays "Automatic Letters".
- `site.css` also styles the legal pages (`.legal`, `.command-box`). Do not change the wording of `privacy.html` or `data-deletion.html`, or the URLs `/`, `/privacy.html`, and `/data-deletion.html`.
- Accessibility: skip link, `main#contenido`, named navs, `:focus-visible`. The `Shell.tsx` drawer traps Tab and restores focus. The sidebar focus ring is ivory because teal disappears on the moss background.
- Layout checks that constrain UI (Tester owns the suite): Playwright smoke at 320, 768, and 1280 px; no horizontal overflow; the login page must not scroll at short heights (`index.css` login media queries; smoke uses 1280×600); the landing example gap under the hero stays within 120 px, and the example column is sticky from 960 px.
- A production `npm run build` throws unless `VITE_API_BASE`, `VITE_COGNITO_DOMAIN`, and `VITE_COGNITO_CLIENT_ID` are set. The admin CI job stays named `build`.

#### Key files

- Landing: `index.html`, `site.css`, `favicon.svg`, `fonts/familjen-grotesk-latin.woff2`, `fonts/OFL.txt`.
- Portal chrome: `admin/index.html`, `admin/src/main.tsx`, `admin/src/App.tsx`, `admin/src/index.css`, `admin/src/components/Shell.tsx`, `Logo.tsx`, `NotReady.tsx`, `Charts.tsx`, `ChatThread.tsx`.
- Pages: `LoginPage.tsx`, `CallbackPage.tsx`, `DashboardPage.tsx`, `ConversationsPage.tsx`, `UnansweredPage.tsx`, `KnowledgePage.tsx`, `SettingsPage.tsx`, `TenantsPage.tsx`.
- Auth: `admin/src/auth/cognito.ts`, `oauth.ts`, `logoutUrl.ts`, `groups.ts`, `AuthContext.tsx`, `AdminContext.tsx`.
- Constraints read, not owned: `AGENTS.md`, `README.md`, `admin/src/theme.contrast.test.ts`, `admin/e2e/smoke.pw.ts`, `admin/public/_headers`, `admin/public/_redirects`.

#### Gotchas

- The font file and the favicon each exist twice (`admin/public/favicon.svg`, `admin/src/fonts/`). The portal build does not use the repo-root copies.
- Default Vite base is `/admin/`. The Cognito redirect defaults to `${origin}${BASE_URL}auth/callback`. Production callback is `https://admin.core-webhook.eu/auth/callback`; logout returns to `/login`. A `dist/404.html` would break those routes. The SPA fallback is `public/_redirects` (`/* /index.html 200`).
- The demo password form appears only when `import.meta.env.DEV` and `VITE_API_BASE` is empty (`admin@example.com`, password `demo`). The Cognito button label is "Entrar con mi cuenta". That click first sends the browser to Hosted UI logout (`markCognitoRelogin`); the next visit to login starts a fresh authorize. The resume flag is `al.oauth.resume`.
- PKCE `state` and the verifier sit in `sessionStorage` (`al.oauth.state`, `al.oauth.verifier`). The callback strips `code` once with `history.replaceState` (a module cache survives Strict Mode). Logout accepts the BFF `cognitoLogoutUrl` only when it is `https` on `VITE_COGNITO_DOMAIN` and the path is `/logout` (`logoutUrl.ts`).
- Group `admin` is a display label, not an access check. The selected tenant id is `sessionStorage` key `al.tenant`. Tokens are not stored. The mock display session (`al.session`) is written only when the API base is empty.
- `NotReady` is wired on Panel, Conversaciones, Conocimiento, and Sin respuesta, but nothing constructs `UnavailableApiError`. `httpClient.ts` turns HTTP errors into generic Spanish strings via `publicApiError`, so a missing path shows an error, not the "todavía no está disponible" screen. README describes that screen; the throw site is absent.
- `privacyPolicyUrl` becomes a link only through `safeNavigationUrl` (https, or http on loopback). The login `from` path goes through `safeInternalPath`.
- Charts set inline `style`, which is why `_headers` allows `style-src-attr 'unsafe-inline'`. `connect-src` lists the two API origins. `style-src` and `font-src` are `'self'`.
- Landing `.bank` answers stay hidden until `<noscript>`. Sticky `#ejemplo` turns off under 700 px height. Login hides `.login-more` under 680 px height so the Cognito screen does not scroll.

