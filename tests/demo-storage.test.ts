import { strict as assert } from 'node:assert';
import { test } from 'node:test';

/*
 * في وضع العرض تُحوَّل قراءة localStorage وكتابته إلى مساحة معزولة في
 * sessionStorage مبذورة ببيانات الأسرة النموذجية: الشارة والمستوى وسجل البحث
 * و«نكمل من حيث وقفنا» … ولا يصل شيء من بيانات العرض إلى localStorage الحقيقي.
 */
class FakeStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  raw() { return this.m; }
}

test('demo storage seeds screens and never touches real localStorage', async () => {
  const local = new FakeStorage();
  const session = new FakeStorage();
  session.setItem('tebyan_demo_active_v1', 'true');
  (globalThis as any).Storage = FakeStorage;
  (globalThis as any).window = { localStorage: local, sessionStorage: session, location: { reload: () => {} } };

  await import('../src/lib/demoStorage.ts');

  assert.equal(local.getItem('edu_ai_xp'), '340', 'XP badge is seeded');
  const sage = JSON.parse(local.getItem('tebyan_sage_progress')!);
  assert.equal(sage.points, 340);
  assert.ok(sage.badges.length > 0);
  assert.ok(JSON.parse(local.getItem('tebyan_search_history')!).length >= 5, 'search history');
  assert.ok(JSON.parse(local.getItem('tebyan_memory')!).query, 'resume card');
  assert.ok(JSON.parse(local.getItem('tebyan_tomorrow_room')!).query, 'tomorrow door');
  assert.ok(JSON.parse(local.getItem('tebyan_thought_memory')!).length >= 3, 'thought memory');
  assert.equal(local.getItem('no_such_key'), null);

  // Writes and removals live in the session overlay only.
  local.setItem('edu_ai_xp', '390');
  assert.equal(local.getItem('edu_ai_xp'), '390');
  local.removeItem('tebyan_memory');
  assert.equal(local.getItem('tebyan_memory'), null);
  assert.equal(local.raw().size, 0, 'real localStorage was never written to');

  // The session store itself is not redirected.
  session.setItem('plain', 'x');
  assert.equal(session.getItem('plain'), 'x');
});

test('admin demo fixtures are coherent and clearly fictitious', async () => {
  const a = await import('../src/data/demoAdmin.ts');
  assert.ok(a.DEMO_USERS.length >= 12);
  assert.equal(new Set(a.DEMO_USERS.map((u: any) => u.id)).size, a.DEMO_USERS.length, 'unique user ids');
  for (const u of a.DEMO_USERS) assert.ok(u.email.endsWith('@example.com'), 'fictitious email');
  assert.ok(a.DEMO_USERS.some((u: any) => u.role === 'admin'));
  assert.ok(a.DEMO_MESSAGES.some((m: any) => m.status === 'new') && a.DEMO_MESSAGES.some((m: any) => m.status === 'read'));
  assert.equal(a.DEMO_TOP_QUERIES.length, 20);
  const sorted = [...a.DEMO_TOP_QUERIES].sort((x: any, y: any) => y.count - x.count);
  assert.deepEqual(a.DEMO_TOP_QUERIES, sorted, 'top queries are ranked');
  const { generated, published, needsReview, skipped } = a.DEMO_GEN_STATUS;
  assert.equal(published + needsReview + skipped, generated, 'generation summary adds up');
  const f = await import('../src/data/demoFixtures.ts');
  const visitor = a.DEMO_CUSTOMERS.find((c: any) => c.id === 'um-saud');
  assert.equal(visitor.points, f.DEMO_LOYALTY.points, 'CRM balance matches the visitor wallet');
  assert.equal(visitor.totalSpent, f.DEMO_LOYALTY.totalSpent);
  assert.equal(a.DEMO_CUSTOMERS.length, a.DEMO_USERS.length, 'every user is a customer');
  assert.ok(a.DEMO_CUSTOMERS.some((c: any) => c.status === 'VIP') && a.DEMO_CUSTOMERS.some((c: any) => c.status === 'At Risk'));
  assert.ok(a.DEMO_COUPONS.every((c: any) => c.code && c.discount > 0));
  for (const m of [...a.DEMO_MESSAGES, ...a.DEMO_USERS]) {
    const d = (m.createdAt as any).toDate();
    assert.ok(d >= new Date('2026-05-01') && d <= new Date('2026-10-01'), 'dates within the recent months');
  }
});
