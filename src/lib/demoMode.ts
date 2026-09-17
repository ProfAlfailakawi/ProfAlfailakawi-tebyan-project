/**
 * وضع العرض (Demo) — بيئة استعراض معزولة، لا تكتب شيئًا.
 *
 * تبيان تطبيقٌ يتحدث إلى Firestore من المتصفح مباشرة، فلا يوجد «خادم» يمكن عزله
 * كما في بقية البرامج. ولهذا فالضمانة هنا مختلفة، وأبسط وأقوى: **في وضع العرض لا
 * تُنفَّذ أي عملية كتابة إلى Firestore إطلاقًا**. القراءة تعمل، والواجهة كاملة،
 * والزائر يتنقّل ويبحث ويجرّب — ولا يترك أثرًا واحدًا في بيانات حقيقية.
 *
 * وتُفرض هذه الضمانة من نقطة واحدة (`firestoreWrites.ts`) لا بحراسةٍ موزّعة على
 * سبعة وأربعين موضع كتابة: موضعٌ واحد يُنسى يكفي لإفساد الضمانة كلها، ويستحيل
 * التأكد من سبعة وأربعين بالعين. ويحرس `scripts/verify-demo-write-guard.mjs` أن
 * تبقى تلك النقطة هي الوحيدة.
 *
 * الراية في sessionStorage: تبويبٌ واحد، وتزول بإغلاقه. ولا يوجد متغيّر بيئة
 * يشغّلها — الطريق الوحيد إليها ضغطةٌ صريحة من الزائر.
 */

const DEMO_FLAG_KEY = 'tebyan_demo_active_v1';

/** يسمح هذا البناء بعرض الديمو؟ خيار إخراج لا إدخال: الافتراض متاح. */
export const DEMO_AVAILABLE =
  (import.meta as any).env?.VITE_DISABLE_DEMO_MODE !== 'true';

function readFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(DEMO_FLAG_KEY) === 'true';
  } catch {
    // نافذة خاصة أو تخزين محجوب يرمي هنا. الفشل المغلق هو الجواب الآمن.
    return false;
  }
}

/**
 * هل هذا التبويب داخل وضع العرض؟
 *
 * تُقرأ مرة واحدة عند التحميل عن قصد: الدخول والخروج يعيدان تحميل الصفحة، فتبقى
 * الإجابة ثابتة طوال عمر الصفحة ولا يمكن أن تتغيّر في منتصف عملية كتابة.
 */
export const IS_DEMO_MODE = DEMO_AVAILABLE && readFlag();

/** يدخل وضع العرض في هذا التبويب. إعادة التحميل هي ما يجعل التحوّل كاملًا. */
export function enterDemoMode(): boolean {
  if (!DEMO_AVAILABLE || typeof window === 'undefined') return false;
  try {
    window.sessionStorage.setItem(DEMO_FLAG_KEY, 'true');
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/** يخرج من وضع العرض ويعيد التطبيق إلى وضعه الطبيعي. */
export function exitDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.sessionStorage.removeItem(DEMO_FLAG_KEY);
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/** يعيد جلسة العرض من البداية دون مغادرتها. */
export function resetDemoMode(): boolean {
  if (!IS_DEMO_MODE || typeof window === 'undefined') return false;
  try {
    // ما يكتبه الزائر أثناء العرض يعيش في تخزين التبويب وحده؛ مسحه يعيد البداية.
    window.sessionStorage.removeItem('tebyan_current_query');
    window.sessionStorage.removeItem('tebyan_current_has_searched');
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/** يُرمى عند أي محاولة كتابة داخل وضع العرض. لا يُلتقط صامتًا في مسار الحفظ. */
export class DemoWriteBlockedError extends Error {
  readonly code = 'DEMO_WRITE_BLOCKED';
  constructor(operation: string) {
    super(`العملية «${operation}» غير متاحة في البيئة التجريبية — لا يكتب العرض أي بيانات.`);
    this.name = 'DemoWriteBlockedError';
  }
}
