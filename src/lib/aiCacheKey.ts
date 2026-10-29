/**
 * مفتاح ذاكرة ردود الذكاء الاصطناعي داخل المتصفح (services/gemini.ts).
 *
 * كان المفتاح يأخذ أول ١٠٠ حرف فقط من نص الطلب ومن التعليمات، وكثير من الأدوات
 * تبدأ تعليماتها بمقدمة ثابتة أطول من ذلك ثم تضع موضوع المستخدم بعدها (هدف خارطة
 * الطريق، موضوع المجلس، المحاكاة، الرأي المخالف…). فكان الطلب الثاني في الجلسة
 * يأخذ جواب الطلب الأول عن موضوعٍ آخر.
 *
 * المفتاح الآن هو الطلب كاملاً: النموذج والمحتوى والتعليمات وشكل الرد المطلوب.
 * طلبان متطابقان فقط يشتركان في الجواب المحفوظ.
 */
export function buildAiCacheKey(params: any): string {
  const config = params?.config || {};
  return JSON.stringify([
    params?.model || 'gemini',
    params?.contents ?? null,
    config.systemInstruction ?? '',
    config.responseMimeType ?? '',
    config.responseSchema ?? null,
    config.temperature ?? null,
  ]);
}

/** حدّ أعلى لعدد الردود المحفوظة في الجلسة، حتى لا تكبر الذاكرة بلا نهاية. */
export const AI_CACHE_MAX_ENTRIES = 100;
