export type ResponseMode = "quick" | "simple" | "deep";

export type DirectGuidance = {
  summary: string;
  action: string;
  context: string;
};

type GuidanceInput = {
  query: string;
  language: "ar" | "en";
  journeyId: string;
  mode: ResponseMode;
  specificInsight?: string | null;
};

const includesAny = (text: string, words: string[]) =>
  words.some((word) => text.includes(word));

export function buildDirectGuidance({
  query,
  language,
  journeyId,
  mode,
  specificInsight,
}: GuidanceInput): DirectGuidance {
  const q = query.toLowerCase();
  const isArabic = language === "ar";

  const contextAr =
    mode === "quick"
      ? "مختصر ومباشر"
      : mode === "simple"
        ? "شرح مبسط"
        : "تحليل أعمق";
  const contextEn =
    mode === "quick"
      ? "Quick and direct"
      : mode === "simple"
        ? "Simple explanation"
        : "Deeper analysis";

  let summaryAr =
    specificInsight ||
    "الموضوع يحتاج فصل المشكلة الأساسية عن التفاصيل المحيطة بها، ثم البدء بأقرب خطوة يمكن التحكم بها الآن.";
  let actionAr =
    "اكتب النتيجة التي تريد الوصول إليها في جملة واحدة، ثم حدّد أصغر خطوة آمنة تستطيع تنفيذها اليوم.";
  let summaryEn =
    specificInsight ||
    "The issue needs the core problem separated from surrounding details, followed by the nearest controllable step.";
  let actionEn =
    "Write the outcome you want in one sentence, then choose the smallest safe step you can take today.";

  if (
    includesAny(q, [
      "مدرسة",
      "المدرسه",
      "دوام",
      "يكره المدرسة",
      "ما يحب المدرسة",
      "school",
      "classroom",
    ])
  ) {
    summaryAr =
      "لا تبدأ بالإجبار أو اتهامه بالكسل. نفوره من المدرسة قد يكون سببه صعوبة دراسية، موقف مع معلم، تنمّر، قلق، أو إرهاق ونوم غير كافٍ؛ المطلوب معرفة متى بدأ وما الذي يتكرر قبله.";
    actionAr =
      "اجلس معه اليوم عشر دقائق بلا محاضرة واسأله: «ما أصعب وقت في المدرسة؟». تواصل مع المدرسة خلال 48 ساعة، واطلب مساعدة مختص إذا استمر الرفض أو ظهرت آلام وقلق متكرران قبل الدوام.";
    summaryEn =
      "Do not begin with force or accusations of laziness. School avoidance may reflect learning difficulty, a teacher issue, bullying, anxiety, or poor sleep; first identify when it began and what happens before it.";
    actionEn =
      "Have a calm ten-minute conversation today and ask, “What is the hardest part of school?” Contact the school within 48 hours, and seek professional help if refusal or repeated physical anxiety symptoms continue.";
  } else if (
    includesAny(q, ["تنمر", "يتنمر", "يتنمرون", "bully", "bullying"])
  ) {
    summaryAr =
      "التنمّر ليس خلافاً عادياً ولا يُعالج بطلب التجاهل فقط. الأولوية حماية الطفل، توثيق ما يحدث، وإشراك المدرسة بخطة واضحة من دون لومه أو إجباره على المواجهة وحده.";
    actionAr =
      "دوّن من فعل ماذا ومتى وأين، طمئن الطفل أن الخطأ ليس خطأه، ثم اطلب اجتماعاً موثقاً مع المدرسة وحدد موعداً قريباً لمراجعة ما تم.";
    summaryEn =
      "Bullying is not an ordinary disagreement and “just ignore it” is not enough. Prioritise safety, document incidents, and involve the school without blaming the child or forcing a solo confrontation.";
    actionEn =
      "Record who did what, when, and where; reassure the child that it is not their fault; then request a documented school meeting and a near-term review date.";
  } else if (
    includesAny(q, [
      "دراسة",
      "مذاكرة",
      "تركيز",
      "واجب",
      "ينسى",
      "study",
      "homework",
      "focus",
      "concentration",
    ])
  ) {
    summaryAr =
      "ضعف الدراسة لا يعني دائماً قلة الرغبة؛ قد تكون المهمة أكبر من قدرته على البدء، أو أن البيئة مشتتة، أو أن هناك صعوبة تحتاج كشفاً. المطلوب تقليل حجم البداية وقياس ما يحدث فعلاً.";
    actionAr =
      "ابدأ بجلسة 15 دقيقة لمهمة واحدة، أبعد المشتتات، ثم راقب أسبوعاً: متى يركز ومتى يتعطل. إذا استمرت الصعوبة في أكثر من مادة، ناقشها مع المعلم أو المختص.";
    summaryEn =
      "Study difficulty is not always lack of motivation; the task may feel too large, the environment may distract, or a learning issue may need assessment. Make the start smaller and observe patterns.";
    actionEn =
      "Begin with one 15-minute task, remove distractions, and observe for a week when focus improves or collapses. If difficulty persists across subjects, speak with the teacher or a specialist.";
  } else if (
    includesAny(q, [
      "موظف",
      "موظفين",
      "مدير",
      "العمل",
      "وظيفة",
      "employee",
      "manager",
      "workplace",
    ])
  ) {
    summaryAr =
      "المشكلة المهنية تصبح أوضح عندما تفصل بين السلوك القابل للملاحظة وبين الحكم على الشخص. ناقش الأثر والتوقع المطلوب، لا النوايا المفترضة.";
    actionAr =
      "اكتب مثالاً محدداً لما حدث، أثره على العمل، وما تتوقعه مستقبلاً. ناقش هذه النقاط في لقاء قصير واتفق على موعد مراجعة واضح.";
    summaryEn =
      "Workplace problems become clearer when observable behaviour is separated from judgments about the person. Discuss impact and expected standards, not assumed intentions.";
    actionEn =
      "Write one concrete example, its impact, and the expected future behaviour. Discuss these in a short meeting and agree on a clear review date.";
  } else if (
    includesAny(q, [
      "دين",
      "ديون",
      "راتب",
      "فلوس",
      "مصاريف",
      "ميزانية",
      "debt",
      "salary",
      "money",
      "budget",
    ])
  ) {
    summaryAr =
      "الضغط المالي يحتاج أرقاماً هادئة قبل القرارات الكبيرة. البداية هي معرفة التدفق الحقيقي: ما يدخل، وما يجب دفعه، وما يمكن تأجيله أو خفضه.";
    actionAr =
      "اجمع مصروفات آخر 30 يوماً في ثلاث خانات: ضروري، قابل للتخفيض، وقابل للإيقاف. بعدها وجّه أول فائض لأعلى التزام كلفة أو خطورة.";
    summaryEn =
      "Financial stress needs calm numbers before large decisions. Start with the real cash flow: income, mandatory payments, and what can be reduced or paused.";
    actionEn =
      "Sort the last 30 days of spending into essential, reducible, and pausable. Direct the first surplus to the highest-cost or highest-risk obligation.";
  } else if (
    includesAny(q, ["غضب", "صراخ", "عصبي", "منفعل", "angry", "anger", "scream"])
  ) {
    summaryAr =
      "الأولوية الآن ليست كسب النقاش، بل تهدئة التصعيد وفهم الحاجة أو الضغط الموجود خلف الغضب.";
    actionAr =
      "أوقف الردود الحادة مؤقتاً، سمِّ الشعور بهدوء، ثم اسأل سؤالاً واحداً: «ما أكثر شيء يضايقك الآن؟»";
    summaryEn =
      "The priority is not winning the argument; it is lowering escalation and understanding the need behind the anger.";
    actionEn =
      "Pause sharp replies, name the emotion calmly, then ask one question: “What is bothering you most right now?”";
  } else if (includesAny(q, ["كذب", "كاذب", "lie", "lying"])) {
    summaryAr =
      "تكرار الكذب غالباً لا يُعالج بالعقوبة وحدها؛ المطلوب حماية الصدق من الخوف ومعرفة الدافع قبل الحكم.";
    actionAr =
      "ابدأ بجملة مطمئنة: «أهم شي عندي أعرف الحقيقة، وبعدها نحل المشكلة مع بعض»، ثم ناقش الأثر لا شخصية الإنسان.";
    summaryEn =
      "Repeated lying is rarely solved by punishment alone; honesty must feel safer than concealment, and the motive should be understood first.";
    actionEn =
      "Begin with reassurance: “What matters first is knowing the truth; then we solve it together,” and discuss the impact, not the person’s identity.";
  } else if (
    includesAny(q, [
      "خوف",
      "قلق",
      "يخاف",
      "متوتر",
      "fear",
      "afraid",
      "anxiety",
      "anxious",
    ])
  ) {
    summaryAr =
      "الخوف هنا يحتاج شعوراً بالأمان قبل النصائح. تقليل الشعور أو السخرية منه قد يزيده حتى لو كانت النية طيبة.";
    actionAr =
      "اطلب وصف الخوف بكلمات بسيطة، ثم اتفقوا على تجربة صغيرة وآمنة بدلاً من إجباره على مواجهة كبيرة دفعة واحدة.";
    summaryEn =
      "Fear needs safety before advice. Minimising or mocking it can intensify it even when the intention is good.";
    actionEn =
      "Ask for a simple description of the fear, then agree on one small safe exposure rather than a large forced confrontation.";
  } else if (
    includesAny(q, [
      "زوج",
      "زوجة",
      "زواج",
      "علاقة",
      "صديقي",
      "صديقتي",
      "relationship",
      "marriage",
      "partner",
    ])
  ) {
    summaryAr =
      "الخلاف لا يُحل بكثرة الحجج إذا كان كل طرف يشعر أنه غير مسموع. افصل بين الموقف الحالي وبين التعميمات القديمة، وحدد طلباً واضحاً قابلاً للتنفيذ.";
    actionAr =
      "ابدأ بوصف موقف واحد بلا اتهام: «لما صار ___ شعرت بـ___ وأحتاج ___». اسمع رد الطرف الآخر حتى النهاية، ثم اتفقا على تغيير واحد لمدة أسبوع.";
    summaryEn =
      "More arguments will not solve a conflict when each person feels unheard. Separate the current incident from old generalisations and make one clear actionable request.";
    actionEn =
      "Describe one incident without blame: ‘When ___ happened, I felt ___ and I need ___.’ Hear the other person fully, then agree on one change for a week.";
  } else if (
    includesAny(q, [
      "ابني",
      "بنتي",
      "ولدي",
      "طفلي",
      "طفل",
      "child",
      "son",
      "daughter",
      "parenting",
    ])
  ) {
    summaryAr =
      "ابدأ بفهم الحاجة خلف السلوك قبل تصحيحه؛ السلوك رسالة، لكنه لا يعني قبول الخطأ. اجمع بين الهدوء وحدّ واضح وثابت يناسب العمر.";
    actionAr =
      "صف السلوك بلا وصف للطفل، اسأله ماذا حدث، ثم قل الحد بجملة قصيرة وما البديل المقبول. طبّق نتيجة منطقية ثابتة من دون إهانة أو تهديد.";
    summaryEn =
      "Understand the need behind the behaviour before correcting it; behaviour is a message, but that does not mean accepting harm. Combine calmness with one clear age-appropriate limit.";
    actionEn =
      "Describe the behaviour without labelling the child, ask what happened, then state the limit and acceptable alternative in one short sentence. Use a consistent logical consequence without humiliation.";
  } else if (
    includesAny(q, [
      "صحة",
      "ألم",
      "مرض",
      "دواء",
      "تشخيص",
      "health",
      "pain",
      "illness",
      "medicine",
      "diagnosis",
    ])
  ) {
    summaryAr =
      "المعلومات العامة قد تساعدك على ترتيب الصورة لكنها لا تكفي للتشخيص. الأعراض الجديدة أو الشديدة أو المتفاقمة تحتاج تقييماً طبياً، خصوصاً مع ضيق التنفس أو الإغماء أو الألم الحاد.";
    actionAr =
      "دوّن متى بدأت الأعراض وشدتها وما يزيدها أو يخففها والأدوية الحالية، ثم تواصل مع مختص. اطلب مساعدة عاجلة عند وجود علامة خطرة أو تدهور سريع.";
    summaryEn =
      "General information can organise the picture but cannot diagnose. New, severe, or worsening symptoms need medical assessment, especially with breathing difficulty, fainting, or severe pain.";
    actionEn =
      "Record onset, severity, triggers, relief, and current medicines, then contact a clinician. Seek urgent help for red flags or rapid deterioration.";
  } else if (
    includesAny(q, [
      "تسويف",
      "أأجل",
      "تأجيل",
      "ما أنجز",
      "وقت",
      "procrastination",
      "delay",
      "time management",
    ])
  ) {
    summaryAr =
      "التسويف غالباً مشكلة بداية غامضة أو ثقيلة، لا نقص إرادة فقط. كلما صغرت أول حركة ووضحت نهايتها، قلّت مقاومة البدء.";
    actionAr =
      "حوّل المهمة إلى فعل يستغرق عشر دقائق، حدّد وقت البداية لا وقت النهاية، وأغلق مشتتاً واحداً فقط. بعد العشر دقائق قرر الاستمرار أو التوقف بوعي.";
    summaryEn =
      "Procrastination is often an unclear or heavy starting problem, not simply weak willpower. A smaller first action reduces resistance.";
    actionEn =
      "Turn the task into a ten-minute action, schedule the start rather than the finish, and remove one distraction. After ten minutes, consciously choose whether to continue.";
  } else if (
    includesAny(q, [
      "قرار",
      "محتار",
      "اختار",
      "خيار",
      "decision",
      "choose",
      "unsure",
    ])
  ) {
    summaryAr =
      "الحيرة غالباً سببها خلط ما هو مهم فعلاً بما هو مخيف أو عاجل. القرار يصبح أوضح عندما تفصل القيم عن الضغوط المؤقتة.";
    actionAr =
      "اكتب الخيارين، وتحت كل واحد: أفضل نتيجة، أسوأ نتيجة، وما الذي ستندم عليه أكثر بعد سنة.";
    summaryEn =
      "Uncertainty often comes from mixing what truly matters with what feels urgent or frightening. Separate values from temporary pressure.";
    actionEn =
      "Write the two options and under each: best outcome, worst outcome, and what you would regret more one year from now.";
  } else if (
    includesAny(q, [
      "فكرة",
      "ابتكار",
      "مشروع",
      "تطوير",
      "idea",
      "innovation",
      "project",
    ])
  ) {
    summaryAr =
      "قوة الفكرة لا تبدأ بكثرة المزايا، بل بوضوح المشكلة التي تحلها ولمن تحلها ولماذا سيهتم بها الناس.";
    actionAr =
      "أكمل هذه الجملة: «هذه الفكرة تساعد ___ على ___ من دون ___»، ثم اختبرها مع شخص واحد من الفئة المستهدفة.";
    summaryEn =
      "An idea becomes strong through a clear problem, audience, and reason to care—not through adding more features.";
    actionEn =
      "Complete: “This idea helps ___ to ___ without ___,” then test that sentence with one target user.";
  } else if (
    includesAny(q, [
      "خطة",
      "هدف",
      "تنفيذ",
      "طريق",
      "plan",
      "goal",
      "execute",
      "roadmap",
    ])
  ) {
    summaryAr =
      "الهدف يبدو كبيراً لأن بدايته ونقطة قياسه غير محددتين. تحويله إلى نتيجة أسبوعية يقلل التشتت ويكشف التقدم.";
    actionAr =
      "حدّد نتيجة واحدة للأسبوع القادم، ثم اختر ثلاث مهام فقط تخدمها واحذف أي مهمة لا ترتبط بها مباشرة.";
    summaryEn =
      "The goal feels large because its start and measurement point are unclear. A weekly outcome reduces noise and reveals progress.";
    actionEn =
      "Choose one outcome for next week, then keep only three tasks that directly serve it.";
  } else if (journeyId === "situation") {
    summaryAr =
      "الموقف يحتاج تهدئة الانفعال أولاً، ثم تحديد ما الذي حدث فعلاً وما الذي تم تفسيره أو افتراضه.";
    actionAr =
      "اكتب ثلاثة أسطر: ما حدث، ما شعرت به، وما الذي تحتاجه الآن. استخدمها قبل أي مواجهة أو رد.";
    summaryEn =
      "The situation needs emotion lowered first, then facts separated from interpretations and assumptions.";
    actionEn =
      "Write three lines: what happened, what you felt, and what you need now. Use them before responding.";
  } else if (journeyId === "future") {
    summaryAr =
      "لا يمكن ضمان المستقبل، لكن يمكن تقليل المفاجآت ببناء أكثر من سيناريو وتحديد العلامات المبكرة لكل واحد.";
    actionAr =
      "اكتب ثلاثة سيناريوهات: الأفضل، المرجح، والأسوأ؛ ثم حدّد إشارة مبكرة واحدة تدل على كل سيناريو.";
    summaryEn =
      "The future cannot be guaranteed, but surprises can be reduced through scenarios and early signals.";
    actionEn =
      "Write best, likely, and worst scenarios, then one early signal for each.";
  }

  if (mode === "deep") {
    summaryAr +=
      " افحص أيضاً الافتراض الذي لو كان خاطئاً سيتغير معه فهمك للمشكلة بالكامل.";
    actionAr +=
      " وبعدها حدّد معلومة واحدة تحتاج التحقق منها قبل اتخاذ خطوة أكبر.";
    summaryEn +=
      " Also test the assumption that would change your entire understanding if it proved false.";
    actionEn +=
      " Then identify one fact to verify before taking a larger step.";
  } else if (mode === "simple") {
    summaryAr +=
      " ركّز على السبب القابل للتغيير الآن، لا على كل الأسباب مرة واحدة.";
    summaryEn +=
      " Focus on the cause you can change now rather than every cause at once.";
  }

  return {
    summary: isArabic ? summaryAr : summaryEn,
    action: isArabic ? actionAr : actionEn,
    context: isArabic ? contextAr : contextEn,
  };
}
