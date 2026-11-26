import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Regression: in the iOS shell, addListener() returned a handle without .catch,
// so `addListener(...).catch()` threw at startup and the whole app never rendered.
const push = readFileSync(new URL('../src/lib/nativePush.ts', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');

test('addListener result is never chained with .catch directly', () => {
  assert.doesNotMatch(push, /addListener\([\s\S]*?\}\)\.catch/);
  assert.match(push, /Promise\.resolve\(\s*plugin\.addListener/);
});

test('startup wraps initNativePush so it cannot block rendering', () => {
  assert.match(main, /try \{\s*initNativePush\(\);\s*\} catch/);
});
