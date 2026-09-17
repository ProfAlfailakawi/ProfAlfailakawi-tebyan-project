/**
 * مكتبة العرض — محتوى تبيان الحقيقي، مُهيّأ للاستعراض بلا قاعدة بيانات.
 *
 * المستودع يحمل أصلًا سبعة وأربعين سؤالًا منشورًا مكتوبًا بعناية في
 * `qawl_fasl_full_v1.json` (يُخدَم من الجذر، ويستعمله الخادم أصلًا كبديل عند
 * انقطاع الاتصال). وهذا هو المحتوى الذي يجب أن يراه من يُعرض عليه المنتج: محتوى
 * المنتج نفسه، لا ثلاثة نماذج مختصرة.
 *
 * ولهذا الملف عملان:
 *
 *   ١. **الترجمة.** شكل الملف الخام يختلف عن `QawlFaslQuestion` الذي تقرأه
 *      الشاشات: `title` مقابل `question`، و`sensitivity` مقابل `riskLevel`،
 *      و`tags` مقابل `keywords`، ولا حقول `category`/`categorySlug`/`reviewStatus`
 *      فيه أصلًا. فالترجمة هنا مرّة واحدة بدل أن تتناثر في الشاشات.
 *
 *   ٢. **التصنيف.** كل الأسئلة الخام مُعلَّمة `categoryId: 'general'`، فلو عُرضت
 *      كما هي لظهرت تسع فئات في الواجهة، ثمانٍ منها فارغة وواحدة فيها كل شيء —
 *      وهو أسوأ من عدم وجود تصنيف. فتُشتقّ الفئة من العنوان والوسوم بمطابقة
 *      كلمات مفتاحية، ويقع ما لا يُطابق في «السلوك والتربية» وهي الفئة الأوسع.
 *
 * لا شيء هنا يُكتب إلى أي مكان: مكتبة العرض للقراءة فقط.
 */
import type { QawlFaslQuestion } from '../components/tabs/QawlFasl/types';
import { CATEGORIES } from '../components/tabs/QawlFasl/types';

/** الشكل الخام كما هو في qawl_fasl_full_v1.json. */
interface RawQuestion {
  id: string;
  title: string;
  categoryId?: string;
  ageGroups?: string[];
  sensitivity?: string;
  tags?: string[];
  status?: string;
  createdAt?: number;
  updatedAt?: number;
  quickSummary?: string;
  quickAnswer?: { sayThis?: string; dontSayThis?: string; doThisNow?: string };
  commonMistake?: string;
  educationalView?: string;
  suggestedAnswer?: string;
  byAgeVersions?: { age: string; text: string }[];
  practicalSteps?: string[];
  exercises?: string[];
  whenToWorry?: string;
  religiousReference?: string;
  scientificStat?: string;
  closingThought?: string;
  resources?: { type: string; title: string; url?: string }[];
}

/* مطابقة كلمات مفتاحية بسيطة ومقروءة — الترتيب مقصود: الأخصّ أولًا، فلا يبتلع
   تصنيفٌ عام سؤالًا ينتمي إلى فئة أدقّ. */
const CATEGORY_RULES: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['prevention', ['تحرش', 'حماية', 'غريب', 'خطر', 'جسد', 'أمان', 'سلامة', 'اختطاف', 'إساءة']],
  ['digital', ['إنترنت', 'الشاشة', 'شاشات', 'ألعاب', 'لعبة', 'يوتيوب', 'تيك توك', 'جوال', 'هاتف', 'رقمي', 'تطبيق']],
  ['faith-religious-questions', ['الله', 'الموت', 'الجنة', 'النار', 'الدين', 'الصلاة', 'القرآن', 'الدعاء', 'الروح', 'الغيب', 'الشيطان', 'الملائكة']],
  ['money', ['المال', 'مصروف', 'ادخار', 'شراء', 'يشتري', 'ثمن', 'فلوس', 'اقتصاد']],
  ['education', ['المدرسة', 'الدراسة', 'الواجب', 'الاختبار', 'المعلم', 'درجات', 'تعلم', 'قراءة', 'حفظ']],
  ['emotions', ['غضب', 'خوف', 'قلق', 'حزن', 'بكاء', 'مشاعر', 'غيرة', 'إحباط', 'توتر']],
  ['personality', ['ثقة', 'خجل', 'شخصية', 'استقلال', 'قرار', 'رأي', 'جرأة']],
  ['future', ['المستقبل', 'الذكاء الاصطناعي', 'مهارات', 'مهنة', 'وظيفة', 'تخصص']],
  ['behavior', ['عناد', 'كذب', 'سلوك', 'عادة', 'انضباط', 'شجار', 'ضرب', 'طاعة', 'احترام']],
];

