/**
 * تخزين وضع العرض — طبقة معزولة فوق localStorage، لا تلمس تخزين المتصفح الحقيقي.
 *
 * شاشات كثيرة في تبيان (الشعار والمستوى، سجل البحث، «نكمل من حيث وقفنا»، باب
 * باجر، العُقد المحفوظة، كبسولات الزمن …) تقرأ من localStorage مباشرة. في متصفحٍ
 * جديد تبدو كلها فارغة. وكتابة بيانات العرض في localStorage الحقيقي ممنوعة: فصاحب
 * المنتج يعرض من متصفحه هو، وسيختلط النموذجي بحسابه.
 *
 * فالحل: في وضع العرض فقط، تُحوَّل قراءة localStorage وكتابته إلى مساحة في
 * sessionStorage (تبويبٌ واحد، تزول بإغلاقه) مبذورةٍ ببيانات الأسرة النموذجية نفسها
 * (سعود ونورة). ما يكتبه الزائر يعيش في المساحة المعزولة وحدها، ولا يقرأ العرض
 * شيئًا من بيانات المتصفح الحقيقية. خارج العرض لا يتغيّر أي شيء: هذا الملف لا يفعل
 * شيئًا ما لم يكن IS_DEMO_MODE صحيحًا.
 */
import { IS_DEMO_MODE } from './demoMode';

const NS = 'tebyan_demo_ls_v1:';
const REMOVED = '\u0000removed';

const DAY = 24 * 60 * 60 * 1000;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

