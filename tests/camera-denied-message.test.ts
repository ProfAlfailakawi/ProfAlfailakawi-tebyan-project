import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cameraDeniedMessage } from '../src/lib/cameraDeniedMessage.ts';

test('in-app: Settings path, no browser wording', () => {
  const ar = cameraDeniedMessage(true, true);
  assert.match(ar, /الإعدادات ‹ Tebyan ‹ الكاميرا/);
  assert.doesNotMatch(ar, /المتصفح|Safari/);
  assert.doesNotMatch(cameraDeniedMessage(false, true), /browser|Safari/i);
});

test('browser: text unchanged', () => {
  assert.equal(cameraDeniedMessage(true, false), 'يرجى السماح بالوصول للكاميرا في إعدادات المتصفح لتجربة الواقع المعزز.');
  assert.equal(cameraDeniedMessage(false, false), 'Please allow camera access in browser settings to experience AR.');
});

test('ARTab uses the helper with the shared native detector', () => {
  const src = readFileSync('src/components/tabs/ARTab.tsx', 'utf8');
  assert.match(src, /cameraDeniedMessage\(language === 'ar', isAppleNativeShell\(\)\)/);
});
