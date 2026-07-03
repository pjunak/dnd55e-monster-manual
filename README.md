# dnd55e-monster-manual

The **D&D 5.5e (2024) bestiary** for
[ttrpg-codex](https://github.com/pjunak/ttrpg-codex) — 333 creature stat blocks
with a browse UI. Addon id: `dnd55e-monster-manual`.

**One addon per book.** Sibling of
[`dnd55e-players-handbook`](https://github.com/pjunak/dnd55e-players-handbook)
(where these monsters originally lived) — the DM chooses per campaign which
books are in play. Browse-only, prose-first: no engine consumes creature data
today; combat automation would be a separate future addon.

## What it does

- **`/bestiary` pages** — an index sorted by Challenge Rating + a stat-block
  detail page per creature (type, AC, HP, speed, CR, abilities, traits, prose).
- **`[[Name|monster]]` wiki-links** resolve into the detail pages.
- **Data api** — `provide()`s `{ apiVersion: 1, listMonsters(q?), getItem,
  getItemByName, getRecords, kinds, loadDetail }` for future consumers (a
  combat or NPC addon would `use('dnd55e-monster-manual')`; `loadDetail()`
  forces the lazy content fetch).

> ⚠ **Data quality:** the records were bulk-scraped and a subset carries the
> WRONG monster's stat block under its name (plus a few missing staples like
> `werewolf`, `wolf`, `commoner`). See
> [`data/KNOWN_ISSUES.md`](data/KNOWN_ISSUES.md) for the confirmed list and
> the repair strategy before trusting or extending the data.

## How content is stored & served

A **per-record JSON tree**: `data/monsters/<id>.json`, one hand-editable file
per creature (see [`data/SCHEMA.md`](data/SCHEMA.md)). The manifest declares
**`"contentDir": "data"`**, so the **host serves the tree** at
`/api/addon/dnd55e-monster-manual/content` (+ `/content/:kind`,
`/item/:kind/:id`, `/kinds`) — **no server code, no `server:code` grant, no
restart**; installs/updates go live immediately. The client fetches the
aggregate once, lazily, and re-renders when it lands.

## Develop

```sh
# from the ttrpg-codex repo — installs this addon locally (bypasses GitHub);
# takes effect on the next app launch, and repo edits are INVISIBLE until
# you re-run it:
node scripts/dev-install-addon.cjs ../dnd55e-monster-manual

# tests (assume ttrpg-codex is a sibling checkout). ⚠ Windows: use exactly
# this RELATIVE form — `node --test tests/` (directory) and absolute paths
# false-fail:
node --test tests/smoke.mjs
```

## Release

Bump `version` in `addon.json` → commit → push. The DM installs/updates from
the GitHub URL via the host's addon wizard (Settings → Doplňky). Because the
manifest declares `contentDir`, content updates are **hot** — no server
restart. One rule: "⬆ Aktualizovat vše" (update-all) keeps the existing
permission grants, so a release that ADDS a `permissions[]` entry must be
applied through the per-addon wizard (the DM re-reviews the grants).

See [`AGENTS.md`](AGENTS.md) for the repo guide + the addon authoring
contract, and [`data/SCHEMA.md`](data/SCHEMA.md) for the record shape.
