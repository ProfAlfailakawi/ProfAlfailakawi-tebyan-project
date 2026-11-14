import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, v),
};

test('community terms acceptance is remembered per account', async () => {
  const { hasAcceptedUgcTerms, acceptUgcTerms } = await import('../src/components/tabs/RippleTerms.tsx');
  assert.equal(hasAcceptedUgcTerms('u1'), false);
  acceptUgcTerms('u1');
  assert.equal(hasAcceptedUgcTerms('u1'), true);
  assert.equal(hasAcceptedUgcTerms('u2'), false);
});

test('feed posting and replying go through the terms gate; web is unaffected by the helper', () => {
  const src = readFileSync('src/components/tabs/RippleEffectTab.tsx', 'utf8');
  assert.match(src, /const handleDropIdea = \(\) => requireTerms\(/);
  assert.match(src, /requireTerms\(\(\) => \{ void handleAddReplyNow/);
  assert.match(src, /!isAppleNativeShell\(\) \|\| !uid \|\| hasAcceptedUgcTerms/);
});

test('payment-adjacent copy is gated by the native-shell helper', () => {
  assert.match(readFileSync('src/components/HomeDashboard.tsx', 'utf8'), /isAppleNativeShell\(\)\s*\?[^]*?بالدينار الكويتي/);
  const loyalty = readFileSync('src/components/tabs/LoyaltyTab.tsx', 'utf8');
  assert.match(loyalty, /\{!native && \(\s*<div>\s*<p[^>]*>[^<]*\{language === 'ar' \? 'الإنفاق الإجمالي'/);
  assert.match(loyalty, /\{!native && \(/);
  assert.match(readFileSync('src/App.tsx', 'utf8'), /native\s*\?\s*"هذه الخدمة تحتاج حساباً/);
});
