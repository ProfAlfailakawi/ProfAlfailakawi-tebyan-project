/**
 * Capability registry — the single source of truth for what Tebyan can become.
 *
 * Each entry declares supported intents, whether it runs inline, its advanced
 * fallback tab (used only when a power user explicitly wants the full tool),
 * safety level, priority, and the HUMAN copy shown to the user. Engine/tool
 * names never appear in `label` or `pitch`.
 */

import type { CapabilityDef, CapabilityId, PitchContext } from './types';

const pick = (ar: string, en: string) => ({ ar, en });

export const CAPABILITIES: Record<CapabilityId, CapabilityDef> = {
  simulate: {
    id: 'simulate',
    canInline: true,
    interactive: true,
    fallbackTab: 'simulation',
    riskLevel: 'normal',
    intents: ['simulate', 'conflict', 'emotional'],
    priority: 10,
    icon: 'MessageSquare',
    label: pick('ابدأ التدريب', 'Start the rehearsal'),
    pitch: (ctx: PitchContext) => {
      const other =
        ctx.domain === 'parenting'
          ? pick('دور ابنك', 'your child')
          : ctx.domain === 'work'
            ? pick('دور مديرك', 'your manager')
            : ctx.domain === 'relationship'
              ? pick('الطرف الآخر', 'the other person')
              : pick('الطرف الآخر', 'the other person');
      return pick(
        `هذا موقف يستفيد من التدريب أكثر من القراءة. أمثّل ${other.ar} ونجرّب الحوار الآن؟`,
        `This is one you rehearse, not just read about. I can play ${other.en} so we try it now.`,
      );
    },
  },

  compare: {
    id: 'compare',
    canInline: true,
    interactive: false,
    fallbackTab: 'decisionroom',
    riskLevel: 'normal',
    intents: ['decide', 'future'],
    priority: 9,
    icon: 'Scale',
    label: pick('قارن الخيارين', 'Weigh the options'),
    pitch: () =>
      pick(
        'هذا القرار له وجهان. نقارنهما بهدوء ونكشف ما قد تندم عليه قبل الحسم؟',
        'This has two sides. Shall we weigh them and surface what you might regret before deciding?',
      ),
  },

  plan: {
    id: 'plan',
    canInline: true,
    interactive: false,
    fallbackTab: 'roadmap',
    riskLevel: 'low',
    intents: ['plan'],
    priority: 9,
    icon: 'Map',
    label: pick('ابنِ الخطة', 'Build the plan'),
    pitch: () =>
      pick(
        'أحوّل هذا إلى أول خطوات عملية تبدأ بها اليوم؟',
        'Shall I turn this into concrete first steps you can start today?',
      ),
  },

  perspectives: {
    id: 'perspectives',
    canInline: true,
    interactive: false,
    fallbackTab: 'council',
    riskLevel: 'low',
    intents: ['decide', 'understand'],
    priority: 6,
    icon: 'Users',
    label: pick('اعرض وجهات نظر أخرى', 'See other angles'),
    pitch: () =>
      pick(
        'أعرض لك الموقف من أكثر من زاوية قبل أن تقرر؟',
        'Want to see this from a few different angles first?',
      ),
  },

  future: {
    id: 'future',
    canInline: true,
    interactive: false,
    fallbackTab: 'timemachine',
    riskLevel: 'low',
    intents: ['future'],
    priority: 7,
    icon: 'Hourglass',
    label: pick('ماذا قد يحدث لاحقًا؟', 'What might happen later?'),
    pitch: () =>
      pick(
        'نستكشف كيف قد تتطور الأمور على المدى القريب والبعيد؟',
        'Shall we explore how this could unfold in the near and long term?',
      ),
  },

  research: {
    id: 'research',
    canInline: true,
    interactive: false,
    fallbackTab: 'knowledgecenter',
    riskLevel: 'normal',
    intents: ['research', 'understand', 'learn'],
    priority: 6,
    icon: 'BookOpenText',
    label: pick('أرِني نقاطًا موثقة', 'Show grounded points'),
    pitch: () =>
      pick(
        'أجمع لك أهم النقاط الموثوقة حول الموضوع؟',
        'Shall I gather the key grounded points on this?',
      ),
  },

  simplify: {
    id: 'simplify',
    canInline: true,
    interactive: false,
    fallbackTab: 'concepts',
    riskLevel: 'low',
    intents: ['understand', 'learn'],
    priority: 5,
    icon: 'Lightbulb',
    label: pick('بسّطها أكثر', 'Simplify it more'),
    pitch: () =>
      pick(
        'أبسّطها لك بمثال قريب وواضح؟',
        'Want it explained more simply, with a close example?',
      ),
  },

  develop: {
    id: 'develop',
    canInline: true,
    interactive: false,
    fallbackTab: 'creativelab',
    riskLevel: 'low',
    intents: ['create'],
    priority: 8,
    icon: 'Sparkles',
    label: pick('طوّر الفكرة', 'Develop the idea'),
    pitch: () =>
      pick(
        'نقوّي فكرتك بثلاث ضربات ونخرج نسخة أوضح؟',
        'Shall we strengthen your idea in three moves and produce a sharper version?',
      ),
  },

  quiz: {
    id: 'quiz',
    canInline: true,
    interactive: true,
    fallbackTab: 'quizzes',
    riskLevel: 'low',
    intents: ['learn'],
    priority: 5,
    icon: 'ClipboardCheck',
    label: pick('اختبر فهمك', 'Test your understanding'),
    pitch: () =>
      pick(
        'نتأكد أنك فهمتها فعلاً بأسئلة قصيرة؟',
        'Shall we check it stuck with a few short questions?',
      ),
  },
};

export function getCapability(id: CapabilityId): CapabilityDef {
  return CAPABILITIES[id];
}

/** Loading line shown while a one-shot capability runs (very short). */
export function capabilityLoadingText(id: CapabilityId, language: 'ar' | 'en'): string {
  const map: Record<CapabilityId, { ar: string; en: string }> = {
    simulate: { ar: 'أجهّز الموقف…', en: 'Setting up the scene…' },
    compare: { ar: 'أقارن الخيارين…', en: 'Weighing the options…' },
    plan: { ar: 'أبني لك الخطة…', en: 'Building your plan…' },
    perspectives: { ar: 'أجمع الزوايا…', en: 'Gathering angles…' },
    future: { ar: 'أستشرف ما قد يحدث…', en: 'Looking ahead…' },
    research: { ar: 'أبحث عن نقاط موثوقة…', en: 'Finding grounded points…' },
    simplify: { ar: 'أبسّطها لك…', en: 'Simplifying…' },
    develop: { ar: 'أطوّر الفكرة…', en: 'Developing the idea…' },
    quiz: { ar: 'أجهّز سؤالك…', en: 'Preparing your question…' },
  };
  const m = map[id];
  return language === 'ar' ? m.ar : m.en;
}
