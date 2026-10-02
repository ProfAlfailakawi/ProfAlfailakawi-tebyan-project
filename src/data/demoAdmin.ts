/**
 * بيانات العرض لشاشات الإدارة — أسماء وبريد وهمية بالكامل (نطاق example.com).
 *
 * في وضع العرض تُفتح شاشات الإدارة (المستخدمون، صندوق الوارد، إدارة «قول فصل»،
 * الكوبونات، لوحة الاستراتيجية) ببيانات من هذا الملف وحده: لا اشتراك في Firestore
 * ولا قراءة من الإنتاج، ولا يلزم حسابٌ حقيقي. التواريخ ثابتة وموزّعة على الأشهر
 * الأخيرة قبل ١ أكتوبر ٢٠٢٦، والأرقام متّسقة: مجموع مصادر الطلبات = الإجمالي.
 */

/** يحاكي Firestore Timestamp للحقول التي تستدعي `.toDate()`. */
const ts = (iso: string) => ({ toDate: () => new Date(iso), seconds: Math.floor(new Date(iso).getTime() / 1000) });

/* ---------------- لوحة الاستراتيجية: تكلفة الذكاء الاصطناعي ---------------- */

export const DEMO_AI_COST = { ai: 412, cache: 1263, kb: 818 };

export const DEMO_TOP_QUERIES: { query: string; count: number }[] = [
  { query: 'كيف أقلل وقت الشاشة لطفلي دون صراخ', count: 46 },
  { query: 'طفلي يرفض الذهاب إلى المدرسة', count: 41 },
  { query: 'كيف أتعامل مع نوبات الغضب عند طفل الثالثة', count: 37 },
  { query: 'طفلي يكذب كثيرا ماذا أفعل', count: 33 },
  { query: 'كيف أشرح مفهوم الموت لطفل صغير', count: 29 },
  { query: 'تنظيم وقت الدراسة واللعب للمرحلة الابتدائية', count: 27 },
  { query: 'ابني خجول ولا يشارك في الصف', count: 24 },
  { query: 'طفلي يسأل أين الله', count: 22 },
  { query: 'كيف أعلم ابني قيمة المال والادخار', count: 19 },
  { query: 'الغيرة بين الإخوة وكيف أخففها', count: 17 },
  { query: 'طفلي يضرب الأطفال الآخرين', count: 15 },
  { query: 'مشكلة النوم المتأخر عند الأطفال', count: 13 },
  { query: 'كيف أحمي طفلي من المحتوى غير اللائق', count: 12 },
  { query: 'العناد عند الطفل في سن الخامسة', count: 10 },
  { query: 'كيف أعزز ثقة ابنتي بنفسها', count: 9 },
  { query: 'طفلي لا يحب القراءة', count: 7 },
  { query: 'كيف أتعامل مع الطفل الحساس جدا', count: 6 },
  { query: 'الطلاق وكيف أخبر أطفالي', count: 5 },
  { query: 'طفلي يخاف من الظلام', count: 4 },
  { query: 'التنمر في المدرسة وماذا أفعل', count: 4 },
];

export const DEMO_AI_SUGGESTIONS: { title: string; description: string; priority: 'low' | 'medium' | 'high' }[] = [
  { title: 'قائمة «روتين المساء» الجاهزة', description: 'أكثر الاستعلامات تكرارًا تدور حول الشاشات والنوم؛ مسار جاهز من خمس خطوات يخفف الاعتماد على التوليد ويرفع نسبة الإجابات من الذاكرة.', priority: 'high' },
  { title: 'تذكير أسبوعي بالمتابعة', description: 'إشعار هادئ كل جمعة يعيد الوالد إلى خطته الأسبوعية، ويرفع معدل العودة بعد أول جلسة.', priority: 'medium' },
  { title: 'بطاقات قول فصل قابلة للمشاركة', description: 'تصدير إجابة قصيرة كبطاقة مصوّرة للمشاركة مع الشريك أو المعلمة.', priority: 'low' },
];

export const DEMO_GEN_STATUS = { generated: 10, published: 7, needsReview: 2, skipped: 1, errors: 0 };

/* ---------------- المستخدمون ---------------- */

const U = (id: string, displayName: string, role: 'admin' | 'user', status: 'active' | 'suspended', created: string, adminNotes = '') => ({
  id,
  displayName,
  email: `${id}@example.com`,
  role,
  status,
  adminNotes,
  createdAt: ts(created),
});

