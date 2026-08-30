/**
 * Capability services — the actual work behind each inline capability.
 *
 * These stay in CONTEXT (original question + understanding + clarifications +
 * prior capability results are fed into every prompt), reuse the existing AI
 * infrastructure (the /api proxy + gemini.ts generators — no key on the client),
 * and normalize every output to the unified CapabilityResult contract so the
 * session can render them all with one card.
 *
 * Safety: for high-stakes topics (medical / legal / mental-health / high-risk
 * financial) the system instruction forbids false certainty and adds a "this is
 * not a substitute for a professional" note, and comparison/future leans stay
 * explicitly non-committal.
 */

import { proxyGenerateContent } from '../../lib/aiProxy';
import type { CapabilityContext, CapabilityResult, CapabilityId } from './types';

const T = { OBJECT: 'OBJECT', STRING: 'STRING', ARRAY: 'ARRAY' } as const;

function contextPreamble(ctx: CapabilityContext): string {
  const ar = ctx.language === 'ar';
  const lines: string[] = [];
  lines.push(
    ar
      ? `سؤال المستخدم الأصلي: «${ctx.originalQuestion}»`
      : `User's original question: "${ctx.originalQuestion}"`,
  );
  if (ctx.understanding)
    lines.push(ar ? `ما فهمناه: ${ctx.understanding}` : `What we understood: ${ctx.understanding}`);
  if (ctx.keyFacts && ctx.keyFacts.length)
    lines.push(
      ar ? `حقائق مهمة في الجلسة: ${ctx.keyFacts.join(' | ')}` : `Key session facts: ${ctx.keyFacts.join(' | ')}`,
    );
  if (ctx.recentTurns && ctx.recentTurns.length)
    lines.push(
      ar
        ? `سياق سابق: ${ctx.recentTurns.map((t) => `"${t.userInput}" → ${t.summary}`).join(' | ')}`
        : `Prior context: ${ctx.recentTurns.map((t) => `"${t.userInput}" → ${t.summary}`).join(' | ')}`,
    );
  if (ctx.clarifications.length)
    lines.push(
      ar
        ? `توضيحات أضافها: ${ctx.clarifications.join(' | ')}`
        : `Clarifications the user added: ${ctx.clarifications.join(' | ')}`,
    );
  if (ctx.priorResults.length)
    lines.push(
      ar
        ? `خطوات سابقة في نفس الجلسة: ${ctx.priorResults
            .map((r) => `${r.title}${r.summary ? ` (${r.summary})` : ''}`)
            .join(' | ')}`
        : `Earlier steps in this session: ${ctx.priorResults
            .map((r) => `${r.title}${r.summary ? ` (${r.summary})` : ''}`)
            .join(' | ')}`,
    );
  return lines.join('\n');
}

function safetyClause(ctx: CapabilityContext): string {
  if (!ctx.highStakes) return '';
  return ctx.language === 'ar'
    ? 'هذا موضوع حسّاس (صحي/نفسي/قانوني/مالي عالي المخاطر): لا تعطِ يقيناً زائفاً، وذكّر بلطف أن هذا لا يغني عن مختص، ولا تقدّم توصية قاطعة تبدو بديلاً عن استشارة متخصصة.'
    : 'This is a high-stakes topic (medical/mental-health/legal/high-risk financial): do not give false certainty, gently note this is not a substitute for a professional, and avoid a definitive recommendation that could replace expert advice.';
}

async function generateStructured(
  systemInstruction: string,
  userText: string,
  properties: Record<string, unknown>,
  required: string[],
): Promise<any> {
  const res = await proxyGenerateContent({
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    config: {
      systemInstruction,
      temperature: 0.5,
      responseMimeType: 'application/json',
      responseSchema: { type: T.OBJECT, properties, required },
    },
  });
  const raw = (res.text || '').trim();
  const s = raw.indexOf('{');
  const e = raw.lastIndexOf('}');
  if (s === -1 || e === -1) throw new Error('no json');
  return JSON.parse(raw.slice(s, e + 1));
}

