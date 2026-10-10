import test from 'node:test';
import assert from 'node:assert/strict';
import { journeyStepMs, effectiveThreshold, journeySlot } from '../src/components/dna/useJourneyReveal';

test('journeyStepMs clamps to 350..750 and caps the total near 4s', () => {
  assert.equal(journeyStepMs(2), 750);
  assert.equal(journeyStepMs(4), 750);
  assert.equal(journeyStepMs(8), 500);
  assert.equal(journeyStepMs(30), 350);
});

test('effectiveThreshold stays attainable for tall elements in short viewports', () => {
  assert.equal(effectiveThreshold(0.5, 80, 800), 0.5);
  assert.ok(Math.abs(effectiveThreshold(0.5, 1000, 500) - 0.45) < 1e-9);
  assert.equal(effectiveThreshold(0.5, 100000, 500), 0.1);
  assert.equal(effectiveThreshold(0.5, 0, 800), 0.5);
});

test('journey mode never loops the halo: its current-node rule replaces the base infinite animation', async () => {
  const { readFileSync } = await import('node:fs');
  const css = readFileSync(new URL('../src/components/dna/dna.css', import.meta.url), 'utf8');
  const rule = css.match(/\.dna-steps\[data-journey\] \.dna-stepi\[data-state='current'\] \.dna-node \{[^}]*\}/);
  assert.ok(rule, 'journey current rule exists');
  assert.match(rule![0], /animation: none;/);
  assert.doesNotMatch(css, /dna-journey-pulse[^;]*infinite/);
  assert.match(css, /\[data-journey\]\[data-reveal\] \.dna-stepi\[data-just\]\[data-state='current'\] \.dna-node/);
});

test('journeySlot distinguishes entities so a reused stepper re-arms for a new playKey', () => {
  assert.notEqual(journeySlot('review:1'), journeySlot('review:2'));
  assert.notEqual(journeySlot(null), journeySlot('review:1'));
  assert.equal(journeySlot('a'), journeySlot('a'));
});
