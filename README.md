# Core Webhook

Static site for [www.core-webhook.eu](https://www.core-webhook.eu) plus a clickable admin portal for **Automatic Letters**, the multi-tenant WhatsApp RAG chatbot.

The files at the repository root are the public site and must stay where they are:

- `index.html` — landing page
- `privacy.html` — privacy policy
- `data-deletion.html` — GDPR deletion instructions (`BORRAR DATOS`)
- `CNAME` — `www.core-webhook.eu`

The portal lives in [`admin/`](admin/) and does not replace those pages.

## Admin portal

Per-tenant console, in Spanish. Tenants, names, and conversations come from the API (or from the database). The portal does not ship a club, a phone number, or sample threads.

With `VITE_API_BASE` empty it uses an in-memory client that starts empty. [`admin/.env.development`](admin/.env.development) points `npm run dev` at the development API and Cognito Hosted UI.

### Run locally

Requires Node.js 22+.

```bash
cd admin
npm install
npm run dev
```

Open [http://localhost:5173/admin/](http://localhost:5173/admin/). The dev server redirects `/` to `/admin/`.

`npm run dev` loads [`admin/.env.development`](admin/.env.development). That file sets `VITE_API_BASE`, so demo passwords are off and sign-in is Cognito. The callback is `http://localhost:5173/admin/auth/callback` and logout returns to `http://localhost:5173/admin/login`. `VITE_COGNITO_DOMAIN` is the Hosted UI host without a scheme. Copy that file as-is if it is missing; the values are the development Function URL and the public PKCE app client. This file is not read by `npm run build`.

To use the empty in-memory client instead, add `admin/.env.development.local` (gitignored) with `VITE_API_BASE=` empty and restart the dev server. That override wins over `.env.development`.

The only demo password, and only while `VITE_API_BASE` is empty, is `demo`:

| Correo | Rol |
| --- | --- |
| `admin@example.com` | Superadmin. The organization list is empty until the API returns tenants. |

`Continuar con Cognito` does not redirect until `VITE_COGNITO_DOMAIN` and `VITE_COGNITO_CLIENT_ID` are set. With `.env.development` they are. See [`admin/src/auth/cognito.ts`](admin/src/auth/cognito.ts) and [`admin/.env.example`](admin/.env.example).

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

`Continuar con Cognito` stores a random `state` and a PKCE verifier in `sessionStorage`, then redirects to the Hosted UI with `code_challenge_method=S256`. The callback checks `state`, strips `code` from the URL with `history.replaceState`, and `POST`s `{ code, codeVerifier, redirectUri }` to `/auth/token` with `credentials: 'include'`. The client secret stays on the server. The BFF sets the httpOnly cookies and the portal then calls `GET /me` to read the session. The profile in the token response is used only if `/me` does not return one.

Logout `POST`s `/auth/logout` (the browser sends `Origin`) and redirects to the returned `cognitoLogoutUrl` when that URL is `https` on `VITE_COGNITO_DOMAIN` and the path is `/logout`. Otherwise it falls back to `https://<domain>/logout` built in the browser.

If the token’s groups include `admin`, the UI treats the person as superadmin even when a tenant group is also present. Any other group name is a tenant id. That label is for display. It is not an access check.

### Authorization

The browser role is display-only. With `VITE_API_BASE` set, demo passwords are rejected and every data request requires a credential established in this tab:

- **Development session:** `POST /auth/token` sets httpOnly cookies (`ae_access`, and `ae_id` for `/me`) and returns `{ email, name, groups }`. The portal does not store access or refresh tokens. If the JSON includes either, it is ignored. Later calls use `credentials: 'include'` and do not send `Authorization`, because a bearer header would make the API skip `ae_access`. On load, and again after the code exchange, the portal calls `GET /me`. That call needs the `ae_id` cookie; a bearer token alone is not enough.
- The HTTP client can still attach an in-memory bearer if something sets one for the tab. The Cognito callback does not. Nothing is written to `localStorage` or `sessionStorage` except the PKCE verifier, `state`, and (mock mode only) the display session.

The API must, on every request, verify the access token’s signature, issuer, audience, and expiry, read `cognito:groups` from that token, and authorize the `{tenantId}` in the path on the server. A caller whose only group is one tenant id must not receive or modify another tenant, even if the portal asks. The group `admin` may access every tenant. Do not trust the role, tenant id, or group list sent by the browser.

### Backend endpoints

Base URL: `VITE_API_BASE`. Paths are defined in [`admin/src/api/endpoints.ts`](admin/src/api/endpoints.ts). JSON unless noted. A tenant caller may only use their own id; `admin` may use any.

| Method | Path | Body / query | Returns |
| --- | --- | --- | --- |
| `GET` | `/me` | cookie `ae_id` | `{ email, name, groups }` so the UI can map `admin` vs tenant id. Not called by the mock. |
| `POST` | `/auth/token` | `{ code, codeVerifier, redirectUri }` | Profile `{ email, name, groups }` and httpOnly cookies. The portal ignores `accessToken` and `refreshToken` in the JSON. |
| `POST` | `/auth/logout` | `Origin` | Clears the cookies and returns `{ cognitoLogoutUrl }`. The portal redirects there when the URL is the configured Hosted UI `/logout`. |
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

Local `npm run dev` already points at the development API through [`admin/.env.development`](admin/.env.development). Uploads, settings, and lists then go through [`admin/src/api/httpClient.ts`](admin/src/api/httpClient.ts). `resetDemo()` exists only on the mock. Production hosts (`admin.core-webhook.eu`, Cloudflare Pages) are a separate step and are not configured by that file.

### Tests

```bash
cd admin
npm test
```
