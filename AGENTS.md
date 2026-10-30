# AGENTS.md

## Project

Automatic Letters is a static landing site and a React/Vite admin portal.

- GitHub Pages serves the landing page and legal pages at www.core-webhook.eu.
- `admin/` is the portal, on Cloudflare Pages at admin.core-webhook.eu. Login is Cognito only.

## Design

Do not change the palette or the fonts.

- Teal `#0F766E`, ivory `#FFFBEB`.
- Orange `#F97316` is only the main accent action, and the text on it is near-black.
- Familjen Grotesk is self-hosted. Do not load fonts from a CDN.

## Legal pages

Do not change the legal wording of `privacy.html` and `data-deletion.html`. A lawyer review is pending. The URLs `/privacy.html` and `/data-deletion.html` are registered in Meta's WhatsApp setup and must stay stable.

## Copy and GitHub

User-facing text is plain Spanish, without jargon. Write pull requests, commits, and comments in English. Open pull requests ready for review, and never merge them.

## Before finishing

In `admin/`, run `npm test`, `npm run build`, and `npm run e2e`. `admin/src/theme.contrast.test.ts` and the Playwright smoke tests must pass.

To check a UI change visually, use the `playwright-cli` skill in `.cursor/skills/playwright-cli/`. Run it without a global install: `npx --yes @playwright/cli@0.1.22`. Do not publish screenshots with `gh --attach`, connect to a real browser session, or use real credentials.

## UI checks and vendored skills

Before finishing any UI change, run the Playwright checks at widths 320, 768 and 1280 px: no horizontal overflow, no scroll on the login page at short heights, and no gap in the landing.

Use the `a11y-wcag` skill for accessibility work (keyboard, focus, accessible names, landmarks, in addition to the existing axe checks). Use the `security-review` skill for security reviews (Cognito/OAuth login flow, XSS in React, Cloudflare Pages headers).

Vendored skills are pinned copies and must not be updated automatically.
