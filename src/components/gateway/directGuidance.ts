export type ResponseMode = 'quick' | 'simple' | 'deep';

export type DirectGuidance = {
  summary: string;
  action: string;
  context: string;
};

type GuidanceInput = {
  query: string;
  language: 'ar' | 'en';
  journeyId: string;
  mode: ResponseMode;
  specificInsight?: string | null;
};

const includesAny = (text: string, words: string[]) => words.some((word) => text.includes(word));

export function buildDirectGuidance({
  query,
  language,
  journeyId,
  mode,
  specificInsight,
}: GuidanceInput): DirectGuidance {
  const q = query.toLowerCase();
  const isArabic = language === 'ar';

  const contextAr =
    mode === 'quick'
      ? 'مختصر ومباشر'
      : mode === 'simple'
        ? 'شرح مبسط'
        : 'تحليل أعمق';
  const contextEn =
    mode === 'quick'
      ? 'Quick and direct'
      : mode === 'simple'
        ? 'Simple explanation'
        : 'Deeper analysis';

  let summaryAr = specificInsight || 'الموضوع يحتاج فصل المشكلة الأساسية عن التفاصيل المحيطة بها، ثم البدء بأقرب خطوة يمكن التحكم بها الآن.';
  let actionAr = 'اكتب النتيجة التي تريد الوصول إليها في جملة واحدة، ثم حدّد أصغر خطوة آمنة تستطيع تنفيذها اليوم.';
  let summaryEn = specificInsight || 'The issue needs the core problem separated from surrounding details, followed by the nearest controllable step.';
  let actionEn = 'Write the outcome you want in one sentence, then choose the smallest safe step you can take today.';

  if (includesAny(q, ['غضب', 'صراخ', 'عصبي', 'منفعل', 'angry', 'anger', 'scream'])) {
    summaryAr = 'الأولوية الآن ليست كسب النقاش، بل تهدئة التصعيد وفهم الحاجة أو الضغط الموجود خلف الغضب.';
    actionAr = 'أوقف الردود الحادة مؤقتاً، سمِّ الشعور بهدوء، ثم اسأل سؤالاً واحداً: «شنو أكثر شي مضايقك الحين؟»';
    summaryEn = 'The priority is not winning the argument; it is lowering escalation and understanding the need behind the anger.';
    actionEn = 'Pause sharp replies, name the emotion calmly, then ask one question: “What is bothering you most right now?”';
  } else if (includesAny(q, ['كذب', 'كاذب', 'lie', 'lying'])) {
    summaryAr = 'تكرار الكذب غالباً لا يُعالج بالعقوبة وحدها؛ المطلوب حماية الصدق من الخوف ومعرفة الدافع قبل الحكم.';
    actionAr = 'ابدأ بجملة مطمئنة: «أهم شي عندي أعرف الحقيقة، وبعدها نحل المشكلة مع بعض»، ثم ناقش الأثر لا شخصية الإنسان.';
    summaryEn = 'Repeated lying is rarely solved by punishment alone; honesty must feel safer than concealment, and the motive should be understood first.';
    actionEn = 'Begin with reassurance: “What matters first is knowing the truth; then we solve it together,” and discuss the impact, not the person’s identity.';
  } else if (includesAny(q, ['خوف', 'قلق', 'يخاف', 'متوتر', 'fear', 'afraid', 'anxiety', 'anxious'])) {
    summaryAr = 'الخوف هنا يحتاج شعوراً بالأمان قبل النصائح. تقليل الشعور أو السخرية منه قد يزيده حتى لو كانت النية طيبة.';
    actionAr = 'اطلب وصف الخوف بكلمات بسيطة، ثم اتفقوا على تجربة صغيرة وآمنة بدلاً من إجباره على مواجهة كبيرة دفعة واحدة.';
    summaryEn = 'Fear needs safety before advice. Minimising or mocking it can intensify it even when the intention is good.';
    actionEn = 'Ask for a simple description of the fear, then agree on one small safe exposure rather than a large forced confrontation.';
  } else if (includesAny(q, ['قرار', 'محتار', 'اختار', 'خيار', 'decision', 'choose', 'unsure'])) {
    summaryAr = 'الحيرة غالباً سببها خلط ما هو مهم فعلاً بما هو مخيف أو عاجل. القرار يصبح أوضح عندما تفصل القيم عن الضغوط المؤقتة.';
    actionAr = 'اكتب الخيارين، وتحت كل واحد: أفضل نتيجة، أسوأ نتيجة، وما الذي ستندم عليه أكثر بعد سنة.';
    summaryEn = 'Uncertainty often comes from mixing what truly matters with what feels urgent or frightening. Separate values from temporary pressure.';
    actionEn = 'Write the two options and under each: best outcome, worst outcome, and what you would regret more one year from now.';
  } else if (includesAny(q, ['فكرة', 'ابتكار', 'مشروع', 'تطوير', 'idea', 'innovation', 'project'])) {
    summaryAr = 'قوة الفكرة لا تبدأ بكثرة المزايا، بل بوضوح المشكلة التي تحلها ولمن تحلها ولماذا سيهتم بها الناس.';
    actionAr = 'أكمل هذه الجملة: «هذه الفكرة تساعد ___ على ___ من دون ___»، ثم اختبرها مع شخص واحد من الفئة المستهدفة.';
    summaryEn = 'An idea becomes strong through a clear problem, audience, and reason to care—not through adding more features.';
    actionEn = 'Complete: “This idea helps ___ to ___ without ___,” then test that sentence with one target user.';
  } else if (includesAny(q, ['خطة', 'هدف', 'تنفيذ', 'طريق', 'plan', 'goal', 'execute', 'roadmap'])) {
    summaryAr = 'الهدف يبدو كبيراً لأن بدايته ونقطة قياسه غير محددتين. تحويله إلى نتيجة أسبوعية يقلل التشتت ويكشف التقدم.';
    actionAr = 'حدّد نتيجة واحدة للأسبوع القادم، ثم اختر ثلاث مهام فقط تخدمها واحذف أي مهمة لا ترتبط بها مباشرة.';
    summaryEn = 'The goal feels large because its start and measurement point are unclear. A weekly outcome reduces noise and reveals progress.';
    actionEn = 'Choose one outcome for next week, then keep only three tasks that directly serve it.';
  } else if (journeyId === 'situation') {
    summaryAr = 'الموقف يحتاج تهدئة الانفعال أولاً، ثم تحديد ما الذي حدث فعلاً وما الذي تم تفسيره أو افتراضه.';
    actionAr = 'اكتب ثلاثة أسطر: ما حدث، ما شعرت به، وما الذي تحتاجه الآن. استخدمها قبل أي مواجهة أو رد.';
    summaryEn = 'The situation needs emotion lowered first, then facts separated from interpretations and assumptions.';
    actionEn = 'Write three lines: what happened, what you felt, and what you need now. Use them before responding.';
  } else if (journeyId === 'future') {
    summaryAr = 'لا يمكن ضمان المستقبل، لكن يمكن تقليل المفاجآت ببناء أكثر من سيناريو وتحديد العلامات المبكرة لكل واحد.';
    actionAr = 'اكتب ثلاثة سيناريوهات: الأفضل، المرجح، والأسوأ؛ ثم حدّد إشارة مبكرة واحدة تدل على كل سيناريو.';
    summaryEn = 'The future cannot be guaranteed, but surprises can be reduced through scenarios and early signals.';
    actionEn = 'Write best, likely, and worst scenarios, then one early signal for each.';
  }

  if (mode === 'deep') {
    summaryAr += ' افحص أيضاً الافتراض الذي لو كان خاطئاً سيتغير معه فهمك للمشكلة بالكامل.';
    actionAr += ' وبعدها حدّد معلومة واحدة تحتاج التحقق منها قبل اتخاذ خطوة أكبر.';
    summaryEn += ' Also test the assumption that would change your entire understanding if it proved false.';
    actionEn += ' Then identify one fact to verify before taking a larger step.';
  } else if (mode === 'simple') {
    summaryAr += ' ركّز على السبب القابل للتغيير الآن، لا على كل الأسباب مرة واحدة.';
    summaryEn += ' Focus on the cause you can change now rather than every cause at once.';
  }

  return {
    summary: isArabic ? summaryAr : summaryEn,
    action: isArabic ? actionAr : actionEn,
    context: isArabic ? contextAr : contextEn,
  };
}
