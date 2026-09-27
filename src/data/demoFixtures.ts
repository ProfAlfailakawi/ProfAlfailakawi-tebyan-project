/**
 * بيانات العرض (Demo) — زائرٌ واحد متّسق عبر كل الشاشات.
 *
 * الشخصية: وليّة أمر من الكويت (أم سعود) لطفلين: سعود (٧ سنوات) ونورة (١٠ سنوات).
 * القصة واحدة في كل شاشة: تعلّق سعود بالألعاب الإلكترونية ومقاومته لإغلاق الجهاز،
 * وتنظيم وقت الدراسة لنورة. ولهذا تتكرر المواضيع نفسها في المكتبة وخريطة المعرفة
 * والرادار الاستباقي ومحفظة الولاء — كما تتكرر في حياة مستخدم حقيقي.
 *
 * كل ما هنا للقراءة فقط، ولا يُقرأ إلا حين `IS_DEMO_MODE`؛ لا يُكتب إلى
 * localStorage ولا إلى Firestore، فلا يتسرّب إلى حسابٍ حقيقي ولا يختلط بجلسةٍ حقيقية
 * في المتصفح نفسه.
 */

/** «قصر الذاكرة» (ركني ← المكتبة): محفوظات من أبواب مختلفة. */
export const DEMO_SAVED_LIBRARY: any[] = [
  {
    id: 'demo-lib-q12',
    type: 'qawlfasl',
    tabId: 'qawlfasl',
    question: 'طفلي مدمن على الألعاب الإلكترونية ويرفض ترك الهاتف.',
    quickSummary:
      'التعامل مع تعلق الطفل بالألعاب يتطلب توازناً بين وضع حدود حازمة وبناء علاقة عاطفية قوية، مع بدائل ممتعة تملأ الوقت.',
  },
  {
    id: 'demo-lib-q17',
    type: 'qawlfasl',
    tabId: 'qawlfasl',
    question: 'كيف أنظم وقت الدراسة واللعب لطفلي في المرحلة الابتدائية؟',
    quickSummary:
      'تنظيم الوقت يعتمد على التوازن بين الانضباط والمرونة، مع إشراك الطفل في وضع الجدول لتعزيز شعوره بالمسؤولية.',
  },
  {
    id: 'demo-lib-oracle-1',
    type: 'oracle',
    tabId: 'oracle',
    question: 'كيف أقلل وقت الشاشة لسعود دون صراخ كل مساء؟',
    content:
      '**ابدئي بالإنذار المسبق:** «بعد عشر دقائق نُغلق الجهاز» ثم «بعد دقيقتين». الانتقال المفاجئ هو ما يشعل المواجهة.\n\n**اجعلي البديل جاهزاً:** نشاط مشترك قصير (لعبة ورق، مساعدة في تحضير العشاء) يبدأ لحظة إغلاق الجهاز.\n\n**ثبّتي القاعدة لا المزاج:** الوقت نفسه كل يوم، حتى في الديوانية وعند الجدّة.',
  },
  {
    id: 'demo-lib-concept-1',
    type: 'concept',
    tabId: 'concepts',
    question: 'التعزيز الإيجابي',
    content:
      'أن تلاحظ السلوك الجيد وتسمّيه لحظة حدوثه: «أعجبني أنك أغلقت الجهاز من أول نداء». ما يُلاحَظ يتكرر.',
  },
  {
    id: 'demo-lib-roadmap-1',
    type: 'roadmap',
    tabId: 'roadmap',
    title: 'خطة أسرية لتنظيم الشاشات خلال الفصل الدراسي الأول',
    estimated_duration: '٦ أسابيع — من ٤ أكتوبر إلى ١٥ نوفمبر ٢٠٢٦',
  },
  'قاعدة البيت: لا أجهزة على مائدة العشاء، ولا في غرف النوم بعد الساعة ٨:٣٠ مساءً.',
];

/** الأطفال في تفضيلات المستخدم — الأسماء نفسها المستعملة في بقية الشاشات. */
export const DEMO_KIDS = [
  { id: 'demo-kid-saud', name: 'سعود', age: 7, strengths: ['خيال واسع', 'حب البناء والتركيب'], challenges: ['التعلق بالألعاب الإلكترونية', 'العناد عند إنهاء اللعب'] },
  { id: 'demo-kid-noura', name: 'نورة', age: 10, strengths: ['القراءة', 'المسؤولية'], challenges: ['تنظيم وقت الدراسة', 'الخجل في الصف'] },
];

