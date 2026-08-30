/**
 * EngineRegistry — the catalogue of internal engines.
 *
 * Every powerful surface Tebyan already owns (Decision Room, Simulation,
 * Roadmap, Council, Time Machine, Knowledge Center, Qawl Fasl, Creative Lab, …)
 * is declared here as an *engine* with:
 *   - the tab it opens (internal handoff target),
 *   - the intents it serves + machine-readable capabilities,
 *   - HUMAN-language copy (a button label + a warm one-line pitch).
 *
 * The user never sees `engineId`, `tabId`, or a brand name — only `label` and
 * `pitch`. This is where "the user sees one need; Tebyan sees twenty engines"
 * is made concrete.
 *
 * IMPORTANT: capabilities reflect what each tab ACTUALLY does today:
 *   - "what could happen later / consequences" lives in Decision Room's
 *     consequence tools and Time Machine — NOT in RippleEffectTab (which is a
 *     social idea feed and does not accept a seeded query).
 *   - Simulation rehearsal is triggered by a `[ROLEPLAY]` prefix on its seed.
 */

import type { ClassifiedIntent, EngineAction, IntentType, Language } from './types';

const ROLEPLAY_PREFIX = '[ROLEPLAY]';

export interface EngineDef {
  id: string;
  /** The App tab id this engine opens via handleTabChange. */
  tabId: string;
  /** Intents this engine can satisfy, best-first. */
  intents: IntentType[];
  /** Machine-readable capabilities (for future routing / debugging). */
  capabilities: string[];
  /** Whether the target tab consumes a seeded query (`initialValue`). */
  acceptsSeed: boolean;
  /** Human button label. */
  label: { ar: string; en: string };
  /** Warm one-line invitation shown above the button. */
  pitch: (intent: ClassifiedIntent, language: Language) => string;
  /** Build the exact context string handed to the tab. */
  buildContext: (query: string, intent: ClassifiedIntent) => string;
  /** Lucide icon name hint for the UI. */
  icon: string;
  /** Base priority when several engines fit equally (higher = preferred). */
  weight: number;
}

const A = (ar: string, en: string, language: Language) => (language === 'ar' ? ar : en);

