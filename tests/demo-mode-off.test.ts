import { strict as assert } from 'node:assert';
import { test } from 'node:test';

/*
 * وضع العرض يَعِد بوعدٍ واحد: لا يكتب شيئًا إلى Firestore. هذه الاختبارات تثبّت
 * ذلك الوعد سلوكيًا (نقطة الحراسة ترمي فعلًا)، ويثبّت `verify-demo-write-guard.mjs`
 * أن تبقى نقطة الحراسة هي الطريق الوحيد. الاثنان معًا لا أحدهما: الأول يثبت أن
 * القفل يعمل، والثاني أنه لا يوجد باب آخر.
 */

/*
 * ملفٌ لحالة «الراية مطفأة» وحدها — عملية مستقلة، للسبب المشروح في الملف المجاور.
 * ما يُثبَت هنا هو النصف الثاني من الضمانة: الحارس لا يعترض شيئًا خارج وضع العرض،
 * فالتطبيق الحقيقي يعمل كما كان تمامًا.
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

test('the flag is off unless it was explicitly set', async () => {
  installSessionStorage(null);
  const mod = await import('../src/lib/demoMode.ts');
  assert.equal(mod.IS_DEMO_MODE, false);
});

test('the guard is inert when the flag is off, so normal use is untouched', async () => {
  installSessionStorage(null);
  const { IS_DEMO_MODE } = await import('../src/lib/demoMode.ts');
  assert.equal(IS_DEMO_MODE, false);

  const writes = await import('../src/lib/firestoreWrites.ts');
  // The call still fails — the arguments are nonsense — but it must reach the
  // real SDK to fail, never the demo block. Anything else would mean the guard
  // refuses writes outside demo mode, which would break the live app.
  for (const name of ['addDoc', 'setDoc', 'updateDoc', 'deleteDoc']) {
    try {
      (writes as any)[name](null, {});
    } catch (err: any) {
      assert.notEqual(
        err?.code,
        'DEMO_WRITE_BLOCKED',
        `${name} must not be blocked when the flag is off`,
      );
    }
  }
});
