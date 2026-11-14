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

const BOOK = 'screen and (min-width:721px) and (max-width:1000px) and (min-height:520px) and (max-height:960px) and (orientation:landscape)';
const norm = (x: string) => x.replace(/\s+/g, ' ').replace(/: /g, ':').replace(/\( /g, '(').trim();

test('book = landscape only: every book media query is exactly the shared BOOK condition (no portrait split, iPad/phones untouched)', () => {
  const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  const sources: Record<string, string> = {
    'src/index.css': css,
    'scripts/generate-qawl-pages.mjs': read('scripts/generate-qawl-pages.mjs'),
    'public/updating.html': read('public/updating.html'),
    'public/privacy-policy.html': read('public/privacy-policy.html'),
    'public/qawl/index.html': read('public/qawl/index.html'),
    'public/qawl/q-1/index.html': read('public/qawl/q-1/index.html'),
    'src/components/common/ResultCard.tsx': read('src/components/common/ResultCard.tsx'),
  };
  let seen = 0;
  for (const [file, text] of Object.entries(sources)) {
    for (const m of text.matchAll(/@media([^{]*)\{/g)) {
      for (const alt of m[1].split(',')) {
        if (!/min-height:\s*520px/.test(alt) || /display-mode/.test(alt)) continue;
        seen++;
        assert.equal(norm(alt), BOOK, `${file}: ${alt.trim()}`);
      }
    }
  }
  assert.ok(seen >= 8, `expected the book queries, saw ${seen}`);
  assert.match(sources['src/components/common/ResultCard.tsx'], /min-width: 721px\) and \(max-width: 1000px\) and \(min-height: 520px\) and \(max-height: 960px\) and \(orientation: landscape\)/);
  assert.doesNotMatch(css, /min-aspect-ratio:\s*3\/2/);
  assert.doesNotMatch(css, /@media[^{]*min-width:\s*640px\)[^{]*max-width:\s*720px\)[^{]*min-height:\s*520px\)\s*(,|\{)/);
});

test('widget keep-out: defined once for Duo inner + standalone, used by header, page top and fixed controls', () => {
  const blocks = [...css.matchAll(/@media([^{]*display-mode:\s*standalone[^{]*)\{/g)];
  assert.equal(blocks.length, 1);
  const alts = blocks[0][1].split(',').map(norm);
  assert.equal(alts.length, 2);
  assert.ok(alts.some((a) => a.includes('(orientation:landscape)') && a.includes('(min-width:721px)')));
  assert.ok(alts.some((a) => a.includes('(orientation:portrait)') && a.includes('(min-width:640px)') && a.includes('(max-width:720px)')));
  assert.match(css, /--duo-cutout-w: 116px; --duo-cutout-h: 116px/);
  assert.match(css, /header\.fixed\.tebyan-app-header \{ padding-right: calc\(var\(--duo-cutout-w\)/);
  assert.match(css, /padding-top: calc\(env\(safe-area-inset-top, 0px\) \+ var\(--duo-cutout-h\)/);
});

test('narrow phones (320-382px): segmented switches size by content and wrap; demo chip rows keep their label clear of the fade', () => {
  const beauty = readFileSync(new URL('../src/styles/beauty.css', import.meta.url), 'utf8');
  // flex-basis 0 + nowrap crushed the longer label past its pill (min-width:max-content from index.css)
  assert.match(beauty, /\.tebyan-seg__btn \{ flex: 1 1 auto;/);
  assert.match(beauty, /main \.tebyan-seg \.tebyan-seg__btn \{[^}]*min-width: 0 !important[^}]*white-space: normal/);
  // the 12px edge fade must not sit on the "try an example" label
  assert.match(beauty, /\[data-demo-starters\] \{[^}]*margin-inline: -\.75rem; padding: \.125rem \.75rem;/);
  const sim = readFileSync(new URL('../src/components/tabs/SimulationTab.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(sim, /cn\("flex-1 \[white-space:nowrap\]!/);
});
