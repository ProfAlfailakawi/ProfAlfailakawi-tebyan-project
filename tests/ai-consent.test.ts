import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Apple 5.1.1(i) / 5.1.2(i): لا يُرسَل أي نص إلى Google Gemini (/api/ai/*) قبل موافقة المستخدم.

const root = new URL('../', import.meta.url).pathname;
const read = (p: string) => readFileSync(join(root, p), 'utf8');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(join(root, dir))) {
    const rel = `${dir}/${name}`;
    if (statSync(join(root, rel)).isDirectory()) walk(rel, out);
    else if (/\.(ts|tsx|js|jsx)$/.test(name)) out.push(rel);
  }
  return out;
}

class MemStorage {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

const g = globalThis as any;
g.localStorage = new MemStorage();
g.sessionStorage = new MemStorage();
const et = new EventTarget();
g.window = g.window || {
  addEventListener: et.addEventListener.bind(et),
  removeEventListener: et.removeEventListener.bind(et),
  dispatchEvent: et.dispatchEvent.bind(et),
};
const fetchCalls: string[] = [];
g.fetch = async (url: string) => {
  fetchCalls.push(String(url));
  return new Response(JSON.stringify({ text: 'ok', audioData: '', mimeType: 'audio/wav' }), {
    status: 200, headers: { 'content-type': 'application/json' },
  });
};

test('static: only src/lib/aiProxy.ts calls /api/ai/*, and only after ensureAiConsent', () => {
  const callers = walk('src').filter((f) => /fetch\([^)]*\/api\/ai|['"`]\/api\/ai\/(generate|audio)['"`]/.test(read(f)));
  assert.deepEqual(callers, ['src/lib/aiProxy.ts']);
  const src = read('src/lib/aiProxy.ts');
  for (const fn of ['proxyGenerateContent', 'proxyGenerateAudio']) {
    const start = src.indexOf(`export async function ${fn}`);
    assert.ok(start >= 0, fn);
    const next = src.indexOf('export async function', start + 10);
    const body = src.slice(start, next < 0 ? undefined : next);
    const gate = body.indexOf('ensureAiConsent(');
    assert.ok(gate > 0, `${fn} must call ensureAiConsent`);
    assert.ok(gate < body.indexOf('getAppCheckHeaders('), `${fn}: consent before App Check`);
    assert.ok(gate < body.indexOf('fetch('), `${fn}: consent before fetch`);
  }
  // No client-side Gemini SDK or direct Google endpoint that would bypass the proxy.
  for (const f of walk('src')) {
    assert.doesNotMatch(read(f), /generativelanguage\.googleapis\.com|from ['"]@google\/genai['"]/, f);
  }
});

test('static: dialog is mounted for the app and admin routes; settings can withdraw consent', () => {
  assert.match(read('src/App.tsx'), /<AiConsentDialog language=\{language\} \/>/);
  assert.match(read('src/main.tsx'), /<AiConsentDialog language="ar" \/>/);
  assert.match(read('src/components/ClientProfilePanel.tsx'), /<AiConsentToggle/);
  assert.match(read('src/components/AiConsentToggle.tsx'), /إيقاف مشاركة الأسئلة مع خدمة الذكاء الاصطناعي/);
  const policy = read('public/privacy-policy.html');
  assert.match(policy, /Google LLC/);
  assert.match(policy, /Gemini API/);
  assert.match(policy, /مساوٍ/);
});

test('dialog text names Google Gemini, what is sent, and has both buttons (AR + EN)', async () => {
  const { AI_CONSENT_TEXT } = await import('../src/components/AiConsentDialog');
  assert.equal(AI_CONSENT_TEXT.ar.accept, 'أوافق وأتابع');
  assert.equal(AI_CONSENT_TEXT.ar.decline, 'لا، شكراً');
  assert.match(AI_CONSENT_TEXT.ar.who, /Google LLC/);
  assert.match(AI_CONSENT_TEXT.en.who, /Gemini API, an AI service operated by Google LLC/);
  assert.match(AI_CONSENT_TEXT.ar.notSent, /البريد|بريدك/);
});

test('runtime: without consent nothing is fetched; decline sends nothing; accept proceeds', async () => {
  const consent = await import('../src/lib/aiConsent');
  const proxy = await import('../src/lib/aiProxy');
  const ask = () => proxy.proxyGenerateContent({ model: 'gemini-2.5-flash', contents: [{ role: 'user', parts: [{ text: 'سؤال' }] }] });
  const speak = () => proxy.proxyGenerateAudio({ text: 'نص' });

  // 1) No dialog host mounted → refused, nothing sent.
  await assert.rejects(ask(), (e: any) => e.code === 'AI_CONSENT_REQUIRED');
  await assert.rejects(speak(), (e: any) => e.code === 'AI_CONSENT_REQUIRED');
  assert.equal(fetchCalls.length, 0);

  // 2) Host mounted, user declines.
  consent.setAiConsentHostMounted(true);
  let requests = 0;
  const onReq = () => { requests++; queueMicrotask(() => consent.resolveAiConsentRequest(false)); };
  g.window.addEventListener(consent.AI_CONSENT_REQUEST_EVENT, onReq);
  await assert.rejects(ask(), (e: any) => e.code === 'AI_CONSENT_REQUIRED');
  assert.equal(requests, 1);
  assert.equal(fetchCalls.length, 0);
  // Declined this session → no repeated pop-ups, still nothing sent.
  await assert.rejects(speak(), (e: any) => e.code === 'AI_CONSENT_REQUIRED');
  assert.equal(requests, 1);
  assert.equal(fetchCalls.length, 0);
  // Typing-ahead suggestion is silent: never prompts, never sends.
  await assert.rejects(proxy.proxyGenerateContent({ contents: [], consentMode: 'silent' }), (e: any) => e.code === 'AI_CONSENT_REQUIRED');
  assert.equal(requests, 1);
  g.window.removeEventListener(consent.AI_CONSENT_REQUEST_EVENT, onReq);

  // 3) User reopens and accepts → request proceeds; consentMode is not forwarded.
  g.sessionStorage.clear();
  const onAccept = () => queueMicrotask(() => consent.resolveAiConsentRequest(true));
  g.window.addEventListener(consent.AI_CONSENT_REQUEST_EVENT, onAccept);
  const res = await ask();
  assert.equal(res.text, 'ok');
  assert.equal(consent.hasAiConsent(), true);
  assert.deepEqual(fetchCalls.filter((u) => u.includes('/api/ai/')), ['/api/ai/generate']);
  g.window.removeEventListener(consent.AI_CONSENT_REQUEST_EVENT, onAccept);

  // 4) Withdraw → blocked again.
  consent.revokeAiConsent();
  consent.setAiConsentHostMounted(false);
  const before = fetchCalls.length;
  await assert.rejects(ask(), (e: any) => e.code === 'AI_CONSENT_REQUIRED');
  assert.equal(fetchCalls.length, before);
});
