import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('ClientProfilePanel: AI failure never fabricates emotion percentages', () => {
  const src = read('src/components/ClientProfilePanel.tsx');
  assert.equal(/Math\.random/.test(src), false);
  assert.match(src, /unavailable: true/);
  assert.match(src, /لا بيانات كافية لتحليل الآن/);
});

test('StrategicArenaTab: no hard-coded emotion percentages or English placeholder', () => {
  const src = read('src/components/tabs/StrategicArenaTab.tsx');
  assert.equal(/value:\s*(30|85|60|45)\b/.test(src), false);
  assert.match(src, /مكوّن تفاعلي/);
});

test('RippleEffectTab: illustrative seeds are labelled instead of showing a fake date', () => {
  const src = read('src/components/tabs/RippleEffectTab.tsx');
  assert.match(src, /مثال توضيحي/);
});
