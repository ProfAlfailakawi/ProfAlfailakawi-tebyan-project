/**
 * ردود الذكاء الاصطناعي في وضع العرض — محلية بالكامل، بلا شبكة.
 *
 * في العرض لا يُستدعى `/api/ai/*` إطلاقًا (لا خادم يردّ عليه، وكل نداء كان يعود
 * بـ404 ويترك الشاشة نموذجًا فارغًا). فبدل ذلك يُولَّد هنا ردٌّ نموذجي واقعي:
 *  - إن طلب المستدعي مخططًا (`responseSchema`) بُنيت قيمة تطابقه شكلًا وأنواعًا.
 *  - وإن طلب JSON بلا مخطط عُرف الشكل من نصّ التعليمات (قليلة ومعروفة).
 *  - وإلا فنصّ Markdown عربي (أو إنجليزي) قصير بالبنية التي تطلبها الشاشات.
 *
 * ما يُنتَج هنا نصٌّ إرشادي عام، لا يحوي آيات ولا أحاديث ولا إحصاءات منسوبة
 * لمصدر؛ والأسماء في أمثلته خيالية. لا يعتمد هذا الملف على أي شيء خارج المتصفح.
 */

const AR = /[\u0600-\u06FF]/;

function lastUserText(contents: any[] | undefined): string {
  if (!Array.isArray(contents)) return '';
  for (let i = contents.length - 1; i >= 0; i--) {
    const parts = contents[i]?.parts;
    if (Array.isArray(parts)) {
      const t = parts.map((p: any) => (typeof p?.text === 'string' ? p.text : '')).join(' ').trim();
      if (t) return t;
    }
  }
  return '';
}

/** يستخرج موضوعًا قصيرًا نظيفًا من نص المستخدم. */
function topicOf(raw: string, ar: boolean): string {
  let t = raw
    .replace(/^(Situation\/Question from a user:|المشكلة\/السؤال:|تاريخ[^:]*:|النص للتفريغ:)\s*/i, '')
    .replace(/Additional context:[\s\S]*$/i, '')
    .replace(/Idea A:\s*/i, '')
    .replace(/^(أنتج|اصنع|أنشئ|اكتب)\s+\S+\s+\S+\s+(عن|حول)\s+/, '')
    .split('\n')[0]
    .replace(/^["«]|["»]$/g, '')
    .trim();
  // الشاشات تُلحق بالسؤال تعليماتٍ بعد علامة الاستفهام أو النقطة: يُكتفى بالجملة الأولى.
  const cut = t.search(/[؟?.!](\s|$)/);
  if (cut >= 8) t = t.slice(0, cut + (/[؟?]/.test(t[cut]) ? 0 : 0)).trim();
  if (t.length > 70) t = t.slice(0, 70).replace(/\s+\S*$/, '') + '…';
  if (/^(You are|أنت|أنتِ)\s/.test(t) && t.length > 40) t = '';
  return t || (ar ? 'هذا الموضوع' : 'this topic');
}

/* ---------------- نصوص حرة (Markdown) ---------------- */

