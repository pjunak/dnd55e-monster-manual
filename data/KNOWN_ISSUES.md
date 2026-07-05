# Data provenance & repair history

**Status 2026-07-04: the misattribution corruption is FIXED.** Every shipped
record now carries its own creature's stat block, verified against the SRD 5.2
(the 2024 rules System Reference Document) via Open5e.

## What was wrong

The original bulk scrape (via the Living-scroll source tree) chain-shifted
content against the filename list: a record could carry ANOTHER monster's
complete stat block under its name, with the `# Heading` regenerated from the
filename — so every record looked self-consistent in the UI while being
attributed to the wrong creature. The corruption lived in the SOURCE, so
re-importing reproduced it.

## How it was repaired

1. **Fingerprint matching.** Each record's content fingerprint (the six
   ability scores + AC + HP + CR) was matched against the SRD 5.2 creature
   list. 221 records were confirmed misattributed; 83 were already correct.
2. **Re-homing (authentic content preserved).** 197 + 26 displaced stat blocks
   were moved to their true ids (only the id/name/heading were corrected —
   the scraped prose is authentic book text). This included content parked
   under 24 spurious plural "group page" ids (`black_dragons` held Black
   Pudding, `mummies` held Nalfeshnee, …), which were deleted after their
   content was re-homed.
3. **Rebuilds from SRD 5.2.** Slots whose true content was lost in the shift
   were regenerated from SRD 5.2 data (stat line, traits, actions), formatted
   to this repo's schema and 2024 book conventions ("Medium or Small"
   humanoids, "Swarm of Tiny X", subtype tags like Devil/Demon/Angel/Genie).
4. **Recovered creatures.** `wolf`, `werewolf`, `commoner` (missing entirely)
   and `bone_devil` (found displaced with no slot) were created.
5. **Non-SRD creatures.** Five 2024-MM creatures outside the SRD
   (`carrion_crawler`, `nothic`, `slaad_tadpole`, `bullywug_warrior`,
   `bullywug_bog_sage`) were verified/rebuilt against the 2024 Monster Manual
   via secondary sources (cross-checked stat lines).

The bestiary now ships 313 records, each verified either against the SRD 5.2
fingerprint (308) or against 2024 MM secondary sources (the five non-SRD ids).

## Follow-up enrichment (2026-07-05)

The limitations noted after the misattribution repair have been addressed:

- **Senses / Languages / Saving Throws / Skills** are now on every record as
  `traits[]` entries (the schema's existing display mechanism, rendered as
  labeled chips alongside Resistances/Immunities). Sourced from the SRD 5.2
  for the 308 fingerprint-matched records and from verified 2024 MM secondary
  sources for the five non-SRD ids. Saving Throws lists only proficient saves
  (those differing from the raw ability modifier), matching 2024 stat block
  style.
- **Flavor prose**: every record now opens with a one-line description after
  the size/type line. These lines are ORIGINAL summaries written for this
  addon — the 2024 Monster Manual's own descriptive paragraphs are copyrighted
  and are not distributed in the SRD, so they cannot be shipped. Anyone with
  book access can replace a line by editing the record's `text`.
- **Encoding artifacts** (mojibake em-dashes/quotes from the original scrape's
  double-encoding) were normalized to proper UTF-8 across all records.

## Remaining (by design)

- The one-line flavor descriptions are intentionally brief originals, not the
  book's prose. This is a licensing boundary, not a data defect.
- Machine-readable `actions` automation is still intentionally NOT shipped
  (combat is out of scope for this addon — see AGENTS.md "Settled decisions").
