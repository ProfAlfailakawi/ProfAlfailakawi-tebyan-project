/**
 * «نُحدّث البرنامج» بدل صفحة Google الإنجليزية.
 *
 *   U1) sw.js: تنقّلٌ يعود 500/502/503/504 ← صفحة التحديث (503، no-store)؛ والنجاح والتحويل يمرّان كما هما.
 *   U2) لا يمسّ /api ولا غير GET، ولا يحفظ أيّ 5xx؛ وانقطاع الطلب يبقى هيكلَ التطبيق كما كان.
 *   U3) التثبيت يحفظ الصفحة في كاش الإصدار، وتنقّلٌ ناجح يعيدها إن مُسحت؛ وبلا صفحةٍ محفوظة يعود الجواب كما جاء.
 *   U4) الصفحة: مستقلّة، RTL، نهاري/ليلي، تسأل "/" كل ٣ ثوانٍ وتتباطأ، تعيد فتح الرابط نفسه، ولا تدور في حلقة.
 *   U5) التطبيق: 5xx بغير JSON على /api ← شريطٌ هادئ؛ وتعافي الحزم يسأل الموقع قبل أن يمسح شيئاً.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { isPlatformUpdating, UPDATING_MESSAGE } from '../src/lib/updatingNotice';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const tick = () => new Promise((r) => setTimeout(r, 0));
const ORIGIN = 'https://tebyan.example';
const PAGE = read('public/updating.html');
const GOOGLE_502 = '<html><title>Error 502 (Server Error)!!1</title><p>Error: Server Error. Please try again in 30 seconds.</p></html>';
const pathOf = (key: any) => new URL(typeof key === 'string' ? key : key.url, ORIGIN).pathname;
const html = (body: string, status = 200) => new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

type Net = (pathname: string) => Promise<Response>;
/** public/sw.js in a sandbox with an in-memory Cache Storage that records every write. */
function worker(net: Net) {
  const handlers: Record<string, (e: any) => void> = {};
  const store = new Map<string, Map<string, Response>>();
  const writes: Array<{ cache: string; key: string; status: number }> = [];
  const open = async (name: string) => {
    if (!store.has(name)) store.set(name, new Map());
    const entries = store.get(name)!;
    return {
      put: async (key: any, response: Response) => { writes.push({ cache: name, key: pathOf(key), status: response.status }); entries.set(pathOf(key), response.clone()); },
      match: async (key: any) => entries.get(pathOf(key))?.clone(),
      addAll: async (list: string[]) => { for (const item of list) { const r = await net(pathOf(item)); if (r.ok) entries.set(pathOf(item), r); } },
    };
  };
  const caches = {
    open,
    keys: async () => [...store.keys()],
    delete: async (name: string) => store.delete(name),
    match: async (key: any) => { for (const entries of store.values()) { const hit = entries.get(pathOf(key)); if (hit) return hit.clone(); } return undefined; },
  };
  const self: any = { addEventListener: (type: string, fn: any) => { handlers[type] = fn; }, location: { origin: ORIGIN }, skipWaiting() {}, clients: { claim() {} } };
  vm.runInNewContext(read('public/sw.js'), { self, URL, Response, Promise, caches, fetch: (input: any) => net(pathOf(input)) });
  const install = async () => { const waits: Promise<unknown>[] = []; handlers.install({ waitUntil: (p: Promise<unknown>) => waits.push(p) }); await Promise.all(waits); };
  const request = async (pathname: string, init: { mode?: string; method?: string } = {}) => {
    let answer: Promise<Response> | null = null;
    handlers.fetch({ request: { url: `${ORIGIN}${pathname}`, mode: init.mode ?? 'navigate', method: init.method ?? 'GET' }, respondWith: (p: Promise<Response>) => { answer = p; } });
    let response: Response | null = null;
    let error: unknown = null;
    try { response = answer ? await answer : null; } catch (e) { error = e; }
    await tick(); await tick(); await tick();
    return { answered: answer !== null, response, error };
  };
  return { install, request, store, writes };
}
const failing = (status: number | 'drop'): Net => async (pathname) => {
  if (pathname === '/updating.html') return html(PAGE);
  if (status === 'drop') throw new TypeError('Failed to fetch');
  return html(GOOGLE_502, status);
};
const isUpdatingPage = async (response: Response | null) =>
  Boolean(response) && response!.status === 503 && response!.headers.get('cache-control') === 'no-store'
  && /text\/html/.test(response!.headers.get('content-type') || '') && (await response!.clone().text()).includes('نُحدّث البرنامج الآن');