const strArr = { type: T.ARRAY, items: { type: T.STRING } };

/* ------------------------------- compare ------------------------------- */

export async function runCompare(ctx: CapabilityContext): Promise<CapabilityResult> {
  const ar = ctx.language === 'ar';
  const sys = [
    ar
      ? 'أنت "تبيان". حلّل قراراً بين خيارين بهدوء وإنصاف. افصل القيم عن الضغوط المؤقتة.'
      : 'You are "Tebyan". Analyse a decision between two options calmly and fairly.',
    contextPreamble(ctx),
    safetyClause(ctx),
    ar
      ? 'أعد JSON: optionA, optionB (عنوان قصير لكل خيار)، gains, losses (مصفوفتان قصيرتان)، biggestRisk، regret (ما قد يندم عليه أكثر)، missingInfo (المعلومة الناقصة قبل الحسم)، lean (إلى أي اتجاه يميل التحليل حالياً، بصياغة غير قاطعة).'
      : 'Return JSON: optionA, optionB (short title each), gains, losses (short arrays), biggestRisk, regret, missingInfo, lean (non-committal current lean).',
  ]
    .filter(Boolean)
    .join('\n');
  const d = await generateStructured(
    sys,
    ctx.originalQuestion,
    {
      optionA: { type: T.STRING },
      optionB: { type: T.STRING },
      gains: strArr,
      losses: strArr,
      biggestRisk: { type: T.STRING },
      regret: { type: T.STRING },
      missingInfo: { type: T.STRING },
      lean: { type: T.STRING },
    },
    ['optionA', 'optionB', 'gains', 'losses'],
  );
  return {
    type: 'compare',
    title: ar ? 'مقارنة الخيارين' : 'Comparing the options',
    sections: [
      { label: ar ? 'الخيار الأول' : 'Option one', body: d.optionA, tone: 'neutral' },
      { label: ar ? 'الخيار الثاني' : 'Option two', body: d.optionB, tone: 'neutral' },
      { label: ar ? 'ما تكسبه' : 'What you gain', items: d.gains, tone: 'positive' },
      { label: ar ? 'ما تخسره' : 'What you lose', items: d.losses, tone: 'risk' },
      ...(d.biggestRisk ? [{ label: ar ? 'أكبر مخاطرة' : 'Biggest risk', body: d.biggestRisk, tone: 'risk' as const }] : []),
      ...(d.regret ? [{ label: ar ? 'ما قد تندم عليه' : 'What you might regret', body: d.regret }] : []),
      ...(d.missingInfo ? [{ label: ar ? 'معلومة ناقصة قبل القرار' : 'Missing info before deciding', body: d.missingInfo, tone: 'muted' as const }] : []),
    ],
    lean: d.lean,
    source: 'ai',
  };
}

/* -------------------------------- plan --------------------------------- */

export async function runPlan(ctx: CapabilityContext): Promise<CapabilityResult> {
  const ar = ctx.language === 'ar';
  const sys = [
    ar
      ? 'أنت "تبيان". حوّل هدف المستخدم إلى خطة أولية صغيرة وقابلة للتنفيذ، لا خطة ضخمة.'
      : 'You are "Tebyan". Turn the goal into a small, actionable first plan — not a huge timeline.',
    contextPreamble(ctx),
    ar
      ? 'أعد JSON: today (خطوة اليوم)، thisWeek، in30Days، checkpoint (نقطة قياس)، avoidNow (ما الذي يجب ألا تفعله الآن).'
      : 'Return JSON: today, thisWeek, in30Days, checkpoint, avoidNow.',
  ].join('\n');
  const d = await generateStructured(
    sys,
    ctx.originalQuestion,
    {
      today: { type: T.STRING },
      thisWeek: { type: T.STRING },
      in30Days: { type: T.STRING },
      checkpoint: { type: T.STRING },
      avoidNow: { type: T.STRING },
    },
    ['today', 'thisWeek', 'in30Days'],
  );
  return {
    type: 'plan',
    title: ar ? 'خطتك الأولية' : 'Your first plan',
    sections: [
      { label: ar ? 'اليوم' : 'Today', body: d.today, tone: 'positive' },
      { label: ar ? 'هذا الأسبوع' : 'This week', body: d.thisWeek },
      { label: ar ? 'خلال 30 يومًا' : 'Within 30 days', body: d.in30Days },
      ...(d.checkpoint ? [{ label: ar ? 'نقطة قياس' : 'Checkpoint', body: d.checkpoint, tone: 'muted' as const }] : []),
      ...(d.avoidNow ? [{ label: ar ? 'لا تفعل هذا الآن' : 'Do not do this now', body: d.avoidNow, tone: 'risk' as const }] : []),
    ],
    source: 'ai',
  };
}

