import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { countStep, easeOut, drawStoreKey } from '../src/components/dna/useFirstView';

const css = readFileSync(new URL('../src/components/dna/dna.css', import.meta.url), 'utf8');
const indexCss = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

test('countStep starts at 0, ends exactly on the final value and never overshoots', () => {
  assert.equal(countStep(250, 0), 0);
  assert.equal(countStep(250, 1), 250);
  assert.equal(countStep(250, 2), 250);
  for (let t = 0; t <= 1; t += 0.05) assert.ok(countStep(250, t) <= 250);
  assert.equal(countStep(7.5, 1, 1), 7.5);
  assert.ok(easeOut(0.5) > 0.5);
});

test('draw play-once keys are namespaced away from journey steppers', () => {
  assert.equal(drawStoreKey('a'), 'draw:a');
  assert.equal(drawStoreKey(null), null);
  assert.equal(drawStoreKey(''), null);
});

test('draw-in styles only apply while JS armed data-draw, and reduced motion removes transitions', () => {
  assert.match(css, /\.dna-ring\[data-draw='pre'\] \.dna-ringv/);
  assert.match(css, /\.dna-tline\[data-draw='pre'\] \.dna-dot/);
  const reduce = css.slice(css.lastIndexOf('prefers-reduced-motion: reduce'));
  assert.match(reduce, /\.dna-spark \.dna-sparkl/);
  assert.match(reduce, /\.dna-tline \.dna-dot/);
});

test('non-journey stepper current node no longer loops; halo is one-shot on change', () => {
  assert.doesNotMatch(css, /animation: dna-halo[^;]*infinite/);
  assert.match(css, /\.dna-stepi\[data-just\]\[data-state='current'\] \.dna-node \{ animation: dna-journey-pulse 1\.5s var\(--dna-ease\) 1; \}/);
});

test('calmed global loops are finite in index.css', () => {
  assert.doesNotMatch(indexCss, /tebyan-breathe 4\.8s ease-in-out infinite/);
  assert.doesNotMatch(indexCss, /tebyan-search-aurora 3\.8s ease-in-out infinite/);
  assert.doesNotMatch(indexCss, /tebyanKnowledgeSweep 9s ease-in-out infinite/);
  assert.doesNotMatch(indexCss, /tebyanLivingMap 18s ease-in-out infinite/);
  assert.match(indexCss, /\.tebyan-gateway-ring:focus-within/);
});
