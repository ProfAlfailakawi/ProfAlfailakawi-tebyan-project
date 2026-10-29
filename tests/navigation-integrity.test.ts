import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { matchRoutes } from 'react-router-dom';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('every tab the command palette opens is a tab App actually renders', () => {
  const palette = read('src/components/GlobalCommand.tsx');
  const app = read('src/App.tsx');
  const ids = [...palette.matchAll(/handleTabChange\('([a-z_-]+)'/g)].map((m) => m[1]);
  assert.ok(ids.length >= 4);
  for (const id of ids) {
    assert.ok(app.includes(`case "${id}":`), `GlobalCommand opens "${id}", which App renders as an empty screen`);
  }
});

test('unknown paths are routed somewhere instead of rendering a blank page', () => {
  const known = [{ path: '/' }, { path: '/qawl' }, { path: '/qawl/:qid' }, { path: '/admin' }];
  // Without a catch-all, react-router matches nothing (and renders nothing) for these.
  for (const p of ['/about', '/index.html', '/qawl/q-5/x']) assert.equal(matchRoutes(known, p), null);
  const withCatchAll = [...known, { path: '*' }];
  for (const p of ['/about', '/index.html', '/qawl/q-5/x']) assert.ok(matchRoutes(withCatchAll, p));
  // Real routes still win over the catch-all.
  assert.equal(matchRoutes(withCatchAll, '/qawl/q-5')?.[0].route.path, '/qawl/:qid');

  const main = read('src/main.tsx');
  assert.match(main, /<Route path="\*" element=\{<RedirectHome \/>\} \/>/);
});

test('home question box: Space is not hijacked and only a visible completion takes over Enter', () => {
  const src = read('src/components/SmartGateway.tsx');
  assert.match(src, /e\.key\.length !== 1 \|\| e\.key === " "/);
  assert.match(src, /role="dialog"\], \[aria-modal="true"\]/);
  assert.match(src, /smartSuggestion\.startsWith\(searchValue\)\s*\?\s*smartSuggestion/);
  assert.match(src, /\(e\.key === "Enter" && !e\.shiftKey\)\) &&\s*ghostSuggestion/);
});
