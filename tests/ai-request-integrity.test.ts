import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildAiCacheKey } from '../src/lib/aiCacheKey';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// مقدمة ثابتة أطول من ١٠٠ حرف ثم موضوع المستخدم — هكذا تبني خارطة الطريق تعليماتها.
const preamble = 'أنتِ "امرأة حنونة ومستشارة حكيمة". تجنبي تماماً مناداة المستخدم أو المتلقين بأي مفردات مشابهة، وخاطبيهم بصفة عامة.  ولدي خارطة طريق لهدف: ';
const roadmapRequest = (goal: string) => ({
  model: 'gemini-2.5-flash',
  contents: [{ parts: [{ text: 'توليد الخريطة' }] }],
  config: { systemInstruction: `${preamble}${goal}`, responseMimeType: 'application/json' },
});

test('AI cache: two goals behind a long fixed preamble get different keys', () => {
  assert.ok(preamble.length > 100);
  // The previous key (first 100 chars of prompt and instruction) made these two collide.
  const oldKey = (r: ReturnType<typeof roadmapRequest>) =>
    `${r.model}-${r.contents[0].parts[0].text.substring(0, 100)}-${r.config.systemInstruction.substring(0, 100)}`;
  assert.equal(oldKey(roadmapRequest('تنظيم النوم')), oldKey(roadmapRequest('تعلم السباحة')));
  assert.notEqual(buildAiCacheKey(roadmapRequest('تنظيم النوم')), buildAiCacheKey(roadmapRequest('تعلم السباحة')));
});

test('AI cache: prompts that differ only after 100 characters get different keys', () => {
  const head = 'س'.repeat(120);
  const a = { model: 'gemini-2.5-flash', contents: [{ parts: [{ text: `${head} أ` }] }] };
  const b = { model: 'gemini-2.5-flash', contents: [{ parts: [{ text: `${head} ب` }] }] };
  assert.notEqual(buildAiCacheKey(a), buildAiCacheKey(b));
});

test('AI cache: an identical request reuses the same key; a different schema does not', () => {
  assert.equal(buildAiCacheKey(roadmapRequest('تنظيم النوم')), buildAiCacheKey(roadmapRequest('تنظيم النوم')));
  const withSchema = { ...roadmapRequest('تنظيم النوم'), config: { ...roadmapRequest('تنظيم النوم').config, responseSchema: { type: 'ARRAY' } } };
  assert.notEqual(buildAiCacheKey(roadmapRequest('تنظيم النوم')), buildAiCacheKey(withSchema));
});

test('services/gemini.ts keys its cache on the whole request, not a 100-character prefix', () => {
  const src = read('src/services/gemini.ts');
  assert.match(src, /const cacheKey = buildAiCacheKey\(params\)/);
  assert.equal(/substring\(0,\s*100\)\}-\$\{persona/.test(src), false);
});

test('generateSimulation sends the user topic outside demo mode as well', () => {
  const src = read('src/services/gemini.ts');
  const start = src.indexOf('export async function generateSimulation');
  const body = src.slice(start, src.indexOf('export async function', start + 10));
  assert.match(body, /text: `ابدأ المحاكاة الآن حول: \$\{topic\}`/);
  assert.equal(/"ابدأ المحاكاة الآن"/.test(body), false);
});
