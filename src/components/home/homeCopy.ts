/**
 * All user-facing copy for the new Tebyan home, in one place.
 *
 * Rule: the IDENTITY and human moments may be warm; the CONTROLS must be plain.
 * Never make the user decode the interface.
 */

import type { Language } from '../../orchestrator/types';

export interface HomeExample {
  ar: string;
  en: string;
}

/** Three small, tappable examples under the input — nothing else competes. */
export const HOME_EXAMPLES: HomeExample[] = [
  { ar: 'محتار بين وظيفتين', en: "I'm torn between two jobs" },
  { ar: 'عندي مشكلة مع ابني', en: 'I have a problem with my son' },
  { ar: 'أريد تطوير فكرة مشروع', en: 'I want to develop a project idea' },
];

export const homeCopy = (language: Language) => {
  const ar = language === 'ar';
  return {
    // Empty state
    title: ar ? 'ما الذي يشغلك؟' : 'What is on your mind?',
    subtitle: ar
      ? 'سؤال، قرار، مشكلة، فكرة أو موقف. اكتبها كما تقولها لشخص تثق برأيه.'
      : 'A question, a decision, a problem, an idea, or a situation. Write it as you would to someone whose opinion you trust.',
    placeholder: ar ? 'اكتب ما يدور في بالك…' : 'Write what is on your mind…',
    submit: ar ? 'اسأل تبيان' : 'Ask Tebyan',
    examplesLabel: ar ? 'أو ابدأ بمثال:' : 'Or start with an example:',
    quietHint: ar
      ? 'لا تحتاج أن تعرف أين تذهب. فقط اكتب ما يشغلك.'
      : 'You don’t need to know where to go. Just write what’s on your mind.',

    // Loading
    loadingUnderstanding: ar ? 'أفهم ما تقصده…' : 'Understanding what you mean…',
    loadingArranging: ar ? 'أرتّب لك أفضل بداية…' : 'Arranging your best starting point…',

    // Answer card
    answerEyebrow: ar ? 'جواب تبيان' : 'Tebyan’s answer',
    understoodLabel: ar ? 'فهمت منك' : 'Here’s what I understood',
    summaryLabel: ar ? 'الخلاصة' : 'The gist',
    actionLabel: ar ? 'ابدأ بهذا الآن' : 'Start with this now',
    otherOptions: ar ? 'خيارات أخرى' : 'Other options',
    hideOptions: ar ? 'إخفاء الخيارات' : 'Hide options',
    optionsHint: ar
      ? 'اختر فقط إذا احتجت مساراً مختلفاً'
      : 'Only if you need a different path',
    simplify: ar ? 'بسّطها أكثر' : 'Simplify it more',
    deepen: ar ? 'حلّلها بعمق' : 'Analyse deeply',
    askDifferently: ar ? 'سؤال جديد' : 'New question',

    // Clarification
    clarifyLead: ar ? 'سؤال واحد يوضّح الصورة:' : 'One question to sharpen this:',
    clarifyPlaceholder: ar ? 'إجابتك (اختياري)…' : 'Your answer (optional)…',
    clarifySend: ar ? 'أعد الجواب' : 'Refine the answer',

    // Returning user
    welcomeBack: ar ? 'أهلاً بعودتك.' : 'Welcome back.',
    lastThing: ar ? 'آخر شيء كنا نعمل عليه' : 'The last thing we worked on',
    resume: ar ? 'أكمل من هنا' : 'Continue from here',
    somethingChanged: ar ? 'أم أن شيئاً تغيّر؟' : 'Or has something changed?',

    // Errors (human, never technical)
    errorTitle: ar ? 'تعذّر إكمال التحليل الآن.' : 'I couldn’t finish that just now.',
    errorBody: ar ? 'حاول مرة أخرى بعد لحظات.' : 'Please try again in a moment.',
    retry: ar ? 'حاول مرة أخرى' : 'Try again',
    emptyError: ar ? 'اكتب ما يشغلك أولاً.' : 'Write what’s on your mind first.',
  };
};
