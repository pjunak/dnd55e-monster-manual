# AGENTS.md — dnd55e-monster-manual (repo guide for AI agents)

**What this repo is.** The D&D 5.5e (2024) bestiary addon for the
[ttrpg-codex](https://github.com/pjunak/ttrpg-codex) host app. Addon id
`dnd55e-monster-manual` (≠ repo dir name — the host keys on the manifest id).
333 creature records as a per-record JSON tree the HOST serves via manifest
`"contentDir": "data"` — **no server code, no restart**; `/bestiary` browse
pages; the `monster` wiki scope (`[[Name|monster]]`); a `provide()` data API
for future consumers.

## Read these first

1. [`README.md`](README.md) — purpose, serving model, dev + release flow.
2. [`data/SCHEMA.md`](data/SCHEMA.md) — the record shape (incl. the mandatory
   `"kind": "monster"` field and the optional `image` seam).
3. [`data/KNOWN_ISSUES.md`](data/KNOWN_ISSUES.md) — ⚠ a subset of records is
   MISATTRIBUTED (wrong monster's stat block under the name). Do not trust or
   bulk-transform the data without reading this.
4. The **canonical addon-authoring contract** lives in the host repo:
   `../ttrpg-codex/examples/addons/AGENTS.md` (condensed) and
   `../ttrpg-codex/examples/addons/AUTHORING.md` (full reference,
   [GitHub](https://github.com/pjunak/ttrpg-codex/blob/main/examples/addons/AUTHORING.md)).
   This file deliberately does NOT vendor a copy — a stale copy misled agents
   here before.

## Layout

```
addon.json          manifest — id, version, permissions, contentDir, tests.client
entry.js            register(host): /bestiary route, sidebar link, wiki kind,
                    actions, provide() API; lazy content fetch + rerender
i18n.js             the addon's own UI strings (addons are English-only)
data/monsters/*.json  one record per creature (committed source content)
tests/smoke.mjs     harness tests (dev-only; not an install gate)
```

## Working here — the facts that bite

- **Sibling checkouts are assumed**: `../ttrpg-codex` (test harness import +
  dev-install script). `../Living-scroll` is the original scrape source — it
  is itself corrupted (see KNOWN_ISSUES); re-importing from it reproduces the
  data problems.
- **Dev loop**: from `../ttrpg-codex` run
  `node scripts/dev-install-addon.cjs ../dnd55e-monster-manual`, then restart
  the app. **Repo edits are invisible until re-dev-installed.**
- **Tests**: `node --test tests/smoke.mjs` from THIS repo's root. On Windows
  only that relative form works (`node --test tests/` and absolute `C:\...`
  paths false-fail), and node runs from PowerShell, not Git Bash, on the
  maintainer's machine.
- **Adding a creature** = add `data/monsters/<id>.json` with
  `"kind": "monster"` (a kind-less record falls back to the DIR name
  `"monsters"` and silently disappears from the wiki scope + browse page).
  Content is hot — reinstall/update and it's live, no restart.
- **Release**: bump `addon.json` version → push → DM updates via the wizard.
  Update-all never grants NEW permissions; a permission-adding release needs
  the per-addon wizard.

## Contract recap (full rules in the host repo)

- All HTML through `host.h` — `esc()` every dynamic value, `dataAction`/`dataOn`
  for handlers (never inline `onclick`). Design tokens (`var(--…)`) + host
  component classes only (`.codex-tile` etc.) — no literal colours/sizes.
- Request exactly the permissions used (`ui:route`, `ui:sidebar`, `ui:action`,
  `wiki:kind` today) — an ungranted capability throws at runtime while tests
  can still pass; the harness enforces `meta.permissions` when declared, so
  keep the test META in sync with `addon.json`.
- `register(host)` is side-effect-free except `register*` calls; renderers must
  survive sparse input (a load-time smoke calls them with samples).
- Everything (UI strings included) in **English**.

## Settled decisions (don't relitigate)

- **One addon per book** — DM opts in per campaign.
- **Combat automation is out of scope** — prose stat blocks only; the source's
  machine-readable `actions` were deliberately dropped (re-derivable if a
  separate combat addon is ever built). This addon stores + serves reference
  content; it does not resolve combat.
