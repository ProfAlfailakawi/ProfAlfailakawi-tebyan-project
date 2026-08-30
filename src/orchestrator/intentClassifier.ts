/**
 * IntentClassifier — understand WHAT the user needs.
 *
 * This is intentionally LOCAL and synchronous: it runs the instant the user
 * submits, so Tebyan can paint an understanding, pick the likely engine, and
 * PRELOAD its chunk before the AI answer returns. The AI answer can later
 * refine the engine choice, but the user never waits on the network to see
 * that Tebyan understood them.
 *
 * It consolidates the four keyword matchers that were scattered across the old
 * SmartGateway (getIntentAndEmotion, pickJourneyProfile, getCognitiveMood,
 * SmartIntentEngine.getIntentProfile) into a single normalized classifier.
 */

import type {
  ClassifiedIntent,
  Domain,
  Emotion,
  IntentType,
  Language,
  Urgency,
} from './types';

/** Arabic-aware normalization: fold tashkeel, hamza/alef variants, ة/ى. */
function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[ً-ْٰ]/g, '') // harakat
    .replace(/[إأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

const has = (text: string, words: string[]) => words.some((w) => text.includes(w));
const count = (text: string, words: string[]) =>
  words.reduce((n, w) => (text.includes(w) ? n + 1 : n), 0);

/* ------------------------------------------------------------------ *
 * Keyword lexicons (Arabic white-dialect + MSA + English).           *
 * ------------------------------------------------------------------ */

const LEX: Record<IntentType, string[]> = {
  decide: [
    'قرار', 'محتار', 'احتار', 'حائر', 'اختار', 'اختيار', 'خيار', 'خيارين',
    'ابيع', 'ابيع مشروعي', 'اكمل او', 'او اترك', 'اوقف او', 'استقيل',
    'decision', 'decide', 'choose', 'choice', 'torn', 'should i', 'or should',
  ],
  conflict: [
    'مشكله مع', 'خلاف', 'زعل', 'يعصب', 'عصب', 'يصرخ', 'صراخ', 'يتجاهلني',
    'مديري', 'المدير', 'زوجي', 'زوجتي', 'ابني', 'بنتي', 'ولدي', 'العميل',
    'الموظف', 'شريكي', 'جاري', 'يرفض', 'نتخانق', 'يكذب', 'عنيد',
    'conflict', 'argument', 'fight', 'refuses', 'angry at', 'my boss', 'my son',
    'my wife', 'my husband', 'my daughter', 'client', 'confront',
  ],
  simulate: [
    'اتدرب', 'تدريب', 'اجرب الحوار', 'استعد لمحادثه', 'محادثه صعبه', 'مقابله',
    'تفاوض', 'اقنع', 'اطلب زياده', 'كيف اكلمه', 'كيف اقول له', 'شكيف اواجه',
    'rehearse', 'practice', 'roleplay', 'negotiat', 'interview', 'how do i tell',
    'how to talk to', 'difficult conversation',
  ],
  plan: [
    'خطه', 'خطوات', 'هدف', 'اهدافي', 'تنفيذ', 'انجز', 'ابدا مشروع', 'ابني',
    'روتين', 'جدول', 'كيف ابدا', 'من وين ابدا', 'مراحل',
    'plan', 'steps', 'roadmap', 'goal', 'milestone', 'how to start', 'launch',
  ],
  create: [
    'فكره', 'افكار', 'ابتكار', 'ابداع', 'اطور', 'مشروع', 'ستارت اب',
    'محتوى', 'اسم', 'شعار', 'حملة', 'brainstorm', 'idea', 'ideas', 'innovat',
    'creative', 'startup', 'develop an idea', 'concept for',
  ],
  future: [
    'ماذا لو', 'شنو بيصير', 'وش يصير', 'تبعات', 'عواقب', 'اثر', 'مستقبل',
    'بعد سنه', 'على المدى', 'سيناريو', 'توقع', 'لاحقا',
    'what if', 'consequence', 'future', 'long term', 'scenario', 'outcome',
    'what happens', 'down the line',
  ],
  write: [
    'اكتب', 'صياغه', 'صيغ لي', 'نص', 'رساله', 'خطاب', 'مقال', 'تدوينه',
    'اعيد صياغه', 'بوست',
    'write', 'draft', 'rephrase', 'compose', 'essay', 'letter', 'polish',
  ],
  learn: [
    'اختبر', 'اختبار', 'كويز', 'ادرس', 'مذاكره', 'احفظ', 'اتعلم',
    'تمرين', 'راجع لي',
    'quiz', 'test me', 'study', 'memorize', 'practice questions', 'revise',
  ],
  research: [
    'ابحث', 'بحث', 'مصادر', 'دليل', 'اثبات', 'دراسات', 'احصائيات',
    'مرجع', 'موثق', 'صحيح ولا',
    'research', 'sources', 'evidence', 'citation', 'studies', 'is it true',
    'fact check',
  ],
  understand: [
    'ليش', 'وش يعني', 'شنو يعني', 'اشرح', 'وضح', 'بسط', 'افهم', 'ما معنى',
    'الفرق بين', 'كيف يعمل', 'ما هو', 'ما هي',
    'what is', 'explain', 'understand', 'meaning of', 'difference between',
    'how does', 'why does',
  ],
  emotional: [
    'تعبان', 'مكتئب', 'حزين', 'ضايق', 'قهر', 'زهقت', 'ما اتحمل', 'مضغوط',
    'قلقان', 'خايف', 'وحيد', 'يائس', 'ما عاد اقدر', 'محبط', 'بكيت',
    'depressed', 'anxious', 'overwhelmed', 'scared', 'hopeless', 'burnt out',
    'i can\'t cope', 'exhausted', 'lonely',
  ],
  mixed: [],
};

const URGENT_WORDS = [
  'الحين', 'الان', 'حالا', 'ضروري', 'مستعجل', 'طوارئ', 'بسرعه', 'اليوم',
  'urgent', 'now', 'asap', 'emergency', 'right now', 'today',
];

const DOMAIN_LEX: Record<Exclude<Domain, 'general'>, string[]> = {
  parenting: [
    'ابني', 'بنتي', 'ولدي', 'طفلي', 'طفل', 'اطفالي', 'ابنائي', 'مراهق',
    'يدرس', 'المدرسه', 'child', 'son', 'daughter', 'kid', 'teenager', 'parenting',
  ],
  work: [
    'مديري', 'المدير', 'العمل', 'وظيفه', 'وظيفتين', 'شغل', 'دوام', 'موظف',
    'ترقيه', 'منصب', 'استقاله', 'الشركه', 'زميل',
    'boss', 'job', 'work', 'career', 'promotion', 'colleague', 'manager', 'office',
  ],
  money: [
    'فلوس', 'مال', 'راتب', 'دين', 'ديون', 'مصاريف', 'ميزانيه', 'استثمار',
    'اسعار', 'ربح', 'خساره', 'money', 'salary', 'debt', 'budget', 'invest',
    'income', 'expenses', 'financial',
  ],
  relationship: [
    'زوجي', 'زوجتي', 'زواج', 'خطيبي', 'خطيبتي', 'حبيبي', 'علاقتي', 'صديقي',
    'صديقتي', 'شريك حياتي', 'marriage', 'wife', 'husband', 'partner',
    'relationship', 'boyfriend', 'girlfriend', 'friend',
  ],
  health: [
    'صحه', 'صحتي', 'الم', 'مرض', 'دواء', 'نفسيتي', 'نوم', 'وزني', 'اكل',
    'health', 'pain', 'sick', 'illness', 'sleep', 'weight', 'diet', 'doctor',
  ],
  study: [
    'ادرس', 'دراسه', 'جامعه', 'تخصص', 'امتحان', 'اختبار', 'شهاده', 'ماده',
    'مذاكره', 'study', 'university', 'exam', 'major', 'degree', 'course', 'college',
  ],
  idea: [
    'فكره', 'مشروع', 'ستارت اب', 'ابتكار', 'منتج', 'خدمه', 'حملة', 'محتوى',
    'idea', 'project', 'startup', 'product', 'venture', 'business idea',
  ],
  self: [
    'نفسي', 'شخصيتي', 'عاداتي', 'تطوير ذاتي', 'ثقتي', 'حياتي', 'مستقبلي',
    'myself', 'my life', 'my habits', 'self improvement', 'confidence', 'my future',
  ],
};

/** Situations that are better rehearsed (Simulation) than merely read about. */
const SOCIAL_MARKERS = [
  'مديري', 'المدير', 'ابني', 'بنتي', 'ولدي', 'زوجي', 'زوجتي', 'العميل',
  'الموظف', 'شريكي', 'كيف اكلمه', 'كيف اقول', 'اطلب زياده', 'اقنع', 'مقابله',
  'تفاوض', 'محادثه', 'اواجه', 'boss', 'my son', 'my daughter', 'my wife',
  'my husband', 'client', 'negotiat', 'convince', 'interview', 'confront',
  'talk to', 'tell him', 'tell her',
];

function pickDomain(text: string): Domain {
  let best: Domain = 'general';
  let bestScore = 0;
  (Object.keys(DOMAIN_LEX) as Array<Exclude<Domain, 'general'>>).forEach((d) => {
    const s = count(text, DOMAIN_LEX[d]);
    if (s > bestScore) {
      bestScore = s;
      best = d;
    }
  });
  return best;
}

function pickEmotion(text: string): Emotion {
  if (
    has(text, [
      'تعبان', 'زهقت', 'مضغوط', 'ضغط', 'ما عاد اقدر', 'ما اتحمل', 'محبط',
      'exhausted', 'overwhelmed', 'burnt out', 'can\'t cope', 'stressed',
    ])
  )
    return 'stress';
  if (has(text, ['خايف', 'قلقان', 'قلق', 'متوتر', 'scared', 'anxious', 'afraid', 'worried']))
    return 'stress';
  if (has(text, ['حزين', 'مكتئب', 'قهر', 'بكيت', 'وحيد', 'يائس', 'depressed', 'sad', 'hopeless', 'lonely']))
    return 'sad';
  if (has(text, URGENT_WORDS)) return 'urgent';
  if (has(text, ['متحمس', 'فرحان', 'متفائل', 'excited', 'hopeful', 'motivated'])) return 'hopeful';
  return 'neutral';
}

/**
 * Classify a raw query. Pure, synchronous, no side effects.
 */
export function classifyIntent(rawQuery: string, _language: Language = 'ar'): ClassifiedIntent {
  const text = normalize(rawQuery);
  const wordCount = text ? text.split(' ').length : 0;

  // Score every intent by keyword hits.
  const scores = {} as Record<IntentType, number>;
  (Object.keys(LEX) as IntentType[]).forEach((intent) => {
    scores[intent] = intent === 'mixed' ? 0 : count(text, LEX[intent]);
  });

  // Emotional distress is a strong override: care comes before mechanics.
  const emotion = pickEmotion(text);
  if (emotion === 'sad' || emotion === 'stress') scores.emotional += 1.5;

  // Rank intents.
  const ranked = (Object.keys(scores) as IntentType[])
    .filter((i) => i !== 'mixed')
    .map((i) => ({ i, s: scores[i] }))
    .sort((a, b) => b.s - a.s);

  const topScore = ranked[0]?.s ?? 0;
  const secondScore = ranked[1]?.s ?? 0;

  let primary: IntentType;
  const secondary: IntentType[] = [];

  if (topScore === 0) {
    // No signal — treat as a general "understand" request.
    primary = 'understand';
  } else {
    primary = ranked[0].i;
    // Collect other genuinely-present intents.
    ranked.slice(1).forEach(({ i, s }) => {
      if (s > 0 && s >= topScore - 1) secondary.push(i);
    });
    // Two comparably-strong, different-family intents → mixed.
    const strongDistinct = secondScore > 0 && secondScore >= topScore - 0.5;
    if (strongDistinct && ranked[1].i !== primary) {
      // Keep the concrete primary but flag the mix so the router can blend.
      if (!secondary.includes(ranked[1].i)) secondary.unshift(ranked[1].i);
    }
  }

  // An emotionally-charged social conflict leans to rehearsal, not reading.
  const isSocialSituation = has(text, SOCIAL_MARKERS);
  if (isSocialSituation && (primary === 'conflict' || primary === 'emotional')) {
    if (!secondary.includes('simulate')) secondary.push('simulate');
  }

  const urgency: Urgency = has(text, URGENT_WORDS)
    ? 'high'
    : emotion === 'sad' || emotion === 'stress'
      ? 'normal'
      : 'normal';

  const domain = pickDomain(text);

  // Confidence: dominated by a clear top score and a reasonable-length query.
  const margin = topScore - secondScore;
  let confidence = Math.min(1, 0.35 + topScore * 0.18 + margin * 0.12);
  if (wordCount <= 2) confidence *= 0.6;

  // Very short or purely vague queries deserve one clarifying question.
  const needsClarification =
    wordCount > 0 &&
    wordCount <= 3 &&
    topScore <= 1 &&
    !isSocialSituation;

  return {
    primary,
    secondary: secondary.slice(0, 3),
    emotion,
    urgency,
    domain,
    confidence: Number(confidence.toFixed(2)),
    isSocialSituation,
    needsClarification,
  };
}