/** سجلّ البحث الذي تبني منه «البصمة المعرفية» عُقدها. */
export const DEMO_SEARCH_HISTORY: string[] = [
  'الألعاب الإلكترونية',
  'تنظيم وقت الدراسة',
  'العناد عند الأطفال',
  'التعزيز الإيجابي',
  'الخجل في المدرسة',
  'النوم المبكر',
  'قيمة المال والادخار',
  'الحوار مع الطفل',
];

/** الرادار الاستباقي (النموّ ← المتابعة): أسبوع من ملاحظات أم سعود. */
export const DEMO_ANALYTICS_LOGS: { date: string; feeling: string; behavior: string }[] = [
  { date: '2026-09-20', feeling: 'متوتر بعد المدرسة', behavior: 'رفض إغلاق الجهاز وصرخ عند التنبيه الثاني' },
  { date: '2026-09-21', feeling: 'هادئ', behavior: 'أغلق الجهاز بعد الإنذار المسبق بعشر دقائق' },
  { date: '2026-09-22', feeling: 'منعزل وصامت', behavior: 'رفض المشاركة في العشاء وبقي في غرفته' },
  { date: '2026-09-23', feeling: 'متحمس', behavior: 'ساعد في تحضير العشاء بدل اللعب' },
  { date: '2026-09-24', feeling: 'مستفز', behavior: 'تجاهل النداء المتكرر أثناء اللعب مع أبناء عمه' },
  { date: '2026-09-25', feeling: 'متعب', behavior: 'نام متأخراً بعد زيارة الديوانية' },
  { date: '2026-09-26', feeling: 'راضٍ', behavior: 'التزم بجدول الشاشة وطلب لعب الورق مع أخته نورة' },
];

/** محفظة الولاء (ركني ← النقاط): رصيد الزائر وسجلّ عملياته. */
export const DEMO_LOYALTY = {
  points: 340,
  totalSpent: 45,
  status: 'Active' as const,
  history: [
    { id: 'h1', date: '2026-09-26', label: 'إكمال خطة «طريق النجاح» الأسبوعية', points: 50 },
    { id: 'h2', date: '2026-09-22', label: 'استشارة أسرية — ٢٥ د.ك', points: 120 },
    { id: 'h3', date: '2026-09-18', label: 'استبدال كود TIBYAN15', points: -100 },
    { id: 'h4', date: '2026-09-12', label: 'حفظ خمس إجابات من «قول فصل»', points: 70 },
    { id: 'h5', date: '2026-09-03', label: 'ورشة «الشاشات والأسرة» — ٢٠ د.ك', points: 200 },
  ],
};

/* ------------------------------------------------------------------ */
/* English variants — the same family and story, for an English UI.   */
/* Kept item-for-item parallel to the Arabic fixtures (same ids, same */
/* order, same points) so switching language never changes the data. */
/* ------------------------------------------------------------------ */

export const DEMO_SAVED_LIBRARY_EN: any[] = [
  {
    id: 'demo-lib-q12',
    type: 'qawlfasl',
    tabId: 'qawlfasl',
    question: 'My child is hooked on video games and refuses to put the phone down.',
    quickSummary:
      "Handling a child's attachment to games takes a balance between firm limits and a strong emotional bond, with enjoyable alternatives that fill the time.",
  },
  {
    id: 'demo-lib-q17',
    type: 'qawlfasl',
    tabId: 'qawlfasl',
    question: 'How do I organise study and play time for my primary-school child?',
    quickSummary:
      'Organising time rests on balancing discipline and flexibility, and on involving the child in setting the schedule to build a sense of responsibility.',
  },
  {
    id: 'demo-lib-oracle-1',
    type: 'oracle',
    tabId: 'oracle',
    question: 'How can I cut Saud’s screen time without shouting every evening?',
    content:
      '**Start with an advance warning:** "In ten minutes we switch the device off", then "two minutes left". The sudden switch is what sparks the fight.\n\n**Have the alternative ready:** a short shared activity (a card game, helping with dinner) that starts the moment the device goes off.\n\n**Anchor the rule, not the mood:** the same time every day, even at the diwaniya and at grandma’s.',
  },
  {
    id: 'demo-lib-concept-1',
    type: 'concept',
    tabId: 'concepts',
    question: 'Positive reinforcement',
    content:
      'Notice good behaviour and name it the moment it happens: "I liked that you switched the device off the first time I asked." What gets noticed gets repeated.',
  },
  {
    id: 'demo-lib-roadmap-1',
    type: 'roadmap',
    tabId: 'roadmap',
    title: 'A family screen plan for the first school term',
    estimated_duration: '6 weeks — 4 October to 15 November 2026',
  },
  'House rule: no devices at the dinner table, and none in bedrooms after 8:30 pm.',
];

