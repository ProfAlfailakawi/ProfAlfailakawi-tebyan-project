/**
 * Turn composer — the two-stage intent + answer pipeline for one session turn.
 *
 * Stage 1 (local, instant): the keyword classifier gives a fast hint used to
 *   preload the likely capability and to seed defaults / offline fallback.
 * Stage 2 (AI semantic): one JSON call produces the human answer AND a
 *   SemanticIntentResult — primary/secondary intents, domain, urgency, social
 *   context, high-stakes flag, and a recommended CAPABILITY (never an engine
 *   name). This is what lets Tebyan understand "الموضوع ما عاد يسوى بس مو قادر
 *   أقطه" as a sunk-cost decision even without the words "قرار" or "أبيع".
 *
 * Never throws: on any AI failure it degrades to the local classifier + the
 * keyword guidance answer, so the user always gets a useful partial turn.
 */

import { proxyGenerateContent } from '../lib/aiProxy';
import { classifyIntent } from './intentClassifier';
import { composeLocalAnswer } from './answerComposer';
import { coerceCapability, capabilityForIntent, type SemanticIntent } from './capabilities/router';
import type { IntentType, Language, ResponseMode } from './types';
import type { CapabilityId } from './capabilities/types';

const T = { OBJECT: 'OBJECT', STRING: 'STRING', ARRAY: 'ARRAY', BOOLEAN: 'BOOLEAN' } as const;

const INTENTS: IntentType[] = [
  'understand', 'decide', 'conflict', 'plan', 'create', 'simulate', 'research', 'write', 'learn', 'future', 'emotional', 'mixed',
];
const CAPS: CapabilityId[] = [
  'simulate', 'compare', 'plan', 'perspectives', 'future', 'research', 'simplify', 'develop', 'quiz',
];

export interface TurnComposition {
  understanding: string;
  summary: string;
  action: string;
  clarifyingQuestion: string | null;
  semantic: SemanticIntent;
  source: 'ai' | 'local';
}

/** Local high-stakes detector (safety net independent of the AI). */
const HIGH_STAKES = [
  'انتحار', 'أموت', 'اموت', 'أذي نفسي', 'اذي نفسي', 'suicide', 'kill myself', 'self-harm',
  'سرطان', 'ورم', 'جلطة', 'نزيف', 'تشخيص', 'دواء', 'جرعة', 'cancer', 'tumor', 'diagnosis', 'medication', 'dose', 'chest pain',
  'محكمة', 'قضية', 'دعوى', 'محامي', 'عقوبة', 'lawsuit', 'legal case', 'court', 'sue',
  'كل مدخراتي', 'قرض كبير', 'أرهن', 'ارهن', 'استثمر كل', 'life savings', 'mortgage everything', 'all my money',
];
function detectHighStakes(text: string): boolean {
  const t = (text || '').toLowerCase();
  return HIGH_STAKES.some((w) => t.includes(w));
}

function systemInstruction(language: Language, mode: ResponseMode, highStakes: boolean): string {
  const depth =
    mode === 'simple'
      ? language === 'ar'
        ? 'اجعل الشرح بسيطاً جداً بمثال قريب.'
        : 'Keep it very simple with a close example.'
      : mode === 'deep'
        ? language === 'ar'
          ? 'حلّل بعمق: الافتراض الأخطر والزاوية غير الظاهرة.'
          : 'Go deeper: the riskiest assumption and the hidden angle.'
        : language === 'ar'
          ? 'اجعل الجواب مختصراً وكافياً للبدء.'
          : 'Keep it concise and enough to start.';
  if (language === 'ar') {
    return [
      'أنت "تبيان": عقل واحد يفهم نية الإنسان الحقيقية خلف كلامه ثم يعطيه أول خطوة، ويقرّر داخلياً القدرة الأنسب.',
      highStakes
        ? 'الموضوع حسّاس (صحي/نفسي/قانوني/مالي عالي المخاطر): احتوِ أولاً، لا تعطِ يقيناً، وذكّر بلطف أن هذا لا يغني عن مختص.'
        : '',
      depth,
      'افهم النية حتى لو لم تُذكر الكلمات صراحة (مثال: التردد في ترك مشروع خاسر = قرار/سَنك كوست).',
      'أعد JSON فقط بالحقول: understanding, summary, action, clarifyingQuestion, primaryIntent, secondaryIntents, domain, urgency, social, highStakes, recommendedCapability.',
      'understanding: جملة أو جملتان تبدأ بفهم ما يمر به (لا إعادة صياغة حرفية).',
      'summary: الخلاصة/الجواب في 2-4 جمل.',
      'action: خطوة عملية واحدة يبدأ بها اليوم.',
      'clarifyingQuestion: سؤال توضيحي واحد فقط، واتركه فارغاً إلا إذا كان سيغيّر الجواب فعلاً.',
      `primaryIntent وsecondaryIntents من: ${INTENTS.join(', ')}.`,
      'domain: مجال مختصر (parenting/work/money/relationship/health/study/idea/self/general).',
      'urgency: low|normal|high. social: هل هو موقف تفاعل مع طرف آخر يُستحسن التدرب عليه؟',
      'highStakes: هل الموضوع حسّاس؟',
      `recommendedCapability: القدرة الأنسب بعد الجواب من: ${CAPS.join(', ')} (اسم قدرة وظيفية، لا اسم أداة).`,
    ]
      .filter(Boolean)
      .join('\n');
  }
  return [
    'You are "Tebyan": one mind that understands the real intent behind a message, gives the first step, and internally decides the fitting capability.',
    highStakes
      ? 'High-stakes topic (medical/mental-health/legal/high-risk financial): contain first, no false certainty, gently note this is not a substitute for a professional.'
      : '',
    depth,
    'Infer intent even when the words are not explicit (e.g. hesitating to quit a failing project = a sunk-cost decision).',
    'Return JSON only: understanding, summary, action, clarifyingQuestion, primaryIntent, secondaryIntents, domain, urgency, social, highStakes, recommendedCapability.',
    `primaryIntent and secondaryIntents from: ${INTENTS.join(', ')}.`,
    'domain: short (parenting/work/money/relationship/health/study/idea/self/general).',
    'urgency: low|normal|high. social: is this an interaction with another party worth rehearsing?',
    `recommendedCapability: the fitting capability after the answer from: ${CAPS.join(', ')} (a functional capability name, not a tool name).`,
  ]
    .filter(Boolean)
    .join('\n');
}

