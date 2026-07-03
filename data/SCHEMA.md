# Monster Manual record schema (D&D 5.5e / 2024)

**Storage & loading.** One JSON file per creature under `data/monsters/<id>.json`.
The manifest declares `contentDir: "data"`, so the **host** reads the tree
(grouping by each record's `kind` field) and serves it at
`/api/addon/dnd55e-monster-manual/content` — no addon server code, no restart.
Adding a creature = adding its JSON file.

**Conventions.** `id` is kebab/snake-case, unique within the kind; `name` is the
display string; `text` is the Markdown prose body (the readable stat block).

## `monster`  (reference stat block — browse only; no engine consumes it)
```jsonc
{
  "id": "aboleth", "kind": "monster", "name": "Aboleth", "edition": "2024",
  "size": "Large", "type": "Large Elemental", "creatureType": "Elemental",  // type = source "<Size> <CreatureType>"; creatureType is the derived tail
  "alignment": "Neutral",
  "ac": "15", "hp": "90 (12d10 + 24)", "speed": "10 ft., Fly 90 ft. (hover)",  // kept as display strings
  "stats": { "STR": 14, "DEX": 20, "CON": 14, "INT": 6, "WIS": 10, "CHA": 6 },
  "cr": "5 (XP 1,800; PB +3)", "crValue": 5,                 // crValue = parsed leading token (e.g. "1/4" → 0.25) for sorting
  "traits": [ { "name": "Resistances", "text": "Bludgeoning, Lightning, …" } ],  // from frontmatter (often NOT in the body)
  "text": "…prose stat block (attacks / saves / damage as readable text)…"
  // NB: machine-readable `actions` automation is intentionally NOT shipped
  // (combat is out of scope); the browse view reads the prose block. It is
  // re-derivable from the Living-scroll source if a combat addon is ever built.
}
```
