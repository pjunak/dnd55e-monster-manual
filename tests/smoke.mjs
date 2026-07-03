// Client self-test for dnd55e-monster-manual against the host test harness.
// The addon fetches the HOST-served content endpoint
// (/api/addon/dnd55e-monster-manual/content — manifest `contentDir`) lazily on
// first access — these tests mock that fetch and drive the live API + pages.
// Run: node --test tests/smoke.mjs  (assumes ttrpg-codex is a sibling checkout).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dryRunRegister, smokeRegistrations } from '../../ttrpg-codex/web/js/addon-test-harness.mjs';
import register from '../entry.js';

const META = { id: 'dnd55e-monster-manual', permissions: ['ui:route', 'ui:sidebar', 'wiki:kind'] };
const CONTENT_URL = '/api/addon/dnd55e-monster-manual/content';

const SAMPLE = {
  monster: [
    { id: 'aboleth', kind: 'monster', name: 'Aboleth', size: 'Large', type: 'Large Elemental',
      creatureType: 'Elemental', alignment: 'Neutral', ac: '15', hp: '90 (12d10 + 24)',
      speed: '10 ft.', stats: { STR: 14, DEX: 20, CON: 14, INT: 6, WIS: 10, CHA: 6 },
      cr: '5 (XP 1,800; PB +3)', crValue: 5,
      traits: [{ name: 'Resistances', text: 'Bludgeoning, Lightning' }],
      text: '## Thunderous Slam\n\nThe aboleth slams a foe.' },
    { id: 'bandit', kind: 'monster', name: 'Bandit', creatureType: 'Humanoid',
      ac: '12', hp: '11 (2d8 + 2)', speed: '30 ft.', cr: '1/8 (XP 25)', crValue: 0.125, text: '' },
  ],
};

function installFetch(payload = SAMPLE, { ok = true, status = 200 } = {}) {
  globalThis.fetch = (url) => {
    assert.equal(url, CONTENT_URL, 'fetches the host-served content endpoint');
    return Promise.resolve({ ok, status, json: () => Promise.resolve(payload) });
  };
}

// Register + force the lazy content load to resolve, returning the live API.
async function loaded() {
  installFetch();
  const { ok, rec, error } = dryRunRegister(register, META);
  assert.ok(ok, error);
  await rec.provided.loadDetail();
  return { rec, api: rec.provided };
}

test('bestiary: register is clean + wires route, sidebar, wiki-kind, api', () => {
  installFetch();
  const { ok, rec, error } = dryRunRegister(register, META);
  assert.ok(ok, error);
  assert.ok(rec.routes.some(r => r.segment === 'bestiary'), 'the /bestiary route');
  assert.ok(rec.sidebar.some(p => p.route === '/bestiary'), 'a sidebar link');
  assert.ok(rec.wikiKinds.some(w => w.scope === 'monster'), 'owns the monster wiki scope');
  assert.equal(rec.provided.apiVersion, 1, 'provides a versioned data api');
});

test('bestiary: renderers survive the smoke pass', () => {
  installFetch();
  const { rec } = dryRunRegister(register, META);
  const smoke = smokeRegistrations(rec);
  assert.ok(smoke.ok, JSON.stringify(smoke.failures));
});

test('bestiary: api lists + resolves monsters once loaded', async () => {
  const { api } = await loaded();
  assert.equal(api.listMonsters().length, 2);
  assert.equal(api.getItem('monster', 'aboleth').stats.STR, 14, 'stat block on the record');
  assert.equal(api.getItemByName('monster', 'aboleth').id, 'aboleth', 'name lookup, case-insensitive');
  assert.deepEqual(api.kinds(), ['monster']);
});

test('bestiary: [[Name|monster]] resolves by NAME → a /bestiary detail link', async () => {
  const { rec } = await loaded();
  const mk = rec.wikiKinds.find(w => w.scope === 'monster');
  assert.deepEqual(mk.resolve('Aboleth'), { kind: 'bestiary', id: 'monster:aboleth' });
  assert.equal(mk.resolve('Not A Monster'), null, 'unknown name → null');
});

test('bestiary: index sorts by CR and the detail renders the stat block', async () => {
  const { rec } = await loaded();
  const route = rec.routes.find(r => r.segment === 'bestiary');
  const idx = route.render('');
  assert.ok(idx.indexOf('Bandit') < idx.indexOf('Aboleth'), 'CR 1/8 lists before CR 5');
  assert.match(idx, /CR 5/, 'CR sublabel');
  const mon = route.render('monster:aboleth');
  assert.match(mon, /Aboleth/);
  assert.match(mon, /Armor Class|Hit Points|Challenge Rating/, 'stat-block labels');
  assert.match(mon, /STR 14/, 'ability scores with values');
  assert.match(mon, /Resistances/, 'frontmatter traits rendered');
  const miss = route.render('monster:nope');
  assert.match(miss, /Not found/);
});

test('bestiary: degrades gracefully BEFORE the content fetch resolves', () => {
  // A fetch that never resolves: getters return empty, pages show a loading
  // state, and nothing throws.
  globalThis.fetch = () => new Promise(() => {});
  const { ok, rec } = dryRunRegister(register, META);
  assert.ok(ok);
  assert.deepEqual(rec.provided.listMonsters(), []);
  const route = rec.routes.find(r => r.segment === 'bestiary');
  assert.match(route.render(''), /Loading…/);
  assert.match(route.render('monster:aboleth'), /Loading…/);
});
