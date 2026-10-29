import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

/** Loads public/sw.js in a sandbox and returns its fetch handler plus what it did. */
function loadServiceWorker(networkResponse: { ok: boolean; type: string; redirected: boolean; status: number }) {
  const listeners: Record<string, (e: any) => void> = {};
  const fetchCalls: Array<{ input: string; init: any }> = [];
  const puts: string[] = [];
  const cache = { put: async (key: string) => void puts.push(key), addAll: async () => {} };
  const sandbox: any = {
    self: {
      location: { origin: 'https://tebyan.example' },
      addEventListener: (type: string, fn: (e: any) => void) => (listeners[type] = fn),
      skipWaiting: () => {},
      clients: { claim: () => {} },
    },
    caches: { open: async () => cache, match: async () => undefined, keys: async () => [] },
    fetch: async (input: string, init: any) => {
      fetchCalls.push({ input, init });
      return { ...networkResponse, clone() { return this; } };
    },
    Response: { error: () => ({ type: 'error' }) },
    URL,
  };
  vm.runInNewContext(read('public/sw.js'), sandbox);
  const navigate = async (path: string) => {
    let responded: Promise<any> | undefined;
    listeners.fetch({
      request: { method: 'GET', mode: 'navigate', url: `https://tebyan.example${path}` },
      respondWith: (p: Promise<any>) => (responded = p),
    });
    const res = await responded;
    await new Promise((r) => setTimeout(r, 0));
    return res;
  };
  return { navigate, fetchCalls, puts };
}

test('service worker: navigations let the browser follow redirects (/qawl/q-5 → /qawl/q-5/)', async () => {
  const sw = loadServiceWorker({ ok: false, type: 'opaqueredirect', redirected: false, status: 0 });
  await sw.navigate('/qawl/q-5');
  assert.equal(sw.fetchCalls[0].input, '/qawl/q-5');
  // Without this, fetch follows the 301 and the redirected response is a network error for a navigation.
  assert.equal(sw.fetchCalls[0].init.redirect, 'manual');
  assert.deepEqual(sw.puts, [], 'a redirect must never become the offline page');
});

test('service worker: only the real app shell at "/" is kept as the offline page', async () => {
  const article = loadServiceWorker({ ok: true, type: 'basic', redirected: false, status: 200 });
  await article.navigate('/qawl/q-5/');
  assert.deepEqual(article.puts, [], 'a static article must not replace the offline app shell');

  const shell = loadServiceWorker({ ok: true, type: 'basic', redirected: false, status: 200 });
  await shell.navigate('/?tab=qawlfasl');
  assert.deepEqual(shell.puts, ['/']);

  const broken = loadServiceWorker({ ok: false, type: 'basic', redirected: false, status: 503 });
  await broken.navigate('/');
  assert.deepEqual(broken.puts, [], 'an error page must not replace the offline app shell');
});

test('static Qawl pages: canonical, sitemap and cards use the final /qawl/<id>/ URL', () => {
  const ids = readdirSync(new URL('../public/qawl/', import.meta.url)).filter((n) => /^q-\d+$/.test(n));
  assert.ok(ids.length > 40);
  for (const id of ids) {
    const page = read(`public/qawl/${id}/index.html`);
    assert.match(page, new RegExp(`<link rel="canonical" href="https://[^"]+/qawl/${id}/">`));
  }
  const sitemap = read('public/sitemap.xml');
  assert.equal(/\/qawl\/q-\d+<\/loc>/.test(sitemap), false);
  const index = read('public/qawl/index.html');
  assert.equal(/class="qcard" href="\/qawl\/q-\d+"/.test(index), false);
});

test('static Qawl pages: small grey text meets WCAG AA contrast on the page background', () => {
  const css = read('scripts/generate-qawl-pages.mjs');
  const hex = (name: string) => css.match(new RegExp(`--${name}:(#[0-9A-Fa-f]{6})`))![1];
  const lum = (h: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: string, b: string) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  assert.ok(ratio(hex('muted'), hex('paper')) >= 4.5, `muted on paper is ${ratio(hex('muted'), hex('paper')).toFixed(2)}:1`);
});
