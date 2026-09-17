import { strict as assert } from 'node:assert';
import { test } from 'node:test';

/*
 * وضع العرض يَعِد بوعدٍ واحد: لا يكتب شيئًا إلى Firestore. هذه الاختبارات تثبّت
 * ذلك الوعد سلوكيًا (نقطة الحراسة ترمي فعلًا)، ويثبّت `verify-demo-write-guard.mjs`
 * أن تبقى نقطة الحراسة هي الطريق الوحيد. الاثنان معًا لا أحدهما: الأول يثبت أن
 * القفل يعمل، والثاني أنه لا يوجد باب آخر.
 */

/*
 * ملفٌ لحالة «الراية مرفوعة» وحدها. الفصل ضروري لا تجميلي: ثوابت الوحدة تُحسب
 * عند التحميل، وESM يخزّن الوحدة لكل مُعرِّف مرة واحدة — فلا يمكن لعمليةٍ واحدة أن
 * ترى قيمتين مختلفتين لـ IS_DEMO_MODE. حالة «الراية مطفأة» في ملفها المجاور،
 * فيشغّلها منفّذ الاختبار في عملية مستقلة.
 */

/** تهيئة sessionStorage قبل تحميل الوحدة — الراية تُقرأ مرة عند التحميل. */
function installSessionStorage(value: string | null) {
  const store = new Map<string, string>();
  if (value !== null) store.set('tebyan_demo_active_v1', value);
  (globalThis as any).window = {
    sessionStorage: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
    location: { reload: () => {} },
  };
}

test('every write function throws once the flag is on', async () => {
  installSessionStorage('true');
  const { IS_DEMO_MODE } = await import('../src/lib/demoMode.ts');
  assert.equal(IS_DEMO_MODE, true, 'demo flag should be on for this case');

  const writes = await import('../src/lib/firestoreWrites.ts');
  for (const name of ['addDoc', 'setDoc', 'updateDoc', 'deleteDoc', 'writeBatch', 'runTransaction']) {
    assert.throws(
      () => (writes as any)[name](null, {}),
      (err: any) => err?.code === 'DEMO_WRITE_BLOCKED',
      `${name} must refuse to run in demo mode`,
    );
  }
});

test('the demo library covers every category instead of collapsing into one', async () => {
  installSessionStorage(null);
  const fs = await import('node:fs');
  const { adaptDemoQuestion, categoryBreakdown } = await import('../src/data/demoLibrary.ts');
  const raw = JSON.parse(fs.readFileSync('qawl_fasl_full_v1.json', 'utf8'));

  const questions = raw.map((r: any) => (adaptDemoQuestion as any)(r));
  assert.equal(questions.length, 47, 'the shipped corpus should be adapted in full');

  const breakdown = categoryBreakdown(questions);
  assert.equal(
    Object.keys(breakdown).length,
    9,
    `all nine categories should be populated, got ${JSON.stringify(breakdown)}`,
  );
  // No single category may swallow the corpus — that reads worse than no
  // categorisation at all, because eight tabs would render empty.
  const largest = Math.max(...Object.values(breakdown) as number[]);
  assert.ok(largest <= questions.length * 0.4, `largest category holds ${largest} of ${questions.length}`);

  // The adapter must translate the raw shape, not pass it through.
  const sample = questions[0];
  assert.ok(sample.question, 'title -> question');
  assert.ok(['low', 'medium', 'high'].includes(sample.riskLevel), 'sensitivity -> riskLevel');
  assert.equal(sample.status, 'published');
  assert.ok(Array.isArray(sample.keywords), 'tags -> keywords');
  assert.ok(sample.categorySlug, 'a slug the category view can match on');
});
