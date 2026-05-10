export const seedData = [
  {
    id: 'seed-1',
    text: 'كيف نساعد الطفل على ترك العناد بدون كسر شخصيته؟ #تربية',
    author: 'نورة',
    authorId: 'seed-author-1',
    likes: 45,
    type: 'seed'
  },
  {
    id: 'branch-1',
    text: 'يمكن تحويل العناد إلى شعور بالاختيار، بحيث نعطي الطفل خيارين مقبولين بدلاً من أمر مباشر. #تطوير #تربية',
    author: 'عبدالله',
    authorId: 'seed-author-2',
    likes: 28,
    type: 'branch',
    parentId: 'seed-1'
  },
  {
    id: 'branch-2',
    text: 'الأفضل مراقبة متى يظهر العناد: وقت الجوع، التعب، أو الشعور بالتجاهل. #تربية #تحليل',
    author: 'سارة',
    authorId: 'seed-author-3',
    likes: 15,
    type: 'branch',
    parentId: 'seed-1'
  },
  {
    id: 'branch-5',
    text: 'استخدام لغة "نحن" بدلاً من "أنت"، مثلاً: "نحن نحتاج لترتيب الغرفة لنلعب براحة". #تربية #تواصل',
    author: 'فهد',
    authorId: 'seed-author-7',
    likes: 12,
    type: 'branch',
    parentId: 'branch-1'
  },
  {
    id: 'branch-13',
    text: 'هذا الأسلوب ينمي "روح الفريق الواحد" داخل الأسرة ويقلل من حدة المواجهة الفردية. #تربية #عمق',
    author: 'دلال',
    authorId: 'seed-author-12',
    likes: 15,
    type: 'branch',
    parentId: 'branch-5'
  },
  {
    id: 'branch-14',
    text: 'ويمكن تعزيز ذلك عبر نظام "المكافأة الجماعية" لتعزيز قيمة التعاون لا التنافس. #تربية #جذر_الجذر',
    author: 'بدر',
    authorId: 'seed-author-10',
    likes: 9,
    type: 'branch',
    parentId: 'branch-13'
  },
  {
    id: 'branch-20',
    text: 'هذه المكافأة يجب أن تكون "معنوية" مثل وقت إضافي للعب معاً، لترسيخ الروابط. #تربية #عمق_العمق',
    author: 'سارة',
    authorId: 'seed-author-3',
    likes: 7,
    type: 'branch',
    parentId: 'branch-14'
  },
  {
    id: 'branch-21',
    text: 'الجذر النهائي: الهدف ليس طاعة الطفل، بل بناء "بوصلة داخلية" توجه سلوكه للأبد. #تربية #الحكمة_القصوى',
    author: 'مريم',
    authorId: 'seed-author-5',
    likes: 24,
    type: 'branch',
    parentId: 'branch-20'
  },
  {
    id: 'seed-2',
    text: 'هل التعليم الشخصي أفضل من التعليم الموحد لكل الطلاب؟ #تعليم',
    author: 'يوسف',
    authorId: 'seed-author-4',
    likes: 34,
    type: 'seed'
  },
  {
    id: 'branch-6',
    text: 'التعليم الشخصي يراعي سرعة التعلم المختلفة وأنماط الذكاء المتعددة. #تعليم #تطوير',
    author: 'مريم',
    authorId: 'seed-author-5',
    likes: 19,
    type: 'branch',
    parentId: 'seed-2'
  },
  {
    id: 'seed-3',
    text: 'كيف يمكن للقائد أن يكون حازماً بدون أن يكون قاسياً؟ #قيادة',
    author: 'مريم',
    authorId: 'seed-author-5',
    likes: 52,
    type: 'seed'
  },
  {
    id: 'branch-7',
    text: 'الحزم يعني الوضوح في التوقعات، والقسوة تعني غياب التعاطف مع التحديات. #قيادة #إدارة',
    author: 'خالد',
    authorId: 'seed-author-6',
    likes: 41,
    type: 'branch',
    parentId: 'seed-3'
  },
  {
    id: 'branch-15',
    text: 'التوقعات الواضحة تخفف القلق عند الفريق، مما يقلل الحاجة للمواجهة القاسية أصلاً. #قيادة #استراتيجية',
    author: 'نورة',
    authorId: 'seed-author-1',
    likes: 22,
    type: 'branch',
    parentId: 'branch-7'
  },
  {
    id: 'branch-16',
    text: 'الصياغة الدقيقة لهذا يعني تحويل "الأوامر" إلى "أهداف مشتركة" يدرك الجميع منفعتها. #قيادة #تطور',
    author: 'أحمد',
    authorId: 'seed-author-9',
    likes: 14,
    type: 'branch',
    parentId: 'branch-15'
  },
  {
    id: 'seed-4',
    text: 'هل يمكن للذكاء الاصطناعي أن يصبح مدرباً شخصياً للتفكير؟ #تكنولوجيا',
    author: 'خالد',
    authorId: 'seed-author-6',
    likes: 88,
    type: 'seed'
  },
  {
    id: 'branch-8',
    text: 'يمكنه ذلك عبر كشف المغالطات المنطقية في أفكارنا التي قد لا نلاحظها نحن. #تكنولوجيا #فلسفة',
    author: 'ليان',
    authorId: 'seed-author-8',
    likes: 55,
    type: 'branch',
    parentId: 'seed-4'
  },
  {
    id: 'seed-5',
    text: 'كيف نحول الخلافات العائلية إلى حوارات صحية؟ #أسرة',
    author: 'فهد',
    authorId: 'seed-author-7',
    likes: 21,
    type: 'seed'
  },
  {
    id: 'seed-6',
    text: 'ما الطريقة الأفضل لبناء عادة جديدة بدون ضغط؟ #تطوير_الذات',
    author: 'ليان',
    authorId: 'seed-author-8',
    likes: 67,
    type: 'seed'
  },
  {
    id: 'branch-9',
    text: 'مبدأ "العادات الذرية": ابدأ بشيء بسيط جداً لا يمكنك الفشل فيه، مثل القراءة لصفحة واحدة. #تطوير_الذات',
    author: 'أحمد',
    authorId: 'seed-author-9',
    likes: 33,
    type: 'branch',
    parentId: 'seed-6'
  },
  {
    id: 'branch-17',
    text: 'السر في "الارتباط الشرطي": اربط العادة الجديدة بفعل تقوم به تلقائياً (مثل القهوة الصباحية). #تطوير_الذات',
    author: 'مريم',
    authorId: 'seed-author-5',
    likes: 25,
    type: 'branch',
    parentId: 'branch-9'
  },
  {
    id: 'branch-18',
    text: 'هذا يقلل "مقاومة الدماغ" للتغيير لأن الفعل الجديد يصبح جزءاً من تدفق اليوم "Flow". #علم_نفس #تطوير',
    author: 'خالد',
    authorId: 'seed-author-6',
    likes: 19,
    type: 'branch',
    parentId: 'branch-17'
  },
  {
    id: 'branch-19',
    text: 'الوصول لهذه المرحلة يجعل العادة "جذرية" ولا تحتاج لجهد إرادي للمحافظة عليها. #إتقان #جذر',
    author: 'سارة',
    authorId: 'seed-author-14',
    likes: 31,
    type: 'branch',
    parentId: 'branch-18'
  },
  {
    id: 'seed-7',
    text: 'كيف يتعلم المبتدئ الاستثمار بدون أن يقع في القرارات العاطفية؟ #المال #البورصة',
    author: 'أحمد',
    authorId: 'seed-author-9',
    likes: 42,
    type: 'seed'
  },
  {
    id: 'branch-3',
    text: 'استخدام تطبيقات محاكاة التداول قبل البدء بأموال حقيقية يقلل التوتر بشكل كبير. #تطوير #بورصة',
    author: 'بدر',
    authorId: 'seed-author-10',
    likes: 18,
    type: 'branch',
    parentId: 'seed-7'
  },
  {
    id: 'branch-22',
    text: 'هذا يساعد في عزل "الضجيج" الإعلامي والتركيز على الأرقام والبيانات الصلبة فقط. #مال #استثمار',
    author: 'خالد',
    authorId: 'seed-author-6',
    likes: 13,
    type: 'branch',
    parentId: 'branch-3'
  },
  {
    id: 'branch-23',
    text: 'الخطوة التالية هي "الأتمتة": اجعل الاستثمار يتم تلقائياً لتلغي دور "القرار اللحظي" الخطير. #مال #ذكاء_مالي',
    author: 'نورة',
    authorId: 'seed-author-1',
    likes: 21,
    type: 'branch',
    parentId: 'branch-22'
  },
  {
    id: 'branch-24',
    text: 'جذر الاستثمار: الوقت أثمن من المبلغ؛ ابدأ صغيراً جداً لكن ابدأ الآن بلا تردد. #مال #حكمة',
    author: 'أحمد',
    authorId: 'seed-author-9',
    likes: 45,
    type: 'branch',
    parentId: 'branch-23'
  },
  {
    id: 'seed-8',
    text: 'كيف نصمم بيئة عمل تقلل التوتر وتزيد الإنتاجية؟ #عمل',
    author: 'حصة',
    authorId: 'seed-author-11',
    likes: 39,
    type: 'seed'
  },
  {
    id: 'branch-25',
    text: 'إدخال عناصر "البيوفيليا" (النباتات والضوء الطبيعي) يقلل من ضغط الدم ويزيد التركيز. #بيئة_العمل #صحة',
    author: 'دلال',
    authorId: 'seed-author-12',
    likes: 17,
    type: 'branch',
    parentId: 'seed-8'
  },
  {
    id: 'branch-26',
    text: 'بل وتخصيص "ركن للصمت التام" يمنع مقاطعة الزملاء أثناء المهام التي تتطلب تركيزاً عميقاً. #عمل #إبداع',
    author: 'فهد',
    authorId: 'seed-author-16',
    likes: 12,
    type: 'branch',
    parentId: 'branch-25'
  },
  {
    id: 'branch-27',
    text: 'قياس الأثر: لاحظ انخفاض معدل الخطأ في التقارير بعد تطبيق نظام "ساعات التركيز". #عمل #بيانات',
    author: 'حصة',
    authorId: 'seed-author-11',
    likes: 8,
    type: 'branch',
    parentId: 'branch-26'
  },
  {
    id: 'seed-9',
    text: 'هل الاستماع العميق أهم مهارة في العلاقات الإنسانية؟ #علاقات',
    author: 'دلال',
    authorId: 'seed-author-12',
    likes: 56,
    type: 'seed'
  },
  {
    id: 'branch-10',
    text: 'الاستماع العميق يعطي الآخر شعوراً بالأمان، وهو حجر الزاوية لأي علاقة ناجحة. #علاقات #تطور',
    author: 'سارة',
    authorId: 'seed-author-3',
    likes: 27,
    type: 'branch',
    parentId: 'seed-9'
  },
  {
    id: 'seed-10',
    text: 'كيف نفرق بين الاحتياج الطبيعي للراحة وبين بوادر الاحتراق النفسي؟ #صحة_نفسية',
    author: 'خالد',
    authorId: 'seed-author-13',
    likes: 102,
    type: 'seed'
  },
  {
    id: 'branch-11',
    text: 'الراحة تعيد لنا طاقتنا، بينما الاحتراق النفسي يجعلنا نشعر بالفراغ حتى بعد النوم لساعات. #صحة_نفسية',
    author: 'مريم',
    authorId: 'seed-author-5',
    likes: 74,
    type: 'branch',
    parentId: 'seed-10'
  },
  {
    id: 'seed-11',
    text: 'ما هي الطريقة الأنسب لاتخاذ القرارات المصيرية تحت الضغط؟ #اتخاذ_القرار',
    author: 'سارة',
    authorId: 'seed-author-14',
    likes: 44,
    type: 'seed'
  },
  {
    id: 'branch-28',
    text: 'استخدم "مصفوفة أيزنهاور" لتصنيف القرارات بين المهم والعاجل. #اتخاذ_القرار #أدوات',
    author: 'خالد',
    authorId: 'seed-author-6',
    likes: 15,
    type: 'branch',
    parentId: 'seed-11'
  },
  {
    id: 'branch-29',
    text: 'لكن الأخطر هو "الانحياز التأكيدي" الذي يجعلنا نختار ما يوافق هوانا لا ما نراه صحيحاً. #وعي #جذر',
    author: 'نورة',
    authorId: 'seed-author-1',
    likes: 28,
    type: 'branch',
    parentId: 'branch-28'
  },
  {
    id: 'branch-30',
    text: 'لذا، جرب "التفكير من المبادئ الأولى": فكك المشكلة لعناصرها الأساسية وأعد بناءها. #فلسفة #تفكير_عميق',
    author: 'أحمد',
    authorId: 'seed-author-9',
    likes: 41,
    type: 'branch',
    parentId: 'branch-29'
  },
  {
    id: 'branch-31',
    text: 'هذا يقودنا لمرحلة "الاحتمالات": لا يوجد قرار صحيح 100%، بل هناك نسبة نجاح متوقعة. #رياضيات #منطق',
    author: 'بدر',
    authorId: 'seed-author-10',
    likes: 19,
    type: 'branch',
    parentId: 'branch-30'
  },
  {
    id: 'branch-32',
    text: 'هنا يأتي دور "الميتا-إدراك": راقب طريقة تفكيرك وأنت تتخذ القرار كأنك شخص ثالث. #علم_نفس #جذر_الجذر',
    author: 'مريم',
    authorId: 'seed-author-5',
    likes: 35,
    type: 'branch',
    parentId: 'branch-31'
  },
  {
    id: 'branch-33',
    text: 'المستوى الأعمق: القرار العظيم ليس وليد العقل فقط، بل هو تناغم بين المنطق والحدس المصقول. #حكمة #تطور',
    author: 'دلال',
    authorId: 'seed-author-12',
    likes: 52,
    type: 'branch',
    parentId: 'branch-32'
  },
  {
    id: 'branch-34',
    text: 'الجذر النهائي: السكون هو أعلى درجات اتخاذ القرار؛ فكر بهدوء لترى الحقيقة بوضوح. #السكون #التنوير',
    author: 'يوسف',
    authorId: 'seed-author-15',
    likes: 77,
    type: 'branch',
    parentId: 'branch-33'
  },
  {
    id: 'seed-12',
    text: 'كيف يمكن تحفيز الإبداع في المهام الروتينية اليومية؟ #إبداع',
    author: 'يوسف',
    authorId: 'seed-author-15',
    likes: 31,
    type: 'seed'
  },
  {
    id: 'seed-13',
    text: 'كيف نبدأ مشروعاً صغيراً بميزانية محدودة جداً؟ #مشاريع',
    author: 'فهد',
    authorId: 'seed-author-16',
    likes: 125,
    type: 'seed'
  },
  {
    id: 'seed-14',
    text: 'هل تنظيم الوقت مهارة فطرية أم شيء يمكن اكتسابه؟ #تنظيم_الوقت',
    author: 'مريم',
    authorId: 'seed-author-17',
    likes: 53,
    type: 'seed'
  },
  {
    id: 'branch-4',
    text: 'تنظيم الوقت غالباً ما يكون صراعاً مع الأولويات وليس مع الساعات. #تطوير #تنظيم_الوقت',
    author: 'عبدالله',
    authorId: 'seed-author-18',
    likes: 36,
    type: 'branch',
    parentId: 'seed-14'
  },
  {
    id: 'seed-15',
    text: 'كيف نحمي التركيز في عصر التشتت الرقمي؟ #تركيز #تكنولوجيا',
    author: 'بدر',
    authorId: 'seed-author-10',
    likes: 61,
    type: 'seed'
  },
  {
    id: 'branch-12',
    text: 'تخصيص "مناطق خالية من التكنولوجيا" في المنزل يساعد في استعادة وضوح الذهن. #تطوير #نمط_حياة',
    author: 'حصة',
    authorId: 'seed-author-11',
    likes: 29,
    type: 'branch',
    parentId: 'seed-15'
  }
];