/* ----------------------------- perspectives ---------------------------- */

export async function runPerspectives(ctx: CapabilityContext): Promise<CapabilityResult> {
  const ar = ctx.language === 'ar';
  const sys = [
    ar
      ? 'أنت "تبيان". اعرض الموقف من ثلاث زوايا مختلفة فقط، ثم القاسم المشترك بينها.'
      : 'You are "Tebyan". Show exactly three different angles, then their common thread.',
    contextPreamble(ctx),
    safetyClause(ctx),
    ar
      ? 'أعد JSON: practical (زاوية عملية)، human (زاوية إنسانية)، critical (زاوية نقدية)، commonThread (المشترك بينها).'
      : 'Return JSON: practical, human, critical, commonThread.',
  ]
    .filter(Boolean)
    .join('\n');
  const d = await generateStructured(
    sys,
    ctx.originalQuestion,
    {
      practical: { type: T.STRING },
      human: { type: T.STRING },
      critical: { type: T.STRING },
      commonThread: { type: T.STRING },
    },
    ['practical', 'human', 'critical'],
  );
  return {
    type: 'perspectives',
    title: ar ? 'ثلاث زوايا' : 'Three angles',
    sections: [
      { label: ar ? 'زاوية عملية' : 'Practical angle', body: d.practical },
      { label: ar ? 'زاوية إنسانية' : 'Human angle', body: d.human },
      { label: ar ? 'زاوية نقدية' : 'Critical angle', body: d.critical },
      ...(d.commonThread ? [{ label: ar ? 'المشترك بينها' : 'The common thread', body: d.commonThread, tone: 'positive' as const }] : []),
    ],
    source: 'ai',
  };
}

/* ------------------------------- future -------------------------------- */

export async function runFuture(ctx: CapabilityContext): Promise<CapabilityResult> {
  const ar = ctx.language === 'ar';
  const sys = [
    ar
      ? 'أنت "تبيان". اعرض ما قد يحدث لاحقاً دون ادعاء يقين.'
      : 'You are "Tebyan". Show what may happen later without claiming certainty.',
    contextPreamble(ctx),
    safetyClause(ctx),
    ar
      ? 'أعد JSON: ifYouDoNow (لو فعلت هذا الآن)، afterWeek، after3Months، biggestUpside (أكبر احتمال إيجابي)، biggestRisk، earlySignal (إشارة مبكرة تراقبها).'
      : 'Return JSON: ifYouDoNow, afterWeek, after3Months, biggestUpside, biggestRisk, earlySignal.',
  ]
    .filter(Boolean)
    .join('\n');
  const d = await generateStructured(
    sys,
    ctx.originalQuestion,
    {
      ifYouDoNow: { type: T.STRING },
      afterWeek: { type: T.STRING },
      after3Months: { type: T.STRING },
      biggestUpside: { type: T.STRING },
      biggestRisk: { type: T.STRING },
      earlySignal: { type: T.STRING },
    },
    ['ifYouDoNow', 'afterWeek', 'after3Months'],
  );
  return {
    type: 'future',
    title: ar ? 'ما قد يحدث لاحقًا' : 'What may happen later',
    sections: [
      { label: ar ? 'لو فعلت هذا الآن' : 'If you act now', body: d.ifYouDoNow },
      { label: ar ? 'بعد أسبوع' : 'After a week', body: d.afterWeek },
      { label: ar ? 'بعد 3 أشهر' : 'After 3 months', body: d.after3Months },
      ...(d.biggestUpside ? [{ label: ar ? 'أكبر احتمال إيجابي' : 'Biggest upside', body: d.biggestUpside, tone: 'positive' as const }] : []),
      ...(d.biggestRisk ? [{ label: ar ? 'أكبر خطر' : 'Biggest risk', body: d.biggestRisk, tone: 'risk' as const }] : []),
      ...(d.earlySignal ? [{ label: ar ? 'إشارة مبكرة راقبها' : 'Early signal to watch', body: d.earlySignal, tone: 'muted' as const }] : []),
    ],
    source: 'ai',
  };
}

