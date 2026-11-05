import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { ADMIN_EMAILS, OWNER_UID, isAdminIdentity } from '../src/lib/adminAccess';
import { cn, formatDisplayDate } from '../src/lib/utils';
import { migrateLegacyData } from '../src/lib/migration';

// ---- adminAccess (client-side UX gate; Firestore rules are the real gate) ----

test('isAdminIdentity rejects missing users and unknown identities', () => {
  assert.equal(isAdminIdentity(null), false);
  assert.equal(isAdminIdentity(undefined), false);
  assert.equal(isAdminIdentity({}), false);
  assert.equal(isAdminIdentity({ uid: 'someone-else', email: 'nobody@example.com' }), false);
  assert.equal(isAdminIdentity({ uid: null, email: null }), false);
});

test('isAdminIdentity accepts the owner uid and every listed admin email, case-insensitively', () => {
  assert.equal(isAdminIdentity({ uid: OWNER_UID, email: null }), true);
  for (const email of ADMIN_EMAILS) {
    assert.equal(isAdminIdentity({ uid: 'x', email }), true);
    assert.equal(isAdminIdentity({ uid: 'x', email: email.toUpperCase() }), true);
  }
});

test('the admin email list is lower-case so the lower-cased lookup can match it', () => {
  for (const email of ADMIN_EMAILS) assert.equal(email, email.toLowerCase());
});

// ---- utils ----

test('cn merges conditional classes and lets the later Tailwind class win', () => {
  assert.equal(cn('p-2', false && 'hidden', 'p-4'), 'p-4');
  assert.equal(cn('a', undefined, null, ['b', { c: true, d: false }]), 'a b c');
});

test('formatDisplayDate returns empty for empty input and the raw text for non-dates', () => {
  assert.equal(formatDisplayDate(null), '');
  assert.equal(formatDisplayDate(undefined), '');
  assert.equal(formatDisplayDate(''), '');
  assert.equal(formatDisplayDate('قريباً'), 'قريباً');
});

test('formatDisplayDate shows the year only when it is not the current year', () => {
  const thisYear = new Date().getFullYear();
  const other = formatDisplayDate('2001-03-05', 'en');
  assert.match(other, /2001/);
  const current = formatDisplayDate(`${thisYear}-03-05`, 'en');
  assert.doesNotMatch(current, new RegExp(String(thisYear)));
  assert.match(current, /March/);
});

test('formatDisplayDate reads an ISO date as a local calendar day (no timezone shift)', () => {
  assert.match(formatDisplayDate('2001-12-31T23:30:00', 'en'), /December 31, 2001/);
});

// ---- migration (legacy tibyan_ -> tebyan_ keys) ----

function withFakeStorage(initial: Record<string, string>, run: (store: Map<string, string>) => void) {
  const store = new Map(Object.entries(initial));
  const g = globalThis as any;
  const previous = g.localStorage;
  const log = console.log;
  g.localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  };
  console.log = () => {};
  try {
    run(store);
  } finally {
    console.log = log;
    if (previous === undefined) delete g.localStorage;
    else g.localStorage = previous;
  }
}

test('migrateLegacyData copies a legacy key to the new key and keeps the old one', () => {
  withFakeStorage({ tibyan_memory: '{"a":1}' }, (store) => {
    migrateLegacyData();
    assert.equal(store.get('tebyan_memory'), '{"a":1}');
    assert.equal(store.get('tibyan_memory'), '{"a":1}');
  });
});

test('migrateLegacyData never overwrites data already stored under the new key', () => {
  withFakeStorage({ tibyan_memory: 'old', tebyan_memory: 'new' }, (store) => {
    migrateLegacyData();
    assert.equal(store.get('tebyan_memory'), 'new');
  });
});

test('migrateLegacyData is a no-op when there is no legacy data, and is idempotent', () => {
  withFakeStorage({ tibyan_usage_stats: '5' }, (store) => {
    migrateLegacyData();
    const snapshot = JSON.stringify([...store.entries()]);
    migrateLegacyData();
    assert.equal(JSON.stringify([...store.entries()]), snapshot);
  });
  withFakeStorage({}, (store) => {
    migrateLegacyData();
    assert.equal(store.size, 0);
  });
});
