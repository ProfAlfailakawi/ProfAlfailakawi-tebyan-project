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

const DUO_GATE = /@media([^{]*)\{(?=\s*:root \{\s*--duo-widget-w: 96px;)/;

test('widget corner: three tokens at :root, 0px outside the Duo, set once inside one size-based gate (tab, Capacitor and installed app alike)', () => {
  assert.match(css, /:root \{\s*--duo-widget-w: 0px;\s*--duo-widget-gap: 0px;\s*--duo-widget-h: 0px;\s*\}/);
  const gate = css.match(DUO_GATE);
  assert.ok(gate, 'the Duo gate block must set the tokens');
  assert.equal([...css.matchAll(/--duo-widget-w: 96px/g)].length, 1);
  assert.match(css, /--duo-widget-gap: 8px;/);
  assert.match(css, /--duo-widget-h: clamp\(64px, 31vh, 270px\);/);
  assert.doesNotMatch(gate[1], /display-mode/);
  // the old 116px box and its variables are gone, not stacked under the new ones
  assert.doesNotMatch(css, /--duo-cutout/);
  // physical right only: never the logical end side, which flips with dir
  assert.match(css, /header\.fixed\.tebyan-app-header \{ padding-right: calc\(var\(--duo-widget-w\) \+ var\(--duo-widget-gap\)\) !important; \}/);
  assert.match(css, /padding-top: calc\(env\(safe-area-inset-top, 0px\) \+ var\(--duo-widget-h\) \+ var\(--duo-widget-gap\)\) !important;/);
  assert.match(css, /\.tebyan-keepout-pad \{ padding-right: calc\(var\(--duo-widget-w\)/);
  assert.match(css, /\.tebyan-book-overlay \{ padding-right: calc\(var\(--duo-widget-w\)/);
});

test('widget corner gate: real queries from index.css evaluated on sizes (Duo and the inferred app viewport on, tall phones and iPads off; no exact widths)', () => {
  const gate = css.match(DUO_GATE);
  assert.ok(gate);
  const queries = gate[1].split(',').map((q) => q.trim());
  const evalQ = (q: string, w: number, h: number) =>
    /^screen\b/.test(q) && [...q.matchAll(/\(\s*([a-z-]+)\s*:\s*([a-z0-9/]+?)(px)?\s*\)/g)].every(([, k, v]) => {
      if (k === 'min-width') return w >= +v;
      if (k === 'max-width') return w <= +v;
      if (k === 'min-height') return h >= +v;
      if (k === 'max-height') return h <= +v;
      if (k === 'orientation') return v === (h >= w ? 'portrait' : 'landscape');
      const [n, d] = v.split('/').map(Number);
      if (k === 'min-aspect-ratio') return w / h >= n / d;
      if (k === 'max-aspect-ratio') return w / h <= n / d;
      return false;
    });
  const applies = (w: number, h: number) => queries.some((q) => evalQ(q, w, h));
  // known Duo sizes and the inferred app viewport (457x678), both orientations
  for (const [w, h] of [[382, 580], [470, 780], [594, 368], [669, 867], [951, 585], [457, 678], [457, 760], [457, 700], [440, 660], [480, 720], [951, 669], [640, 867], [382, 700], [382, 764], [470, 900], [385, 760]]) {
    assert.ok(applies(w, h), `${w}x${h} must apply`);
    if (w / h < 1 && h / w <= 1.75) assert.ok(applies(h, w), `${h}x${w} must apply (rotated)`);
  }
  // ordinary tall phones, iPads, desktops, landscape phones: tokens stay 0
  for (const [w, h] of [[390, 844], [844, 390], [430, 932], [932, 430], [393, 852], [402, 874], [360, 740], [744, 1024], [1024, 768], [1180, 820], [820, 1180], [1280, 800], [1440, 900], [951, 350], [568, 320]]) {
    assert.ok(!applies(w, h), `${w}x${h} must NOT apply`);
  }
});

test('widget corner: never gated on display-mode or posture', () => {
  for (const m of css.matchAll(/@media([^{]*)\{/g)) {
    let depth = 1, i = (m.index ?? 0) + m[0].length;
    const from = i;
    while (i < css.length && depth) { depth += css[i] === '{' ? 1 : css[i] === '}' ? -1 : 0; i++; }
    if (css.slice(from, i).includes('--duo-widget')) assert.doesNotMatch(m[1], /display-mode|device-posture|viewport-segments/);
  }
});

test('widget corner guard (Playwright WebKit) and ?duo-debug=1 overlay are wired', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.match(pkg.scripts['test:duo-widget'], /duo-widget-guard/);
  const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
  assert.match(main, /duo-debug/);
  assert.match(main, /import\(['"]\.\/lib\/duoDebug/);
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
