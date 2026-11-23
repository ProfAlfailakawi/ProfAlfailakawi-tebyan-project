import { strict as assert } from 'node:assert';
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  apnsConfigFromEnv,
  apnsPayload,
  createApnsSender,
  createPushService,
  createRippleReplyPushHandler,
  createSubscribeNativeHandler,
} from '../functions/nativePush.js';

/* Native iOS push (APNs): HTTP/2 is mocked, nothing touches the network. */

const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
const P8 = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const ENV = { APNS_KEY_P8: P8, APNS_KEY_ID: 'KEYID12345', APNS_TEAM_ID: 'TEAMID1234', APNS_TOPIC: 'com.dralfailakawi.tebyan.ios' };
const TOKEN = 'a'.repeat(64);
const NOW = 1_800_000_000_000;

function mockConnect(status: number, body = '') {
  const calls: any[] = [];
  const connect = (origin: string) => {
    const client: any = new EventEmitter();
    client.close = () => {};
    client.request = (headers: any) => {
      const req: any = new EventEmitter();
      req.setEncoding = () => {};
      req.end = (payload: string) => {
        calls.push({ origin, headers, payload });
        setImmediate(() => {
          req.emit('response', { ':status': status });
          if (body) req.emit('data', body);
          req.emit('end');
        });
      };
      return req;
    };
    return client;
  };
  return { connect, calls };
}

test('no-op without env: nothing is sent and no connection opens', async () => {
  const m = mockConnect(200);
  const sender = createApnsSender({ crypto, env: () => ({ APNS_KEY_ID: 'x' }), connect: m.connect });
  assert.equal(sender.configured(), false);
  const r = await sender.send(TOKEN, { title: 't', url: '/' });
  assert.equal(r.skipped, true);
  assert.equal(m.calls.length, 0);
  assert.equal(apnsConfigFromEnv({}), null);
});

