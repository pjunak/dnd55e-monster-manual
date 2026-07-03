// English UI strings for dnd55e-monster-manual — the source of truth.
// Flat key → string catalog mirroring the host's /i18n/en.json shape. English
// is always present and is the universal fallback; other locales layer on top.
// NOTE: this catalog is for the addon's CHROME (page titles, labels). Creature
// names/prose live in the data records.

export default {
  'nav.bestiary':     'Monster Manual',
  'page.title':       'Monster Manual',
  'page.intro':       'Browse the D&D 5.5e (2024) bestiary — reference stat blocks, prose-first. [[Name|monster]] wiki-links resolve here.',

  'kind.monsters':    'Bestiary',
  'kindName.monster': 'Monster',
  'monster.cr':       'CR {cr}',

  // ── Detail-metadata labels (the stat block) ──────────────────────
  'label.creatureType': 'Type',
  'label.ac':           'Armor Class',
  'label.hp':           'Hit Points',
  'label.speed':        'Speed',
  'label.cr':           'Challenge Rating',
  'label.abilities':    'Abilities',

  // ── List filters ─────────────────────────────────────────────────
  'filter.all':               'All',
  'filter.clear':             'Clear',
  'filter.searchPlaceholder': 'Search…',
  'filter.noMatch':           'Nothing matches the filters.',
  'filter.cr':                'CR',

  // ── Misc ─────────────────────────────────────────────────────────
  'misc.empty':    'No content yet.',
  'misc.unnamed':  '(unnamed)',
  'misc.back':     'Monster Manual',
  'misc.notFound': 'Not found',
  'misc.loading':  'Loading…',
};