/** الفئة الأوسع، وهي ما يقع فيه ما لم يُطابق قاعدةً أدقّ. */
const FALLBACK_CATEGORY = 'behavior';

function categoryIdFor(raw: RawQuestion): string {
  const haystack = `${raw.title || ''} ${(raw.tags || []).join(' ')} ${raw.quickSummary || ''}`;
  for (const [id, keywords] of CATEGORY_RULES) {
    if (keywords.some(word => haystack.includes(word))) return id;
  }
  return FALLBACK_CATEGORY;
}

function riskFor(sensitivity?: string): QawlFaslQuestion['riskLevel'] {
  return sensitivity === 'high' ? 'high' : sensitivity === 'low' ? 'low' : 'medium';
}

function adapt(raw: RawQuestion): QawlFaslQuestion {
  const categoryId = categoryIdFor(raw);
  const category = CATEGORIES.find(c => c.id === categoryId);
  return {
    id: raw.id,
    question: raw.title,
    title: raw.title,
    category: category?.title || 'السلوك والتربية والتعامل',
    categoryId,
    categorySlug: categoryId,
    mainCategory: category?.title,
    keywords: raw.tags || [],
    ageGroups: raw.ageGroups || ['4-6', '7-9'],
    riskLevel: riskFor(raw.sensitivity),
    status: 'published',
    createdAt: raw.createdAt || Date.now(),
    updatedAt: raw.updatedAt || Date.now(),
    reviewStatus: {
      // المحتوى في هذا الملف مُراجَع فعلًا وهذا ما تعرضه الشاشة.
      educational: 'approved',
      religious: 'approved',
      sources: 'approved',
    },
    quickSummary: raw.quickSummary || '',
    quickAnswer: {
      sayThis: raw.quickAnswer?.sayThis || '',
      dontSayThis: raw.quickAnswer?.dontSayThis || '',
      doThisNow: raw.quickAnswer?.doThisNow || '',
    },
    commonMistake: raw.commonMistake || '',
    educationalView: raw.educationalView || '',
    suggestedAnswer: raw.suggestedAnswer || '',
    byAgeVersions: raw.byAgeVersions || [],
    practicalSteps: raw.practicalSteps || [],
    exercises: raw.exercises || [],
    whenToWorry: raw.whenToWorry || '',
    religiousReference: raw.religiousReference,
    scientificStat: raw.scientificStat,
    closingThought: raw.closingThought,
    resources: (raw.resources || []) as QawlFaslQuestion['resources'],
  } as QawlFaslQuestion;
}

let cached: QawlFaslQuestion[] | null = null;

/**
 * يحمّل مكتبة العرض من الملف المخدوم على الجذر.
 *
 * الملف نفسه الذي يستعمله الخادم كبديل عند انقطاع الاتصال، فلا نسخة ثانية تتعتّق.
 * وإن تعذّر جلبه يرجع الاستدعاء فارغًا، ويُبقي المستدعي على بياناته الحالية بدل
 * أن تُفرَّغ الشاشة.
 */
export async function loadDemoLibrary(): Promise<QawlFaslQuestion[]> {
  if (cached) return cached;
  try {
    const response = await fetch('/qawl_fasl_full_v1.json', { cache: 'force-cache' });
    if (!response.ok) return [];
    const raw = (await response.json()) as RawQuestion[];
    if (!Array.isArray(raw)) return [];
    cached = raw.filter(item => item && item.id && item.title).map(adapt);
    return cached;
  } catch {
    return [];
  }
}

/** التوزيع على الفئات — يُستعمل في الاختبار لإثبات أن التصنيف لم ينهَر إلى فئة واحدة. */
export function categoryBreakdown(questions: QawlFaslQuestion[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const q of questions) out[q.categoryId || 'unknown'] = (out[q.categoryId || 'unknown'] || 0) + 1;
  return out;
}

export { adapt as adaptDemoQuestion };
export type { RawQuestion as DemoRawQuestion };
