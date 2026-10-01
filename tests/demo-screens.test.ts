import { strict as assert } from 'node:assert';
import { test } from 'node:test';

/*
 * كل شاشة في العرض تقرأ بياناتٍ محلية (لا Firestore) يجب أن تجد ما تعرضه:
 * قصر الذاكرة، البصمة المعرفية، الرادار الاستباقي، محفظة الولاء، وسديم الأفكار.
 * وتبقى الشخصية واحدة عبرها (سعود ونورة) كي لا يبدو العرض مُلفّقاً.
 */
test('every demo screen fixture is non-empty and coherent', async () => {
  const f = await import('../src/data/demoFixtures.ts');
  const { seedData } = await import('../src/data/seedData.ts');

  assert.ok(f.DEMO_SAVED_LIBRARY.length >= 5, 'library (Rukni → My library)');
  const types = new Set(f.DEMO_SAVED_LIBRARY.map((i: any) => (typeof i === 'string' ? 'text' : i.type)));
  for (const t of ['qawlfasl', 'oracle', 'concept', 'roadmap', 'text']) assert.ok(types.has(t), `library has a ${t} item`);

  assert.ok(f.DEMO_SEARCH_HISTORY.length >= 4, 'knowledge graph history');
  assert.equal(new Set(f.DEMO_SEARCH_HISTORY).size, f.DEMO_SEARCH_HISTORY.length, 'history has no duplicates');

  assert.ok(f.DEMO_ANALYTICS_LOGS.length >= 5, 'predictive radar logs');
  for (const l of f.DEMO_ANALYTICS_LOGS) assert.ok(l.date && l.feeling && l.behavior);

  assert.ok(f.DEMO_LOYALTY.points > 0 && f.DEMO_LOYALTY.history.length > 0, 'loyalty wallet');
  const earned = f.DEMO_LOYALTY.history.reduce((a: number, h: any) => a + h.points, 0);
  assert.equal(earned, f.DEMO_LOYALTY.points, 'loyalty balance equals its history');

  assert.ok(seedData.length > 15, 'ripple / nebula seeds');
  assert.ok(f.DEMO_SAVED_LIBRARY.length >= 12, 'library has enough variety for the counters');

  for (const lang of ['ar', 'en']) {
    const pr = f.getDemoFixtures(lang).prediction;
    assert.ok(pr.pattern_found && pr.prediction && pr.proactive_warning, `radar prediction (${lang}) is filled`);
    assert.ok(['Low', 'Medium', 'High'].includes(pr.risk_level));
  }

  const names = f.DEMO_KIDS.map((k: any) => k.name);
  assert.deepEqual(names, ['سعود', 'نورة']);
  assert.ok(f.DEMO_ANALYTICS_LOGS.some((l: any) => l.behavior.includes('نورة')), 'same family across screens');
});

test('demo fixtures follow the UI language, item for item', async () => {
  const f = await import('../src/data/demoFixtures.ts');
  const ar = f.getDemoFixtures('ar');
  const en = f.getDemoFixtures('en');
  const arabic = /[؀-ۿ]/;

  assert.equal(ar.savedLibrary, f.DEMO_SAVED_LIBRARY);
  assert.equal(en.savedLibrary.length, ar.savedLibrary.length);
  assert.deepEqual(en.savedLibrary.map((i: any) => (typeof i === 'string' ? 'text' : i.id)), ar.savedLibrary.map((i: any) => (typeof i === 'string' ? 'text' : i.id)));
  assert.equal(en.searchHistory.length, ar.searchHistory.length);
  assert.equal(en.analyticsLogs.length, ar.analyticsLogs.length);
  assert.equal(en.loyalty.points, ar.loyalty.points);
  assert.equal(en.loyalty.history.reduce((a: number, h: any) => a + h.points, 0), en.loyalty.points);
  assert.deepEqual(en.kids.map((k: any) => k.name), ['Saud', 'Noura']);
  assert.ok(en.analyticsLogs.some((l: any) => l.behavior.includes('Noura')));

  const enText = JSON.stringify([en.savedLibrary, en.searchHistory, en.analyticsLogs, en.loyalty, en.kids, en.visitorName]);
  assert.ok(!arabic.test(enText), 'English fixtures contain no Arabic text');

  // Items the visitor adds survive; demo items are swapped by id.
  const extra = { id: 'user-added', type: 'oracle', question: 'مضاف' };
  const localized = f.localizeDemoLibrary([...f.DEMO_SAVED_LIBRARY, extra], 'en');
  assert.deepEqual(localized.slice(0, -1), f.DEMO_SAVED_LIBRARY_EN);
  assert.equal(localized.at(-1), extra);
  assert.deepEqual(f.localizeDemoLibrary(localized.slice(0, -1), 'ar'), f.DEMO_SAVED_LIBRARY);
});

test('Nebula does not subscribe to live ripples in demo mode', async () => {
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../src/components/tabs/NebulaTab.tsx', import.meta.url), 'utf8');
  const effect = src.slice(src.indexOf('useEffect(() => {'), src.indexOf("collection(db, 'ripples')"));
  assert.match(effect, /if \(IS_DEMO_MODE\) return;/, 'demo returns before subscribing to ripples');
});
