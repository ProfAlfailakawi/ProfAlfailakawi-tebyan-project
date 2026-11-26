import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Regression: in the iOS app env(safe-area-inset-top) read 0, so the header sat under
// the status bar and its account/menu buttons could not be tapped. Every top inset now
// goes through --tb-safe-top, which also honours the native --duo-native-safe-top.
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const files = ['src/index.css', 'src/App.tsx', 'src/styles/beauty.css', 'src/components/TabHeader.tsx', 'src/lib/updatingNotice.ts'];

test('top safe-area insets use --tb-safe-top', () => {
  for (const f of files) {
    const uses = read(f).match(/env\(safe-area-inset-top[^)]*\)/g) ?? [];
    const allowed = f === 'src/index.css' ? 2 : 0; // the two definitions of --tb-safe-top
    assert.equal(uses.length, allowed, `${f} still uses env(safe-area-inset-top) directly`);
  }
});

test('native shell inset feeds --tb-safe-top', () => {
  assert.match(read('src/index.css'), /--tb-safe-top:\s*max\(env\(safe-area-inset-top, 0px\), var\(--duo-native-safe-top, 0px\)\)/);
});
