import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { resolveAuthDomain, shouldFallbackToRedirect } from '../src/lib/authDomain.ts';

const CFG = 'tebyan-app-2026.firebaseapp.com';

test('production host uses same-origin authDomain', () => {
  assert.equal(resolveAuthDomain(CFG, 'tebyan.dr-alfailakawi.com'), 'tebyan.dr-alfailakawi.com');
});
test('localhost and unknown hosts keep configured domain', () => {
  assert.equal(resolveAuthDomain(CFG, 'localhost'), CFG);
  assert.equal(resolveAuthDomain(CFG, 'tebyan-app-2026.web.app'), CFG);
  assert.equal(resolveAuthDomain(CFG, undefined), CFG);
});
test('env override wins', () => {
  assert.equal(resolveAuthDomain(CFG, 'localhost', 'x.example.com'), 'x.example.com');
});
test('redirect fallback codes', () => {
  assert.ok(shouldFallbackToRedirect('auth/popup-blocked'));
  assert.ok(shouldFallbackToRedirect('auth/operation-not-supported-in-this-environment'));
  assert.ok(shouldFallbackToRedirect('auth/web-storage-unsupported'));
  assert.ok(!shouldFallbackToRedirect('auth/popup-closed-by-user'));
});
