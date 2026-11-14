import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { createDeleteAccountHandler } from '../functions/accountDeletion.js';
import { isAppleNativeShell } from '../src/lib/appleNativeShell.ts';

/*
 * DELETE /api/account (App Store 5.1.1(v)). The handler is host-agnostic, so the
 * authorization rules are tested here with fake firebase-admin services:
 * no token -> 401, other uid -> 403, stale sign-in -> 401, own uid -> deletes only that uid.
 */
const NOW = 1_800_000_000_000;

function setup(tokenUid = 'uid-A', authTimeAgoSec = 10) {
  const calls: string[] = [];
  const deletedUsers: string[] = [];
  const firestore = {
    collection: (name: string) => ({
      where: (_f: string, _op: string, v: string) => ({ get: async () => { calls.push(`query:${name}:${v}`); return { docs: [] }; } }),
      doc: (id: string) => ({ delete: async () => { calls.push(`delete:${name}/${id}`); } }),
    }),
    collectionGroup: () => ({ where: () => ({ get: async () => ({ docs: [] }) }) }),
    recursiveDelete: async () => {},
  };
  const services = {
    auth: {
      verifyIdToken: async (t: string) => {
        if (t !== 'good-token') throw Object.assign(new Error('bad'), { code: 'auth/argument-error' });
        return { uid: tokenUid, auth_time: Math.floor(NOW / 1000) - authTimeAgoSec };
      },
      deleteUser: async (uid: string) => { deletedUsers.push(uid); },
    },
    firestore,
  };
  const handler = createDeleteAccountHandler({ getServices: async () => services, now: () => NOW });
  return { handler, calls, deletedUsers };
}

function run(handler: any, { token, body, query }: { token?: string; body?: any; query?: any } = {}) {
  return new Promise<{ status: number; json: any }>((resolve) => {
    const req = { header: (n: string) => (n === 'Authorization' && token ? `Bearer ${token}` : undefined), body, query };
    let status = 200;
    const res: any = {
      status(c: number) { status = c; return res; },
      json(j: any) { resolve({ status, json: j }); return res; },
    };
    handler(req, res);
  });
}

test('no token -> 401 and nothing is deleted', async () => {
  const { handler, calls, deletedUsers } = setup();
  const r = await run(handler);
  assert.equal(r.status, 401);
  assert.deepEqual(calls, []);
  assert.deepEqual(deletedUsers, []);
});

test('invalid token -> 401 and nothing is deleted', async () => {
  const { handler, deletedUsers } = setup();
  const r = await run(handler, { token: 'forged' });
  assert.equal(r.status, 401);
  assert.deepEqual(deletedUsers, []);
});

test('a different uid in the body or query -> 403 and nothing is deleted', async () => {
  for (const extra of [{ body: { uid: 'uid-B' } }, { query: { uid: 'uid-B' } }]) {
    const { handler, calls, deletedUsers } = setup('uid-A');
    const r = await run(handler, { token: 'good-token', ...extra });
    assert.equal(r.status, 403);
    assert.deepEqual(calls, []);
    assert.deepEqual(deletedUsers, []);
  }
});

test('stale sign-in -> 401 REAUTH_REQUIRED and nothing is deleted', async () => {
  const { handler, deletedUsers } = setup('uid-A', 60 * 60);
  const r = await run(handler, { token: 'good-token' });
  assert.equal(r.status, 401);
  assert.equal(r.json.error, 'REAUTH_REQUIRED');
  assert.deepEqual(deletedUsers, []);
});

test('own uid with a fresh sign-in deletes only that uid', async () => {
  const { handler, calls, deletedUsers } = setup('uid-A');
  const r = await run(handler, { token: 'good-token', body: { uid: 'uid-A' } });
  assert.equal(r.status, 200);
  assert.deepEqual(deletedUsers, ['uid-A']);
  assert.ok(calls.includes('delete:users/uid-A'));
  assert.ok(calls.includes('delete:admins/uid-A'));
  assert.ok(calls.every((c) => !c.includes('uid-B')));
});

test('the route is mounted in both the function and the server, and Google sign-in is hidden in the iOS shell', () => {
  const fn = readFileSync(new URL('../functions/index.js', import.meta.url), 'utf8');
  const srv = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  assert.match(fn, /app\.delete\("\/api\/account"/);
  assert.match(srv, /app\.delete\("\/api\/account"/);
  const login = readFileSync(new URL('../src/components/Login.tsx', import.meta.url), 'utf8');
  assert.match(login, /\{!hideThirdPartySignIn && \(/);
});

test('isAppleNativeShell: false without window, true only for native iOS', () => {
  assert.equal(isAppleNativeShell(), false);
  const g: any = globalThis;
  g.window = { Capacitor: { isNativePlatform: () => true, getPlatform: () => 'ios' } };
  assert.equal(isAppleNativeShell(), true);
  g.window = { Capacitor: { isNativePlatform: () => true, getPlatform: () => 'android' } };
  assert.equal(isAppleNativeShell(), false);
  g.window = {};
  assert.equal(isAppleNativeShell(), false);
  delete g.window;
});
