# Work Routing

How to decide who handles what. Standing policy is in `.squad/decisions.md`. `AGENTS.md` is the project guide.

## Standing rules

- Never write secrets, tokens, API keys, customer data, or tenant data into `.squad/` or any other file.
- Keep `/`, `/privacy.html`, and `/data-deletion.html` stable, and leave the legal wording of those two HTML files unchanged.
- Keep code and tests minimal.
- Write GitHub text in English. User-facing product copy stays plain Spanish.
- Do not rename CI jobs. The admin portal job is `build`.

## Routing Table

| Work Type | Route To | Fallback | Examples |
|-----------|----------|----------|----------|
| Landing page | Frontend | Lead | `index.html`, `site.css`, `fonts/`, `favicon.svg` |
| Admin portal UI | Frontend | Lead | React and Vite screens under `admin/` |
| Cognito login UI | Frontend | Lead | Hosted UI, PKCE, and the callback in the portal |
| Accessible UI implementation | Frontend | Lead | Semantic HTML, keyboard, focus, and names in the UI |
| Vitest and Playwright | Tester | Lead | `admin/src/**/*.test.ts` and `admin/e2e/smoke.pw.ts` |
| Axe and accessibility verification | Tester | Frontend | axe in the smoke tests and the `a11y-wcag` skill |
| Scope and code review | Lead | — | Review of Frontend and Tester changes |
| Security review of auth and headers | Lead | Rai | Cognito flow, XSS, Cloudflare Pages headers |
| Decision merge | Scribe | — | Merge `.squad/decisions/inbox/` into `decisions.md` |
| Backlog watch | Ralph | Lead | Issues labeled `squad` |
| Responsible-AI review | Rai | Lead | User-facing copy and safety checks |
| External claim checks | Fact Checker | Lead | Verify a claim before stating it as fact |

## Issue Routing

| Label | Action | Who |
|-------|--------|-----|
| `squad` | Triage: analyze issue, assign `squad:{member}` label | Lead |
| `squad:{name}` | Pick up issue and complete the work | Named member |

### How Issue Assignment Works

1. When a GitHub issue gets the `squad` label, the **Lead** triages it — analyzing content, assigning the right `squad:{member}` label, and commenting with triage notes.
2. When a `squad:{member}` label is applied, that member picks up the issue in their next session.
3. Members can reassign by removing their label and adding another member's label.
4. The `squad` label is the "inbox" — untriaged issues waiting for Lead review.

## Rules

1. **Eager by default** — spawn every agent who can start useful work, including the tester when a feature is being built.
2. **Scribe merges decisions** after substantial work. This Cursor host has no `background-runs` capability, so Scribe runs in the same turn and the coordinator waits.
3. **Quick facts → coordinator answers directly.** Don't spawn an agent for a fact already in `AGENTS.md` or `README.md`.
4. **When two agents could handle it**, pick the one whose domain is the primary concern. Lead reviews; Lead does not take the implementation.
5. **"Team, ..." → fan-out.** Spawn the relevant specialists together. Cursor waits for them; it does not detach background runs.
6. **Issue-labeled work** — when a `squad:{member}` label is applied to an issue, route to that member. Lead handles every untriaged `squad` label.

## Cursor host

Cursor declares approvals, cancel-run, cursor-reconnect, mcp-bridge, subagents, and typed-content-parts, plus a steering file. It does not declare background-runs, native-hooks, or an in-process transport. Specialists are not separate Cursor agents: the coordinator inlines `.squad/agents/<name>/charter.md`. The `squad` agent uses the session model (`model: inherit`).
