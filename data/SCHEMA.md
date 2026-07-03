# Monster Manual record schema (D&D 5.5e / 2024)

**Storage & loading.** One JSON file per creature under `data/monsters/<id>.json`.
The manifest declares `contentDir: "data"`, so the **host** reads the tree
(grouping by each record's `kind` field) and serves it at
`/api/addon/dnd55e-monster-manual/content` — no addon server code, no restart.
Adding a creature = adding its JSON file.

**Conventions.** `id` is kebab/snake-case, unique within the kind; `name` is the
display string; `text` is the Markdown prose body (the readable stat block).
**Every record MUST carry `"kind": "monster"`** — the host's fallback keys a
kind-less record by its top-level DIR name (`"monsters"`, plural), which makes
it silently invisible to `[[…|monster]]` and the browse page.

⚠ **Data quality:** the shipped records were bulk-scraped and a subset is
misattributed (a record can carry ANOTHER monster's stat block under its
name). Read [`KNOWN_ISSUES.md`](KNOWN_ISSUES.md) before trusting or extending
the data.

## `monster`  (reference stat block — browse only; no engine consumes it)
```jsonc
{
  "id": "example_monster", "kind": "monster", "name": "Example Monster", "edition": "2024",
  "size": "Medium", "type": "Medium Undead", "creatureType": "Undead",  // type = "<Size> <CreatureType>"; creatureType is the type without the size prefix
  "alignment": "Neutral Evil",
  "ac": "12", "hp": "15 (2d8 + 6)", "speed": "30 ft.",         // kept as display strings
  "stats": { "STR": 13, "DEX": 8, "CON": 16, "INT": 3, "WIS": 6, "CHA": 5 },
  "cr": "1/4 (XP 50; PB +2)", "crValue": 0.25,                 // crValue = parsed leading token (e.g. "1/4" → 0.25) for sorting
  "traits": [ { "name": "Resistances", "text": "…" } ],        // from frontmatter (often NOT in the body)
  "text": "…prose stat block (attacks / saves / damage as readable text)…",
  "image": "assets/example.webp"   // OPTIONAL — repo-relative path, resolved via
                                   // host.asset(); detail page + list rows show it,
                                   // hidden when absent. No records ship one yet.
  // NB: machine-readable `actions` automation is intentionally NOT shipped
  // (combat is out of scope); the browse view reads the prose block. It is
  // re-derivable from the Living-scroll source if a combat addon is ever built.
}
```
