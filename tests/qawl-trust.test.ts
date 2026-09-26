import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { getAnswerTrust, extractReligiousCitation, DEFAULT_REVIEWER } from '../src/lib/qawlTrust';

test('explicit sources, reviewer and date win', () => {
  const t = getAnswerTrust({ sources: ['كتاب أ', { title: 'دراسة ب', url: 'https://example.org' }, { title: 'x', url: 'javascript:alert(1)' }], reviewedBy: 'د. س', reviewedAt: '2026-01-02' });
  assert.deepEqual(t.sources.map(s => s.title), ['كتاب أ', 'دراسة ب', 'x']);
  assert.equal(t.sources[1].url, 'https://example.org');
  assert.equal(t.sources[2].url, undefined);
  assert.deepEqual(t.reviewers, ['د. س']);
  assert.equal(t.reviewedAt?.toISOString().slice(0, 10), '2026-01-02');
});

test('defaults: owner reviewer, updatedAt, and no empty sources', () => {
  const t = getAnswerTrust({ updatedAt: 1777085286263, religiousReference: 'نص بلا تخريج' });
  assert.deepEqual(t.sources, []);
  assert.deepEqual(t.reviewers, [DEFAULT_REVIEWER]);
  assert.ok(t.reviewedAt);
});

test('citation extraction from religiousReference', () => {
  assert.equal(extractReligiousCitation('(لَيْسَ كَمِثْلِهِ شَيْءٌ) - سورة الشورى، الآية 11.'), 'القرآن الكريم — سورة الشورى، الآية 11');
  assert.equal(extractReligiousCitation("'...' (سورة آل عمران: 185)."), 'القرآن الكريم — سورة آل عمران، الآية 185');
  assert.equal(extractReligiousCitation("'إن الله رفيق' (رواه البخاري)."), 'الحديث الشريف — رواه البخاري');
  assert.equal(extractReligiousCitation('بلا مرجع'), null);
});
