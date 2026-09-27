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

  const names = f.DEMO_KIDS.map((k: any) => k.name);
  assert.deepEqual(names, ['سعود', 'نورة']);
  assert.ok(f.DEMO_ANALYTICS_LOGS.some((l: any) => l.behavior.includes('نورة')), 'same family across screens');
});
