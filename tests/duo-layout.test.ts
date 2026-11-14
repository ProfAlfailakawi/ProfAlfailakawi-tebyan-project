import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('layout never depends on device-posture or viewport-segments (null by default in Safari)', () => {
  assert.doesNotMatch(css, /@media[^{]*device-posture/);
  assert.doesNotMatch(css, /@media[^{]*viewport-segments/);
});

test('pinch zoom is never locked', () => {
  const meta = html.match(/<meta name="viewport"[^>]*>/)?.[0] ?? '';
  assert.match(meta, /viewport-fit=cover/);
  assert.doesNotMatch(meta, /user-scalable\s*=\s*(no|0)|maximum-scale/i);
});

test('screen-height math uses dvh, not 100vh', () => {
  const dir = new URL('../src/components/tabs/', import.meta.url);
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.tsx')) continue;
    assert.doesNotMatch(readFileSync(new URL(f, dir), 'utf8'), /100vh/, f);
  }
});

test('touch targets and short-window rules exist', () => {
  assert.match(css, /@media \(pointer: coarse\)[\s\S]*min-height: 44px/);
  assert.match(css, /@media \(max-height: 480px\)/);
});

test('Duo book/laptop media queries apply to screens only (printing keeps one column)', () => {
  const sources = {
    'src/index.css': css,
    'scripts/generate-qawl-pages.mjs': readFileSync(new URL('../scripts/generate-qawl-pages.mjs', import.meta.url), 'utf8'),
    'public/updating.html': readFileSync(new URL('../public/updating.html', import.meta.url), 'utf8'),
    'public/privacy-policy.html': readFileSync(new URL('../public/privacy-policy.html', import.meta.url), 'utf8'),
    'public/qawl/q-1/index.html': readFileSync(new URL('../public/qawl/q-1/index.html', import.meta.url), 'utf8'),
  };
  let seen = 0;
  for (const [file, text] of Object.entries(sources)) {
    for (const m of text.matchAll(/@media([^{]*)\{/g)) {
      for (const alt of m[1].split(',')) {
        if (!/min-height:\s*520px|max-height:\s*420px/.test(alt)) continue;
        seen++;
        assert.match(alt.trim(), /^screen and /, `${file}: ${alt.trim()}`);
      }
    }
  }
  assert.ok(seen >= 10, `expected the Duo queries, saw ${seen}`);
});
