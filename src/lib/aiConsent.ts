/**
 * موافقة المستخدم على مشاركة النص مع خدمة الذكاء الاصطناعي (Google Gemini API).
 *
 * Apple 5.1.1(i) / 5.1.2(i): لا يُرسَل أي نص إلى /api/ai/* قبل موافقة صريحة داخل التطبيق.
 * البوابة الوحيدة لكل نداءات الذكاء الاصطناعي هي `ensureAiConsent` وتستدعيها
 * `proxyGenerateContent` و`proxyGenerateAudio` في src/lib/aiProxy.ts قبل أي fetch.
 */

export const AI_CONSENT_KEY = 'tebyan_ai_consent_v1';
export const AI_CONSENT_DECLINED_SESSION_KEY = 'tebyan_ai_consent_declined';
export const AI_CONSENT_REQUEST_EVENT = 'tebyan:ai-consent-request';
export const AI_CONSENT_CHANGED_EVENT = 'tebyan:ai-consent-changed';
export const AI_CONSENT_DECLINED_EVENT = 'tebyan:ai-consent-declined';

export class AiConsentRequiredError extends Error {
  code = 'AI_CONSENT_REQUIRED';
  constructor() {
    super('تحتاج إجابات الذكاء الاصطناعي إلى موافقتك على مشاركة نص سؤالك مع خدمة Google Gemini. ما زالت المكتبة وبقية الأقسام متاحة لك.');
    this.name = 'AiConsentRequiredError';
  }
}

export function isAiConsentError(e: unknown): boolean {
  return !!e && (e as any).code === 'AI_CONSENT_REQUIRED';
}

function safeGet(store: 'local' | 'session', key: string): string | null {
  try {
    const s = store === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
    return s ? s.getItem(key) : null;
  } catch { return null; }
}
function safeSet(store: 'local' | 'session', key: string, value: string | null) {
  try {
    const s = store === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
    if (!s) return;
    if (value === null) s.removeItem(key); else s.setItem(key, value);
  } catch { /* تخزين محجوب: تبقى الموافقة غير محفوظة فيُسأل المستخدم من جديد */ }
}

function emit(name: string, detail?: unknown) {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    }
  } catch { /* لا شيء */ }
}

export function hasAiConsent(): boolean {
  return safeGet('local', AI_CONSENT_KEY) === 'granted';
}

export function grantAiConsent() {
  safeSet('local', AI_CONSENT_KEY, 'granted');
  safeSet('session', AI_CONSENT_DECLINED_SESSION_KEY, null);
  emit(AI_CONSENT_CHANGED_EVENT, { granted: true });
}

/** سحب الموافقة: لا يُرسَل بعدها شيء حتى يوافق المستخدم من جديد. */
export function revokeAiConsent() {
  safeSet('local', AI_CONSENT_KEY, null);
  emit(AI_CONSENT_CHANGED_EVENT, { granted: false });
}

export function declineAiConsent() {
  safeSet('local', AI_CONSENT_KEY, null);
  safeSet('session', AI_CONSENT_DECLINED_SESSION_KEY, '1');
  emit(AI_CONSENT_CHANGED_EVENT, { granted: false });
  emit(AI_CONSENT_DECLINED_EVENT);
}

type Resolver = (granted: boolean) => void;
let pending: Promise<boolean> | null = null;
let pendingResolve: Resolver | null = null;
let hostMounted = false;

/** يستدعيها مكوّن الحوار عند تركيبه؛ دون حوار مركّب لا تُعدّ أي موافقة ممكنة. */
export function setAiConsentHostMounted(mounted: boolean) {
  hostMounted = mounted;
  if (!mounted && pendingResolve) resolveAiConsentRequest(false);
}

/** يستدعيها الحوار عند ضغط أحد الزرين. */
export function resolveAiConsentRequest(granted: boolean) {
  if (granted) grantAiConsent(); else declineAiConsent();
  const r = pendingResolve;
  pending = null;
  pendingResolve = null;
  r?.(granted);
}

/** يفتح الحوار يدويًا (من الإعدادات أو من ملاحظة الرفض). */
export function openAiConsentDialog(): Promise<boolean> {
  if (hasAiConsent()) return Promise.resolve(true);
  if (!hostMounted) return Promise.resolve(false);
  if (pending) return pending;
  pending = new Promise<boolean>((resolve) => { pendingResolve = resolve; });
  emit(AI_CONSENT_REQUEST_EVENT);
  return pending;
}

export type AiConsentMode = 'prompt' | 'silent';

/**
 * تُستدعى قبل أي إرسال. تعيد true فقط بعد موافقة محفوظة.
 * - 'prompt': يظهر الحوار إن لم توجد موافقة (إلا إن رفض المستخدم في هذه الجلسة).
 * - 'silent': للنداءات الخلفية (اقتراح الصياغة أثناء الكتابة): لا حوار ولا إرسال.
 */
export async function ensureAiConsent(mode: AiConsentMode = 'prompt'): Promise<boolean> {
  if (hasAiConsent()) return true;
  if (mode === 'silent') return false;
  if (safeGet('session', AI_CONSENT_DECLINED_SESSION_KEY) === '1') {
    emit(AI_CONSENT_DECLINED_EVENT);
    return false;
  }
  return openAiConsentDialog();
}