function freeText(topic: string, ar: boolean, hint: string): string {
  if (ar) {
    if (/مخطوطة الحقيقة|حكيم قديم/.test(hint)) {
      return `في ما تُرك من الصفحات القديمة قيل: إن من أراد فهم «${topic}» فليبدأ بالإصغاء قبل الكلام.\n\nفالسرّ الذي يطلبه الناس بعيدًا يكون في الغالب قريبًا: في عادةٍ صغيرة تتكرر، وفي سؤالٍ صادق يُطرح بهدوء.\n\nومن صبر على الغموض ساعةً انكشفت له الصورة، ومن استعجلها ضاعت منه التفاصيل.`;
    }
    if (/تناقضاً واحداً|تناقض/.test(hint)) {
      return `يبدو أن هناك رغبة في الهدوء مع انشغال مستمر بالتفاصيل الصغيرة، وكأن الراحة مؤجَّلة إلى أن تكتمل كل المهام. لماذا هذا التوهان؟`;
    }
    if (/Fabric|اتجاهات النسيج/.test(hint)) {
      return `اتجاهان بارزان: العناية بالروتين الهادئ، والتعلّم من التجربة اليومية. كلاهما ينضج عبر التكرار والحوار.`;
    }
    if (/توأم روحه|النمط الفكري/.test(hint)) {
      return `النمط الفكري هنا يميل إلى التأمل وبناء العادات الصغيرة. ثمة من يشارك هذا التردد: من يرى في التفاصيل اليومية بابًا للمعنى.`;
    }
    if (/Serendipity|اكتشاف صدفة/.test(hint)) {
      return `فكرة هجينة: تحويل «${topic}» إلى لعبة أسرية قصيرة مدتها ٥ دقائق، تُكافأ فيها المحاولة لا النتيجة.`;
    }
    if (/خريطة ذهنية/.test(hint)) {
      return `- ${topic}\n  - الفهم\n    - ما الذي يحدث فعلًا؟\n    - ما الذي يحتاجه الطفل؟\n  - التطبيق\n    - خطوة صغيرة اليوم\n    - متابعة هادئة بعد أسبوع`;
    }
    if (/أرسطو|صقل الفكرة/.test(hint)) {
      return `الفكرة الجوهرية: «${topic}» تنضج حين تُختبر في موقف حقيقي صغير، لا حين تُناقش طويلًا.`;
    }
    return `**الإجابة الجوهرية: ابدأوا بخطوة صغيرة وواضحة بخصوص «${topic}»**\n\n**لماذا هذا مهم؟** لأن التغيير الهادئ المتكرر أثبت من القرار الكبير المفاجئ.\n\n**الخطوات الميدانية**\n- حدّدوا موقفًا واحدًا محددًا لتجربته هذا الأسبوع.\n- صوغوا الطلب بجملة قصيرة ونبرة هادئة.\n- امنحوا الطرف الآخر وقتًا قصيرًا للاستجابة قبل التدخل.\n- دوّنوا ما نجح وما لم ينجح في نهاية اليوم.\n\n**حكمة ذهبية:** الهدوء لا يعني الضعف، بل هو أقصر طريق للإصغاء.\n\n**مراجع سريعة:** ما سبق إرشاد عام ضمن العرض التجريبي، وليس بديلًا عن مختص عند الحاجة.\n\n> هذا ردّ تجريبي مُعدّ مسبقًا ضمن البيئة التجريبية.`;
  }
  return `**Core answer: start with one small, clear step on "${topic}".**\n\n**Why it matters:** calm, repeated change lasts longer than a sudden big decision.\n\n**Action steps**\n- Pick one specific situation to try this week.\n- Phrase the request in one short, calm sentence.\n- Give the other side a moment to respond before stepping in.\n- Note what worked at the end of the day.\n\n**Golden wisdom:** calm is not weakness; it is the shortest path to being heard.\n\n> This is a pre-written demo response generated locally.`;
}

/* ---------------- مخططات JSON ---------------- */

