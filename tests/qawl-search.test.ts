import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findLocalQawlMatch, isQawlQuestionId, normalizeForQawlMatch } from '../src/lib/qawlSearch';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

const library = [
  { id: 'q-1', question: 'طفلي يسأل: أين الله؟', keywords: ['الإيمان'], category: 'الإيمان والأسئلة الدينية' },
  { id: 'q-2', question: 'ابني يكذب كثيراً، كيف أتصرف؟', keywords: ['الكذب'], category: 'السلوك والتربية والتعامل' },
  { id: 'q-3', question: 'كيف أحمي طفلي من الإساءة؟', keywords: ['الحماية'], category: 'الوقاية وحماية الطفل' },
];

test('Qawl search: hamza, diacritics and punctuation no longer block obvious matches', () => {
  assert.equal(normalizeForQawlMatch('أين اللّه؟'), normalizeForQawlMatch('اين الله'));
  // The old matcher was a literal includes(): all of these missed.
  assert.equal(library[0].question.includes('اين الله'), false);
  assert.equal(findLocalQawlMatch(library, 'اين الله')?.id, 'q-1');
  assert.equal(findLocalQawlMatch(library, 'طفلي يسأل أين الله')?.id, 'q-1');
  assert.equal(findLocalQawlMatch(library, 'اساءة')?.id, 'q-3');
});

test('Qawl search: question text wins over keywords and category; misses stay misses', () => {
  assert.equal(findLocalQawlMatch(library, 'يكذب')?.id, 'q-2');
  assert.equal(findLocalQawlMatch(library, 'الكذب')?.id, 'q-2');
  assert.equal(findLocalQawlMatch(library, 'تعلم السباحة'), null);
  assert.equal(findLocalQawlMatch(library, 'ا'), null);
});

test('Qawl deep links: ids are recognised, typed questions are not', () => {
  for (const id of ['q-5', 'q12', 'AbCdEfGhIjKlMnOpQrSt']) assert.equal(isQawlQuestionId(id), true, id);
  for (const text of ['ابني يكذب', 'bullying', '', undefined]) assert.equal(isQawlQuestionId(text), false, String(text));
  assert.equal(isQawlQuestionId('custom-id', ['custom-id']), true);
});

test('Qawl tab: ids are not searched, generation is admin-only, the search runs once', () => {
  const tab = read('src/components/tabs/QawlFasl/QawlFaslTab.tsx');
  assert.match(tab, /const canPublish = !IS_DEMO_MODE && \(isAdminIdentity\(user\) \|\| profile\?\.role === 'admin'\)/);
  assert.match(tab, /if \(!canPublish \|\| dailyTriggered\.current\) return;/);
  assert.match(tab, /initialValue && !initialIsQuestionId && initialValue !== consumedValue \? initialValue : undefined/);
  assert.equal(/setConsumedQuery\(false\)/.test(tab), false);

  const home = read('src/components/tabs/QawlFasl/HomeView.tsx');
  const missBranch = home.indexOf('} else if (!canPublish) {');
  const generate = home.indexOf('handleMissingSearchPublishing(');
  assert.ok(missBranch > 0 && generate > missBranch, 'non-admins must branch off before the generator is called');
  assert.match(home, /لا يوجد في المكتبة جواب جاهز لهذا السؤال بعد/);
});

test('Qawl trending: only terms that match the library are shown to everyone', () => {
  const home = read('src/components/tabs/QawlFasl/HomeView.tsx');
  assert.match(home, /trendingSearches\.filter\(\(t\) => typeof t\?\.query === 'string' && findLocalQawlMatch\(questions, t\.query\)\)/);
  assert.equal(/\{trendingSearches\.map\(/.test(home), false);
  // A private free-text query matches nothing in the library, a generic topic does.
  assert.equal(findLocalQawlMatch(library, 'ابنتي عمرها ١٢ تعرضت لموقف من قريب لنا'), null);
  assert.ok(findLocalQawlMatch(library, 'الكذب'));
});