test('U1 navigation answered 500/502/503/504 → updating page (503, no-store)', async () => {
  for (const status of [500, 502, 503, 504]) {
    const sw = worker(failing(status));
    await sw.install();
    assert.ok(await isUpdatingPage((await sw.request('/')).response), `/ with ${status}`);
    assert.ok(await isUpdatingPage((await sw.request('/qawl/q-5/')).response), `/qawl/q-5/ with ${status}`);
  }
});

test('U1 successful and redirected navigations pass through untouched', async () => {
  const sw = worker(async (p) => (p === '/updating.html' ? html(PAGE) : html('<p>app</p>')));
  await sw.install();
  const ok = await sw.request('/?tab=qawlfasl');
  assert.equal(ok.response?.status, 200);
  assert.equal(await ok.response!.text(), '<p>app</p>');
  const redirect = worker(async () => new Response(null, { status: 302, headers: { Location: '/qawl/q-5/' } }));
  assert.equal((await redirect.request('/qawl/q-5')).response?.status, 302);
});

test('U2 /api, non-GET and assets are not replaced; no 5xx is ever stored', async () => {
  const sw = worker(failing(502));
  await sw.install();
  assert.equal((await sw.request('/api/ai/generate', { mode: 'cors' })).answered, false);
  assert.equal((await sw.request('/api/health')).answered, false, 'even a navigation to /api is left alone');
  assert.equal((await sw.request('/', { method: 'POST' })).answered, false);
  const icon = await sw.request('/pwa-icon-192.png', { mode: 'no-cors' });
  assert.equal(await isUpdatingPage(icon.response), false);
  assert.deepEqual(sw.writes.filter((w) => w.status >= 500), []);
  assert.equal(sw.writes.some((w) => w.key === '/' && w.status !== 200), false);
});

test('U2 a dropped request still opens the cached app shell (offline behaviour unchanged)', async () => {
  const sw = worker(async (p) => { if (p === '/updating.html' || p === '/') return html(p === '/' ? '<p>shell</p>' : PAGE); throw new TypeError('offline'); });
  await sw.install();
  const shell = await sw.request('/qawl/q-5/');
  assert.equal(await shell.response!.text(), '<p>shell</p>');
});

test('U3 install stores the page in the build cache; a good navigation refills it; none stored → raw answer', async () => {
  const sw = worker(failing(502));
  await sw.install();
  const [name] = [...sw.store.keys()];
  assert.match(name, /^tebyan-/);
  assert.ok(sw.store.get(name)!.has('/updating.html'));
  assert.ok(read('public/sw.js').includes("const BUILD = '__BUILD_ID__';"), 'build stamp kept');

  const empty = worker(failing(502));
  assert.equal((await empty.request('/')).response?.status, 502, 'nothing worse than before');

  const refill = worker(async (p) => (p === '/updating.html' ? html(PAGE) : html('<p>ok</p>')));
  await refill.request('/');
  assert.ok([...refill.store.values()].some((m) => m.has('/updating.html')));
});

