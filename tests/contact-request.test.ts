import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { CONTACT_LIMITS, buildContactRequest, sendContactRequest } from '../src/lib/contactRequest.ts';

/*
 * نموذج «تواصل» كان لا يحفظ شيئًا: `contact_requests` بلا قاعدة، فالرفض الافتراضي
 * يمنع كل كتابة. المستودع بلا محاكي Firestore (ولا Java في CI)، فهذا الاختبار:
 *  1) يتحقق من وجود القاعدة ومن أنها تقبل حقول النموذجين بالضبط وبالحدود نفسها؛
 *  2) يتحقق من أن فشل الكتابة يعود خطأً لا نجاحًا، وأن الزر العائم يعرضه.
 */
const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

function contactBlock(): string {
  const start = rules.indexOf('match /contact_requests/{requestId}');
  assert.ok(start >= 0, 'firestore.rules has a contact_requests rule');
  return rules.slice(start, rules.indexOf('\n    }\n', start));
}

test('contact_requests rule: create-only for anyone, admin read/delete/status-update', () => {
  const block = contactBlock();
  const create = block.match(/allow create: if ([\s\S]*?);\n/)![1];
  assert.doesNotMatch(create, /isSignedIn|request\.auth/, 'signed-out visitors may create');
  assert.match(create, /createdAt == request\.time/, 'server timestamp enforced');
  assert.match(create, /status == 'new'/);
  assert.match(block, /allow read, delete: if isAdmin\(\);/);
  assert.match(block, /allow update: if isAdmin\(\)\s*&& request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)\.hasOnly\(\['status'\]\);/);
  assert.doesNotMatch(block, /allow (write|list|get)\b/);
});

test('rule fields and caps match what both forms write', () => {
  const block = contactBlock();
  const allowed = JSON.parse(block.match(/hasOnly\((\[[^\]]*\])\)/)![1].replace(/'/g, '"')) as string[];
  const required = JSON.parse(block.match(/hasAll\((\[[^\]]*\])\)/)![1].replace(/'/g, '"')) as string[];

  const tab = buildContactRequest({ name: 'n', email: 'e@x', message: 'm', language: 'ar' }, 'TS');
  const floating = buildContactRequest({ name: 'n', email: 'e@x', message: 'm', source: 'floating_button' }, 'TS');
  for (const data of [tab, floating]) {
    for (const k of Object.keys(data)) assert.ok(allowed.includes(k), `rule allows field ${k}`);
    for (const k of required) assert.ok(k in data, `form writes required field ${k}`);
    assert.equal(data.status, 'new');
  }

  for (const [field, cap] of Object.entries(CONTACT_LIMITS)) {
    assert.match(block, new RegExp(`data\\.${field}\\.size\\(\\) <= ${cap}\\b`), `${field} cap ${cap} matches rule`);
  }
});

test('a rejected write is reported as an error, never as success', async () => {
  const denied = Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' });
  const failed = await sendContactRequest(async () => { throw denied; }, { name: 'n' });
  assert.equal(failed.ok, false);
  assert.equal(failed.error, denied);

  const written: unknown[] = [];
  const ok = await sendContactRequest(async (d) => { written.push(d); }, { name: 'n' });
  assert.equal(ok.ok, true);
  assert.equal(written.length, 1);
});

test('both forms show an error state when the write fails', () => {
  const floating = readFileSync(new URL('../src/components/MessagesFloatingButton.tsx', import.meta.url), 'utf8');
  assert.match(floating, /if \(!result\.ok\) \{[\s\S]*?setSendFailed\(true\);[\s\S]*?return;/);
  assert.match(floating, /\{sendFailed && \(/, 'floating form renders the failure');

  const tab = readFileSync(new URL('../src/components/tabs/ContactTab.tsx', import.meta.url), 'utf8');
  assert.match(tab, /if \(!result\.ok\) \{[\s\S]*?setStatus\('error'\);[\s\S]*?return;/);
});
