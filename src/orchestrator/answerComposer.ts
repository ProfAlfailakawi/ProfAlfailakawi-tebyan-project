/**
 * AnswerComposer — produce the human answer shown first, before any complexity.
 *
 * Contract (unchanged for the UI): { understanding, summary, action }.
 *   understanding → "فهمت منك …"  (Tebyan reflecting the need back)
 *   summary       → "الخلاصة"      (the answer itself)
 *   action        → "ابدأ بهذا الآن" (the first concrete step)
 *
 * Primary path: one Gemini JSON call through the existing /api/ai/generate proxy
 * (which already injects the white-dialect + gender-neutral style layer, and
 * keeps the API key server-side). If the model is unavailable, rate-limited, or
 * offline, we degrade honestly to a LOCAL answer built from the same keyword
 * engine the old gateway used — the user still gets a useful, partial answer
 * instead of a failure screen.
 */

import { proxyGenerateContent } from '../lib/aiProxy';
import { buildDirectGuidance } from '../components/gateway/directGuidance';
import type {
  ClassifiedIntent,
  ComposedAnswer,
  IntentType,
  Language,
  ResponseMode,
} from './types';

const T = {
  OBJECT: 'OBJECT',
  STRING: 'STRING',
  ARRAY: 'ARRAY',
} as const;

const ENGINE_ENUM: IntentType[] = [
  'understand',
  'decide',
  'conflict',
  'plan',
  'create',
  'simulate',
  'research',
  'write',
  'learn',
  'future',
  'emotional',
];

function modeDirectiveAr(mode: ResponseMode): string {
  if (mode === 'simple')
    return 'اجعل الشرح بسيطاً جداً ومباشراً، بمثال قريب، وركّز على السبب الذي يمكن تغييره الآن.';
  if (mode === 'deep')
    return 'حلّل بعمق أكبر: اكشف الافتراض الأخطر، والزاوية غير الظاهرة، وما الذي يحتاج تحققاً قبل خطوة أكبر.';
  return 'اجعل الجواب مختصراً ومباشراً وكافياً للبدء فوراً.';
}

function modeDirectiveEn(mode: ResponseMode): string {
  if (mode === 'simple')
    return 'Keep it very simple and direct, with a close example, focused on the one cause that can change now.';
  if (mode === 'deep')
    return 'Go deeper: surface the riskiest assumption, the hidden angle, and what needs verifying before a bigger step.';
  return 'Keep the answer concise, direct, and enough to start immediately.';
}

