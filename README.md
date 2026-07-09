# dnd55e-monster-manual — MERGED, repo archived

> **⚠ This addon has been merged into
> [`dnd55e-compendium`](https://github.com/pjunak/dnd55e-players-handbook)
> (formerly `dnd55e-players-handbook`) as of 2026-07-09.**
>
> The 313 creature records now live there under `data/mm/monsters/` (every
> record carries `book: "mm"` — sourcebook provenance became a per-record
> field). The `/bestiary` route, the `[[Name|monster]]` wiki kind, the
> stat-block detail pages, and the `listMonsters` data API all moved into the
> merged addon unchanged.
>
> **Why merged:** the host's wiki-kind + route namespaces are global
> (first-wins), so per-book addons could never share content kinds, and the
> character-sheet engine consumes exactly one provider. Books are now a data
> facet, not addon boundaries. The data-repair history formerly in
> `data/KNOWN_ISSUES.md` moved to `data/mm/KNOWN_ISSUES.md` in the merged repo.
>
> **Do not install this addon alongside the merged one** — both register the
> `monster` wiki kind and the `/bestiary` route, and the second one to load
> will fail. Uninstall `dnd55e-monster-manual` first.

This repository is kept read-only for history (the original extraction and the
2026-07-04 SRD-5.2 misattribution repair live in its git log).
