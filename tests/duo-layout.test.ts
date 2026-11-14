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
        if (!/min-height:\s*520px/.test(alt) || /display-mode/.test(alt) || /\(orientation:\s*portrait\)/.test(alt)) continue; // the inner-portrait widget band is checked below
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

test('widget keep-out: defined once for the Duo inner screen (tab AND installed app), used by header, page top and fixed controls', () => {
  const blocks = [...css.matchAll(/@media([^{]*)\{(?=\s*:root \{ --duo-cutout-w: 116px)/g)];
  assert.equal(blocks.length, 1);
  const alts = blocks[0][1].split(',').map(norm);
  assert.deepEqual(alts, [
    norm('screen and (min-width:721px) and (max-width:1000px) and (min-height:520px) and (max-height:960px) and (orientation:landscape)'),
    norm('screen and (min-width:640px) and (max-width:720px) and (min-height:520px) and (max-height:960px) and (orientation:portrait)'),
  ]);
  assert.match(css, /:root \{ --duo-cutout-w: 116px; --duo-cutout-h: 116px; --duo-cutout-reach: 268px; \}/);
  // the box is measured on the native app: ~80px wide, down to ~y=250-265; one box (w x reach) covers it
  assert.equal([...css.matchAll(/--duo-cutout-reach\s*:/g)].length, 1, 'reach is defined once, inside the two inner-screen bands');
  assert.equal([...css.matchAll(/--duo-cutout-w\s*:/g)].length, 1);
  assert.equal([...css.matchAll(/--duo-cutout-h\s*:/g)].length, 1);
  // below the header band the content flows beside the box (an empty float), it is not pushed down
  assert.match(css, /\.tebyan-book-main::before \{\s*content: "";\s*float: right;\s*width: var\(--duo-cutout-w\);\s*height: max\(0px, calc\(var\(--duo-cutout-reach\)/);
  assert.match(css, /\.tebyan-keepout-overlay\b/);
  for (const f of ['src/components/GlobalCommand.tsx', 'src/App.tsx']) {
    assert.match(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), /tebyan-book-overlay tebyan-keepout-overlay/, f);
  }
  // the static privacy page (outside React) reserves the same box: 268px minus its 24px body padding
  const privacy = readFileSync(new URL('../public/privacy-policy.html', import.meta.url), 'utf8');
  assert.match(privacy, /main::before\{content:"";float:right;width:116px;height:244px\}/);
  assert.doesNotMatch(privacy, /display-mode/);
  // the static Qawl Fasl pages (generated, outside React) reserve it too: header steps inward, first lines flow beside the box
  for (const f of ['scripts/generate-qawl-pages.mjs', 'public/qawl/index.html', 'public/qawl/q-1/index.html']) {
    const t = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
    assert.match(t, /\.top-in\{padding-right:132px\}\s*\.wrap::before\{content:"";float:right;width:116px;height:178px\}/, f);
    assert.doesNotMatch(t, /display-mode/, f);
  }
  assert.match(css, /header\.fixed\.tebyan-app-header \{ padding-right: calc\(var\(--duo-cutout-w\)/);
  assert.match(css, /padding-top: calc\(env\(safe-area-inset-top, 0px\) \+ var\(--duo-cutout-h\)/);
});

test('widget keep-out guard: real queries from index.css, evaluated on sizes; never gated on display-mode', () => {
  const start = css.indexOf('Duo widget keep-out.');
  assert.ok(start > 0);
  const section = css.slice(start, css.indexOf('}\n', css.indexOf('.tebyan-book-overlay:not(.flex-col)', start)) + 2);
  assert.doesNotMatch(section, /display-mode/);
  // no other rule that uses the keep-out variables may be display-mode gated either
  for (const m of css.matchAll(/@media([^{]*)\{/g)) {
    let depth = 1, i = (m.index ?? 0) + m[0].length;
    const from = i;
    while (i < css.length && depth) { depth += css[i] === '{' ? 1 : css[i] === '}' ? -1 : 0; i++; }
    if (css.slice(from, i).includes('--duo-cutout')) assert.doesNotMatch(m[1], /display-mode/);
  }
  const m = css.match(/@media([^{]*)\{(?=\s*:root \{ --duo-cutout-w: 116px)/);
  assert.ok(m);
  const queries = m![1].split(',').map((q) => q.trim());
  const evalQ = (q: string, w: number, h: number) =>
    /^screen\b/.test(q) && [...q.matchAll(/\(\s*([a-z-]+)\s*:\s*([a-z0-9]+?)(px)?\s*\)/g)].every(([, k, v]) => {
      if (k === 'min-width') return w >= +v;
      if (k === 'max-width') return w <= +v;
      if (k === 'min-height') return h >= +v;
      if (k === 'max-height') return h <= +v;
      if (k === 'orientation') return v === (h >= w ? 'portrait' : 'landscape');
      return false;
    });
  const applies = (w: number, h: number) => queries.some((q) => evalQ(q, w, h));
  for (const [w, h] of [[951, 669], [951, 585], [669, 867], [720, 900]]) assert.ok(applies(w, h), `${w}x${h} must apply`);
  for (const [w, h] of [[390, 844], [844, 390], [932, 430], [744, 1024], [820, 1180], [1024, 768], [1180, 820], [1280, 800], [1440, 900], [367, 740], [951, 350]]) {
    assert.ok(!applies(w, h), `${w}x${h} must NOT apply`);
  }
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