export const DEMO_KIDS_EN = [
  { id: 'demo-kid-saud', name: 'Saud', age: 7, strengths: ['Vivid imagination', 'Loves building things'], challenges: ['Attached to video games', 'Stubborn when play has to end'] },
  { id: 'demo-kid-noura', name: 'Noura', age: 10, strengths: ['Reading', 'Responsibility'], challenges: ['Organising study time', 'Shy in class'] },
];

export const DEMO_SEARCH_HISTORY_EN: string[] = [
  'Video games',
  'Organising study time',
  'Stubbornness in children',
  'Positive reinforcement',
  'Shyness at school',
  'Early bedtime',
  'Money and saving',
  'Talking with your child',
];

export const DEMO_ANALYTICS_LOGS_EN: { date: string; feeling: string; behavior: string }[] = [
  { date: '2026-09-20', feeling: 'Tense after school', behavior: 'Refused to switch the device off and shouted at the second reminder' },
  { date: '2026-09-21', feeling: 'Calm', behavior: 'Switched the device off after the ten-minute warning' },
  { date: '2026-09-22', feeling: 'Withdrawn and silent', behavior: 'Refused to join dinner and stayed in his room' },
  { date: '2026-09-23', feeling: 'Excited', behavior: 'Helped prepare dinner instead of playing' },
  { date: '2026-09-24', feeling: 'Provoked', behavior: 'Ignored repeated calls while gaming with his cousins' },
  { date: '2026-09-25', feeling: 'Tired', behavior: 'Slept late after the diwaniya visit' },
  { date: '2026-09-26', feeling: 'Content', behavior: 'Kept to the screen schedule and asked to play cards with his sister Noura' },
];

export const DEMO_LOYALTY_EN: typeof DEMO_LOYALTY = {
  ...DEMO_LOYALTY,
  history: [
    { id: 'h1', date: '2026-09-26', label: 'Completed the weekly “Road to Success” plan', points: 50 },
    { id: 'h2', date: '2026-09-22', label: 'Family consultation — 25 KWD', points: 120 },
    { id: 'h3', date: '2026-09-18', label: 'Redeemed code TIBYAN15', points: -100 },
    { id: 'h4', date: '2026-09-12', label: 'Saved five “Qawl Fasl” answers', points: 70 },
    { id: 'h5', date: '2026-09-03', label: '“Screens and the Family” workshop — 20 KWD', points: 200 },
  ],
};

const isArabic = (language?: string) => !language || language === 'ar';

/** The demo fixtures in the current UI language (Arabic is the default). */
export function getDemoFixtures(language?: string) {
  const ar = isArabic(language);
  return {
    savedLibrary: ar ? DEMO_SAVED_LIBRARY : DEMO_SAVED_LIBRARY_EN,
    kids: ar ? DEMO_KIDS : DEMO_KIDS_EN,
    searchHistory: ar ? DEMO_SEARCH_HISTORY : DEMO_SEARCH_HISTORY_EN,
    analyticsLogs: ar ? DEMO_ANALYTICS_LOGS : DEMO_ANALYTICS_LOGS_EN,
    loyalty: ar ? DEMO_LOYALTY : DEMO_LOYALTY_EN,
    visitorName: ar ? 'أنت' : 'You',
  };
}

/**
 * Swap demo library items for their counterpart in `language`, leaving anything
 * the visitor added during the session untouched. Items are matched by id, and
 * the one plain-text note by its value in either language.
 */
export function localizeDemoLibrary(items: any[], language?: string): any[] {
  const target = getDemoFixtures(language).savedLibrary;
  const byId = new Map<string, any>();
  let targetText: string | undefined;
  for (const it of target) {
    if (typeof it === 'string') targetText = it;
    else byId.set(it.id, it);
  }
  const demoTexts = new Set(
    [...DEMO_SAVED_LIBRARY, ...DEMO_SAVED_LIBRARY_EN].filter((i): i is string => typeof i === 'string'),
  );
  return items.map((it) => {
    if (typeof it === 'string') return demoTexts.has(it) && targetText ? targetText : it;
    if (it && typeof it === 'object' && typeof it.id === 'string' && byId.has(it.id)) {
      const loc = byId.get(it.id);
      return it.tabId && !loc.tabId ? { ...loc, tabId: it.tabId } : loc;
    }
    return it;
  });
}