/* ------------------------------ develop -------------------------------- */

export async function runDevelop(ctx: CapabilityContext): Promise<CapabilityResult> {
  const ar = ctx.language === 'ar';
  const sys = [
    ar
      ? 'أنت "تبيان". قوِّ فكرة المستخدم بثلاث ضربات ثم اكتب نسخة مطورة موجزة.'
      : 'You are "Tebyan". Strengthen the idea in three moves, then write a short improved version.',
    contextPreamble(ctx),
    ar
      ? 'أعد JSON: whatsDifferent (ما المختلف فيها)، whatToCut (ما الذي يمكن حذفه)، whatMakesMemorable (ما يجعلها لا تُنسى)، improvedVersion (نسخة مطورة في جملتين).'
      : 'Return JSON: whatsDifferent, whatToCut, whatMakesMemorable, improvedVersion.',
  ].join('\n');
  const d = await generateStructured(
    sys,
    ctx.originalQuestion,
    {
      whatsDifferent: { type: T.STRING },
      whatToCut: { type: T.STRING },
      whatMakesMemorable: { type: T.STRING },
      improvedVersion: { type: T.STRING },
    },
    ['whatsDifferent', 'whatToCut', 'whatMakesMemorable', 'improvedVersion'],
  );
  return {
    type: 'develop',
    title: ar ? 'لنقوِّ الفكرة' : "Let's strengthen it",
    sections: [
      { label: ar ? 'ما المختلف فيها؟' : "What's different?", body: d.whatsDifferent },
      { label: ar ? 'ما الذي يمكن حذفه؟' : 'What to cut?', body: d.whatToCut, tone: 'muted' },
      { label: ar ? 'ما يجعلها لا تُنسى؟' : 'What makes it memorable?', body: d.whatMakesMemorable, tone: 'positive' },
      { label: ar ? 'نسخة مطوّرة' : 'Improved version', body: d.improvedVersion, tone: 'positive' },
    ],
    source: 'ai',
  };
}

/* ------------------------------ simplify ------------------------------- */

export async function runSimplify(ctx: CapabilityContext): Promise<CapabilityResult> {
  const ar = ctx.language === 'ar';
  // Reuse the existing simplifyConcept generator.
  const { simplifyConcept } = await import('../../services/gemini');
  const text = await simplifyConcept(ctx.originalQuestion, ctx.language);
  return {
    type: 'simplify',
    title: ar ? 'بصيغة أبسط' : 'In simpler terms',
    summary: typeof text === 'string' ? text : String(text ?? ''),
    source: 'ai',
  };
}

/* ------------------------------ research ------------------------------- */