export const DEMO_USERS: any[] = [
  U('demo-admin', 'مدير العرض', 'admin', 'active', '2026-05-12T08:00:00Z', 'حساب إدارة تجريبي.'),
  U('um-saud', 'أم سعود', 'user', 'active', '2026-06-03T09:20:00Z', 'ولية أمر نشطة؛ تستخدم قول فصل والرادار الاستباقي.'),
  U('abu-fahad', 'أبو فهد', 'user', 'active', '2026-06-18T17:45:00Z'),
  U('um-yousef', 'أم يوسف', 'user', 'active', '2026-06-27T11:05:00Z'),
  U('abu-reem', 'أبو ريم', 'user', 'active', '2026-07-04T19:30:00Z'),
  U('muallima-sara', 'المعلمة سارة', 'user', 'active', '2026-07-11T07:50:00Z', 'معلمة ابتدائي، تشارك إجابات قول فصل مع أولياء الأمور.'),
  U('um-abdullah', 'أم عبدالله', 'user', 'active', '2026-07-23T13:10:00Z'),
  U('abu-nasser', 'أبو ناصر', 'user', 'suspended', '2026-08-02T21:00:00Z', 'أوقف مؤقتًا بسبب رسائل متكررة.'),
  U('um-hessa', 'أم حصة', 'user', 'active', '2026-08-09T10:15:00Z'),
  U('abu-turki', 'أبو تركي', 'user', 'active', '2026-08-17T16:40:00Z'),
  U('um-dana', 'أم دانة', 'user', 'active', '2026-08-26T08:25:00Z'),
  U('mushrif-khaled', 'المشرف خالد', 'user', 'active', '2026-09-01T12:00:00Z', 'مشرف تربوي؛ طلب باقة للمدرسة.'),
  U('abu-mishari', 'أبو مشاري', 'user', 'active', '2026-09-09T18:20:00Z'),
  U('um-lulwa', 'أم لولوة', 'user', 'active', '2026-09-15T09:05:00Z'),
  U('abu-badr', 'أبو بدر', 'user', 'active', '2026-09-22T20:35:00Z'),
  U('um-fajer', 'أم فجر', 'user', 'active', '2026-09-28T07:40:00Z'),
];

/* ---------------- صندوق الوارد ---------------- */

const M = (id: string, name: string, message: string, created: string, status: 'new' | 'read', language = 'ar') => ({
  id,
  name,
  email: `${id}@example.com`,
  message,
  language,
  status,
  createdAt: ts(created),
});

export const DEMO_MESSAGES: any[] = [
  M('msg-01', 'أم سعود', 'شكرًا على خطة تنظيم الشاشات؛ بدأ سعود يغلق الجهاز من أول نداء. هل توجد خطة مشابهة لنورة في المرحلة المتوسطة؟', '2026-09-30T19:12:00Z', 'new'),
  M('msg-02', 'المشرف خالد', 'نود اعتماد قول فصل لمدرستنا (420 ولي أمر). كيف نحصل على باقة المدارس؟', '2026-09-29T08:40:00Z', 'new'),
  M('msg-03', 'أبو مشاري', 'لم يصلني رمز الخصم بعد الاشتراك. أرجو المساعدة.', '2026-09-27T21:05:00Z', 'new'),
  M('msg-04', 'أم لولوة', 'اقتراح: إضافة سؤال عن تعامل الطفل مع غياب الأب بسبب السفر.', '2026-09-24T10:30:00Z', 'read'),
  M('msg-05', 'Fahad (Demo)', 'Is there an English version of the weekly plans? I would like to share them with a relative.', '2026-09-19T14:22:00Z', 'read', 'en'),
  M('msg-06', 'المعلمة سارة', 'أرغب في طباعة إجابة «طفلي يرفض الذهاب إلى المدرسة» لتوزيعها في اجتماع أولياء الأمور.', '2026-09-12T07:55:00Z', 'read'),
  M('msg-07', 'أم دانة', 'التطبيق ممتاز، لكن الخط صغير قليلًا على الجوال.', '2026-08-30T17:10:00Z', 'read'),
  M('msg-08', 'أبو تركي', 'كيف أحذف سجل البحث الخاص بي؟', '2026-08-14T11:45:00Z', 'read'),
];

/* ---------------- الكوبونات ---------------- */

export const DEMO_COUPONS: any[] = [
  { id: 'cp-1', code: 'TIBYAN15', discount: 15, status: 'active' },
  { id: 'cp-2', code: 'WELCOME10', discount: 10, status: 'active' },
  { id: 'cp-3', code: 'SCHOOL25', discount: 25, status: 'active' },
  { id: 'cp-4', code: 'FAMILY30', discount: 30, status: 'active' },
];

/* ---------------- إدارة «قول فصل» ---------------- */