test('JWT is ES256, signed by the .p8 key, with kid/iss/iat', async () => {
  const m = mockConnect(200);
  const sender = createApnsSender({ crypto, env: () => ENV, connect: m.connect, now: () => NOW });
  const r = await sender.send(TOKEN, { title: 'hi', url: '/?tab=ripple' });
  assert.equal(r.ok, true);
  const call = m.calls[0];
  assert.equal(call.origin, 'https://api.push.apple.com');
  assert.equal(call.headers[':path'], `/3/device/${TOKEN}`);
  assert.equal(call.headers['apns-topic'], 'com.dralfailakawi.tebyan.ios');
  const jwt = String(call.headers.authorization).replace(/^bearer /, '');
  const [h, p, s] = jwt.split('.');
  assert.deepEqual(JSON.parse(Buffer.from(h, 'base64url').toString()), { alg: 'ES256', kid: 'KEYID12345' });
  assert.deepEqual(JSON.parse(Buffer.from(p, 'base64url').toString()), { iss: 'TEAMID1234', iat: NOW / 1000 });
  const ok = crypto.verify('sha256', Buffer.from(`${h}.${p}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'));
  assert.equal(ok, true);
});

test('payload carries the target url; external urls fall back to /', () => {
  const p = JSON.parse(apnsPayload({ title: 'T', body: 'B', url: '/?tab=ripple' }));
  assert.equal(p.url, '/?tab=ripple');
  assert.equal(p.aps.alert.title, 'T');
  assert.equal(JSON.parse(apnsPayload({ title: 'T', url: 'https://evil.example' })).url, '/');
  assert.equal(JSON.parse(apnsPayload({ title: 'T', url: '//evil.example' })).url, '/');
});

for (const [status, body] of [[410, '{"reason":"Unregistered"}'], [400, '{"reason":"BadDeviceToken"}'], [410, '']] as const) {
  test(`token is dropped on ${status} ${body || '(no body)'}`, async () => {
    const m = mockConnect(status, body);
    const sender = createApnsSender({ crypto, env: () => ENV, connect: m.connect });
    const deleted: string[] = [];
    const warnings: string[] = [];
    const firestore = {
      collection: () => ({
        where: () => ({ limit: () => ({ get: async () => ({ docs: [{ data: () => ({ uid: 'u1', token: TOKEN }), ref: { delete: async () => { deleted.push('d'); } } }] }) }) }),
      }),
    };
    const push = createPushService({ sender, crypto, getServices: async () => ({ firestore }), log: { warn: (...a: any[]) => warnings.push(a.join(' ')) } as any });
    const summary = await push.sendToUsers(['u1'], { title: 't', url: '/' });
    assert.equal(summary.dropped, 1);
    assert.equal(deleted.length, 1);
    assert.ok(warnings.every((w) => !w.includes(TOKEN)), 'full token must never be logged');
  });
}

test('other failures keep the token', async () => {
  const m = mockConnect(500, '{"reason":"InternalServerError"}');
  const sender = createApnsSender({ crypto, env: () => ENV, connect: m.connect });
  const r = await sender.send(TOKEN, { title: 't', url: '/' });
  assert.equal(r.ok, false);
  assert.equal(r.gone, false);
});

function res() {
  const out: any = { statusCode: 200, body: null };
  out.status = (c: number) => { out.statusCode = c; return out; };
  out.json = (b: any) => { out.body = b; return out; };
  return out;
}
const req = (body: any, token?: string) => ({ body, header: (n: string) => (n === 'Authorization' && token ? `Bearer ${token}` : '') });

test('subscribe-native requires auth and stores the token per user', async () => {
  const stored: any[] = [];
  const firestore = { collection: () => ({ doc: (id: string) => ({ set: async (v: any) => { stored.push({ id, ...v }); } }) }) };
  const services = { auth: { verifyIdToken: async (t: string) => { if (t !== 'good') throw new Error('bad'); return { uid: 'u1' }; } }, firestore };
  const sender = createApnsSender({ crypto, env: () => ({}) });
  const push = createPushService({ sender, crypto, getServices: async () => services });
  const handler = createSubscribeNativeHandler({ push, getServices: async () => services });
  const r1 = res(); await handler(req({ token: TOKEN }) as any, r1);
  assert.equal(r1.statusCode, 401);
  const r2 = res(); await handler(req({ token: 'nope' }, 'good') as any, r2);
  assert.equal(r2.statusCode, 400);
  const r3 = res(); await handler(req({ token: TOKEN }, 'good') as any, r3);
  assert.equal(r3.statusCode, 200);
  assert.equal(stored[0].uid, 'u1');
  assert.equal(stored[0].token, TOKEN);
});

test('ripple-reply pushes only to the parent author, only for the caller\'s own reply', async () => {
  const ripples: Record<string, any> = {
    reply1: { authorId: 'u2', parentId: 'root1', text: 'nice' },
    root1: { authorId: 'u1' },
  };
  const firestore = { collection: () => ({ doc: (id: string) => ({ get: async () => ({ exists: id in ripples, data: () => ripples[id] }) }) }) };
  const services = { auth: { verifyIdToken: async (t: string) => ({ uid: t }) }, firestore };
  const sent: any[] = [];
  const push: any = { sendToUsers: async (uids: string[], msg: any) => { sent.push({ uids, msg }); return { sent: 1 }; } };
  const handler = createRippleReplyPushHandler({ push, getServices: async () => services });
  const forged = res(); await handler(req({ replyId: 'reply1' }, 'u3') as any, forged);
  assert.equal(forged.statusCode, 403);
  const ok = res(); await handler(req({ replyId: 'reply1' }, 'u2') as any, ok);
  assert.equal(ok.statusCode, 200);
  assert.deepEqual(sent[0].uids, ['u1']);
  assert.equal(sent[0].msg.url, '/?tab=ripple');
});

test('no APNS secret or key material is committed', () => {
  for (const f of ['functions/nativePush.js', 'functions/index.js', 'server.ts', 'src/lib/nativePush.ts']) {
    const src = readFileSync(f, 'utf8');
    assert.ok(!/BEGIN PRIVATE KEY/.test(src), f);
  }
});
