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

The app is a client-side SPA. The host must serve `index.html` for deep links such as `/admin/conversaciones`, or use hash routing later. `admin/public/_redirects` covers Cloudflare Pages when the **project root is `admin/`**.

**Subfolder on the current static host** (`www.core-webhook.eu/admin/`):

1. `cd admin && npm run build`
2. Publish the contents of `admin/dist` at the `/admin/` path, next to the existing root HTML. Do not replace `index.html`, `privacy.html`, `data-deletion.html`, or `CNAME` at the repository root.
3. Configure a fallback so `/admin/*` serves `/admin/index.html`.

GitHub Pages, if it deploys the branch root as-is, will serve the Vite **source** `admin/index.html`, which does not run without a build. Publish `admin/dist`, not the source folder.

**Subdomain or Cloudflare Pages** (`admin.core-webhook.eu`):

```bash
cd admin
VITE_BASE=/ npm run build
```

- Root directory: `admin`
- Build command: `VITE_BASE=/ npm run build`
- Output directory: `dist`
- SPA fallback: `/* /index.html 200` (already in `public/_redirects`)

Set the Cognito redirect URI to `https://admin.core-webhook.eu/auth/callback`.

### Cognito

Production login should redirect to the Hosted UI instead of the demo form:

```text
https://<domain>/oauth2/authorize
  ?client_id=ADMIN_CLIENT_ID
  &response_type=code
  &scope=openid email profile
  &redirect_uri=<origin>/admin/auth/callback
```

The callback page receives `code`. The .NET API should exchange it (client secret stays on the server) and return tokens. Authorization uses Cognito groups:

- `admin` — superadmin, all tenants
- any other group name — that tenant’s id, for example `club-basquet-sama`

Send the access token as `Authorization: Bearer` on every API call.

### Backend endpoints

Base URL: `VITE_API_BASE`. Paths are defined in [`admin/src/api/endpoints.ts`](admin/src/api/endpoints.ts). JSON unless noted. A tenant caller may only use their own id; `admin` may use any.

| Method | Path | Body / query | Returns |
| --- | --- | --- | --- |
| `GET` | `/me` | — | `{ email, name, groups }` so the UI can map `admin` vs tenant id. Not called by the mock. |
| `POST` | `/auth/token` | `{ code, redirectUri }` | `{ accessToken }` after the Hosted UI callback. Not called by the mock. |
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

To point the portal at the API:

```bash
# admin/.env.local
VITE_API_BASE=https://api.core-webhook.eu
```

Restart `npm run dev`. Uploads, settings, and lists then go through [`admin/src/api/httpClient.ts`](admin/src/api/httpClient.ts). `resetDemo()` exists only on the mock.
