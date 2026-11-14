import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  APP_STORE_URL, PLAY_STORE_URL, detectInstallPlatform, resolveInstallAction, shouldShowInstall,
} from '../src/shared/install-banner.ts';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
const IPAD_DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120 Mobile Safari/537.36';
const MAC = IPAD_DESKTOP_UA;
const base = { standalone: false, hasDeferredPrompt: false };

test('store URL constants ship empty (apps not live)', () => {
  assert.equal(APP_STORE_URL, '');
  assert.equal(PLAY_STORE_URL, '');
});

test('platform detection', () => {
  assert.equal(detectInstallPlatform({ userAgent: IPHONE, isNativeIos: true }), 'native-ios');
  assert.equal(detectInstallPlatform({ userAgent: IPHONE, isNativeIos: false }), 'ios');
  assert.equal(detectInstallPlatform({ userAgent: IPAD_DESKTOP_UA, maxTouchPoints: 5, isNativeIos: false }), 'ios');
  assert.equal(detectInstallPlatform({ userAgent: MAC, maxTouchPoints: 0, isNativeIos: false }), 'desktop');
  assert.equal(detectInstallPlatform({ userAgent: ANDROID, isNativeIos: false }), 'android');
});

test('native iOS shell never shows install, even with store URLs', () => {
  const i = { ...base, platform: 'native-ios' as const, appStoreUrl: 'https://apps.apple.com/app/id1', hasDeferredPrompt: true };
  assert.equal(shouldShowInstall(i), false);
  assert.deepEqual(resolveInstallAction(i), { kind: 'hidden' });
});

test('iOS browser: App Store when set, else Add-to-Home-Screen steps', () => {
  assert.deepEqual(resolveInstallAction({ ...base, platform: 'ios', appStoreUrl: 'https://apps.apple.com/app/id1' }),
    { kind: 'open-store', url: 'https://apps.apple.com/app/id1' });
  assert.deepEqual(resolveInstallAction({ ...base, platform: 'ios', appStoreUrl: '' }), { kind: 'ios-instructions' });
  assert.deepEqual(resolveInstallAction({ ...base, platform: 'ios', appStoreUrl: 'javascript:alert(1)' }), { kind: 'ios-instructions' });
});

test('Android: Play Store when set, else PWA prompt / menu hint', () => {
  assert.deepEqual(resolveInstallAction({ ...base, platform: 'android', playStoreUrl: 'https://play.google.com/store/apps/details?id=x' }),
    { kind: 'open-store', url: 'https://play.google.com/store/apps/details?id=x' });
  assert.deepEqual(resolveInstallAction({ ...base, platform: 'android', hasDeferredPrompt: true }), { kind: 'pwa-prompt' });
  assert.deepEqual(resolveInstallAction({ ...base, platform: 'android' }), { kind: 'browser-menu-hint' });
});

test('desktop ignores store URLs and keeps PWA behaviour', () => {
  const urls = { appStoreUrl: 'https://apps.apple.com/app/id1', playStoreUrl: 'https://play.google.com/x' };
  assert.deepEqual(resolveInstallAction({ ...base, platform: 'desktop', ...urls, hasDeferredPrompt: true }), { kind: 'pwa-prompt' });
  assert.deepEqual(resolveInstallAction({ ...base, platform: 'desktop', ...urls }), { kind: 'browser-menu-hint' });
});

test('installed (standalone) hides everywhere', () => {
  for (const platform of ['ios', 'android', 'desktop'] as const)
    assert.deepEqual(resolveInstallAction({ ...base, platform, standalone: true }), { kind: 'hidden' });
});
