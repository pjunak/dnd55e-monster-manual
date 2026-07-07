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
//  BROWSE UI. /bestiary is the filterable creature list (search + CR + type,
//  CR-sorted); the detail page renders the stat block with the host's shared
//  .codex-tile components (AC / HP / CR + the six ability tiles), traits, and
//  the prose body. Records may carry an optional `image` (a bundled file,
//  resolved via host.asset) — the picture seam for future artwork.
//
//  Style/safety contract: HTML only via host.h (esc/breadcrumb/dataOn);
//  colours/spacing only via design tokens var(--…) + host component classes;
//  chrome strings through i18n t().
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

  // ── List state: search + CR + creature-type filters (session-lived) ──
  const _q = { search: '', cr: '', type: '' };
  let _qTimer = null;
  host.registerAction('q', (field, value) => {
    _q[field] = String(value == null ? '' : value);
    if (_qTimer) { clearTimeout(_qTimer); _qTimer = null; }
    const go = () => {
      host.ui.rerender();
      if (field === 'search' && typeof document !== 'undefined') setTimeout(() => {
        const el = document.getElementById('mm-search');
        if (el) { el.focus(); const n = el.value.length; try { el.setSelectionRange(n, n); } catch (_) {} }
      }, 0);
    };
    if (field === 'search') _qTimer = setTimeout(go, 180); else go();
  });
  host.registerAction('qClear', () => { _q.search = ''; _q.cr = ''; _q.type = ''; host.ui.rerender(); });

  // Diacritics-insensitive multi-word contains (mirrors the host's `norm`).
  const norm = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const hit = (m, q) => {
    if (!q) return true;
    const blob = norm([m.name, m.creatureType, m.type, m.alignment, m.size, m.cr].join(' '));
    return norm(q).split(/\s+/).every((w) => !w || blob.includes(w));
  };
  const crToken = (cr) => String(cr || '').split(' ')[0];

  function renderIndex() {
    _ensureLoaded();
    const all = monsters();
    // Filter options derive from the live data.
    const crOpts = [...new Set(all.map((m) => m.crValue).filter((v) => v != null))]
      .sort((a, b) => a - b)
      .map((v) => {
        const sample = all.find((m) => m.crValue === v);
        return { value: String(v), label: t('monster.cr', { cr: crToken(sample && sample.cr) || String(v) }) };
      });
    const typeOpts = [...new Set(all.map((m) => m.creatureType).filter(Boolean))].sort()
      .map((x) => ({ value: x, label: x }));

    const items = all.filter((m) => hit(m, _q.search)
      && (!_q.cr || String(m.crValue) === _q.cr)
      && (!_q.type || m.creatureType === _q.type));
    const sorted = [...items].sort((a, b) =>
      (Number(a.crValue) || 0) - (Number(b.crValue) || 0) || String(a.name).localeCompare(String(b.name)));

    const select = (field, labelTxt, opts) => `
      <label style="display:inline-flex;align-items:center;gap:var(--space-1);font-size:var(--text-xs);color:var(--text-muted)">${esc(labelTxt)}
        <select class="edit-input" style="width:auto" ${host.h.dataOn('change', host.action('q'), field, '$value')}>
          <option value="">${esc(t('filter.all'))}</option>
          ${opts.map((o) => `<option value="${esc(o.value)}"${String(_q[field]) === String(o.value) ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}
        </select></label>`;
    const clear = (_q.search || _q.cr || _q.type)
      ? `<button type="button" class="inline-create-btn" ${host.h.dataAction(host.action('qClear'))}>✕ ${esc(t('filter.clear'))}</button>`
      : '';
    const countLabel = sorted.length !== all.length ? `${sorted.length} / ${all.length}` : String(all.length);

    return `
      <div class="page-header"><h1>🐉 ${esc(t('page.title'))}
        <span style="color:var(--text-muted);font-size:var(--text-lg);font-weight:400">${esc(countLabel)}</span></h1></div>
      <p style="color:var(--text-muted);max-width:42rem">${esc(t('page.intro'))}</p>
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-2);align-items:center;margin:var(--space-3) 0">
        <input id="mm-search" class="edit-input" type="search" value="${esc(_q.search)}"
          placeholder="${esc(t('filter.searchPlaceholder'))}" style="flex:1 1 14rem;max-width:22rem"
          aria-label="${esc(t('filter.searchPlaceholder'))}"
          ${host.h.dataOn('input', host.action('q'), 'search', '$value')}>
        ${select('cr', t('filter.cr'), crOpts)}
        ${select('type', t('label.creatureType'), typeOpts)}
        ${clear}
      </div>
      ${sorted.length
        ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(14rem,1fr));gap:var(--space-1)">${sorted.map(itemLink).join('')}</div>`
        : (_loaded
          ? `<div style="color:var(--text-muted);font-size:var(--text-sm);padding:var(--space-3) 0">${esc(t('filter.noMatch'))}</div>`
          : skelRows(8))}`;
  }

  // Skeleton placeholders (the host .codex-skel shimmer) while the content fetch
  // is in flight; the role=status wrapper keeps a screen-reader "Loading…"
  // announcement. The shapes (row grid / prose lines) are this page's layout.
  const skelBox = (style) => `<div class="codex-skel" aria-hidden="true" style="${style}"></div>`;
  const skelWrap = (inner) => `<div role="status" aria-label="${esc(t('misc.loading'))}">${inner}</div>`;
  const skelRows = (n) => skelWrap(`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(14rem,1fr));gap:var(--space-1)">${Array.from({ length: n }, () => skelBox('min-height:2.75rem')).join('')}</div>`);
  const skelLines = () => skelWrap([95, 88, 92, 70, 83].map((w) => skelBox(`height:0.85rem;max-width:${w}%;margin-bottom:var(--space-2)`)).join(''));

  function itemLink(m) {
    const thumb = m.image
      ? `<img src="${esc(host.asset(String(m.image)))}" alt="" loading="lazy"
           style="width:2rem;height:2rem;object-fit:cover;border-radius:var(--radius-sm);flex:none"
           ${host.h.dataOn('error', 'hide', '$el')}>`
      : '';
    const sub = m.cr
      ? ` <span style="color:var(--text-muted);font-size:var(--text-xs)">· ${esc(t('monster.cr', { cr: crToken(m.cr) }))}${m.creatureType ? ' · ' + esc(m.creatureType) : ''}</span>`
      : (m.creatureType ? ` <span style="color:var(--text-muted);font-size:var(--text-xs)">· ${esc(m.creatureType)}</span>` : '');
    // Whole row is one host <a class="codex-link-row"> — the same comfortable
    // ~44px hover/focus-ringed target the PHB compendium uses (widgets.css).
    return `<a href="#/bestiary/monster:${esc(m.id)}" class="codex-link-row">
      ${thumb}<span style="min-width:0"><span style="color:var(--text-parchment)">${esc(m.name || t('misc.unnamed'))}</span>${sub}</span></a>`;
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
        ${skelLines()}`;
    }
    const rec = kind === 'monster' ? getItem('monster', id) : null;
    if (!rec) {
      return `${crumbBar(t('misc.notFound'))}
        <div class="page-header"><h1>${esc(t('misc.notFound'))}</h1></div>`;
    }

    // Badge chips: size/type + alignment + speed.
    const chips = [];
    const chip = (txt, accent) => chips.push(`<span style="display:inline-flex;align-items:center;border:1px solid ${accent ? 'rgba(var(--accent-gold-rgb),.45)' : 'var(--border-subtle)'};color:${accent ? 'var(--accent-gold)' : 'var(--text-light)'};background:var(--bg-raised);border-radius:var(--radius-pill);padding:0.1rem var(--space-2);font-size:var(--text-xs)">${esc(txt)}</span>`);
    if (rec.type) chip(rec.type, true);
    if (rec.alignment) chip(rec.alignment);
    if (rec.speed) chip(`${t('label.speed')}: ${rec.speed}`);

    // Headline stat tiles — the host's shared .codex-tile component, labelled
    // with the same host stat glyphs the character sheet uses (h.icon →
    // .codex-icon; feature-detected, so an older host just shows the text).
    // HP/CR values split their leading token big, the parenthetical small beneath.
    const split = (s) => { const str = String(s || ''); const i = str.indexOf(' '); return i > 0 ? [str.slice(0, i), str.slice(i + 1)] : [str, '']; };
    const ic = (name) => (typeof host.h.icon === 'function') ? host.h.icon(name, { size: 13 }) : '';
    const tile = (label, value, sub, accent, glyph) => `
      <div class="codex-tile${accent ? ' codex-tile-accent' : ''}" style="max-width:11rem">
        <div class="codex-tile-label">${glyph ? ic(glyph) + ' ' : ''}${esc(label)}</div>
        <div class="codex-tile-value">${esc(value)}</div>
        ${sub ? `<div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:1px">${esc(sub)}</div>` : ''}
      </div>`;
    const [hpMain, hpSub] = split(rec.hp);
    const [crMain, crSub] = split(rec.cr);
    const tiles = `
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-2);margin:var(--space-3) 0">
        ${rec.ac != null ? tile(t('label.ac'), String(rec.ac), '', true, 'shield') : ''}
        ${rec.hp ? tile(t('label.hp'), hpMain, hpSub, true, 'heart') : ''}
        ${rec.cr ? tile(t('label.cr'), crMain, crSub) : ''}
      </div>`;

    // The six ability tiles (score + modifier).
    const ab = rec.stats || {};
    const mod = (s) => { const m = Math.floor((Number(s) - 10) / 2); return (m >= 0 ? '+' : '') + m; };
    const abilities = `
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-1);margin:0 0 var(--space-3)">
        ${['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map((a) => `
          <div class="codex-tile" style="flex:0 1 5.5rem;min-width:4.5rem;padding:var(--space-1) var(--space-2)">
            <div class="codex-tile-label">${esc(a)}</div>
            <div class="codex-tile-value" style="font-size:var(--text-lg)">${esc(mod(ab[a]))}</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted)">${esc(String(ab[a] != null ? ab[a] : 10))}</div>
          </div>`).join('')}
      </div>`;

    // Traits (frontmatter — often NOT in the prose body).
    const traits = (rec.traits || []).filter((tr) => tr && tr.name);
    const traitsHtml = traits.length
      ? `<div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4);margin:0 0 var(--space-3);display:flex;flex-wrap:wrap;gap:var(--space-3) var(--space-5)">${traits.map((tr) => `
          <div style="min-width:8rem"><div style="color:var(--text-muted);font-size:var(--text-xs);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">${esc(tr.name)}</div>
          <div style="color:var(--text-parchment)">${esc(tr.text || '')}</div></div>`).join('')}</div>`
      : '';

    // Optional bundled picture (record `image` via host.asset — the artwork seam).
    const img = rec.image
      ? `<img src="${esc(host.asset(String(rec.image)))}" alt="${esc(rec.name || '')}" loading="lazy"
           style="float:right;max-width:min(280px,42%);border-radius:var(--radius-lg);margin:0 0 var(--space-3) var(--space-4);box-shadow:var(--shadow-md)"
           ${host.h.dataOn('error', 'hide', '$el')}>`
      : '';

    return `
      ${crumbBar(rec.name || t('misc.unnamed'))}
      <div style="display:flow-root">
        ${img}
        <div class="page-header">
          <h1>${esc(rec.name || t('misc.unnamed'))} <span style="color:var(--text-muted);font-size:var(--text-lg);font-weight:400">${esc(t('kindName.monster'))}</span></h1>
        </div>
        ${chips.length ? `<div style="display:flex;flex-wrap:wrap;gap:var(--space-1);margin:0 0 var(--space-2)">${chips.join('')}</div>` : ''}
        ${tiles}
        ${abilities}
        ${traitsHtml}
        ${rec.text ? `<div class="md-view">${renderMarkdown(rec.text)}</div>` : ''}
      </div>`;
  }
}
