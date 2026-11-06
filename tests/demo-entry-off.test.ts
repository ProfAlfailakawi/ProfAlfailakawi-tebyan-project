import { strict as assert } from 'node:assert';
import { test } from 'node:test';

/* بلا الوسيط (أو بقيمة غير 1) يبقى الإنتاج كما هو، والزر مخفيّ افتراضيًا. */

test('no param, or a wrong value, leaves production untouched', async () => {
  const store = new Map<string, string>();
  (globalThis as any).window = {
    sessionStorage: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
    location: { href: 'https://x.test/?demo=0', reload: () => {} },
    history: { state: null, replaceState: () => assert.fail('must not rewrite the URL') },
  };
  const mod = await import('../src/lib/demoMode.ts');
  assert.equal(mod.IS_DEMO_MODE, false);
  assert.equal(mod.DEMO_ENTRY_VISIBLE, false, 'entry button defaults OFF');
  assert.equal(store.size, 0);
});
