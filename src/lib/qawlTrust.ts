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
    // «20 سبتمبر» — تُحذف السنة إن كانت السنة الحالية، وتُذكر فيما عداها.
    const sameYear = d.getFullYear() === new Date().getFullYear();
    return new Intl.DateTimeFormat('ar-u-nu-latn', sameYear ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** هل اعتُمد الجواب فعلياً (تربوياً وشرعياً ومصادر)؟ نفس منطق شارة الحالة في صفحة السؤال. */
export function isQawlApproved(q: any): boolean {
  const ok = (v?: string) => v === 'published' || v === 'approved' || v === 'verified';
  return ok(q?.reviewStatus?.educational) && ok(q?.reviewStatus?.religious) && ok(q?.reviewStatus?.sources);
}

export type QawlAudience = 'child' | 'adult';

/** الفئة المخاطَبة من الفئات العمرية للسؤال: كل الفئات ١٩+ أو «كبار» تعني راشدين، وغير ذلك أطفال/مراهقون. */
export function getQawlAudience(ageGroups?: string[]): QawlAudience {
  const groups = (ageGroups || []).map((g) => String(g).trim()).filter(Boolean);
  if (groups.length === 0) return 'child';
  const adultWord = /(كبار|راشد|بالغ|شباب|adult|senior|elder|مسن)/i;
  const isAdultGroup = (g: string) => {
    if (adultWord.test(g)) return true;
    const nums = (g.match(/\d+/g) || []).map(Number);
    return nums.length > 0 && Math.min(...nums) >= 19;
  };
  return groups.every(isAdultGroup) ? 'adult' : 'child';
}

export function qawlSayLabel(a: QawlAudience): string {
  return a === 'adult' ? 'يمكنك أن تقول:' : 'قل للطفل:';
}

export function qawlReassurance(a: QawlAudience): string {
  return a === 'adult'
    ? 'هذا السؤال طبيعي جدًا… ويمر به كثير من الناس.'
    : 'هذا السؤال طبيعي جدًا… ويحدث مع كثير من الأطفال.';
}
