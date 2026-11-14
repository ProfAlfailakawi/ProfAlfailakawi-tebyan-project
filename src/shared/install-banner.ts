/**
 * Single source of truth for the "install the app" entry (header button).
 *
 * Rules:
 *  1. Inside the iOS native shell: never shown.
 *  2. iPhone/iPad in a browser: shown; opens the App Store page when
 *     APP_STORE_URL is set, otherwise the existing "Add to Home Screen" steps.
 *  3. Android browsers: opens the Google Play page when PLAY_STORE_URL is set,
 *     otherwise the existing PWA install prompt.
 *  4. Desktop: unchanged (PWA prompt / browser-menu hint).
 */

/** Public App Store page of this app. Leave empty until the app is live. */
export const APP_STORE_URL = '';
/** Public Google Play page of this app. Leave empty until it has a public link. */
export const PLAY_STORE_URL = '';

export type InstallPlatform = 'native-ios' | 'ios' | 'android' | 'desktop';

export type InstallAction =
  | { kind: 'hidden' }
  | { kind: 'open-store'; url: string }
  | { kind: 'ios-instructions' }
  | { kind: 'pwa-prompt' }
  | { kind: 'browser-menu-hint' };

export interface PlatformEnv {
  userAgent: string;
  maxTouchPoints?: number;
  isNativeIos: boolean;
}

export function detectInstallPlatform(env: PlatformEnv): InstallPlatform {
  if (env.isNativeIos) return 'native-ios';
  const ua = env.userAgent || '';
  // iPadOS 13+ reports a Mac user agent but has a touch screen.
  const iPadOs = /Macintosh/.test(ua) && (env.maxTouchPoints ?? 0) > 1;
  if (/iPad|iPhone|iPod/.test(ua) || iPadOs) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

export interface InstallInput {
  platform: InstallPlatform;
  /** Already installed / running as an installed PWA. */
  standalone: boolean;
  /** A captured `beforeinstallprompt` event is available. */
  hasDeferredPrompt: boolean;
  appStoreUrl?: string;
  playStoreUrl?: string;
}

const isHttpUrl = (u?: string): u is string => !!u && /^https:\/\//i.test(u.trim());

/** Whether the install entry is visible at all. */
export function shouldShowInstall(i: Pick<InstallInput, 'platform' | 'standalone'>): boolean {
  return i.platform !== 'native-ios' && !i.standalone;
}

/** What a tap on the install entry does. */
export function resolveInstallAction(i: InstallInput): InstallAction {
  if (!shouldShowInstall(i)) return { kind: 'hidden' };
  if (i.platform === 'ios') {
    return isHttpUrl(i.appStoreUrl)
      ? { kind: 'open-store', url: i.appStoreUrl.trim() }
      : { kind: 'ios-instructions' };
  }
  if (i.platform === 'android' && isHttpUrl(i.playStoreUrl)) {
    return { kind: 'open-store', url: i.playStoreUrl.trim() };
  }
  return i.hasDeferredPrompt ? { kind: 'pwa-prompt' } : { kind: 'browser-menu-hint' };
}
