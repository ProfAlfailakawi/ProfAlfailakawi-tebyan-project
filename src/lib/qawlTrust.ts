/**
 * «القول الفصل» — طبقة الثقة: المصادر، المراجِع، وتاريخ آخر مراجعة.
 *
 * الحقول الاختيارية في البيانات (qawl_fasl_full_v1.json / Firestore):
 *   sources?:    (string | { title: string; url?: string })[]
 *   reviewedBy?: string | string[]
 *   reviewedAt?: string (ISO) | number (ms)
 * عند غيابها: المراجِع الافتراضي هو صاحب المنصة، وتاريخ المراجعة = updatedAt،
 * والمصادر تُستخرج فقط من تخريج religiousReference (سورة ورقم آية، أو «رواه …») إن وُجد — وإلا لا
 * يُعرض قسم المصادر إطلاقاً.
 *
 * منطق مطابق (نسخة JS) موجود في scripts/generate-qawl-pages.mjs للصفحات الثابتة.
 */
export const DEFAULT_REVIEWER = 'د. أحمد الفيلكاوي';

export interface TrustSource { title: string; url?: string }
export interface AnswerTrust {
  sources: TrustSource[];
  reviewers: string[];
  reviewedAt: Date | null;
}

const clean = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** يستخرج إحالة قصيرة وموثّقة: آية بسورتها ورقمها، أو تخريج حديث. */
export function extractReligiousCitation(ref?: string): string | null {
  const text = clean(ref);
  if (!text) return null;
  const quran = text.match(/سورة\s+([\u0621-\u064A]+(?:\s+[\u0621-\u064A]+)?)\s*(?:،\s*الآي(?:ة|ات)\s*|:\s*)([\d٠-٩]+(?:\s*[-–]\s*[\d٠-٩]+)?)/);
  if (quran) return `القرآن الكريم — سورة ${quran[1]}، الآية ${quran[2].replace(/\s+/g, '')}`;
  const hadith = text.match(/((?:رواه|صحيح)\s+[^()\-–.،"']+)/);
  if (hadith) return `الحديث الشريف — ${hadith[1].trim()}`;
  return null;
}

export function getAnswerTrust(q: any): AnswerTrust {
  const sources: TrustSource[] = [];
  if (Array.isArray(q?.sources)) {
    for (const s of q.sources) {
      if (typeof s === 'string' && clean(s)) sources.push({ title: clean(s) });
      else if (s && typeof s === 'object' && clean(s.title)) {
        const url = typeof s.url === 'string' && /^https?:\/\//.test(s.url) ? s.url : undefined;
        sources.push({ title: clean(s.title), url });
      }
    }
  }
  if (sources.length === 0) {
    const cite = extractReligiousCitation(q?.religiousReference);
    if (cite) sources.push({ title: cite });
  }

  const rb = q?.reviewedBy;
  const reviewers = (Array.isArray(rb) ? rb : rb ? [rb] : []).map(clean).filter(Boolean);
  if (reviewers.length === 0) reviewers.push(DEFAULT_REVIEWER);

  const raw = q?.reviewedAt ?? q?.updatedAt;
  const d = raw != null && raw !== '' ? new Date(typeof raw === 'object' && typeof raw.toMillis === 'function' ? raw.toMillis() : raw) : null;
  return { sources, reviewers, reviewedAt: d && !Number.isNaN(d.getTime()) ? d : null };
}

export function formatArabicDate(d: Date): string {
  try {
    return new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}
