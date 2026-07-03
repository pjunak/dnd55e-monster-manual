# Known data-quality issues (READ BEFORE TRUSTING RECORDS)

**Status 2026-07-03: a significant subset of the 333 records carries ANOTHER
monster's stat block under its name.** The corruption is inherited from the
scrape that produced the Living-scroll source tree
(`Living-scroll/modules/compendium/data/dnd_2024/players_handbook/monsters/*.md`
— note monsters live under *players_handbook* upstream): frontmatter AND prose
were shifted against the filename list in several alphabet ranges, and each
record's `# Heading` was later regenerated from the filename — so every record
is **self-consistent and looks fine in the UI**, it's just attributed to the
wrong creature. No internal check can catch the swaps (a duplicate-stat scan
across all 333 found zero duplicates — it's a chain displacement, not a copy).

## Confirmed misattributed (record → what the content actually is)

| id | content is actually |
|---|---|
| `aboleth` | Air Elemental |
| `earth_elemental` | Efreeti ("Large Elemental (Genie)", CR 11) |
| `fire_elemental` | Fire Giant ("Huge Giant", CR 9) |
| `ogre` | Oni ("Large Fiend", CR 7) |
| `priest` | Pseudodragon ("Tiny Dragon", CR 1/4) |
| `warhorse` | (a Tiny Beast, CR 0 — likely Weasel) |
| `weasel` | (a Medium Beast, CR 1/4 — likely Wolf) |
| `water_elemental` | a lycanthrope ("Medium or Small Monstrosity (Lycanthrope)") |
| `wight` | Will-o'-Wisp ("Tiny Undead", CR 2) |
| `winter_wolf` | Worg ("Large Fey", CR 1/2) |
| `worg` | Wight ("Medium or Small Undead") |
| `wraith` | Wyvern ("Large Dragon", CR 6) |

## Confirmed missing entirely (no file at all)

`werewolf`, `wolf`, `commoner` — and possibly more; the displacement chains
imply some creatures' true content was dropped where the shifts began.

## Verified CORRECT (spot checks against the printed 2024 MM)

`zombie`, `skeleton`, `goblin_warrior`, `adult_red_dragon`, `bandit`, `mage`,
`vampire`. The corruption clusters in ranges (A/E/F/O/P/W probed so far);
staples between them check out — but **treat any individual record as
unverified until audited**.

## What was already fixed here (2026-07-03)

36 records had a mechanically mis-split `creatureType` (`"or Small Humanoid"`
etc. — the lost derivation script split `"Medium or Small Humanoid"` on the
first space). Fixed: `size` now carries the full `"Medium or Small"`,
`creatureType` the clean type. This fix is orthogonal to the misattribution
above (it normalized fields, it could not re-home content).

## Repair strategy (future work — do NOT hand-shuffle blindly)

1. External truth is required: the printed 2024 Monster Manual (or a clean
   scrape). The Living-scroll source is itself corrupted — re-running any
   import reproduces the problem.
2. Mechanical aids that work: (a) self-reference scan — many prose blocks name
   their true owner ("the wraith", "the oni"); generic ones ("the elemental",
   "the dragon") don't; (b) plausibility scan — `creatureType`/`cr` vs the
   record name; (c) the missing-name list above shows where chains begin/end.
3. Re-home content to the correct ids, create the missing records, then
   spot-verify every touched record against the book.

Until then the bestiary is fine as a BROWSE demo but not as a rules-accurate
reference.