export const ENGINES: Record<string, EngineDef> = {
  simulation: {
    id: 'simulation',
    tabId: 'simulation',
    intents: ['simulate', 'conflict'],
    capabilities: ['roleplay', 'rehearsal', 'behavioral-feedback'],
    acceptsSeed: true,
    icon: 'MessageSquare',
    weight: 10,
    label: { ar: 'ابدأ التدريب', en: 'Start the rehearsal' },
    pitch: (intent, language) => {
      const other =
        intent.domain === 'parenting'
          ? A('دور ابنك', 'your child', language)
          : intent.domain === 'work'
            ? A('دور مديرك', 'your manager', language)
            : intent.domain === 'relationship'
              ? A('الطرف الآخر', 'the other person', language)
              : A('الطرف الآخر', 'the other person', language);
      return A(
        `هذا موقف يستفيد من التدريب أكثر من القراءة. هل تريد أن أمثّل ${other} ونجرّب الحوار الآن؟`,
        `This is a situation you rehearse, not just read about. Want me to play ${other} so we can try the conversation now?`,
        language,
      );
    },
    // Simulation reads a [ROLEPLAY] prefix to jump straight into rehearsal.
    buildContext: (query) => `${ROLEPLAY_PREFIX}${query}`,
  },

  decisionroom: {
    id: 'decisionroom',
    tabId: 'decisionroom',
    intents: ['decide', 'future'],
    capabilities: ['compare-options', 'tradeoffs', 'risks', 'consequence-waves', 'red-team'],
    acceptsSeed: true,
    icon: 'Scale',
    weight: 9,
    label: { ar: 'قارن الخيارين', en: 'Weigh the options' },
    pitch: (_intent, language) =>
      A(
        'هذا القرار له وجهان. هل نقارنهما بهدوء ونكشف ما قد تندم عليه قبل أن تحسم؟',
        'This decision has two sides. Shall we weigh them calmly and surface what you might regret before you commit?',
        language,
      ),
    buildContext: (query) => query,
  },

  council: {
    id: 'council',
    tabId: 'council',
    intents: ['decide', 'understand'],
    capabilities: ['multiple-perspectives', 'schools-of-thought', 'debate'],
    acceptsSeed: true,
    icon: 'Users',
    weight: 6,
    label: { ar: 'اعرض وجهات نظر أخرى', en: 'See other perspectives' },
    pitch: (_intent, language) =>
      A(
        'قد يفيدك أن ترى الموقف من أكثر من زاوية قبل أن تقرر. أجمع لك آراءً مختلفة؟',
        'It may help to see this from several angles before you decide. Want me to gather different views?',
        language,
      ),
    buildContext: (query) => query,
  },

  roadmap: {
    id: 'roadmap',
    tabId: 'roadmap',
    intents: ['plan'],
    capabilities: ['steps', 'milestones', 'priorities'],
    acceptsSeed: true,
    icon: 'Map',
    weight: 9,
    label: { ar: 'ابنِ الخطة', en: 'Build the plan' },
    pitch: (_intent, language) =>
      A(
        'هذا واضح بما يكفي لنحوّله إلى أول خطوات عملية. أبنيها معك الآن؟',
        'This is clear enough to turn into concrete first steps. Shall I build them with you now?',
        language,
      ),
    buildContext: (query) => query,
  },

  timemachine: {
    id: 'timemachine',
    tabId: 'timemachine',
    intents: ['future'],
    capabilities: ['scenario-analysis', 'evolution', 'consequences-over-time'],
    acceptsSeed: true,
    icon: 'Hourglass',
    weight: 7,
    label: { ar: 'استشرف ما قد يحدث', en: 'Explore what may happen' },
    pitch: (_intent, language) =>
      A(
        'لهذا القرار آثار قريبة وبعيدة. هل نستكشف كيف قد تتطور الأمور مع الوقت؟',
        'This has near and long-term ripples. Shall we explore how things may unfold over time?',
        language,
      ),
    buildContext: (query) => query,
  },

  knowledgecenter: {
    id: 'knowledgecenter',
    tabId: 'knowledgecenter',
    intents: ['understand', 'research', 'learn'],
    capabilities: ['explain', 'structure', 'connect-concepts'],
    acceptsSeed: true,
    icon: 'Network',
    weight: 7,
    label: { ar: 'افهمها بعمق', en: 'Understand it in depth' },
    pitch: (_intent, language) =>
      A(
        'أرتّب لك الموضوع من جذوره حتى تراه كاملاً وواضحاً؟',
        'Shall I lay this out from its roots so you can see the whole picture clearly?',
        language,
      ),
    buildContext: (query) => query,
  },

  qawlfasl: {
    id: 'qawlfasl',
    tabId: 'qawlfasl',
    intents: ['understand', 'research', 'conflict', 'learn', 'emotional'],
    capabilities: ['curated-answer', 'retrieval', 'cite', 'neutral', 'caring'],
    acceptsSeed: true,
    icon: 'BookOpenText',
    weight: 6,
    label: { ar: 'أرِني جواباً موثقاً', en: 'Show me a grounded answer' },
    pitch: (_intent, language) =>
      A(
        'عندي إجابة مرتّبة وموثوقة قريبة جداً من موضوعك. أعرضها لك؟',
        'I have a grounded, well-organised answer very close to your topic. Want to see it?',
        language,
      ),
    buildContext: (query) => query,
  },

  concepts: {
    id: 'concepts',
    tabId: 'concepts',
    intents: ['understand', 'learn'],
    capabilities: ['simplify', 'define'],
    acceptsSeed: true,
    icon: 'Lightbulb',
    weight: 5,
    label: { ar: 'بسّطها أكثر', en: 'Simplify it further' },
    pitch: (_intent, language) =>
      A(
        'أقدر أبسّطها لك أكثر بمثال قريب. أشرحها ببساطة؟',
        'I can simplify this with a close example. Want the plain version?',
        language,
      ),
    buildContext: (query) => query,
  },

  creativelab: {
    id: 'creativelab',
    tabId: 'creativelab',
    intents: ['create'],
    capabilities: ['ideate', 'remix', 'differentiate'],
    acceptsSeed: true,
    icon: 'Sparkles',
    weight: 8,
    label: { ar: 'طوّر الفكرة', en: 'Develop the idea' },
    pitch: (_intent, language) =>
      A(
        'الفكرة تستحق أن نطوّرها ونولّد لها اتجاهات أقوى. نبدأ؟',
        'This idea is worth developing into stronger directions. Shall we start?',
        language,
      ),
    buildContext: (query) => query,
  },

  truthmanuscript: {
    id: 'truthmanuscript',
    tabId: 'truthmanuscript',
    intents: ['write'],
    capabilities: ['compose', 'polish'],
    acceptsSeed: true,
    icon: 'ScrollText',
    weight: 6,
    label: { ar: 'حوّلها إلى نص', en: 'Turn it into writing' },
    pitch: (_intent, language) =>
      A(
        'أقدر أصوغ أفكارك في نص متماسك وجميل. أكتبه لك؟',
        'I can shape your thoughts into coherent, polished writing. Shall I?',
        language,
      ),
    buildContext: (query) => query,
  },

  quizzes: {
    id: 'quizzes',
    tabId: 'quizzes',
    intents: ['learn'],
    capabilities: ['test-understanding'],
    acceptsSeed: true,
    icon: 'ClipboardCheck',
    weight: 5,
    label: { ar: 'اختبر فهمك', en: 'Test your understanding' },
    pitch: (_intent, language) =>
      A(
        'نتأكد أنك فهمتها فعلاً بأسئلة قصيرة؟',
        'Shall we make sure it stuck with a few short questions?',
        language,
      ),
    buildContext: (query) => query,
  },
};

/**
 * All engines that can serve a given intent, best-first.
 * An engine that SPECIALISES in the intent (it is its first declared intent)
 * outranks a generalist of equal weight — so "understand" prefers Knowledge
 * Center over Time Machine, and "future" prefers Time Machine over Decision
 * Room, without brittle global weight juggling.
 */
export function enginesForIntent(intent: IntentType): EngineDef[] {
  return Object.values(ENGINES)
    .filter((e) => e.intents.includes(intent))
    .sort((a, b) => {
      const aSpec = a.intents[0] === intent ? 1 : 0;
      const bSpec = b.intents[0] === intent ? 1 : 0;
      if (aSpec !== bSpec) return bSpec - aSpec;
      return b.weight - a.weight;
    });
}

export function getEngine(id: string): EngineDef | undefined {
  return ENGINES[id];
}

/** Turn an engine + query into the user-facing action object. */
export function toEngineAction(
  engine: EngineDef,
  query: string,
  intent: ClassifiedIntent,
  language: Language,
): EngineAction {
  return {
    engineId: engine.id,
    tabId: engine.tabId,
    label: language === 'ar' ? engine.label.ar : engine.label.en,
    pitch: engine.pitch(intent, language),
    handoffContext: engine.buildContext(query, intent),
    icon: engine.icon,
  };
}

export { ROLEPLAY_PREFIX };
