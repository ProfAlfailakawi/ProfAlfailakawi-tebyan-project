import { strict as assert } from 'node:assert';
import { test } from 'node:test';

/* دخول العرض عبر `?demo=1`: يرفع الراية ويمحو الوسيط، وبدونه لا شيء يتغيّر. */

function install(href: string) {
  const store = new Map<string, string>();
  const calls: string[] = [];
  (globalThis as any).window = {
    sessionStorage: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
    location: { href, reload: () => {} },
    history: { state: null, replaceState: (_s: any, _t: string, u: string) => void calls.push(u) },
  };
  return { store, calls };
}

test('?demo=1 enters demo mode and strips the param', async () => {
  const { store, calls } = install('https://x.test/?demo=1&tab=qawl#a');
  const { IS_DEMO_MODE } = await import('../src/lib/demoMode.ts');
  assert.equal(IS_DEMO_MODE, true);
  assert.equal(store.get('tebyan_demo_active_v1'), 'true');
  assert.deepEqual(calls, ['/?tab=qawl#a']);
});
