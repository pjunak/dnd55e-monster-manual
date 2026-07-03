// ═══════════════════════════════════════════════════════════════
//  dnd55e-monster-manual — the D&D 5.5e (2024) bestiary + a browse UI.
//
//  One addon per BOOK: this is the Monster Manual (creature stat blocks,
//  reference/browse-only — no engine consumes it; combat automation is a
//  possible FUTURE addon, deliberately not built here). Sibling of
//  dnd55e-players-handbook, same architecture:
//
//  DATA LOADING. Content is a per-record JSON tree (data/monsters/<id>.json,
//  see data/SCHEMA.md) that the HOST serves for us at
//  /api/addon/dnd55e-monster-manual/content — the manifest declares
//  `contentDir: "data"`, so there is NO addon server code and NO `server:code`
//  grant (and installs/updates need no server restart). This client lazily
//  fetches that aggregate ONCE on first access (never at register time —
//  register() must stay side-effect-free), caches it, then host.ui.rerender()s
//  so anything drawn before the data landed refreshes.
//
//  Style/safety contract: HTML only via host.h (esc/breadcrumb); colours/
//  spacing only via design tokens var(--…); chrome strings through i18n t().
// ═══════════════════════════════════════════════════════════════

import { t } from './i18n.js';

// The host-served content endpoint (manifest contentDir). Same-origin.
const CONTENT_URL = '/api/addon/dnd55e-monster-manual/content';