const STRING_BY_KEY: Array<[RegExp, (t: string, ar: boolean, i: number) => string]> = [
  [/^refined_query$/i, () => ''],
  [/^era$/i, (_t, ar, i) => (ar ? ['الماضي القريب', 'الحاضر', 'المستقبل'][i % 3] : ['Recent past', 'Present', 'Future'][i % 3])],
  [/teaching_method|method/i, (t, ar, i) => (ar ? ['التعلّم بالحوار داخل الأسرة', 'تطبيقات تفاعلية مع متابعة الأهل', 'مساعد تعلّم شخصي بإشراف تربوي'][i % 3] : 'Guided family dialogue')],
  [/^tools$/i, (_t, ar, i) => (ar ? ['الحكايات والمجالس', 'الكتب والأقراص', 'الأجهزة اللوحية'][i % 3] : 'Books, tablets')],
  [/waveType/i, () => 'sine'],
  [/symbolName/i, (t, ar) => (ar ? 'الميزان الهادئ' : 'The calm scale')],
  [/significance/i, (t, ar) => (ar ? `رمز تجريبي يعبّر عن التوازن في التعامل مع «${t}».` : `A demo symbol of balance regarding "${t}".`)],
  [/sonic/i, (_t, ar) => (ar ? 'نغمة دافئة بطيئة تهدّئ الإيقاع وتفتح مساحة للإصغاء.' : 'A warm slow tone that calms the rhythm.')],
  [/^year$/i, (_t, _a, i) => String(2000 + i * 15)],
  [/title|name|label|headline|heading/i, (t, ar, i) => (ar ? `${['خطة هادئة', 'مدخل عملي', 'زاوية جديدة', 'خطوة أولى'][i % 4]} حول ${t}` : `A calm approach to ${t}`)],
  [/url|link/i, () => ''],
  [/slug/i, () => 'general-demo'],
  [/category/i, (_t, ar) => (ar ? 'السلوك والانفعالات' : 'Behavior')],
  [/risk/i, () => 'low'],
  [/age/i, (_t, ar, i) => (ar ? ['٥-٧ سنوات', '٨-١٢ سنة', '١٣-١٧ سنة'][i % 3] : '8-12')],
  [/sayThis/i, (_t, ar) => (ar ? 'أرى أن الأمر صعب عليك الآن، وأنا هنا لنجد حلًّا معًا.' : 'I can see this is hard right now; let us find a way together.')],
  [/dontSayThis/i, (_t, ar) => (ar ? 'كم مرة قلت لك! لماذا لا تسمع الكلام أبدًا؟' : 'How many times have I told you!')],
  [/doThisNow/i, (_t, ar) => (ar ? 'توقّف لحظة، تنفّس بهدوء، ثم انزل إلى مستوى نظره وسمِّ الشعور.' : 'Pause, breathe, get to eye level and name the feeling.')],
  [/summary|overview|essence|synopsis/i, (t, ar) => (ar ? `خلاصة تجريبية: ${t} يُعالَج بخطوات صغيرة هادئة ومتكررة، مع متابعة لطيفة.` : `Demo summary: ${t} responds best to small, calm, repeated steps.`)],
  [/religious/i, (_t, ar) => (ar ? 'لا مرجع شرعي مُدرج في الرد التجريبي.' : 'No religious reference in the demo response.')],
  [/scientific|stat/i, (_t, ar) => (ar ? 'يميل الباحثون عمومًا إلى أن الروتين الثابت يخفف التوتر عند الصغار (إرشاد عام بلا رقم).' : 'Research generally suggests steady routines ease stress in children (general note, no figure).')],
  [/mistake/i, (_t, ar) => (ar ? 'الخطأ الشائع: رفع الصوت قبل فهم ما وراء السلوك.' : 'Common mistake: raising the voice before understanding the behavior.')],
  [/question|prompt/i, (t, ar, i) => (ar ? `السؤال ${i + 1}: أيٌّ مما يلي أنسب في التعامل مع «${t}»؟` : `Question ${i + 1}: which approach fits "${t}" best?`)],
  [/answer|response|reply|message|content|text|body|description|desc|detail|insight|impact|scenario|narrative|story|explanation|advice|tip|note|reason|rationale|result|outcome/i, (t, ar, i) => (ar ? [`تفصيل تجريبي حول «${t}»: يبدأ الحل بملاحظة الموقف بهدوء ثم اختيار خطوة صغيرة قابلة للتنفيذ اليوم.`, `الأفضل ربط الخطوة بروتين ثابت وتعزيز المحاولة قبل النتيجة، مع مراجعة قصيرة آخر الأسبوع.`, `يُنصح بتجنب الحكم السريع وترك مساحة للطرف الآخر ليعبّر عن رأيه.`][i % 3] : `Demo detail on "${t}": observe calmly, then pick one small step doable today.`)],
];

function stringFor(key: string, topic: string, ar: boolean, idx: number): string {
  for (const [re, fn] of STRING_BY_KEY) if (re.test(key)) return fn(topic, ar, idx);
  return ar ? `نص تجريبي حول «${topic}»` : `Demo text about "${topic}"`;
}

function numberFor(key: string, integer: boolean, idx: number): number {
  if (/frequency/i.test(key)) return 432;
  if (/amplitude/i.test(key)) return 60;
  if (/xp|reward/i.test(key)) return 50;
  if (/year/i.test(key)) return 1900 + idx * 40;
  if (/prob|chance/i.test(key)) return [72, 55, 38][idx % 3];
  if (/score|level|rating|engagement|learning|usability|impact|strength|confidence|value|percent/i.test(key)) return [78, 64, 85, 71][idx % 4];
  return integer ? 60 + idx * 5 : 0.7;
}

function fromSchema(schema: any, key: string, topic: string, ar: boolean, idx: number): any {
  if (!schema) return stringFor(key, topic, ar, idx);
  const type = String(schema.type || '').toUpperCase();
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[idx % schema.enum.length];
  switch (type) {
    case 'OBJECT': {
      const out: any = {};
      for (const [k, v] of Object.entries<any>(schema.properties || {})) out[k] = fromSchema(v, k, topic, ar, idx);
      // الاختبارات: الجواب الصحيح يجب أن يطابق أحد الخيارات حرفيًا.
      if (Array.isArray(out.options) && 'answer' in out) {
        if (out.type === 'boolean') out.options = ar ? ['صح', 'خطأ'] : ['True', 'False'];
        else if (out.options.length) out.options = out.options.map((_: any, i: number) => (ar ? `الخيار ${['الأول', 'الثاني', 'الثالث', 'الرابع'][i] || i + 1}: ${['خطوة هادئة وواضحة', 'تجاهل الموقف', 'رفع الصوت', 'تأجيل بلا متابعة'][i] || 'خيار آخر'}` : `Option ${i + 1}`));
        out.answer = out.options[0];
      }
      return out;
    }
    case 'ARRAY': {
      const item = schema.items;
      const itemType = String(item?.type || '').toUpperCase();
      const props = item?.properties || {};
      const isQuiz = 'question' in props && 'options' in props;
      const n = isQuiz ? 6 : itemType === 'OBJECT' ? 3 : /option/i.test(key) ? 4 : 3;
      return Array.from({ length: n }, (_, i) => {
        const v = fromSchema(item, key, topic, ar, i);
        if (isQuiz && v && typeof v === 'object') {
          v.type = ['multiple', 'multiple', 'multiple', 'boolean', 'boolean', 'fill'][i];
          if (v.type === 'boolean') v.options = ar ? ['صح', 'خطأ'] : ['True', 'False'];
          v.answer = v.options?.[0] ?? v.answer;
        }
        if (itemType === 'STRING') {
          return ar ? `${['خطوة', 'تمرين', 'كلمة مفتاحية', 'ملاحظة'][i % 4]} تجريبية ${i + 1} حول ${topic}` : `Demo item ${i + 1} on ${topic}`;
        }
        return v;
      });
    }
    case 'NUMBER':
      return numberFor(key, false, idx);
    case 'INTEGER':
      return numberFor(key, true, idx);
    case 'BOOLEAN':
      return idx === 0;
    default:
      return stringFor(key, topic, ar, idx);
  }
}