test('U4 page: self-contained, RTL, light/dark, Tebyan identity and copy', () => {
  assert.equal(/https?:\/\/(?!www\.w3\.org)/i.test(PAGE), false, 'no external URL');
  assert.equal(/<link\b|\bsrc=|@import/i.test(PAGE), false);
  assert.ok((PAGE.match(/url\("([^"]+)"\)/g) || []).every((u) => /^url\("\/fonts\//.test(u)));
  assert.match(PAGE, /<html lang="ar" dir="rtl">/);
  assert.match(PAGE, /prefers-color-scheme:dark/);
  assert.match(PAGE, /prefers-reduced-motion/);
  assert.match(PAGE, /<title>نُحدّث البرنامج · تبيان<\/title>/);
  assert.ok(PAGE.includes('M148 408 V244 C148 164 200 112 256 84'), 'the mark is Tebyan’s icon.svg');
  for (const text of ['نُحدّث البرنامج الآن ✨', 'لحظاتٍ ونعود', 'أعد المحاولة الآن']) assert.ok(PAGE.includes(text), text);
});

function runPage(options: { probe: boolean[]; recent?: number[]; pathname?: string; online?: boolean }) {
  const script = /<script>([\s\S]*?)<\/script>/.exec(PAGE)![1];
  const timers: Array<{ fn: () => void; ms: number }> = [];
  const asked: string[] = [];
  const nodes: Record<string, any> = {};
  const node = (id: string) => (nodes[id] ??= { textContent: '', addEventListener() {} });
  const store: Record<string, string> = options.recent ? { 'tebyan-updating-reloads': JSON.stringify(options.recent) } : {};
  const location = { pathname: options.pathname ?? '/qawl/q-5/', reloads: 0, replaced: '', reload() { this.reloads++; }, replace(url: string) { this.replaced = url; } };
  let call = 0;
  vm.runInNewContext(script, {
    document: { getElementById: node, addEventListener() {}, hidden: false },
    window: { addEventListener() {} }, navigator: { onLine: options.online ?? true }, location,
    sessionStorage: { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; } },
    setTimeout: (fn: () => void, ms: number) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {},
    fetch: (url: string, init: any) => { asked.push(`${url}|${init?.cache}`); return Promise.resolve({ ok: options.probe[Math.min(call++, options.probe.length - 1)] }); },
    AbortController, JSON, Date, Math,
  });
  const step = async () => { const t = timers.filter((x) => x.ms !== 8000).shift()!; timers.splice(timers.indexOf(t), 1); t.fn(); await tick(); await tick(); return t.ms; };
  return { asked, location, nodes, step };
}

test('U4 page asks "/" every 3 s, then reopens the same URL', async () => {
  const page = runPage({ probe: [false, false, true] });
  const delays = [await page.step(), await page.step(), await page.step()];
  assert.deepEqual(delays, [3000, 3000, 3000]);
  assert.ok(page.asked.every((a) => a === '/|no-store'), String(page.asked));
  assert.equal(page.location.reloads, 1);
});

test('U4 page backs off to 15 s while the site is down', async () => {
  const page = runPage({ probe: [false] });
  const delays: number[] = [];
  for (let i = 0; i < 16; i++) delays.push(await page.step());
  assert.equal(delays[0], 3000);
  assert.ok(delays.at(-1)! > 3000 && delays.every((ms) => ms <= 15000));
  assert.ok(delays.every((ms, i) => i === 0 || ms >= delays[i - 1]));
  assert.equal(page.location.reloads, 0);
});

test('U4 page never loops: three reloads in two minutes → every 30 s', async () => {
  const now = Date.now();
  const page = runPage({ probe: [true], recent: [now - 5000, now - 4000, now - 3000] });
  assert.equal(await page.step(), 30000);
  assert.ok(page.nodes.lead.textContent.includes('وقتاً أطول'));
});

test('U4 opened by name → back to "/"; offline → says so and does not ask', async () => {
  const named = runPage({ probe: [true], pathname: '/updating.html' });
  await named.step();
  assert.equal(named.location.replaced, '/');
  assert.equal(named.location.reloads, 0);
  const offline = runPage({ probe: [true], online: false });
  await offline.step();
  assert.equal(offline.asked.length, 0);
  assert.ok(offline.nodes.title.textContent.includes('لا اتصال'));
});

test('U5 app: only a non-JSON 5xx is the platform; the AI proxy shows the calm bar before reading JSON', () => {
  assert.ok(isPlatformUpdating(502, 'text/html; charset=UTF-8') && isPlatformUpdating(503, '') && isPlatformUpdating(500, 'text/html') && isPlatformUpdating(504, null));
  assert.ok(!isPlatformUpdating(503, 'application/json; charset=utf-8') && !isPlatformUpdating(404, 'text/html') && !isPlatformUpdating(200, 'text/html'));
  assert.ok(UPDATING_MESSAGE.includes('نُحدّث البرنامج'));
  const proxy = read('src/lib/aiProxy.ts');
  for (const fn of ['export async function proxyGenerateContent', 'export async function proxyGenerateAudio']) {
    const start = proxy.indexOf(fn);
    const body = proxy.slice(start, proxy.indexOf('\n}\n', start));
    const guard = body.indexOf('isPlatformUpdating(response.status, contentType)');
    assert.ok(guard > 0 && guard < body.indexOf('response.json()') && guard < body.indexOf("includes('application/json')"), fn);
    assert.ok(body.includes('showUpdatingNotice(apiAnswers)'), fn);
  }
});

test('U5 chunk recovery asks the site before wiping caches or the worker', () => {
  const src = read('src/lib/app-update.ts');
  const body = src.slice(src.indexOf('async function recoverFromStaleChunk'), src.indexOf('export function markShellHealthy'));
  const ask = body.indexOf('await siteAnswers()');
  assert.ok(ask > 0 && ask < body.indexOf('sessionStorage.setItem') && ask < body.indexOf('purgeShell()'));
  assert.ok(src.includes('SERVER_BACK_EVENT, () => { void checkForUpdate(); }'));
});
