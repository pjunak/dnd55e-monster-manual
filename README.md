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
- **Data api** — `provide()`s `listMonsters(q?) / getItem / getItemByName /
  getRecords / kinds` for future consumers (a combat or NPC addon would
  `use('dnd55e-monster-manual')`).

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
# from the ttrpg-codex repo — installs this addon locally (bypasses GitHub):
node scripts/dev-install-addon.cjs ../dnd55e-monster-manual

# tests (assume ttrpg-codex is a sibling checkout):
node --test tests/smoke.mjs
```

See [`AGENTS.md`](AGENTS.md) for the addon authoring contract.
