# Squad Decisions

## Active Decisions

### 2026-11-21: Never store secrets or customer data
**By:** Lead
**What:** Never write secrets, tokens, API keys, customer data, or tenant data into `.squad/` or any other file. That includes charters, decisions, history, logs, commits, and pull requests.
**Why:** Team memory is committed and shared. Those values do not belong in the repository.

### 2026-11-21: Meta-registered URLs stay stable
**By:** Lead
**What:** The URLs `/`, `/privacy.html`, and `/data-deletion.html` stay stable. Do not rename, remove, or replace those pages. Do not change the legal wording of `privacy.html` or `data-deletion.html`.
**Why:** Those URLs are registered in Meta's WhatsApp setup, and the legal wording is under lawyer review. `AGENTS.md` is the project guide for the rest of the legal constraint.

### 2026-11-21: Keep code and tests minimal
**By:** Lead
**What:** Change only the code and tests the task needs. Do not add speculative files, extra dependencies, or broad refactors.
**Why:** The landing site and the admin portal are small and stay that way.

### 2026-11-21: GitHub text is English
**By:** Lead
**What:** Pull requests, commit messages, code comments, and GitHub discussion are in English. User-facing product copy stays plain Spanish, as `AGENTS.md` requires.
**Why:** This repository's GitHub language is English.

### 2026-11-21: Do not rename CI jobs
**By:** Lead
**What:** Do not rename GitHub Actions jobs. The admin portal workflow job is `build`. Leave `.github/workflows/` unchanged unless a human asks for a workflow edit.
**Why:** Existing checks use those job names.

### 2026-11-21: Economy model profile
**By:** Lead
**What:** Auto model selection uses Squad's economy profile. `.squad/config.json` sets `modelProfile` to `economy` and `economyMode` to true. Charters keep `Preferred: auto` and do not pin a premium model.
**Why:** Local Cursor sessions should prefer the cheaper profile Squad ships.

### 2026-11-21: Two hosts, two deploys
**By:** Lead
**What:** GitHub Pages publishes only the repository-root landing at www.core-webhook.eu. The admin portal is a separate Cloudflare Pages project built from `admin/` at admin.core-webhook.eu (`VITE_BASE=/`, output `dist`). Do not copy `admin/dist`, `public/_redirects`, or `public/_headers` onto the marketing site, and do not replace root `index.html` or `CNAME`. Keep the SPA fallback `/* /index.html 200`. A production portal build must set `VITE_API_BASE`, `VITE_COGNITO_DOMAIN`, and `VITE_COGNITO_CLIENT_ID`, and must not fall back to the demo password.
**Why:** The sites are different artifacts. GitHub Pages cannot send the portal CSP, and overlaying the Vite build would replace the public site. The demo password is only for an empty API base in local development.

### 2026-11-21: Open pull requests ready and do not merge
**By:** Lead
**What:** Open pull requests ready for review. Agents do not merge them.
**Why:** A human reviews and merges. The squad's job ends when the pull request is ready.

### 2026-11-21: Vendored skills stay pinned
**By:** Lead
**What:** Do not update `.cursor/skills/` automatically. `security-review` stays at the commit recorded in its `UPSTREAM.md`. When a UI check needs the Playwright CLI, run `npx --yes @playwright/cli@0.1.22`, and do not attach screenshots with `gh`.
**Why:** Those copies are pinned on purpose. An unattended bump changes the review and the browser check without a human asking.

### 2026-11-21: End-to-end tests stay mocked
**By:** Lead
**What:** Playwright smoke tests mock the API and do not call Cognito. CI builds with the invalid placeholder hosts and client id already in `.github/workflows/admin-portal.yml`. Do not point the suite at real hosts, use real credentials, or print tokens or tenant data.
**Why:** The smoke run has to stay safe in CI and in review. Live login and customer data do not belong in that suite.

### 2026-11-21: Portal session and Cloudflare headers stay strict
**By:** Lead
**What:** Cognito login stays Hosted UI plus PKCE. The client secret stays on the server. The browser session is httpOnly cookies, not web storage. `sessionStorage` holds only the PKCE verifier, `state`, and, in mock mode only, the display session. Access and refresh tokens in JSON are ignored. The UI role from groups is display-only; the API authorizes. Accept a logout redirect only when it is `https` on the configured Hosted UI host and the path is `/logout`. Do not weaken `admin/public/_headers` (`'self'` scripts, styles, and fonts, `frame-ancestors 'none'`, and the listed API `connect-src`). Render `privacyPolicyUrl` as a link only through the https-or-loopback check.
**Why:** That is the reviewed login and header contract. Storing tokens, trusting the browser role, or loosening CSP would bypass it. Cloudflare Pages is what makes `frame-ancestors` a real response header.

## Governance

- Standing decisions above are team policy. `AGENTS.md` stays the project guide; do not paste it into this file.
- New decisions go to `.squad/decisions/inbox/` through `squad_decide`. Scribe merges them here.
- Keep history focused on work, decisions focused on direction.
