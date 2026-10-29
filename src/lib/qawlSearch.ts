/**
 * «القول الفصل» — بحث المكتبة داخل المتصفح.
 *
 * كان البحث يطابق النص حرفياً (`includes`) على ما في Firestore وحده، فتفشل
 * مطابقات واضحة: «اين الله» لا تجد «أين الله؟»، و«اساءة» لا تجد «إساءة»، والأسئلة
 * المدمجة في التطبيق لا تُبحث أصلاً. هنا مطابقة عربية متسامحة على المكتبة المعروضة
 * نفسها (المدمجة + المنشورة)، تُجرَّب قبل الاستعلام البعيد.
 */
import { normalizeArabic } from '../services/instantSearch';

/** نص موحّد للمطابقة: بلا تشكيل ولا تطويل، همزات موحّدة، ة→ه، ى→ي، وبلا علامات ترقيم. */
export function normalizeForQawlMatch(text: unknown): string {
  return normalizeArabic(String(text ?? ''))
    .replace(/[؟،؛«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface MatchableQuestion {
  question?: string;
  title?: string;
  keywords?: string[];
  category?: string;
  mainCategory?: string;
}

/**
 * أقرب سؤال في المكتبة لنص البحث، بنفس حقول البحث القديم (نص السؤال، الكلمات
 * المفتاحية، الباب) لكن بترتيب: نص السؤال أولاً، ثم الكلمات المفتاحية، ثم الباب.
 */
export function findLocalQawlMatch<T extends MatchableQuestion>(questions: readonly T[], term: string): T | null {
  const needle = normalizeForQawlMatch(term);
  if (needle.length < 3) return null;
  const has = (value: unknown) => normalizeForQawlMatch(value).includes(needle);
  return (
    questions.find((q) => has(q.question || q.title)) ||
    questions.find((q) => Array.isArray(q.keywords) && q.keywords.some(has)) ||
    questions.find((q) => has(q.category) || has(q.mainCategory)) ||
    null
  );
}

/**
 * هل القيمة معرّف سؤال لا نص بحث؟ روابط الصفحات الثابتة ترسل `q=q-5`، والأسئلة
 * المدمجة معرّفاتها q1…q14، وما يُنشأ في Firestore معرّفه ٢٠ حرفاً لاتينياً.
 */
export function isQawlQuestionId(value: string | null | undefined, knownIds: Iterable<string> = []): boolean {
  const v = (value || '').trim();
  if (!v) return false;
  if (/^q-?\d+$/i.test(v) || /^[A-Za-z0-9]{20}$/.test(v)) return true;
  for (const id of knownIds) if (id === v) return true;
  return false;
}
