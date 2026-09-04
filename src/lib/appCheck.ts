/**
 * App Check header helper for calls to the Tebyan backend proxy.
 *
 * The /api/ai/* endpoints spend the owner's Gemini key. The backend verifies a
 * Firebase App Check token (see functions/index.js) so that only the real app
 * — not a script or a third-party page — can reach them. This helper produces
 * that header.
 *
 * It never throws and never blocks the request: when App Check is not
 * configured (no VITE_RECAPTCHA_SITE_KEY at build time) or the token cannot be
 * minted, it returns an empty object and the backend decides what to do.
 */
export async function getAppCheckHeaders(): Promise<Record<string, string>> {
  try {
    const [{ appCheck }, appCheckApi] = await Promise.all([
      import('./firebase'),
      import('firebase/app-check'),
    ]);
    if (!appCheck) return {};
    const result = await appCheckApi.getToken(appCheck, /* forceRefresh */ false);
    return result?.token ? { 'X-Firebase-AppCheck': result.token } : {};
  } catch (err) {
    console.warn('[AppCheck] token unavailable:', err);
    return {};
  }
}
