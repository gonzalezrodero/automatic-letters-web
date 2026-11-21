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

## Governance

- Standing decisions above are team policy. `AGENTS.md` stays the project guide; do not paste it into this file.
- New decisions go to `.squad/decisions/inbox/` through `squad_decide`. Scribe merges them here.
- Keep history focused on work, decisions focused on direction.
