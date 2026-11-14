/**
 * Firebase Auth authDomain resolution.
 *
 * Safari (ITP / storage partitioning) breaks signInWithPopup/Redirect when the
 * auth handler lives on a different site (<project>.firebaseapp.com) than the
 * page. Firebase Hosting serves /__/auth/handler on every connected custom
 * domain, so on the production host we use the serving host as authDomain.
 */
const SAME_ORIGIN_AUTH_HOSTS = ['tebyan.dr-alfailakawi.com'];

export function resolveAuthDomain(
  configured: string,
  hostname: string | undefined,
  envOverride?: string,
): string {
  const override = (envOverride || '').trim();
  if (override) return override;
  if (hostname && SAME_ORIGIN_AUTH_HOSTS.includes(hostname.toLowerCase())) {
    return hostname.toLowerCase();
  }
  // localhost, preview channels, *.web.app, native shells: keep the default.
  return configured;
}

const FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
  'auth/web-storage-unsupported',
]);

export function shouldFallbackToRedirect(code: unknown): boolean {
  return typeof code === 'string' && FALLBACK_CODES.has(code);
}
