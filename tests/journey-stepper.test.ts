import test from 'node:test';
import assert from 'node:assert/strict';
import { journeyStepMs } from '../src/components/dna/useJourneyReveal';

test('journeyStepMs clamps to 350..750 and caps the total near 4s', () => {
  assert.equal(journeyStepMs(2), 750);
  assert.equal(journeyStepMs(4), 750);
  assert.equal(journeyStepMs(8), 500);
  assert.equal(journeyStepMs(30), 350);
});