/** JSON بلا مخطط: الأشكال المعروفة في الشيفرة. */
function jsonNoSchema(hint: string, topic: string, ar: boolean): unknown {
  if (/"classification"/.test(hint)) return { classification: 'new_case', matchId: null, normalizedMeaning: topic, mainTopic: topic, subTopics: [], riskLevel: 'low', ageMentioned: '', emotionalTone: 'calm' };
  if (/"rage"/.test(hint)) return { rage: 62, sad: 28, tired: 45 };
  if (/maturityLabel/.test(hint)) return { summary: 'مجرة أفكار تدور حول الأسرة والروتين والهدوء في التعامل.', maturityLabel: 'نضج تربوي متنامٍ', scores: [12, 20, 28], themes: ['الروتين', 'الحوار', 'الهدوء', 'التعزيز'], commitments: ['تخصيص عشر دقائق يوميًا للإصغاء دون مقاطعة', 'تأجيل التصحيح إلى ما بعد هدوء الموقف'] };
  if (/xp_reward/.test(hint)) return ar ? { title: 'ثلاثون ثانية إصغاء', task: 'في أول حوار اليوم، أصغوا حتى النهاية دون مقاطعة، ثم أعيدوا بكلماتكم ما سمعتم.', xp_reward: 50 } : { title: 'Thirty seconds of listening', task: 'In the first conversation today, listen to the end without interrupting, then restate what you heard.', xp_reward: 50 };
  if (/refined_query/.test(hint)) return { refined_query: '' };
  return { text: freeText(topic, ar, hint) };
}

export interface DemoAiParams {
  model?: string;
  contents?: any[];
  config?: any;
}

/** يبني نص الرد التجريبي (نصًا حرًّا أو JSON مُسلسَلًا حسب الطلب). */
export function demoAiText(params: DemoAiParams): string {
  const cfg = params.config || {};
  const sysHead = String(cfg.systemInstruction || '').slice(0, 400);
  const user = lastUserText(params.contents);
  const full = `${sysHead} ${user}`;
  const ar = AR.test(sysHead.slice(0, 160)) || AR.test(user.slice(0, 120));
  const topic = topicOf(user, ar);
  const wantsJson = String(cfg.responseMimeType || '').includes('json') || !!cfg.responseSchema;

  if (!wantsJson) return freeText(topic, ar, full);
  if (cfg.responseSchema) return JSON.stringify(fromSchema(cfg.responseSchema, '', topic, ar, 0));
  // JSON بلا مخطط: التعليمات الكاملة (لا رأسها) تحدد الشكل.
  return JSON.stringify(jsonNoSchema(`${String(cfg.systemInstruction || '')} ${user}`, topic, ar));
}

/** الشكل نفسه الذي يعيده `proxyGenerateContent` للخادم الحقيقي. */
export async function demoAiResponse(params: DemoAiParams) {
  // تأخير قصير يُشعر بأن الرد «يُفكَّر» لا أنه مخزّن؛ لا شبكة فيه.
  await new Promise((r) => setTimeout(r, 450));
  const text = demoAiText(params);
  return {
    response: { get text() { return text; } },
    get text() { return text; },
    _cached: 'demo',
  };
}

/** لا صوت في العرض: الواجهة تعرف مسار `offline` وتتصرف كأنه لا يوجد توليد صوتي. */
export function demoAudioResponse() {
  return {
    audioData: '',
    mimeType: 'audio/wav',
    offline: true,
    message: 'التوليد الصوتي غير متاح في البيئة التجريبية.',
  };
}