function localTurn(query: string, language: Language, mode: ResponseMode): TurnComposition {
  const intent = classifyIntent(query, language);
  const answer = composeLocalAnswer(query, language, intent, mode);
  const highStakes = detectHighStakes(query);
  const social = intent.isSocialSituation;
  return {
    understanding: answer.understanding,
    summary: answer.summary,
    action: answer.action,
    clarifyingQuestion: null,
    source: 'local',
    semantic: {
      primaryIntent: intent.primary,
      secondaryIntents: intent.secondary,
      domain: intent.domain,
      urgency: intent.urgency,
      social,
      highStakes,
      recommendedCapability: capabilityForIntent(intent.primary, social),
    },
  };
}

function coerceIntent(v: unknown, fallback: IntentType): IntentType {
  if (typeof v !== 'string') return fallback;
  const s = v.trim().toLowerCase() as IntentType;
  return (INTENTS as string[]).includes(s) ? s : fallback;
}

export async function composeTurn(
  query: string,
  language: Language = 'ar',
  mode: ResponseMode = 'quick',
): Promise<TurnComposition> {
  // Stage 1 — local hint (also the fallback).
  const localHint = classifyIntent(query, language);
  const localHighStakes = detectHighStakes(query);

  try {
    const res = await proxyGenerateContent({
      contents: [{ role: 'user', parts: [{ text: query }] }],
      config: {
        systemInstruction: systemInstruction(language, mode, localHighStakes),
        temperature: 0.5,
        responseMimeType: 'application/json',
        responseSchema: {
          type: T.OBJECT,
          properties: {
            understanding: { type: T.STRING },
            summary: { type: T.STRING },
            action: { type: T.STRING },
            clarifyingQuestion: { type: T.STRING },
            primaryIntent: { type: T.STRING },
            secondaryIntents: { type: T.ARRAY, items: { type: T.STRING } },
            domain: { type: T.STRING },
            urgency: { type: T.STRING },
            social: { type: T.BOOLEAN },
            highStakes: { type: T.BOOLEAN },
            recommendedCapability: { type: T.STRING },
          },
          required: ['understanding', 'summary', 'action', 'primaryIntent'],
        },
      },
    });
    const raw = (res.text || '').trim();
    const s = raw.indexOf('{');
    const e = raw.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('no json');
    const d = JSON.parse(raw.slice(s, e + 1));

    const understanding = String(d.understanding || '').trim();
    const summary = String(d.summary || '').trim();
    const action = String(d.action || '').trim();
    if (!understanding || !summary || !action) throw new Error('empty');

    const primaryIntent = coerceIntent(d.primaryIntent, localHint.primary);
    const secondaryIntents = Array.isArray(d.secondaryIntents)
      ? d.secondaryIntents.map((x: unknown) => coerceIntent(x, 'understand')).filter((x: IntentType, i: number, a: IntentType[]) => a.indexOf(x) === i && x !== primaryIntent).slice(0, 3)
      : localHint.secondary;
    const social = typeof d.social === 'boolean' ? d.social : localHint.isSocialSituation;
    const highStakes = (typeof d.highStakes === 'boolean' ? d.highStakes : false) || localHighStakes;
    const urgency = ['low', 'normal', 'high'].includes(d.urgency) ? d.urgency : localHint.urgency;
    const domain = typeof d.domain === 'string' && d.domain ? d.domain : localHint.domain;
    const recommendedCapability =
      coerceCapability(d.recommendedCapability) || capabilityForIntent(primaryIntent, social);
    const clarify = String(d.clarifyingQuestion || '').trim();

    return {
      understanding,
      summary,
      action,
      clarifyingQuestion: clarify.length > 4 ? clarify : null,
      source: 'ai',
      semantic: { primaryIntent, secondaryIntents, domain, urgency, social, highStakes, recommendedCapability },
    };
  } catch {
    return localTurn(query, language, mode);
  }
}

export { detectHighStakes };