export async function runResearch(ctx: CapabilityContext): Promise<CapabilityResult> {
  const ar = ctx.language === 'ar';

  // Real grounding: ask the backend Evidence Mode to answer with retrieved
  // sources (web search / internal file store). Citations come from the model's
  // groundingMetadata — never invented. High-stakes prefers web grounding.
  const { proxyGenerateEvidence } = await import('../../lib/aiProxy');
  const prompt = [
    contextPreamble(ctx),
    safetyClause(ctx),
    ar
      ? `اجمع أهم 3 نقاط حول: «${ctx.originalQuestion}»، معتمداً على مصادر حقيقية قدر الإمكان. لا تختلق أي مصدر أو دراسة أو رابط.`
      : `Gather the 3 most important points on: "${ctx.originalQuestion}", grounded in real sources where possible. Never invent a source, study, or URL.`,
  ]
    .filter(Boolean)
    .join('\n');

  let text = '';
  let citations: Array<{ title?: string; uri?: string; snippet?: string; kind?: string }> = [];
  let source: 'web' | 'internal' | 'model' = 'model';
  try {
    const res = await proxyGenerateEvidence({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: ar ? 'أنت "تبيان" باحث أمين.' : 'You are "Tebyan", an honest researcher.',
        temperature: 0.4,
      },
      evidenceMode: ctx.highStakes ? 'web' : 'auto',
    });
    text = (res.text || '').trim();
    const ev = res.evidence;
    if (ev && Array.isArray(ev.citations)) citations = ev.citations as typeof citations;
    if (ev && (ev.source === 'web' || ev.source === 'internal')) source = ev.source;
  } catch {
    /* fall through to analytical (ungrounded) result */
  }

  // Optionally enrich with Tebyan's own curated corpus (Qawl Fasl) as an
  // internal source — best-effort, never fabricated.
  const internalClaims: NonNullable<CapabilityResult['claims']> = [];
  try {
    const { qawlFaslService } = await import('../../services/qawlFaslService');
    // Guard against a slow corpus lookup stalling the capability.
    const matches = await Promise.race([
      qawlFaslService.searchQuestions(ctx.originalQuestion),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000)),
    ]);
    (Array.isArray(matches) ? matches : []).slice(0, 1).forEach((m: any) => {
      const title = m?.question || m?.title;
      const snippet = m?.quickSummary || m?.quickAnswer;
      if (title && snippet)
        internalClaims.push({
          claim: String(snippet).slice(0, 220),
          sourceTitle: String(title),
          sourceType: 'internal',
          evidenceSnippet: ar ? 'من مكتبة تبيان' : 'From the Tebyan library',
          confidence: 'medium',
          verified: true,
        });
    });
  } catch {
    /* corpus unavailable — skip silently */
  }

  const webClaims: NonNullable<CapabilityResult['claims']> = citations
    .filter((c) => c && (c.title || c.uri || c.snippet))
    .slice(0, 4)
    .map((c) => ({
      claim: String(c.snippet || c.title || '').slice(0, 240),
      sourceTitle: c.title ? String(c.title) : undefined,
      sourceUrl: c.uri ? String(c.uri) : undefined,
      sourceType: c.kind === 'internal' ? ('internal' as const) : ('web' as const),
      evidenceSnippet: c.snippet ? String(c.snippet) : undefined,
      confidence: 'medium' as const,
      verified: true,
    }));

  const claims = [...internalClaims, ...webClaims];
  const grounded = claims.length > 0;

  if (grounded) {
    return {
      type: 'research',
      title: ar ? 'نقاط بمصادر' : 'Points with sources',
      summary: text || (ar ? 'إليك ما وجدته مع مصادره.' : "Here's what I found, with its sources."),
      claims,
      grounded: true,
      source: source === 'web' ? 'web' : 'internal',
    };
  }

  // No real source retrieved — be honest: analytical, not "grounded".
  return {
    type: 'research',
    title: ar ? 'نقاط تحليلية' : 'Analytical points',
    summary:
      (text ? text + '\n\n' : '') +
      (ar
        ? 'هذه خلاصة تحليلية من تبيان وليست معلومة موثقة بمصدر مباشر.'
        : 'This is Tebyan’s analytical summary, not information verified against a direct source.'),
    grounded: false,
    source: 'ai',
  };
}

/* ----------------------------- simulation ------------------------------ */

/**
 * Post-rehearsal analysis for the inline simulation. The conversation itself
 * reuses gemini.ts `generateRoleplayResponse`; this produces the short,
 * human debrief the inline UX shows (what worked / what weakened / a better
 * line / what to avoid).
 */
