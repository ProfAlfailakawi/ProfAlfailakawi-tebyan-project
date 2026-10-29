/**
 * ما يحفظه تبيان من أسئلة المستخدم وتحليلها على هذا الجهاز، ومحوه من مكان واحد.
 *
 * كان زرّا الخروج يمحوان قوائم مختلفة (زر لوحة «حسابي» لا يمحو شيئاً)، وزر «محو
 * الذاكرة المعرفية» يترك «الذاكرة المعرفية» نفسها (tebyan_thought_memory) وأسئلة
 * أخرى محفوظة، فيرى الحساب التالي على الجهاز نفسه أسئلة من قبله، وتُرسل إلى
 * الذكاء الاصطناعي كسياق.
 */

/** سجل الأسئلة وتحليلها: ما يَعِد زر «محو الذاكرة المعرفية» بمحوه. */
export const QUESTION_HISTORY_KEYS = [
  'tebyan_memory',
  'tebyan_search_history',
  'tebyan_galaxy_cache',
  'tebyan_thought_memory',
  'tebyan_cognitive_memory',
  'tebyan_last_session',
  'tebyan_last_query',
  'tebyan_tomorrow_room',
] as const;

/** كل سؤال أُرسل يُعلَّم بمفتاح يحمل نصه. */
export const QUESTION_MARK_PREFIX = 'tebyan_cache_v1_';

/** ما كان زر الخروج في قائمة المستخدم يمحوه أصلاً إضافة إلى السجل. */
const SIGN_OUT_EXTRA_KEYS = [
  'tebyan_sage_progress',
  'tebyan_usage_stats',
  'tebyan_analytics_logs',
  'tebyan_custom_avatar',
  'tebyan_style_confirmed',
] as const;

type KeyStore = Pick<Storage, 'removeItem' | 'key' | 'length'>;

function safeStorage(): KeyStore | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** يمحو سجل الأسئلة وتحليلها من هذا الجهاز. */
export function clearQuestionHistory(storage: KeyStore | null = safeStorage()): void {
  if (!storage) return;
  try {
    QUESTION_HISTORY_KEYS.forEach((k) => storage.removeItem(k));
    const marks: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(QUESTION_MARK_PREFIX)) marks.push(k);
    }
    marks.forEach((k) => storage.removeItem(k));
  } catch {
    /* تخزين محجوب: لا شيء محفوظ أصلاً */
  }
}

/** عند تسجيل الخروج من أي زر: سجل الأسئلة وبيانات الجلسة الشخصية. */
export function clearLocalUserDataOnSignOut(storage: KeyStore | null = safeStorage()): void {
  if (!storage) return;
  clearQuestionHistory(storage);
  try {
    SIGN_OUT_EXTRA_KEYS.forEach((k) => storage.removeItem(k));
  } catch {
    /* تخزين محجوب */
  }
}
