# Core Webhook

Static site for [www.core-webhook.eu](https://www.core-webhook.eu) plus a clickable admin portal for **Automatic Letters**, the multi-tenant WhatsApp RAG chatbot.

The files at the repository root are the public site and must stay where they are:

- `index.html` — landing page
- `privacy.html` — privacy policy
- `data-deletion.html` — GDPR deletion instructions (`BORRAR DATOS`)
- `CNAME` — `www.core-webhook.eu`

The portal lives in [`admin/`](admin/) and does not replace those pages.

## Admin portal

Per-tenant console, in Spanish, with mock data for two organizations:

- **Club Bàsquet Samà** (Cambrils) — summer basketball camp
- **Escola de Música L’Harmonia** (Girona)

About ten conversations each, in Catalan, Spanish, and English, including one anonymized GDPR deletion per tenant. Nothing calls the .NET backend yet. The UI talks to an `AdminApi`; `VITE_API_BASE` swaps the in-memory client for `fetch`.

### Run locally

Requires Node.js 22+.

```bash
cd admin
npm install
npm run dev
```

Open [http://localhost:5173/admin/](http://localhost:5173/admin/). The dev server redirects `/` to `/admin/`.

Demo passwords are all `demo`:

| Correo | Rol |
| --- | --- |
| `admin@core-webhook.eu` | Superadmin. Can switch tenants. |
| `campus@cbsama.cat` | Only Club Bàsquet Samà |
| `secretaria@harmonia.cat` | Only Escola de Música L’Harmonia |

`Continuar con Cognito` does not redirect until `VITE_COGNITO_DOMAIN` and `VITE_COGNITO_CLIENT_ID` are set. Until then it shows where the Hosted UI plugs in. See [`admin/src/auth/cognito.ts`](admin/src/auth/cognito.ts) and [`admin/.env.example`](admin/.env.example).

### Build

```bash
cd admin
npm run build
```

Output is static files in `admin/dist`, with asset paths prefixed by `/admin/` (override with `VITE_BASE`). Preview the production build:

```bash
npm run preview
```

Then open [http://localhost:4173/admin/](http://localhost:4173/admin/).

### Deploy

Recommended host: **Cloudflare Pages** at `admin.core-webhook.eu`, as its own project. Do not publish this app by copying a build over the marketing site.

```bash
cd admin
VITE_BASE=/ npm run build
```

- Root directory: `admin`
- Build command: `VITE_BASE=/ npm run build`
- Output directory: `dist`
- SPA fallback: `public/_redirects` (`/* /index.html 200`), copied into `dist`
- Headers: `public/_headers`, also copied into `dist`

`_headers` sends a Content-Security-Policy that matches this app: scripts and styles from `'self'`, Google Fonts (`fonts.googleapis.com` / `fonts.gstatic.com`), `style-src-attr 'unsafe-inline'` because the charts set `style` on elements, `connect-src` for `https://api.core-webhook.eu`, and `frame-ancestors 'none'`. `frame-ancestors` only works as an HTTP header, which is why this deploy is preferred over GitHub Pages. If the API origin changes, edit `connect-src` in `admin/public/_headers`.

Cognito redirect URI: `https://admin.core-webhook.eu/auth/callback`. Logout URI: `https://admin.core-webhook.eu/login`.

The build also writes `dist/404.html` (a copy of `index.html`) for hosts that use a 404 document as the SPA fallback.

**Subfolder** (`www.core-webhook.eu/admin/`), only if you cannot use the subdomain:

1. `cd admin && npm run build` (default `VITE_BASE=/admin/`).
2. Publish the **contents** of `admin/dist` at the `/admin/` path.
3. Never replace the repository-root `index.html`, `privacy.html`, `data-deletion.html`, or `CNAME`. Those files are the public site. Do not copy `dist/index.html` onto them.
4. Add a fallback so `/admin/*` serves `/admin/index.html` (Cloudflare rule or the emitted `404.html`, depending on the host).

GitHub Pages serving the branch root will show the Vite **source** `admin/index.html`, which does not run. It also cannot set the CSP above. Publish `admin/dist` on a host that can, not the source tree.

### Cognito

`Continuar con Cognito` stores a random `state` and a PKCE verifier in `sessionStorage`, then redirects to the Hosted UI with `code_challenge_method=S256`. The callback checks `state`, strips `code` from the URL with `history.replaceState`, and `POST`s the code plus verifier to `/auth/token`. The client secret stays on the server.

Logout, when Cognito is configured, goes to `https://<domain>/logout` after clearing the tab session.

If the token’s groups include `admin`, the UI treats the person as superadmin even when a tenant group is also present. Any other group name is a tenant id (`club-basquet-sama`). That label is for display. It is not an access check.

### Authorization

The browser role is display-only. With `VITE_API_BASE` set, demo passwords are rejected and every data request requires a credential established in this tab:

- **Preferred:** `POST /auth/token` sets an httpOnly, Secure, SameSite cookie and returns `{ email, name, groups }` with no tokens in the JSON. Later calls use `credentials: 'include'`. On load, the portal calls `GET /me` once to see whether that cookie is still present.
- **Also supported:** the token response includes `accessToken`. The portal keeps it in a module variable for the lifetime of the tab and sends `Authorization: Bearer`. It is not written to `localStorage` or `sessionStorage`. A refresh drops it. A `refreshToken` in the JSON is ignored.

The API must, on every request, verify the access token’s signature, issuer, audience, and expiry, read `cognito:groups` from that token, and authorize the `{tenantId}` in the path on the server. A caller who only has the group `club-basquet-sama` must not receive or modify `escola-harmonia`, even if the portal asks. The group `admin` may access every tenant. Do not trust the role, tenant id, or group list sent by the browser.

### Backend endpoints

Base URL: `VITE_API_BASE`. Paths are defined in [`admin/src/api/endpoints.ts`](admin/src/api/endpoints.ts). JSON unless noted. A tenant caller may only use their own id; `admin` may use any.

| Method | Path | Body / query | Returns |
| --- | --- | --- | --- |
| `GET` | `/me` | — | `{ email, name, groups }` so the UI can map `admin` vs tenant id. Not called by the mock. |
| `POST` | `/auth/token` | `{ code, codeVerifier, redirectUri }` | Profile `{ email, name, groups }`. Set an httpOnly cookie, or also return `accessToken` for tab memory. Do not rely on the browser to store a refresh token. |
| `GET` | `/tenants` | — | `TenantProfile[]` |
| `GET` | `/tenants/{tenantId}` | — | `TenantProfile` |
| `PATCH` | `/tenants/{tenantId}` | `{ systemPrompt, privacyPolicyUrl }` | updated `TenantProfile` |
| `GET` | `/tenants/{tenantId}/dashboard` | — | `DashboardStats` for the demo window (conversation count, messages in 7 days, active users, topics, languages, daily activity, recent previews) |
| `GET` | `/tenants/{tenantId}/conversations` | `q`, `language` (`es` \| `ca` \| `en`), `from`, `to` (`YYYY-MM-DD`), `includeAnonymized` | `Conversation[]` |
| `GET` | `/tenants/{tenantId}/conversations/{conversationId}` | — | `Conversation` |
| `GET` | `/tenants/{tenantId}/documents` | — | `KnowledgeDocument[]` |
| `POST` | `/tenants/{tenantId}/documents` | `multipart/form-data` field `file` (pdf, md, txt) | `KnowledgeDocument` (`processing`, then `indexed` once chunked) |
| `DELETE` | `/tenants/{tenantId}/documents/{documentId}` | — | `204` |

Shapes the UI already expects:

```ts
interface TenantProfile {
  id: string
  name: string
  shortName: string
  city: string
  kind: string
  botPhoneNumberId: string
  displayPhone: string
  systemPrompt: string
  privacyPolicyUrl: string
}

type ConversationEvent =
  | { type: 'MessageReceived'; text: string; at: string }
  | { type: 'ReplyGenerated'; text: string; at: string }

interface Conversation {
  id: string
  tenantId: string
  userPhone: string          // empty after GDPR anonymization
  language: 'es' | 'ca' | 'en'
  topic: string
  anonymized: boolean
  deletionRequestedAt?: string
  events: ConversationEvent[]
}
```

`at` is an ISO-8601 timestamp. Phone numbers should already be masked for tenant staff, or the UI will mask E.164 values itself (`+34 611 ** ** 01`). Anonymized threads must not include the original messages or phone number.

Ids in those paths are a single segment matching `^[a-z0-9-]+$` and are URL-encoded. The portal will not request `..` or any other id.

`privacyPolicyUrl` is rendered as a link only when it is `https`, or `http` on localhost / 127.0.0.1. Anything else, including values returned by the API, is shown as text.

To point the portal at the API:

```bash
# admin/.env.local
VITE_API_BASE=https://api.core-webhook.eu
```

Restart `npm run dev`. Uploads, settings, and lists then go through [`admin/src/api/httpClient.ts`](admin/src/api/httpClient.ts). `resetDemo()` exists only on the mock.

### Tests

```bash
cd admin
npm test
```