/** البذور: تُبنى عند أول قراءة، وتاريخها نسبي إلى لحظة العرض. */
function buildSeeds(): Record<string, string> {
  const j = (v: unknown) => JSON.stringify(v);
  const now = Date.now();
  return {
    // الشارة والمستوى (نقاط الخبرة) — «متيقظ/مستنير» بدل صفر.
    edu_ai_xp: '340',
    tebyan_sage_progress: j({
      points: 340,
      level: 'enlightened',
      badges: ['wisdom', 'dialogue'],
      stats: { wisdom: 4, dialogue: 3, patience: 1 },
    }),
    // سجل البحث الذي تعرضه بوابة البحث (آخر ٥).
    tebyan_search_history: j([
      'كيف أقلل وقت الشاشة لسعود دون صراخ؟',
      'تنظيم وقت الدراسة لنورة',
      'العناد عند الأطفال',
      'التعزيز الإيجابي',
      'الخجل في المدرسة',
    ]),
    tebyan_usage_stats: j({ ask: 7, qawlfasl: 6, oracle: 4, concepts: 3, roadmap: 2, analytics: 2, mylibrary: 2 }),
    // «أهلاً بعودتك — وقفنا عند»
    tebyan_memory: j({
      query: 'كيف أقلل وقت الشاشة لسعود دون صراخ كل مساء؟',
      path: 'oracle',
      timestamp: ago(26 * 60 * 1000),
      followedUp: false,
      uid: null,
    }),
    // «باب باجر»
    tebyan_tomorrow_room: j({ query: 'خطة هادئة لوقت الدراسة مع نورة بعد العصر', at: ago(3 * 60 * 60 * 1000) }),
    tebyan_style_confirmed: 'true',
    // خريطة المعرفة: عُقد محفوظة.
    tebyan_saved_nodes: j([
      { id: 'node-demo-1', title: 'الإنذار المسبق قبل إغلاق الجهاز', type: 'idea', createdAt: ago(2 * DAY) },
      { id: 'node-demo-2', title: 'جدول الدراسة المشترك مع نورة', type: 'idea', createdAt: ago(6 * DAY) },
      { id: 'node-demo-3', title: 'بدائل ممتعة للشاشة مساءً', type: 'idea', createdAt: ago(11 * DAY) },
    ]),
    // حفظ سريع من إجابات البوابة وقول فصل.
    tebyan_quick_saves: j([
      { id: 'quick-demo-1', type: 'قول فصل', title: 'طفلي مدمن على الألعاب الإلكترونية ويرفض ترك الهاتف.', content: 'طفلي مدمن على الألعاب الإلكترونية ويرفض ترك الهاتف.', createdAt: ago(3 * DAY) },
      { id: 'quick-demo-2', type: 'insight', title: 'كيف أنظم وقت الدراسة واللعب لطفلي؟', content: 'كيف أنظم وقت الدراسة واللعب لطفلي؟', createdAt: ago(9 * DAY) },
      { id: 'quick-demo-3', type: 'insight', title: 'قيمة المال والادخار لدى الأطفال', content: 'قيمة المال والادخار لدى الأطفال', createdAt: ago(16 * DAY) },
    ]),
    // كبسولات الزمن (اللوح الشخصي).
    tebyan_time_capsules: j([
      { text: 'بعد شهرين: هل التزم سعود بإغلاق الجهاز من أول نداء؟', sealedAt: ago(20 * DAY), dueAt: ago(-40 * DAY) },
      { text: 'نهاية الفصل: مراجعة جدول الدراسة مع نورة.', sealedAt: ago(8 * DAY), dueAt: ago(-75 * DAY) },
    ]),
    // ذاكرة الفهم (شجرة المعرفة في اللوح الشخصي).
    tebyan_thought_memory: j([
      {
        id: 'tm-demo-1', originalText: 'ابني لا يترك الألعاب الإلكترونية', normalizedMeaning: 'تعلّق الطفل بالألعاب الإلكترونية',
        mainTopic: 'الألعاب الإلكترونية', subTopics: ['حدود الوقت', 'الإنذار المسبق'], riskLevel: 'medium', ageMentioned: '٧ سنوات',
        emotionalTone: 'قلق', generatedText: 'ابدئي بالإنذار المسبق وثبّتي القاعدة لا المزاج.', timestamp: now - 12 * DAY, usageCount: 3, classification: 'original',
      },
      {
        id: 'tm-demo-2', originalText: 'كيف أقلل الشاشة دون صراخ', normalizedMeaning: 'تقليل الشاشة بهدوء',
        mainTopic: 'الألعاب الإلكترونية', subTopics: ['بدائل ممتعة'], riskLevel: 'low', ageMentioned: '٧ سنوات',
        emotionalTone: 'متعب', generatedText: 'جهّزي نشاطًا بديلًا يبدأ لحظة إغلاق الجهاز.', timestamp: now - 5 * DAY, usageCount: 2, relatedToId: 'tm-demo-1', classification: 'related_variant',
      },
      {
        id: 'tm-demo-3', originalText: 'ابنتي تحتاج تنظيم وقت الدراسة', normalizedMeaning: 'تنظيم وقت الدراسة',
        mainTopic: 'وقت الدراسة', subTopics: ['جدول أسبوعي'], riskLevel: 'low', ageMentioned: '١٠ سنوات',
        emotionalTone: 'مهتم', generatedText: 'أشركي نورة في وضع الجدول لتشعر بالمسؤولية.', timestamp: now - 2 * DAY, usageCount: 1, classification: 'new_case',
      },
    ]),
    // تحليل «المجرّة المعرفية» في اللوح الشخصي.
    tebyan_galaxy_cache: j({
      summary: 'اهتمامك يدور حول محورين: تنظيم الشاشات لسعود، وتنظيم وقت الدراسة لنورة. أسئلتك تنتقل من «كيف أمنع» إلى «كيف أبني عادة»، وهذا نضج تربوي واضح.',
      maturityLabel: 'مستنير',
      scores: [72, 64, 81],
      themes: ['الألعاب الإلكترونية', 'وقت الدراسة', 'التعزيز الإيجابي', 'الحوار', 'العناد'],
      commitments: ['إنذار مسبق بعشر دقائق قبل إغلاق الجهاز كل مساء', 'جلسة جدول أسبوعية مع نورة كل جمعة'],
      historyCount: 8,
    }),
    // مهمة اليوم (تُثبَّت على اليوم الحالي كي لا تنتظر خدمة الذكاء الاصطناعي).
    daily_mission_cache: j({
      title: 'لحظة امتنان قبل النوم',
      task: 'اسأل كل طفل عن أجمل لحظة في يومه، واستمع دون تعليق لمدة دقيقتين.',
      xp_reward: 50,
    }),
    daily_mission_cache_date: new Date().toDateString(),
  };
}

let seeds: Record<string, string> | null = null;
const seedFor = (key: string): string | null => {
  seeds ??= buildSeeds();
  return Object.prototype.hasOwnProperty.call(seeds, key) ? seeds[key] : null;
};

function install(): void {
  if (!IS_DEMO_MODE || typeof window === 'undefined') return;
  let real: Storage;
  try {
    real = window.localStorage;
  } catch {
    return;
  }
  const proto = Storage.prototype;
  const origGet = proto.getItem;
  const origSet = proto.setItem;
  const origRemove = proto.removeItem;
  const session = window.sessionStorage;
  const isLocal = (s: Storage) => s === real;

  proto.getItem = function (this: Storage, key: string) {
    if (!isLocal(this)) return origGet.call(this, key);
    const own = origGet.call(session, NS + key);
    if (own === REMOVED) return null;
    return own !== null ? own : seedFor(String(key));
  };
  proto.setItem = function (this: Storage, key: string, value: string) {
    if (!isLocal(this)) return origSet.call(this, key, value);
    origSet.call(session, NS + key, String(value));
  };
  proto.removeItem = function (this: Storage, key: string) {
    if (!isLocal(this)) return origRemove.call(this, key);
    origSet.call(session, NS + key, REMOVED);
  };
}

install();