export const DEMO_MISSING_QUESTIONS: any[] = [
  { id: 'mq-1', query: 'طفلي يمص إصبعه وعمره ست سنوات', frequency: 14, status: 'pending' },
  { id: 'mq-2', query: 'كيف أتعامل مع غيرة طفلي من المولود الجديد', frequency: 11, status: 'pending' },
  { id: 'mq-3', query: 'ابنتي ترفض ارتداء ملابس معينة', frequency: 8, status: 'pending' },
  { id: 'mq-4', query: 'طفلي يتأتئ عند الحديث أمام الغرباء', frequency: 6, status: 'pending' },
  { id: 'mq-5', query: 'كيف أشرح الصيام لطفل في السابعة', frequency: 5, status: 'pending' },
];

export const DEMO_ANSWER_REPORTS: any[] = [
  { id: 'ar-1', questionId: 'q-3', questionTitle: 'طفلي شاهد محتوى غير لائق على الإنترنت، كيف أتعامل؟', note: 'أرجو إضافة خطوات لضبط إعدادات الأمان في تطبيق اليوتيوب.', contact: 'reporter1@example.com', status: 'open', createdAt: ts('2026-09-26T09:15:00Z') },
  { id: 'ar-2', questionId: 'q-6', questionTitle: 'طفلي يرفض الذهاب إلى المدرسة ويبكي كل صباح.', note: 'الفقرة الثالثة تحتاج توضيحًا لعمر ما قبل المدرسة.', contact: 'reporter2@example.com', status: 'open', createdAt: ts('2026-09-18T16:40:00Z') },
  { id: 'ar-3', questionId: 'q-7', questionTitle: 'كيف أعزز الثقة بالنفس عند طفل خجول جداً؟', note: 'مثال الحوار مفيد جدًا، لكن يوجد خطأ مطبعي في عنوان الخطوة الثانية.', contact: '', status: 'resolved', createdAt: ts('2026-09-05T12:00:00Z') },
];

/* ---------------- الولاء: قائمة العملاء (عرض الإدارة) ---------------- */

/** رصيد النقاط والإنفاق (د.ك) وحالة العميل لكل مستخدم؛ الحالة تتبع آخر عملية شراء. */
const CUSTOMER_STATS: Record<string, { points: number; spent: number; status: 'VIP' | 'Active' | 'Inactive' | 'At Risk' | 'New'; last: string }> = {
  'demo-admin': { points: 1500, spent: 0, status: 'VIP', last: '2026-09-30T09:00:00Z' },
  'um-saud': { points: 340, spent: 45, status: 'Active', last: '2026-09-22T09:00:00Z' },
  'abu-fahad': { points: 1180, spent: 135, status: 'VIP', last: '2026-09-27T18:00:00Z' },
  'um-yousef': { points: 260, spent: 40, status: 'Active', last: '2026-09-19T10:00:00Z' },
  'abu-reem': { points: 90, spent: 15, status: 'At Risk', last: '2026-09-08T19:00:00Z' },
  'muallima-sara': { points: 720, spent: 95, status: 'Active', last: '2026-09-25T08:00:00Z' },
  'um-abdullah': { points: 150, spent: 25, status: 'At Risk', last: '2026-09-10T13:00:00Z' },
  'abu-nasser': { points: 60, spent: 10, status: 'Inactive', last: '2026-08-04T21:00:00Z' },
  'um-hessa': { points: 410, spent: 60, status: 'Active', last: '2026-09-21T10:00:00Z' },
  'abu-turki': { points: 30, spent: 5, status: 'Inactive', last: '2026-08-18T16:00:00Z' },
  'um-dana': { points: 520, spent: 70, status: 'Active', last: '2026-09-24T08:00:00Z' },
  'mushrif-khaled': { points: 1260, spent: 180, status: 'VIP', last: '2026-09-29T12:00:00Z' },
  'abu-mishari': { points: 80, spent: 20, status: 'Active', last: '2026-09-20T18:00:00Z' },
  'um-lulwa': { points: 200, spent: 30, status: 'Active', last: '2026-09-26T09:00:00Z' },
  'abu-badr': { points: 0, spent: 0, status: 'New', last: '2026-09-22T20:00:00Z' },
  'um-fajer': { points: 0, spent: 0, status: 'New', last: '2026-09-28T07:00:00Z' },
};

export const DEMO_CUSTOMERS: any[] = DEMO_USERS.map((u: any, i: number) => {
  const st = CUSTOMER_STATS[u.id];
  return {
    id: u.id,
    displayName: u.displayName,
    email: u.email,
    phone: `+965 5550 ${String(1001 + i)}`,
    points: st.points,
    totalSpent: st.spent,
    lastOrderDate: ts(st.last),
    status: st.status,
    role: u.role,
  };
});