export default function register(host) {
  const { esc, renderMarkdown } = host.h;

  // The host wayfinding row (same component core articles use) back to the
  // bestiary index. Feature-detected for older hosts.
  const crumbBar = (current) => (typeof host.h.breadcrumb === 'function')
    ? host.h.breadcrumb([{ label: t('page.title'), href: '#/bestiary' }, { label: current }])
    : `<a href="#/bestiary" style="color:var(--text-muted)">← ${esc(t('misc.back'))}</a>`;

  // ── Content cache + lazy load (mirrors the PHB addon) ────────────
  let _data = {};            // kind → record[]  (empty until loaded)
  let _loaded = false;
  let _loading = null;

  const _ensureLoaded = () => {
    if (_loaded) return Promise.resolve();
    if (_loading) return _loading;
    _loading = fetch(CONTENT_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((data) => {
        _data = (data && typeof data === 'object') ? data : {};
        _loaded = true;
        try { host.ui.rerender(); } catch (_) {}
      })
      .catch(() => { /* leave _data empty — pages show a loading state */ })
      .then(() => { _loading = null; });
    return _loading;
  };

  const recordsOf = (kind) => { _ensureLoaded(); return _data[kind] || []; };
  const monsters  = () => recordsOf('monster');
  const getItem = (kind, id) => recordsOf(kind).find((x) => x.id === id) || null;
  const getItemByName = (kind, name) => {
    const n = String(name || '').trim().toLowerCase();
    return recordsOf(kind).find((x) => (x.name || '').toLowerCase() === n) || null;
  };

  // ── Data API (no consumer today; a future combat/NPC addon would
  //    use('dnd55e-monster-manual')). Same shape family as the PHB api. ──
  host.provide({
    apiVersion: 1,
    listMonsters: (q) => monsters()
      .filter((m) => !q || q.cr == null || m.crValue === q.cr)
      .map((m) => ({ id: m.id, name: m.name, cr: m.cr, crValue: m.crValue, creatureType: m.creatureType })),
    getItem,
    getItemByName,
    getRecords: (kind) => recordsOf(kind),
    kinds: () => Object.keys(_data),
    loadDetail: () => _ensureLoaded(),
  });

  // ── Browse UI ────────────────────────────────────────────────────
  host.registerSidebarPage({ route: '/bestiary', label: t('nav.bestiary'), icon: '🐉' });
  host.registerRoute('bestiary', (sub) => (sub ? renderItem(sub) : renderIndex()));

  // [[Name|monster]] wiki-links resolve into the bestiary detail page (the
  // PHB addon dropped this scope when the monsters moved here). Additive
  // fallthrough — never shadows a world entity of the same name.
  host.registerWikiKind('monster', (label) => {
    const r = getItemByName('monster', label);
    return r ? { kind: 'bestiary', id: 'monster:' + r.id } : null;
  });

  function renderIndex() {
    _ensureLoaded();
    const items = monsters();
    // Sort by CR then name — the natural bestiary reading order.
    const sorted = [...items].sort((a, b) =>
      (Number(a.crValue) || 0) - (Number(b.crValue) || 0) || String(a.name).localeCompare(String(b.name)));
    const count = items.length
      ? `<span style="color:var(--text-muted);font-size:var(--text-xs);background:var(--bg-raised);border-radius:var(--radius-pill);padding:0 var(--space-2)">${esc(String(items.length))}</span>`
      : '';
    const body = items.length
      ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(13rem,1fr));gap:var(--space-1)">${sorted.map(itemLink).join('')}</div>`
      : `<div style="color:var(--text-muted);font-size:var(--text-sm)">${esc(_loaded ? t('misc.empty') : t('misc.loading'))}</div>`;
    return `
      <div class="page-header"><h1>🐉 ${esc(t('page.title'))}</h1></div>
      <p style="color:var(--text-muted);max-width:42rem">${esc(t('page.intro'))}</p>
      ${!_loaded ? `<p style="color:var(--text-muted)">${esc(t('misc.loading'))}</p>` : ''}
      <section style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4);margin-top:var(--space-4)">
        <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3);padding-bottom:var(--space-1);border-bottom:1px solid var(--border-subtle)">
          <span style="width:3px;height:.9rem;border-radius:var(--radius-pill);background:var(--accent-gold);flex:none"></span>
          <span style="font-size:var(--text-sm);font-weight:600;color:var(--text-light);letter-spacing:.04em;text-transform:uppercase">${esc(t('kind.monsters'))}</span>
          ${count ? `<span style="margin-left:auto">${count}</span>` : ''}
        </div>${body}</section>`;
  }

  function itemLink(m) {
    const sub = m.cr
      ? ` <span style="color:var(--text-muted);font-size:var(--text-xs)">· ${esc(t('monster.cr', { cr: String(m.cr).split(' ')[0] }))}</span>`
      : (m.creatureType ? ` <span style="color:var(--text-muted);font-size:var(--text-xs)">· ${esc(m.creatureType)}</span>` : '');
    return `<a href="#/bestiary/monster:${esc(m.id)}" style="display:flex;align-items:baseline;gap:var(--space-1);padding:var(--space-1) var(--space-2);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);color:var(--text-light);text-decoration:none">
      <span style="color:var(--text-parchment)">${esc(m.name || t('misc.unnamed'))}</span>${sub}</a>`;
  }

  function renderItem(param) {
    // `param` is "<kind>:<id>" — the same detail-param convention as the PHB
    // browse pages, so wiki-resolve + links stay uniform across book addons.
    let kind = '', id = String(param);
    const ci = id.indexOf(':');
    if (ci >= 0) { kind = id.slice(0, ci); id = id.slice(ci + 1); }
    if (!_loaded) {
      _ensureLoaded();
      return `${crumbBar(t('misc.loading'))}
        <div class="page-header"><h1>${esc(t('misc.loading'))}</h1></div>
        <p style="color:var(--text-muted)">${esc(t('misc.loading'))}</p>`;
    }
    const rec = kind === 'monster' ? getItem('monster', id) : null;
    if (!rec) {
      return `${crumbBar(t('misc.notFound'))}
        <div class="page-header"><h1>${esc(t('misc.notFound'))}</h1></div>`;
    }
    // The stat-block meta card (plain text — esc()ed here; traits from
    // frontmatter often are NOT in the prose body).
    const meta = [];
    const txt = (label, value) => { if (value != null && value !== '') meta.push({ label, value: String(value) }); };
    txt(t('label.creatureType'), [rec.type, rec.alignment].filter(Boolean).join(', '));
    txt(t('label.ac'), rec.ac);
    txt(t('label.hp'), rec.hp);
    txt(t('label.speed'), rec.speed);
    txt(t('label.cr'), rec.cr);
    const mod = (s) => { const m = Math.floor((Number(s) - 10) / 2); return (m >= 0 ? '+' : '') + m; };
    const ab = rec.stats || {};
    txt(t('label.abilities'), ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
      .map((a) => `${a} ${ab[a] != null ? ab[a] : 10} (${mod(ab[a])})`).join('   '));
    for (const tr of rec.traits || []) if (tr.name) txt(tr.name, tr.text);
    const metaHtml = meta.length
      ? `<div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4);margin:var(--space-3) 0;display:flex;flex-wrap:wrap;gap:var(--space-3) var(--space-5)">${meta.map((m) => `
          <div style="min-width:8rem"><div style="color:var(--text-muted);font-size:var(--text-xs);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">${esc(m.label)}</div>
          <div style="color:var(--text-parchment)">${esc(m.value)}</div></div>`).join('')}</div>`
      : '';
    return `
      ${crumbBar(rec.name || t('misc.unnamed'))}
      <div class="page-header">
        <h1>${esc(rec.name || t('misc.unnamed'))} <span style="color:var(--text-muted);font-size:var(--text-lg);font-weight:400">${esc(t('kindName.monster'))}</span></h1>
      </div>
      ${metaHtml}
      ${rec.text ? `<div class="md-view">${renderMarkdown(rec.text)}</div>` : ''}`;
  }
}