function buildSystemInstruction(
  intent: ClassifiedIntent,
  language: Language,
  mode: ResponseMode,
): string {
  if (language === 'ar') {
    return [
      'أنت "تبيان": عقل واحد هادئ وذكي يساعد الإنسان على فهم ما يشغله ثم يعطيه أول خطوة عملية.',
      'مهمتك أن تفهم النية الحقيقية خلف كلام المستخدم، لا أن تكرر سؤاله.',
      intent.emotion === 'sad' || intent.emotion === 'stress' || intent.urgency === 'high'
        ? 'المستخدم في حالة ضغط أو انفعال: ابدأ بالاحتواء والتهدئة قبل أي نصيحة.'
        : '',
      modeDirectiveAr(mode),
      'أعد النتيجة بصيغة JSON فقط بالحقول: understanding, summary, action, clarifyingQuestion, recommendedEngine.',
      'understanding: جملة أو جملتان تبدأ بفهم ما يمر به المستخدم بعمق (وليس إعادة صياغة السؤال حرفياً).',
      'summary: الخلاصة/الجواب في 2-4 جمل واضحة.',
      'action: خطوة واحدة عملية يقدر يبدأ فيها اليوم، ملموسة وقابلة للتنفيذ.',
      'clarifyingQuestion: سؤال توضيحي واحد فقط، واتركه فارغاً إلا إذا كان سيغيّر الجواب فعلاً.',
      'recommendedEngine: اختر الأنسب من هذه القائمة لما يحتاجه المستخدم بعد الجواب: ' +
        ENGINE_ENUM.join(', ') +
        '.',
    ]
      .filter(Boolean)
      .join('\n');
  }
  return [
    'You are "Tebyan": one calm, intelligent mind that helps a person understand what is on their mind, then gives them the first practical step.',
    'Understand the real intent behind the message; do not repeat the question back.',
    intent.emotion === 'sad' || intent.emotion === 'stress' || intent.urgency === 'high'
      ? 'The user is under stress or emotion: lead with containment and calm before advice.'
      : '',
    modeDirectiveEn(mode),
    'Return JSON only with fields: understanding, summary, action, clarifyingQuestion, recommendedEngine.',
    'understanding: one or two sentences that grasp what the user is going through (not a paraphrase of the question).',
    'summary: the answer in 2-4 clear sentences.',
    'action: one concrete step they can start today.',
    'clarifyingQuestion: at most one; leave empty unless it would truly change the answer.',
    'recommendedEngine: pick the most fitting from: ' + ENGINE_ENUM.join(', ') + '.',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Local, offline-safe answer using the existing keyword guidance engine. */
export function composeLocalAnswer(
  query: string,
  language: Language,
  intent: ClassifiedIntent,
  mode: ResponseMode,
): ComposedAnswer {
  const journeyId =
    intent.primary === 'future'
      ? 'future'
      : intent.primary === 'conflict' || intent.primary === 'emotional'
        ? 'situation'
        : intent.primary;

  const guidance = buildDirectGuidance({
    query,
    language,
    journeyId,
    mode,
    specificInsight: null,
  });

  return {
    understanding: localUnderstanding(intent, language),
    summary: guidance.summary,
    action: guidance.action,
    clarifyingQuestion: null,
    engineHint: intent.primary,
    source: 'local',
  };
}

/** A warm, templated "فهمت منك" line derived from the classified intent. */
function localUnderstanding(intent: ClassifiedIntent, language: Language): string {
  const ar: Partial<Record<IntentType, string>> = {
    decide: 'فهمت منك أنك أمام قرار مهم وتريد أن تحسمه بثقة دون ندم لاحق.',
    conflict: 'فهمت منك أن هناك موقفاً مع طرف قريب منك، وتبحث عن طريقة تتعامل بها بهدوء وذكاء.',
    plan: 'فهمت منك أن لديك هدفاً واضحاً وتحتاج أن تحوّله إلى خطوات عملية تبدأ بها.',
    create: 'فهمت منك أن لديك فكرة وتريد أن تطوّرها إلى شيء أقوى وأوضح.',
    simulate: 'فهمت منك أنك تستعد لموقف أو حوار مهم وتريد أن تكون جاهزاً له.',
    future: 'فهمت منك أنك تريد أن ترى آثار الأمر على المدى القريب والبعيد قبل أن تمضي.',
    understand: 'فهمت منك أنك تريد أن تفهم هذا الموضوع بوضوح ومن جذوره.',
    research: 'فهمت منك أنك تبحث عن جواب موثوق ومبني على أساس واضح.',
    write: 'فهمت منك أنك تريد أن تصوغ أفكارك في نص واضح ومؤثر.',
    learn: 'فهمت منك أنك تريد أن تتعلم هذا الموضوع وتتأكد أنك فهمته فعلاً.',
    emotional: 'فهمت منك أنك تمر بضغط الآن، وأول ما يهمني أن نهدّئ الأمور قبل أي خطوة.',
  };
  const en: Partial<Record<IntentType, string>> = {
    decide: 'I understand you are facing an important decision and want to make it with confidence, without later regret.',
    conflict: 'I understand there is a situation with someone close to you, and you want a calm, smart way to handle it.',
    plan: 'I understand you have a clear goal and need to turn it into practical first steps.',
    create: 'I understand you have an idea and want to develop it into something stronger and clearer.',
    simulate: 'I understand you are preparing for an important conversation and want to be ready for it.',
    future: 'I understand you want to see the near and long-term effects before you move.',
    understand: 'I understand you want to grasp this topic clearly, from its roots.',
    research: 'I understand you are looking for a grounded, well-founded answer.',
    write: 'I understand you want to shape your thoughts into clear, effective writing.',
    learn: 'I understand you want to learn this and make sure it truly stuck.',
    emotional: 'I understand you are under pressure right now; first I want us to steady things before any step.',
  };
  const table = language === 'ar' ? ar : en;
  return (
    table[intent.primary] ||
    (language === 'ar'
      ? 'فهمت منك ما يشغلك، ودعني أرتّب لك أوضح بداية.'
      : 'I understand what is on your mind; let me arrange the clearest starting point for you.')
  );
}

function coerceEngineHint(value: unknown): IntentType | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase() as IntentType;
  return (ENGINE_ENUM as string[]).includes(v) ? v : null;
}

/**
 * Compose the answer. Resolves to an AI answer when possible, otherwise a local
 * one. Never throws — a partial local answer always beats a failure.
 */
export async function composeAnswer(
  query: string,
  language: Language,
  intent: ClassifiedIntent,
  mode: ResponseMode = 'quick',
): Promise<ComposedAnswer> {
  try {
    const res = await proxyGenerateContent({
      contents: [{ role: 'user', parts: [{ text: query }] }],
      config: {
        systemInstruction: buildSystemInstruction(intent, language, mode),
        temperature: 0.5,
        responseMimeType: 'application/json',
        responseSchema: {
          type: T.OBJECT,
          properties: {
            understanding: { type: T.STRING },
            summary: { type: T.STRING },
            action: { type: T.STRING },
            clarifyingQuestion: { type: T.STRING },
            recommendedEngine: { type: T.STRING },
          },
          required: ['understanding', 'summary', 'action'],
        },
      },
    });

    const raw = (res.text || '').trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) throw new Error('no json');
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    const understanding = String(parsed.understanding || '').trim();
    const summary = String(parsed.summary || '').trim();
    const action = String(parsed.action || '').trim();
    if (!understanding || !summary || !action) throw new Error('empty fields');

    const clarify = String(parsed.clarifyingQuestion || '').trim();
    return {
      understanding,
      summary,
      action,
      clarifyingQuestion: clarify.length > 4 ? clarify : null,
      engineHint: coerceEngineHint(parsed.recommendedEngine) || intent.primary,
      source: 'ai',
    };
  } catch {
    return composeLocalAnswer(query, language, intent, mode);
  }
}
