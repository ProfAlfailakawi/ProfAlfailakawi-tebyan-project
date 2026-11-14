import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { createListRippleReportsHandler, createReportRippleHandler } from '../functions/rippleModeration.js';

/*
 * POST /api/ripple-reports and GET /api/admin/ripple-reports (App Store 1.2).
 * Handlers are host-agnostic, so they are tested with fake firebase-admin services.
 */
const NOW = 1_800_000_000_000;

function setup() {
  const stored: any[] = [];
  const ripples: Record<string, any> = { 'r-1': { text: 'hello', authorId: 'author-1' } };
  const admins = new Set(['uid-admin-doc']);
  const firestore = {
    collection: (name: string) => ({
      doc: (id: string) => ({
        get: async () => ({
          exists: name === 'ripples' ? id in ripples : name === 'admins' ? admins.has(id) : false,
          data: () => ripples[id],
        }),
        set: async (v: any) => { stored.push({ id, ...v }); },
      }),
      add: async (v: any) => { stored.push({ id: 'auto', ...v }); },
      orderBy: () => ({ limit: () => ({ get: async () => ({ docs: stored.map((v) => ({ id: v.id, data: () => v })) }) }) }),
    }),
  };
  const users: Record<string, any> = {
    'good-token': { uid: 'uid-A' },
    'admin-token': { uid: 'uid-X', email: 'ah_f@hotmail.com', firebase: { sign_in_provider: 'google.com' } },
    'unverified-admin-email': { uid: 'uid-Y', email: 'ah_f@hotmail.com', email_verified: false, firebase: { sign_in_provider: 'password' } },
    'admin-doc-token': { uid: 'uid-admin-doc' },
  };
  const services = {
    auth: { verifyIdToken: async (t: string) => { if (!users[t]) throw new Error('bad'); return users[t]; } },
    firestore,
  };
  const getServices = async () => services;
  return {
    stored,
    report: createReportRippleHandler({ getServices, now: () => NOW }),
    list: createListRippleReportsHandler({ getServices }),
  };
}

function run(handler: any, { token, body }: { token?: string; body?: any } = {}) {
  return new Promise<{ status: number; json: any }>((resolve) => {
    const req = { header: (n: string) => (n === 'Authorization' && token ? `Bearer ${token}` : undefined), body };
    let status = 200;
    const res: any = {
      status(c: number) { status = c; return res; },
      json(j: any) { resolve({ status, json: j }); return res; },
    };
    handler(req, res);
  });
}

test('bad input -> 400 and nothing is stored', async () => {
  const { report, stored } = setup();
  const bad = [
    undefined,
    {},
    { rippleId: 'r-1' },
    { rippleId: 'r-1', reason: 'because' },
    { rippleId: '../x', reason: 'spam' },
    { rippleId: 123, reason: 'spam' },
    { rippleId: 'r-1', reason: 'spam', note: 'x'.repeat(501) },
    { rippleId: 'r-1', reason: 'spam', note: { a: 1 } },
  ];
  for (const body of bad) {
    const r = await run(report, { body });
    assert.equal(r.status, 400, JSON.stringify(body));
  }
  assert.deepEqual(stored, []);
});

test('unknown ripple -> 404 and nothing is stored', async () => {
  const { report, stored } = setup();
  const r = await run(report, { body: { rippleId: 'nope', reason: 'spam' } });
  assert.equal(r.status, 404);
  assert.deepEqual(stored, []);
});

test('invalid token -> 401 and nothing is stored', async () => {
  const { report, stored } = setup();
  const r = await run(report, { token: 'forged', body: { rippleId: 'r-1', reason: 'spam' } });
  assert.equal(r.status, 401);
  assert.deepEqual(stored, []);
});

test('anonymous report is stored without a reporter uid and the response leaks nothing', async () => {
  const { report, stored } = setup();
  const r = await run(report, { body: { rippleId: 'r-1', reason: 'abuse', note: ' rude ' } });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { reported: true });
  assert.equal(stored.length, 1);
  assert.equal(stored[0].reporterUid, null);
  assert.equal(stored[0].note, 'rude');
  assert.equal(stored[0].status, 'new');
  assert.equal(stored[0].rippleAuthorId, 'author-1');
});

test('signed-in report is stored with the token uid, never a body-supplied one', async () => {
  const { report, stored } = setup();
  const r = await run(report, { token: 'good-token', body: { rippleId: 'r-1', reason: 'spam', reporterUid: 'uid-B' } });
  assert.equal(r.status, 200);
  assert.equal(stored.length, 1);
  assert.equal(stored[0].reporterUid, 'uid-A');
  assert.equal(stored[0].id, 'r-1__uid-A');
});

test('admin list: no token 401, non-admin 403 with no data, unverified password email 403', async () => {
  const { report, list, stored } = setup();
  await run(report, { body: { rippleId: 'r-1', reason: 'spam' } });
  assert.equal(stored.length, 1);
  assert.equal((await run(list)).status, 401);
  assert.equal((await run(list, { token: 'forged' })).status, 401);
  for (const token of ['good-token', 'unverified-admin-email']) {
    const r = await run(list, { token });
    assert.equal(r.status, 403);
    assert.equal(r.json.reports, undefined);
  }
});

test('admin list: admins (identity or admins/{uid}) can read reports', async () => {
  const { report, list } = setup();
  await run(report, { body: { rippleId: 'r-1', reason: 'spam' } });
  for (const token of ['admin-token', 'admin-doc-token']) {
    const r = await run(list, { token });
    assert.equal(r.status, 200);
    assert.equal(r.json.reports.length, 1);
    assert.equal(r.json.reports[0].rippleId, 'r-1');
  }
});

test('routes are rate limited in both the function and the server; rules grant clients nothing on ripple_reports', () => {
  const fn = readFileSync(new URL('../functions/index.js', import.meta.url), 'utf8');
  const srv = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  for (const src of [fn, srv]) {
    assert.match(src, /app\.post\("\/api\/ripple-reports", rippleReportRateLimit,/);
    assert.match(src, /app\.get\("\/api\/admin\/ripple-reports", rippleReportRateLimit,/);
    assert.match(src, /rippleReportRateLimit = rateLimit\(/);
  }
  const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  assert.ok(!rules.includes('ripple_reports'), 'no client rule: default-deny applies');
});

test('block + report UI is wired into the ripple list and nebula', () => {
  const tab = readFileSync(new URL('../src/components/tabs/RippleEffectTab.tsx', import.meta.url), 'utf8');
  assert.match(tab, /blockedAuthors\.has\(r\.authorId\)/);
  assert.match(tab, /<ModerationContactLine/);
  assert.match(tab, /<RippleReportDialog/);
  const nebula = readFileSync(new URL('../src/components/tabs/NebulaTab.tsx', import.meta.url), 'utf8');
  assert.match(nebula, /blockedAuthors\.has\(r\.authorId\)/);
});
