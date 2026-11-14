/**
 * True only inside the iOS app (Capacitor hosted mode), never on the website.
 * App Store guideline 4.8: the app keeps just the site's own email + password
 * sign-in, so third-party (Google) sign-in buttons are hidden there.
 */
export function isAppleNativeShell(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  return !!(cap?.isNativePlatform?.() && cap?.getPlatform?.() === 'ios');
}
