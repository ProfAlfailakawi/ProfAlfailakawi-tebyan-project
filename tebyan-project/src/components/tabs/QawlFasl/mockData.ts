import { QawlFaslQuestion } from './types';

export const mockQuestions: QawlFaslQuestion[] = [
  {
    id: 'q1',
    question: 'طفلي يسأل: أين الله؟',
    category: 'الإيمان والأسئلة الدينية',
    categoryId: 'faith-religious-questions',
    categorySlug: 'faith-religious-questions',
    mainCategory: 'الإيمان والأسئلة الوجودية',
    keywords: ['الله', 'أين', 'عقيدة'],
    ageGroups: ['4-6', '7-9'],
    riskLevel: 'medium',
    quickSummary: 'الله خالقنا، لا نراه بأعيننا الآن لأنه عظيم جداً، لكنه يرانا ويسمعنا ويحبنا ونراه في الجنة.',
    quickAnswer: {
      sayThis: "الله موجود في كل مكان بعلمه وقدرته، وهو يرانا ويسمعنا دائماً.",
      dontSayThis: "الله في السماء جالس على العرش (للأطفال الصغار قد يتخيلونه كإنسان).",
      doThisNow: "اخبره أننا يمكن أن نكلم الله في أي وقت بالدعاء."
    },
    commonMistake: "التهرب من السؤال أو إعطاء إجابات معقدة تفوق إدراكه.",
    educationalView: "الطفل في هذا العمر يبحث عن الأمان والملموسية، يجب ربط وجود الله بأفعاله (المطر، الشجر) بدلاً من ذاته.",
    suggestedAnswer: "الله سبحانه وتعالى عظيم جداً، مثل الهواء الذي لا نراه لكننا نتنفسه ونحس به، الله يرانا ويسمعنا وقريب منا جداً عندما ندعوه.",
    byAgeVersions: [
      { age: '4-6', text: 'الله في كل مكان، يرانا ويسمعنا ويحبنا.' },
      { age: '7-9', text: 'الله فوق السماوات، لكنه معنا بعلمه وقدرته، يعلم كل ما نفعل.' }
    ],
    practicalSteps: [
      'اجلس مع الطفل في مستوى نظره.',
      'اسأله أولاً: "أنت ماذا تعتقد؟" لفهم ما يدور في ذهنه.',
      'اشرح له قدرة الله من خلال تأمل الطبيعة.'
    ],
    exercises: [
      'لعبة "ماذا أرى وماذا لا أرى" (الهواء، الحب، العقل) لتبسيط فكرة الإيمان بالغيب.'
    ],
    whenToWorry: "إذا كانت أسئلة الطفل ناتجة عن خوف شديد من العقاب أو الموت.",
    religiousReference: "الرَّحْمَنُ عَلَى الْعَرْشِ اسْتَوَى (طه: 5)",
    resources: [
      {
        type: 'book',
        title: 'أسئلة الأطفال الإيمانية',
        description: 'د. عبدالله الركف - كتاب رائع يناقش الأساليب التربوية للإجابة على أسئلة الأطفال.',
        url: 'https://www.google.com/search?q=كتاب+أسئلة+الأطفال+الإيمانية+عبدالله+الركف'
      },
      {
        type: 'site',
        title: 'الإسلام سؤال وجواب',
        description: 'فتاوى موثوقة حول كيفية الرد على استفسارات الأطفال العقدية.',
        url: 'https://islamqa.info/ar'
      }
    ],
    closingThought: "أسئلة الأطفال الدينية هي فرصة لغرس محبة الله وليس الخوف منه.",
    status: 'published',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    reviewStatus: {
      educational: 'approved',
      religious: 'approved',
      sources: 'approved'
    }
  },
  {
    id: 'q2',
    question: 'طفلي شاهد محتوى غير لائق على الهاتف، ماذا أفعل؟',
    category: 'التقنية والهوية الرقمية',
    categoryId: 'digital',
    categorySlug: 'digital',
    mainCategory: 'التقنية والإنترنت',
    keywords: ['هاتف', 'محتوى', 'تقنية'],
    ageGroups: ['7-9', '10-12', '13-15'],
    riskLevel: 'high',
    quickSummary: 'الخطوة الأولى هي احتواء الطفل وعدم تعنيفه فوراً، ثم فهم كيف وصل للمحتوى، وتأمين الأجهزة.',
    quickAnswer: {
      sayThis: "أنا سعيد أنك أخبرتني، هذا شيء مزعج ويحدث أحياناً بالخطأ.",
      dontSayThis: "كيف تشاهد هذا؟ أنت سيء! سأسحب منك الهاتف نهائياً.",
      doThisNow: "اسحب منه الجهاز بهدوء، طمئنه، ثم قم بتفعيل الرقابة الأبوية على الجهاز."
    },
    commonMistake: "رد الفعل العنيف والصراخ، مما يجعل الطفل يخفي أي خطأ في المستقبل.",
    educationalView: "الطفل هنا ضحية للخوارزميات أو الفضول الطبيعي، دور المربي هو التوجيه والحماية وليس العقاب على خطأ غير مقصود.",
    suggestedAnswer: "هذا المحتوى غير مناسب لأعمارنا لأن عقولنا ما زالت تنمو، كما أن هناك أشياء في الإنترنت ليست جيدة. إذا رأيت شيئاً غريباً مرة أخرى، أريد منك إغلاق الشاشة وإخباري فوراً.",
    byAgeVersions: [
      { age: '7-9', text: 'هذه صورة سيئة ظهرت بالخطأ، من الجيد أنك أخبرتني لنقوم بمسحها.' },
      { age: '10-12', text: 'الإنترنت مليء بأشياء غير مفيدة ومضرة لعقولنا، مبرمجوا هذه المواقع يريدون سرقة وقتنا.' }
    ],
    practicalSteps: [
      'حافظ على هدوئك تماماً.',
      'افهم السياق: هل بحث عنه أم ظهر كنافذة منبثقة؟',
      'قم بتفعيل تطبيقات الرقابة (مثل Google Family Link أو أبل Screen Time).'
    ],
    exercises: [
      'تدريب الطفل على قاعدة "أغلق الشاشة، واذهب لأخبر أبي/أمي".'
    ],
    whenToWorry: "إذا كان الطفل يبحث عن هذا المحتوى بشكل متكرر وسري، أو ظهرت عليه علامات انعزال غير طبيعية.",
    scientificStat: "دراسات تثبت أن 70% من الأطفال يتعرضون لمحتوى غير لائق بالخطأ قبل سن الـ 12.",
    resources: [
      {
        type: 'site',
        title: 'معهد السلامة الأسرية عبر الإنترنت (FOSI)',
        description: 'موقع يوفر أدلة إرشادية للمواطنة الرقمية.',
        url: 'https://www.fosi.org/'
      },
      {
        type: 'video',
        title: 'كيف نراقب محتوى أبنائنا الذكي؟',
        description: 'تقرير إرشادي لأدوات الرقابة الأبوية.',
        url: 'https://www.youtube.com/results?search_query=الرقابة+الابوية+على+الاجهزة+الذكية'
      }
    ],
    closingThought: "المنع المطلق مستحيل، لكن التربية الذاتية وبناء جسر الثقة هو الحماية الحقيقية.",
    status: 'published',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
    reviewStatus: {
      educational: 'approved',
      religious: 'approved',
      sources: 'approved'
    }
  },
  {
    id: 'q3',
    question: 'طفلي يخاف من الظلام، كيف أساعده؟',
    category: 'الشخصية والثقة',
    categoryId: 'personality',
    categorySlug: 'personality',
    mainCategory: 'السلوك والتربية',
    keywords: ['خوف', 'ظلام', 'شخصية'],
    ageGroups: ['4-6', '7-9'],
    riskLevel: 'low',
    status: 'published',
    createdAt: Date.now() - 3000000,
    updatedAt: Date.now(),
    reviewStatus: { educational: 'approved', religious: 'approved', sources: 'approved' },
    quickSummary: 'الخوف من الظلام مرحلة نمو طبيعية. يجب تقبل خوفه وتدريبه تدريجياً على الأمان.',
    quickAnswer: {
      sayThis: 'الظلام هو فقط عندما تذهب الشمس للنوم حتى نرتاح نحن أيضاً.',
      dontSayThis: 'لا تكن جباناً، لا يوجد شيء مخيف!',
      doThisNow: 'وفر إضاءة خفيفة جداً في الغرفة كبداية.'
    },
    commonMistake: 'إطفاء الضوء فجأة لتدريبه بالقوة، مما يزيد صدمته.',
    educationalView: 'يتخيل الأطفال في هذا العمر وجود وحوش بسبب نمو التخيل لديهم. التصديق على مشاعرهم وبناء الأمان هو الأنجح.',
    suggestedAnswer: 'الغرفة هي نفسها سواء في النور أو الظلام. هل تريد أن نترك الباب مفتوحاً قليلاً؟',
    byAgeVersions: [
      { age: '4-6', text: 'سأترك ضوءاً صغيراً، وأنا موجود قريب منك.' }
    ],
    practicalSteps: ['تدرج في الإضاءة', 'ابحث معه تحت السرير بالكشاف ليطمئن'],
    exercises: ['لعبة الظل: تشكيل حيوانات باليدين على الحائط في الظلام لربط الظلام بالمتعة.'],
    resources: [
      {
        type: 'study',
        title: 'Childhood Fears: Development and Management',
        description: 'KidsHealth - دراسة مفصلة لكيفية تعامل الآباء مع المخاوف المنتشرة في الطفولة المبكرة.',
        url: 'https://kidshealth.org/'
      }
    ],
    whenToWorry: 'إذا كان الخوف يمنعه تماماً من النوم لأيام ويسبب نوبات هلع هستيرية.',
    closingThought: 'الصبر والتدريج هما مفتاح الأمان للطفل.'
  },
  {
    id: 'q4',
    question: 'طفلي يرفض مشاركة ألعابه، هل هو أناني؟',
    category: 'السلوك والانضباط',
    categoryId: 'behavior',
    categorySlug: 'behavior',
    mainCategory: 'السلوك والتربية',
    keywords: ['أنانية', 'مشاركة', 'ألعاب'],
    ageGroups: ['4-6'],
    riskLevel: 'medium',
    status: 'published',
    createdAt: Date.now() - 4000000,
    updatedAt: Date.now(),
    reviewStatus: { educational: 'approved', religious: 'approved', sources: 'approved' },
    quickSummary: 'الأطفال تحت سن السادسة لا يستوعبون مفهوم الملكية والمشاركة بشكل كامل.',
    quickAnswer: {
      sayThis: 'هذه لعبتك، يمكنك اللعب بها الآن، وبإمكانك إعطاؤها لصديقك لاحقاً.',
      dontSayThis: 'أعطِ اللعبة لجارك فالتصرف بأنانية أمر سيء!',
      doThisNow: 'شراء ألعاب جماعية تعتمد على التعاون.'
    },
    commonMistake: 'إجبار الطفل على إعطاء لعبته بالقوة أمام الآخرين إرضاءً لهم.',
    educationalView: 'تدريب الطفل على تبادل الأدوار أفضل من إجباره على التفريط في ممتلكاته.',
    suggestedAnswer: 'نحن نتشارك الأشياء لتكون الألعاب أكثر متعة. سنضع منبهاً، خمس دقائق لك وخمس دقائق له.',
    byAgeVersions: [
      { age: '4-6', text: 'سيلعب بها قليلاً وسيعيدها لك، إنها لا تزال لك.' }
    ],
    practicalSteps: ['تقديم مفهوم "دورك ودوري"'],
    exercises: ['لعب كرات بتبادل الأدوار لتعليم الانتظار.'],
    resources: [
      {
        type: 'book',
        title: 'The Whole-Brain Child',
        description: 'Dan Siegel & Tina Payne Bryson - يشرح تطور دماغ الطفل ولماذا تعد المشاركة صعبة.',
        url: 'https://www.google.com/search?q=The+Whole-Brain+Child+book'
      }
    ],
    whenToWorry: 'إذا ترافق ذلك مع عدوانية شديدة وضرب لمن يقترب.',
    closingThought: 'احترم ملكية طفلك، ليحترم ملكية الآخرين.'
  },
  {
    id: 'q5',
    question: 'كيف أحمي طفلي من التحرش؟',
    category: 'الوقاية وحماية الطفل',
    categoryId: 'prevention',
    categorySlug: 'prevention',
    mainCategory: 'الحماية والمخاطر',
    keywords: ['حماية', 'تحرش', 'وقاية'],
    ageGroups: ['4-6', '7-9', '10-12'],
    riskLevel: 'high',
    status: 'published',
    createdAt: Date.now() - 5000000,
    updatedAt: Date.now(),
    reviewStatus: { educational: 'approved', religious: 'approved', sources: 'approved' },
    quickSummary: 'تثقيف الطفل بحدود جسده وتعليمه الصراخ والهرب والإبلاغ هو الخط الدفاعي الأول.',
    quickAnswer: {
      sayThis: 'جسدك ملكك فقط، لا يحق لأحد أن يلمسه بطريقة تزعجك.',
      dontSayThis: 'الصمت وتجنب الموضوع حفاظاً على البراءة المدعاة.',
      doThisNow: 'تعليمه أسماء أجزاء الجسم الحقيقية وعدم ترك الغموض.'
    },
    commonMistake: 'إخافة الطفل من الناس عموماً وعدم إعطائه حلولاً عملية.',
    educationalView: 'الوقاية تكون بتطبيع الحديث عن الجسد بشكل علمي وبسيط لبناء الحدود الآمنة.',
    suggestedAnswer: 'هناك مناطق خاصة في جسدنا، مغطاة بملابس السباحة، غير مسموح لأحد لمسها إلا أمك أو الطبيب بعلم وقوفنا أمامه.',
    byAgeVersions: [
      { age: '4-6', text: 'قانون الملابس الداخلية: ما تغطيه ملابسك الداخلية هو لك وحدك ولا ينبغي أن يراه أحد.' }
    ],
    practicalSteps: ['علم الطفل أن يقول كلمتي "لا" وتوقف بصوت عالٍ والهرب فوراً لشخص بالغ آمن.'],
    exercises: ['لعبة تمثيلية "ماذا تفعل لو اقترب منك شخص غريب وطلب الذهاب معه؟"'],
    resources: [
      {
        type: 'site',
        title: 'Child Mind Institute - حماية الطفل',
        description: 'مقال يقدم استراتيجيات الحديث مع الأبناء عن الحماية الجسدية.',
        url: 'https://childmind.org/'
      },
      {
        type: 'study',
        title: 'Protecting Children from Sexual Abuse',
        description: 'Mayo Clinic - الإرشادات الطبية والتربوية لحماية الطفل.',
        url: 'https://www.mayoclinic.org/healthy-lifestyle/childrens-health/in-depth/child-sexual-abuse/art-20046603'
      }
    ],
    whenToWorry: 'إذا ظهر على الطفل علامات تغير مفاجئ مثل التبول اللاإرادي أو الانعزال الحاد أو الخوف من أشخاص معينين.',
    closingThought: 'المعرفة هي الدرع الواقي للطفل أمام الخبثاء.'
  },
  {
    id: 'q6',
    question: 'طفلي يرفض الذهاب للمدرسة ويقول بطني يؤلمني',
    category: 'التعليم والمدرسة',
    categoryId: 'education',
    categorySlug: 'education',
    mainCategory: 'التعلم والمدرسة',
    keywords: ['مدرسة', 'هروب', 'مرض'],
    ageGroups: ['7-9', '10-12'],
    riskLevel: 'medium',
    status: 'published',
    createdAt: Date.now() - 6000000,
    updatedAt: Date.now(),
    reviewStatus: { educational: 'approved', religious: 'approved', sources: 'approved' },
    quickSummary: 'هذا ما يعرف بالتطبع النفسي للمرض هرباً من ضغط أو تنمر أو قلق دراسي في المدرسة.',
    quickAnswer: {
      sayThis: 'أرى أنك لست مرتاحاً للذهاب اليوم، هل هناك شيء يزعجك في المدرسة؟',
      dontSayThis: 'أنت تكذب! اذهب واستعد فوراً.',
      doThisNow: 'استمع له بصدق، وتأكد طبياً من عدم وجود مرض حقيقي مبدئياً.'
    },
    commonMistake: 'علاج العرض (الألم) وتجاهل السبب النفسي العميق (القلق من معلم أو طالب).',
    educationalView: 'الحصول على تعاون الطفل أسهل بكثير من كسر إرادته. يجب بناء جسر أمان.',
    suggestedAnswer: 'المدرسة أحياناً تكون صعبة، أريد أن أساعدك على جعلها أفضل. دعنا نتحدث عما يزعجك حقاً.',
    byAgeVersions: [],
    practicalSteps: ['الحديث مع المعلم لبحث سلوك الطفل في الفصل.', 'مراقبة الواجبات', 'بناء علاقات مدرسية له بدعوة أصدقائه للمنزل.'],
    exercises: [],
    resources: [
      {
        type: 'site',
        title: 'School Refusal: How to Help',
        description: 'الأكاديمية الأمريكية لطب الأطفال بخصوص تجنب الأطفال للمدرسة.',
        url: 'https://www.healthychildren.org/English/health-issues/conditions/emotional-problems/Pages/School-Avoidance.aspx'
      }
    ],
    whenToWorry: 'انقطاع تدريجي أو فقدان للوزن وتوتر مستمر يدوم لأسابيع.',
    closingThought: 'الأطفال لا يتصنعون المرض إلا إذا كانت هناك بيئة ضاغطة أقوى من قدرتهم على التعبير.'
  },
  {
    id: 'q7',
    question: 'كيف أشرح الموت لطفلي بكل هدوء؟',
    category: 'المشاعر والذكاء العاطفي',
    categoryId: 'emotions',
    categorySlug: 'emotions',
    mainCategory: 'المشاعر والعلاقات',
    keywords: ['موت', 'فقد', 'مشاعر'],
    ageGroups: ['4-6', '7-9'],
    riskLevel: 'high',
    status: 'published',
    createdAt: Date.now() - 7000000,
    updatedAt: Date.now(),
    reviewStatus: { educational: 'approved', religious: 'approved', sources: 'approved' },
    quickSummary: 'الموت هو جزء من دورة الحياة. الأطفال بحاجة للصدق بطريقة لا تثير الذعر.',
    quickAnswer: {
      sayThis: 'توقف جسمه عن العمل الآن، وهو انتقل ليكون عند الله في الجنة.',
      dontSayThis: 'لقد نام نومة طويلة. (لأن ذلك يسبب خوف الطفل من النوم!)',
      doThisNow: 'دعه يعبر عن حزنه واحتضنه.'
    },
    commonMistake: 'تأليف قصص كاذبة مثل "سافر لمكان بعيد" مما يجعله يشعر بالهجران والانتظار المستمر.',
    educationalView: 'التعبير الصحيح يعلمه أن الفقد أمر حقيقي والمشاعر المصاحبة له شرعية ولا يجب كبتها.',
    suggestedAnswer: 'كل شيء له وقت للحياة، مثل الزهور عندما تذبل. عندما ينتهي الوقت يموت الجسد لكن روحه عند الله ونحن ندعو له دائماً.',
    byAgeVersions: [],
    practicalSteps: ['تجنب ربط الموت بالمرض العادي حتى لا يخاف من أي زكام.'],
    exercises: ['رسم لوحة للفقيد للتعبير عن الحب، أو زراعة شجرة باسمه كصدقة جارية.'],
    resources: [
      {
        type: 'book',
        title: 'كيف نتحدث مع أطفالنا عن فقدان الأحبة؟',
        description: 'كتاب تربوي يعالج التعامل مع صدمات الفقد عند الصغار بشكل سلس.',
        url: 'https://www.google.com/search?q=كتب+عن+شرح+الموت+للاطفال'
      },
      {
        type: 'study',
        title: 'Talking to Children About Death',
        description: 'نصائح المعهد الوطني للصحة والمكتبة الوطنية للطب.',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6433284/'
      }
    ],
    whenToWorry: 'إذا توقف عن الأكل لمدة طويلة أو ظهرت علامات اكتئاب واضطرابات نوم متطرفة.',
    closingThought: 'الوضوح والحب هما أفضل أدوات لتجاوز مرحلة الفقد.'
  },
  {
    id: 'q8',
    question: 'طفلي يطلب هاتفاً خاصاً، متى أسمح له؟',
    category: 'التقنية والهوية الرقمية',
    categoryId: 'digital',
    categorySlug: 'digital',
    mainCategory: 'التقنية والإنترنت',
    keywords: ['هاتف', 'أجهزة', 'عمر'],
    ageGroups: ['10-12', '13-15'],
    riskLevel: 'medium',
    status: 'published',
    createdAt: Date.now() - 8000000,
    updatedAt: Date.now(),
    reviewStatus: { educational: 'approved', religious: 'approved', sources: 'approved' },
    quickSummary: 'لا يوجد عمر مثالي، لكن يُنصح بتأخير امتلاك هاتف ذكي قدر الإمكان (حتى 14 عاماً إن أمكن) لحماية أدمغتهم الدوبامينية.',
    quickAnswer: {
      sayThis: 'الهاتف مسؤولية كبيرة، وسنرى مدى قدرتك على إدارتها أولاً.',
      dontSayThis: 'عندما تكبر، الآن مستحيل ولن أناقش هذا.',
      doThisNow: 'قدم له ساعة ذكية أو جهاز لوحي مشترك (أيباد لجميع العائلة) كخطوة وسيطة.'
    },
    commonMistake: 'إعطاء هاتف للطفل للتخلص من إلحاحه بدون إعداد مسبق لاتفاقية الاستخدام.',
    educationalView: 'يجب أن يكون الهاتف أداة مقننة بضوابط تضعها الأسرة وليس ملكية مطلقة للطفل غير قابلة للتدخل.',
    suggestedAnswer: 'نحن نتفهم رغبتك لأن أصدقاءك يملكون واحداً، ولكننا سنبدأ بجهاز نستخدمه للضرورة وسنتفق على قوانين مثل ساعات الاستخدام المتفق عليها.',
    byAgeVersions: [],
    practicalSteps: ['توقيع اتفاقية الأسرة لاستخدام التقنية بحيث يعرف أنه قد يُسحب لو خالف الشروط.'],
    exercises: [],
    resources: [
      {
        type: 'site',
        title: 'Wait Until 8th',
        description: 'مبادرة أمريكية عالمية لتأخير حصول الأطفال على هواتف ذكية حتى الصف الثامن (14 سنة) لحمايتهم من القلق وتشتت الانتباه.',
        url: 'https://www.waituntil8th.org/'
      },
      {
        type: 'study',
        title: 'Smartphones in childhood',
        description: 'دراسة تأثير الهواتف على نمو الدماغ للطفل وصحته النفسية، منشورة في هارفرد.',
        url: 'https://www.health.harvard.edu/blog/kids-and-smartphones-what-parents-should-know-2019102418047'
      }
    ],
    whenToWorry: 'عندما يصبح الهاتف أو الشاشة وسيلته الوحيدة للتواصل والشعور بالرضا أو الهروب من الواقع.',
    closingThought: 'تأخير الجهاز الذكي هو بمثابة إعطاء الدماغ فرصة للنمو السليم بعيداً عن دوبامين الإشعارات اللانهائية.'
  },
  {
    id: 'q9',
    question: 'كيف أتعامل مع كذب طفلي المستمر؟',
    category: 'السلوك والانضباط',
    categoryId: 'behavior',
    categorySlug: 'behavior',
    mainCategory: 'السلوك والتربية',
    keywords: ['كذب', 'سلوك', 'مواجهة'],
    ageGroups: ['7-9', '10-12'],
    riskLevel: 'medium',
    status: 'published',
    createdAt: Date.now() - 9000000,
    updatedAt: Date.now(),
    reviewStatus: { educational: 'approved', religious: 'approved', sources: 'approved' },
    quickSummary: 'الكذب غالباً يكون بسبب الخوف الشديد من العقاب أو ضعف الثقة أو لتجنب المساءلة النقدية.',
    quickAnswer: {
      sayThis: 'أنا أهتم جداً بمعرفة الحقيقة ولن أغضب إذا كنت صادقاً معي.',
      dontSayThis: 'أنت كاذب! ومنافق! لن أثق بك ثانية أبداً.',
      doThisNow: 'وفر بيئة آمنة للصدق عن طريق شكر الطفل عندما يعترف بخطئه.'
    },
    commonMistake: 'التركيز على العقاب المؤلم ووصم الطفل بلفظ "كاذب" مما يعزز هذه الهوية لديه.',
    educationalView: 'الصدق قيمة تُزرع بالحب والقدوة والتسامح النسبي وليس بتعنيف الأخطاء وتأنيب الضمير المبالغ فيه.',
    suggestedAnswer: 'الجميع يخطئون حتى الكبار، لكن الشجعان فقط هم من يعترفون بذلك. قل لي الحقيقة وأنا سأقف بجانبك ونرى كيف نصحح الموقف.',
    byAgeVersions: [],
    practicalSteps: ['لا تسأل أسئلة فخية إجابتها واضحة (لا تقل: هل كسرت الزجاج؟ وأنت تعلم أنه هو)، بل واجه الموقف بلطف: (الزجاج مكسور، كيف ننظفه وكيف نحترس مرة أخرى؟).'],
    exercises: [],
    resources: [
      {
        type: 'book',
        title: 'How to Talk So Kids Will Listen & Listen So Kids Will Talk',
        description: 'أديل فايبر وإلين مازليش - الكتاب التربوي الأهم في كيفية التواصل مع الأطفال لبناء الثقة ومنع الكذب.',
        url: 'https://www.adelefaber.com/'
      }
    ],
    whenToWorry: 'الكذب العمدي المتكرر بغرض سرقة الآخرين أو إيذائهم دون أدنى شعور بالذنب، فهنا يتطلب تدخل أخصائي نفسي تعديل سلوك.',
    closingThought: 'كلما كان المنزل أكثر هدوءاً واستيعاباً، كان الطفل أكثر صدقاً وتصالحاً مع أخطائه.'
  },
  {
    id: 'q10',
    question: 'كيف أعلم طفلي الفرق بين الغرباء الآمنين والغير آمنين؟',
    category: 'الوقاية وحماية الطفل',
    categoryId: 'prevention',
    categorySlug: 'prevention',
    mainCategory: 'الحماية والمخاطر',
    keywords: ['غرباء', 'حماية', 'وعي'],
    ageGroups: ['4-6', '7-9'],
    riskLevel: 'medium',
    status: 'published',
    createdAt: Date.now() - 10000000,
    updatedAt: Date.now(),
    reviewStatus: { educational: 'approved', religious: 'approved', sources: 'approved' },
    quickSummary: 'تجنب قاعدة "لا تتحدث مع الغرباء"، فهي مربكة للطفل في الطوارئ. علمه قاعدة سلوك الغريب المريب (كأن يطلب الكتمان).',
    quickAnswer: {
      sayThis: 'أي شخص يطلب منك إخفاء سر عني أو يعرض عليك هدية بمفردك دون علمي هو إنسان غير آمن.',
      dontSayThis: 'إياك أن تكلم أي شخص لا تعرفه في الشارع مطلقاً!',
      doThisNow: 'اجعله يعدد قائمة البالغين الآمنين للجوء إليهم في الطوارئ (طبيب، ضابط، أو أم معها أطفال).'
    },
    commonMistake: 'زرع فوبيا الغرباء التي تجعل الطفل متجمداً من الخوف، فيعجز عن طلب مساعدة بالشارع لو فُقد.',
    educationalView: 'يجب التمييز في عقل الطفل بين نوايا الأشخاص وليس أشكالهم، الابتسامة المبالغ فيها لا تعني الأمان.',
    suggestedAnswer: 'إذا ضعت في المتجر وواجهت مشكلة، ابحث عن أم تحمل طفلاً أو موظف أمن واسألهم المساعدة وانتظر مكانك.',
    byAgeVersions: [],
    practicalSteps: ['قاعدة حاسمة: الكبار الآمنون لا يطلبون من الأطفال الصغار المساعدة في حمل حقيبة أو وصف مكان! الكبار يطلبون ذلك من كبار مثلهم.'],
    exercises: [],
    resources: [
      {
        type: 'site',
        title: 'Safety Rule: Tricky People',
        description: 'شعار "الناس المخادعون بدل الغرباء" من موقع Safe Kids.',
        url: 'https://www.safekids.org/'
      }
    ],
    whenToWorry: 'موافقة الطفل السهلة على استلام الحلوى من أشخاص بالغين في الحدائق دون العودة واستئذانك.',
    closingThought: 'نحن لا نخيفهم من العالم، بل نمنحهم راداراً داخلياً لاكتشاف المخاطر المحتملة.'
  },
  {
    id: 'q11',
    question: 'طفلي يسأل: لماذا نحن فقراء وغيرنا أغنياء؟',
    category: 'المال والاستهلاك',
    categoryId: 'money',
    categorySlug: 'money',
    mainCategory: 'السلوك والتربية',
    keywords: ['مال', 'غنى', 'فقر'],
    ageGroups: ['7-9', '10-12'],
    riskLevel: 'medium',
    status: 'published',
    createdAt: Date.now() - 11000000,
    updatedAt: Date.now(),
    reviewStatus: { educational: 'approved', religious: 'approved', sources: 'approved' },
    quickSummary: 'شرح مفهوم تنوع الأرزاق وأن السعادة الحقيقية ليست مربوطة دائماً بالمال وحده.',
    quickAnswer: {
      sayThis: 'الله يوزع الأرزاق بطرق مختلفة، ونحن نمتلك أموراً أخرى ثمينة كالأسرة والصحة.',
      dontSayThis: 'لأننا لا نسرق أو نرابي مثل هؤلاء! (هذا يجعله يحقد على الأغنياء ويكره التطور).',
      doThisNow: 'اذكر له 3 أشياء مجانية تستمتعون بها معاً كعائلة (مثل التنزه أو قراءة القصص).'
    },
    commonMistake: 'إظهار التذمر الدائم والانتقاد لقلة المال أمام الطفل مما يصيبه بالقلق تجاه المستقبل.',
    educationalView: 'يجب تعليم الطفل الرضا والقناعة بجانب التشجيع على العمل والاجتهاد، وليس السخط.',
    suggestedAnswer: 'الغنى ليس بالنقود فقط. الكثير من الناس يملكون قصوراً لكنهم مرضى أو تعساء، هل تفضل النقود الكثيرة مع الوحدة أم عائلتنا الرائعة مع الرزق الذي يكفينا؟',
    byAgeVersions: [],
    practicalSteps: ['تعليمه مهارات إدارة المصروف والادخار المبكر.', 'مشاركته في حصالة الصدقة ليشعر بعطاء من هم أفقر.'],
    exercises: [],
    resources: [
      {
        type: 'book',
        title: 'The Opposite of Spoiled',
        description: 'رون ليبر - كتاب عملي حول كيفية تعليم الأطفال عن المال.',
        url: 'https://www.google.com/search?q=The+Opposite+of+Spoiled+book'
      }
    ],
    whenToWorry: 'إذا بدأ يسرق المال أو يشعر بالدونية الشديدة والعزلة بين زملائه في المدرسة.',
    closingThought: 'المشاعر والقيم تجاه المال هي ميراث تورثه الأسرة أكثر من المال ذاته.'
  },
  {
    id: 'q12',
    question: 'ما فائدة المدرسة والدراسة إذا كان الذكاء الاصطناعي سيفعل كل شيء؟',
    category: 'المستقبل والابتكار',
    categoryId: 'future',
    categorySlug: 'future',
    mainCategory: 'التقنية والإنترنت',
    keywords: ['ذكاء اصطناعي', 'مستقبل', 'دراسة', 'AI'],
    ageGroups: ['10-12', '13-15'],
    riskLevel: 'low',
    status: 'published',
    createdAt: Date.now() - 12000000,
    updatedAt: Date.now(),
    reviewStatus: { educational: 'approved', religious: 'approved', sources: 'approved' },
    quickSummary: 'الذكاء الاصطناعي مجرد أداة عملاقة لكنها تحتاج لمن يديرها بالعقل البشري والفكر النقدي.',
    quickAnswer: {
      sayThis: 'الذكاء الاصطناعي سيساعدك، لكنه لا يملك إبداعك، أخلاقك، وتجاربك العاطفية.',
      dontSayThis: 'أنت محق، المستقبل مظلم ولا داعي للتعب.',
      doThisNow: 'شجعه على استخدام أدوات الذكاء الاصطناعي لحل مسألة معقدة وإظهار أين أخطأ البرنامج.'
    },
    commonMistake: 'إحباط الطفل وتأكيد مخاوفه من استحواذ الآلات على جميع الوظائف.',
    educationalView: 'يجب تحويل الخوف من المستقبل إلى حماس للاستعداد له ومهارات قيادته.',
    suggestedAnswer: 'نحن ندرس الآن لنتعلم كيف نفكر ونحل المشاكل الكبيرة؛ الآلات تنفذ فقط ما نأمرها به. الشخص الذي لا يدرس لن يتمكن من توجيه حتى الذكاء الاصطناعي.',
    byAgeVersions: [],
    practicalSteps: ['تنمية مهارات التفكير الفلسفي والنقدي وحل المشكلات.', 'دمج مفاهيم البرمجة الخفيفة أو توجيه الأوامر للذكاء الاصطناعي Prompt Engineering في اهتماماته.'],
    exercises: [],
    resources: [
      {
        type: 'video',
        title: 'Education in the Age of AI',
        description: 'Sal Khan (TED Talk) يناقش كيف يجب أن تتغير استراتيجيات التعليم في عصر الذكاء الاصطناعي التوليدي.',
        url: 'https://www.ted.com/talks/sal_khan_how_ai_could_save_not_destroy_education'
      },
      {
        type: 'site',
        title: 'World Economic Forum - The Future of Jobs',
        description: 'تقارير حول الوظائف التي تتطلب إبداعاً بشرياً كبيراً في المستقبل.',
        url: 'https://www.weforum.org/reports/the-future-of-jobs-report-2023/'
      }
    ],
    whenToWorry: 'استسلام كامل للفراغ وفقدان الدافعية والانسحاب من الأداء الأكاديمي.',
    closingThought: 'المستقبل لا تصنعه الآلات، بل يصنعه البشر الماهرون الذين يوجهون هذه الآلات.'
  },
  {
    id: 'q13',
    question: 'كيف أحبب طفلي في الصلاة؟',
    category: 'الإيمان والأسئلة الدينية',
    categoryId: 'faith-religious-questions',
    categorySlug: 'faith-religious-questions',
    mainCategory: 'الإيمان والأسئلة الوجودية',
    keywords: ['الصلاة', 'العبادة', 'تربية روحية'],
    ageGroups: ['7-9', '10-12'],
    riskLevel: 'low',
    status: 'published',
    createdAt: Date.now() - 13000000,
    updatedAt: Date.now(),
    reviewStatus: { educational: 'approved', religious: 'approved', sources: 'approved' },
    quickSummary: 'حب الصلاة يأتي بالقدوة المحبة المرنة وليس بالضرب أو الإجبار الذي يخلق نفوراً نفسياً وازدواجية.',
    quickAnswer: {
      sayThis: 'الصلاة هي موعدنا اليومي للتحدث مع الله وشكره على نعمه الكثيرة.',
      dontSayThis: 'قم صلِّ وإلا سيدخلك الله في نار جهنم!',
      doThisNow: 'اصنع زاوية جميلة ومريحة للصلاة في المنزل، وأحياناً صرّح بصوت مسموع: "أنا متشوق للصلاة لأرتاح قليلاً".'
    },
    commonMistake: 'حصر التذكير بالصلاة بصيغة الأمر العسكري، وربطها بالتهديد الدائم.',
    educationalView: 'في المرحلة العمرية 7-10 يجب أن تكون الصلاة تجربة اجتماعية وعاطفية دافئة مقترنة بمحبة الله والأسرة.',
    suggestedAnswer: 'نحن نصلي لأننا نحب الله ونحتاج لزيارته واستمداد الطاقة منه يومياً، فالصلاة مثل شحن الهاتف المحمول.',
    byAgeVersions: [],
    practicalSteps: ['الترغيب الإيجابي: احتضان الطفل بعد كل صلاة والدعاء له.', 'التدرج: البدء باشتراط صلوات محددة يومياً حتى يألفها دون استعجال.', 'الذهاب للمسجد وجعله نزهة قصيرة مريحة.'],
    exercises: [],
    resources: [
      {
        type: 'book',
        title: 'كيف تحبب طفلك في الصلاة؟',
        description: 'تقديم طرق عملية ومناسبة للمراحل العمرية لتحبيب الأطفال بالصلاة وتجنب الإكراه المذموم.',
      },
      {
        type: 'video',
        title: 'خماسية تحبيب الطفل في الصلاة - د. جاسم المطوع',
        description: 'كيف ننتقل بالطفل من الرفض إلى الحب والمبادرة من سن السابعة.',
        url: 'https://www.youtube.com/results?search_query=جاسم+المطوع+الصلاة+للاطفال'
      }
    ],
    whenToWorry: 'عندما يكذب الطفل باستمرار بأنه صلى من شدة خوفه من القصاص الجسدي.',
    closingThought: 'الطفل المجبور سيترك الصلاة فور استقلاله، والطفل المحب سيصلي ولو واجه العالم.'
  },
  {
    id: 'q14',
    question: 'طفلي المتنمر: ماذا أفعل إذا كان ابني هو من يتنمر على زملائه؟',
    category: 'السلوك والانضباط',
    categoryId: 'behavior',
    categorySlug: 'behavior',
    mainCategory: 'السلوك والتربية',
    keywords: ['تنمر', 'عنف', 'سلوك عدواني'],
    ageGroups: ['7-9', '10-12', '13-15'],
    riskLevel: 'high',
    status: 'published',
    createdAt: Date.now() - 14000000,
    updatedAt: Date.now(),
    reviewStatus: { educational: 'approved', religious: 'approved', sources: 'approved' },
    quickSummary: 'الطفل المتنمر غالباً ما يفتقد إلى التعاطف أو يعاني من ضغط خفي ويسعى لإثبات السيطرة.',
    quickAnswer: {
      sayThis: 'السلوك الذي قمت به سيء ومرفوض، ولا يمكننا أذية الآخرين لأننا نشعر بالغضب.',
      dontSayThis: 'لا بأس، هذا يثبت أنك قوي وتدافع عن نفسك.',
      doThisNow: 'ناقش معه كيف يشعر الضحية، وافرض عواقب طبيعية واضحة بخصوص الحادثة.'
    },
    commonMistake: 'الإنكار المطلق لخطأ الابن أمام إدارة المدرسة والمبررات الدائمة لسلوكه أو تعنيفه بعُنف في المنزل كرد فعل.',
    educationalView: 'يحتاج المتنمر إلى تدريب مكثف على مهارات "الذكاء العاطفي والتعاطف" قبل العقاب المجرد.',
    suggestedAnswer: 'نحن عائلة لا نقبل إيذاء الناس مطلقاً، كيف كنت ستشعر لو حدث ذلك لك؟ علينا أن نكتب رسالة اعتذار ونصلح ما حدث.',
    byAgeVersions: [],
    practicalSteps: [
      'البحث عن الجذر التربوي (هل يشاهد عنفاً أسرياً أو محتوى ميديا عنيفاً؟).',
      'تدريبه على حل الصراعات بالكلام البناء وليس فرض العوائق الجسدية.',
      'التعاون الوثيق والمباشر مع المدرسة لتقويم سلوكه.'
    ],
    exercises: [],
    resources: [
      {
        type: 'site',
        title: 'StopBullying.gov - What to Do If Your Child Is Bullying Others',
        description: 'خطوات عملية من مؤسسات حكومية أمريكية للتعامل مع الطفل المتنمر وتصحيح سلوكه.',
        url: 'https://www.stopbullying.gov/prevention/what-to-do-if-your-child-is-bullying-others'
      },
      {
        type: 'book',
        title: 'الذكاء العاطفي للأطفال',
        description: 'كتاب يشرح كيف ننمي التعاطف والإحساس بالآخرين لدى الأطفال واليافعين لتجنب العدوانية.'
      }
    ],
    whenToWorry: 'عندما يستمتع بإيذاء الحيوانات الأليفة أو لا يُظهر أي مشاعر تأنيب للضمير بعد إيذاء زميل.',
    closingThought: 'التقويم المبكر للمتنمر هو إنقاذ له من العزلة والرفض الاجتماعي المستقبلي.'
  }
];