export async function analyzeRehearsal(
  chatHistory: Array<{ role: 'user' | 'ai'; text: string }>,
  ctx: CapabilityContext,
): Promise<CapabilityResult> {
  const ar = ctx.language === 'ar';
  const transcript = chatHistory
    .map((m) => `${m.role === 'user' ? (ar ? 'المستخدم' : 'User') : ar ? 'الطرف الآخر' : 'Other'}: ${m.text}`)
    .join('\n');
  const sys = [
    ar
      ? 'أنت "تبيان" تحلل أداء المستخدم في تدريب حواري. كن بسيطاً وعملياً ومشجعاً، لا أكاديمياً.'
      : 'You are "Tebyan" analysing the user\'s performance in a rehearsed conversation. Be simple, practical, encouraging.',
    contextPreamble(ctx),
    ar
      ? 'أعد JSON: strength (ما الذي نجح)، weakness (ما الذي أضعف موقفه)، betterSentence (جملة أفضل كان يمكن قولها)، avoid (شيء كان يجب تجنبه)، summary (سطر واحد).'
      : 'Return JSON: strength, weakness, betterSentence, avoid, summary.',
  ].join('\n');
  try {
    const d = await generateStructured(
      sys,
      transcript || ctx.originalQuestion,
      {
        strength: { type: T.STRING },
        weakness: { type: T.STRING },
        betterSentence: { type: T.STRING },
        avoid: { type: T.STRING },
        summary: { type: T.STRING },
      },
      ['strength', 'weakness', 'betterSentence'],
    );
    return {
      type: 'simulate',
      title: ar ? 'كيف كان أداؤك؟' : 'How did you do?',
      summary: d.summary,
      sections: [
        { label: ar ? 'نقطة قوية' : 'What worked', body: d.strength, tone: 'positive' },
        { label: ar ? 'نقطة تحتاج تعديل' : 'What to adjust', body: d.weakness, tone: 'risk' },
        { label: ar ? 'جملة أفضل' : 'A better line', body: d.betterSentence, tone: 'neutral' },
        ...(d.avoid ? [{ label: ar ? 'شيء كان يجب تجنبه' : 'Something to avoid', body: d.avoid, tone: 'muted' as const }] : []),
      ],
      source: 'ai',
    };
  } catch {
    return {
      type: 'simulate',
      title: ar ? 'انتهى التدريب' : 'Rehearsal finished',
      summary: ar
        ? 'تعذّر تحليل الأداء الآن، لكن التدريب نفسه مفيد. جرّب مرة ثانية إذا أردت.'
        : "I couldn't analyse it just now, but the rehearsal itself helps. Try again if you like.",
      degraded: true,
      source: 'local',
    };
  }
}

/* --------------------------- one-shot dispatch -------------------------- */

const ONE_SHOT: Record<
  Exclude<CapabilityId, 'simulate' | 'quiz'>,
  (ctx: CapabilityContext) => Promise<CapabilityResult>
> = {
  compare: runCompare,
  plan: runPlan,
  perspectives: runPerspectives,
  future: runFuture,
  develop: runDevelop,
  simplify: runSimplify,
  research: runResearch,
};

/** Run a one-shot capability with a safe, human fallback on failure. */
export async function runOneShotCapability(
  id: Exclude<CapabilityId, 'simulate' | 'quiz'>,
  ctx: CapabilityContext,
): Promise<CapabilityResult> {
  try {
    return await ONE_SHOT[id](ctx);
  } catch {
    const ar = ctx.language === 'ar';
    return {
      type: id,
      title: ar ? 'تعذّر إكمال هذه الخطوة' : "Couldn't finish this step",
      summary: ar
        ? 'تعذّر إكمال هذه الخطوة الآن، لكن يمكننا المتابعة بطريقة أخرى.'
        : "I couldn't finish this step just now, but we can continue another way.",
      degraded: true,
      source: 'local',
    };
  }
}
