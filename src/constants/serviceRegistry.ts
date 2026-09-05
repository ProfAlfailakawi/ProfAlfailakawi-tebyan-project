import type { ElementType } from 'react';
import {
  Activity,
  BarChart3,
  BookOpenText,
  Box,
  BrainCircuit,
  ClipboardCheck,
  Command,
  Gamepad2,
  Hourglass,
  LibraryBig,
  Lightbulb,
  Lock,
  Mail,
  MessageCircleQuestion,
  Network,
  Route,
  ScrollText,
  Sparkles,
  TicketPercent,
  Users,
  Waves,
  Zap,
} from 'lucide-react';

export type ServiceCategory = 'understand' | 'decide' | 'solve' | 'create' | 'plan' | 'personal';

export type TebyanService = {
  id: string;
  category: ServiceCategory;
  icon: ElementType;
  titleAr: string;
  titleEn: string;
  brandAr: string;
  brandEn: string;
  descriptionAr: string;
  descriptionEn: string;
  keywordsAr: string[];
  keywordsEn: string[];
  featured?: boolean;
};

export const SERVICE_CATEGORIES: Array<{
  id: ServiceCategory;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
}> = [
  {
    id: 'understand',
    titleAr: 'أفهم وأتعلم',
    titleEn: 'Understand & learn',
    descriptionAr: 'اسأل، اطلب جواباً موثوقاً، وشاهد أفكارك مترابطة.',
    descriptionEn: 'Ask, get a trusted answer, and see your ideas connected.',
  },
  {
    id: 'decide',
    titleAr: 'أحسم وأنجز',
    titleEn: 'Decide & do',
    descriptionAr: 'احسم قرارك، تدرّب على الموقف، وولّد أفكاراً جديدة.',
    descriptionEn: 'Decide, rehearse the situation, and generate new ideas.',
  },
  {
    id: 'create',
    titleAr: 'أبتكر وأصوغ',
    titleEn: 'Create & shape',
    descriptionAr: 'حوّل الفكرة الخام إلى قصة، مخطوطة، أو تجربة بصرية.',
    descriptionEn: 'Turn a raw idea into a story, manuscript, or visual experience.',
  },
  {
    id: 'plan',
    titleAr: 'أخطط وأقيس',
    titleEn: 'Plan & measure',
    descriptionAr: 'حوّل الهدف إلى مسار، اختبر فهمك، واقرأ تقدمك.',
    descriptionEn: 'Turn a goal into a path, test understanding, and read progress.',
  },
  {
    id: 'personal',
    titleAr: 'رحلتي',
    titleEn: 'My journey',
    descriptionAr: 'خطتك وتقدمك، مجتمع الأفكار، وركنك الخاص.',
    descriptionEn: 'Your plan and progress, the idea community, and your corner.',
  },
];

export const TEBYAN_SERVICES: TebyanService[] = [
  {
    id: 'ask',
    category: 'understand',
    icon: MessageCircleQuestion,
    titleAr: 'اسأل تبيان',
    titleEn: 'Ask Tebyan',
    brandAr: 'جواب يناسب سؤالك',
    brandEn: 'One question, your style of answer',
    descriptionAr: 'اسأل عن أي شيء، واختر أسلوب الجواب: واضح، مبسّط، أو على شكل قصة.',
    descriptionEn: 'Ask anything and pick how you want the answer: clear, simplified, or as a story.',
    keywordsAr: ['سؤال', 'شرح', 'أفهم', 'بسط', 'مستشار', 'قصة', 'خريطة'],
    keywordsEn: ['question', 'explain', 'understand', 'simplify', 'counsel', 'story', 'map'],
    featured: true,
  },
  {
    id: 'qawlfasl',
    category: 'understand',
    icon: ScrollText,
    titleAr: 'قول فصل',
    titleEn: 'Qawl Fasl',
    brandAr: 'مرجع الوالدين الموثوق',
    brandEn: 'The trusted parents reference',
    descriptionAr: 'أجوبة محسومة ومراجعة لأصعب أسئلة الأطفال ومواقف التربية.',
    descriptionEn: 'Vetted, decisive answers to the hardest questions children ask.',
    keywordsAr: ['طفل', 'ولدي', 'بنتي', 'تربية', 'يسأل', 'مراهق'],
    keywordsEn: ['child', 'kid', 'parenting', 'asks', 'teen'],
    featured: true,
  },

  {
    id: 'oracle', category: 'understand', icon: BrainCircuit,
    titleAr: 'المستشار الكلي', titleEn: 'Oracle',
    brandAr: 'رأي أعمق من عدة زوايا', brandEn: 'A wider advisory lens',
    descriptionAr: 'استدع مستشاراً مناسباً لطبيعة السؤال، واسمع قراءة موزونة قبل القرار.',
    descriptionEn: 'Call up the right advisor for the question and get a balanced read before moving.',
    keywordsAr: ['مستشار', 'رأي', 'نصيحة', 'خبير', 'زاوية'], keywordsEn: ['advisor', 'opinion', 'advice', 'expert', 'angle'], featured: true,
  },
  {
    id: 'concepts', category: 'understand', icon: BookOpenText,
    titleAr: 'المفاهيم', titleEn: 'Concepts', brandAr: 'فكك المصطلح من جذره', brandEn: 'Unpack the idea from its root',
    descriptionAr: 'حوّل المفاهيم الثقيلة إلى تعريفات وروابط وأمثلة قابلة للفهم.', descriptionEn: 'Turn dense concepts into definitions, links, and usable examples.',
    keywordsAr: ['مفهوم', 'تعريف', 'مصطلح', 'شرح'], keywordsEn: ['concept', 'definition', 'term', 'explain'],
  },
  {
    id: 'knowledgecenter', category: 'understand', icon: Network,
    titleAr: 'مركز المعرفة', titleEn: 'Knowledge Center', brandAr: 'ابحث داخل شبكة المعنى', brandEn: 'Search inside the meaning network',
    descriptionAr: 'استكشف موضوعاً عبر جذوره وروابطه ومداخله العلمية والفكرية.', descriptionEn: 'Explore a topic through roots, links, and scholarly entry points.',
    keywordsAr: ['بحث', 'معرفة', 'مصادر', 'مركز', 'شبكة'], keywordsEn: ['research', 'knowledge', 'sources', 'center', 'network'], featured: true,
  },
  {
    id: 'mindmap', category: 'understand', icon: Network,
    titleAr: 'الخريطة الذهنية', titleEn: 'Mind Map', brandAr: 'حوّل الفكرة إلى بنية', brandEn: 'Turn thought into structure',
    descriptionAr: 'ارسم العلاقات بين الأفكار لتعرف الأصل والفرع والخطوة التالية.', descriptionEn: 'Map relationships between ideas so roots, branches, and next steps are visible.',
    keywordsAr: ['خريطة ذهنية', 'تنظيم', 'ربط', 'أفكار'], keywordsEn: ['mind map', 'organize', 'connect', 'ideas'],
  },
  {
    id: 'truthmanuscript', category: 'understand', icon: ScrollText,
    titleAr: 'مخطوطة الحقيقة', titleEn: 'Truth Manuscript', brandAr: 'اكتب ما لا يقال بسهولة', brandEn: 'Write what is hard to say',
    descriptionAr: 'حوّل التأملات والمشاعر والأفكار العميقة إلى نص مصقول قابل للحفظ.', descriptionEn: 'Turn reflections, emotions, and deep thoughts into a polished saved text.',
    keywordsAr: ['كتابة', 'مشاعر', 'تأمل', 'مخطوطة'], keywordsEn: ['writing', 'feelings', 'reflection', 'manuscript'],
  },
  {
    id: 'timemachine', category: 'understand', icon: Hourglass,
    titleAr: 'آلة الزمن', titleEn: 'Time Machine', brandAr: 'افهم الماضي والمآل', brandEn: 'Read the past and possible outcomes',
    descriptionAr: 'شاهد كيف نشأت فكرة أو قرار، وما السيناريوهات التي قد يفتحها.', descriptionEn: 'See how an idea or decision emerged and what scenarios it may open.',
    keywordsAr: ['زمن', 'مستقبل', 'ماضي', 'سيناريو'], keywordsEn: ['time', 'future', 'past', 'scenario'],
  },
  {
    id: 'council', category: 'decide', icon: Users,
    titleAr: 'المجلس', titleEn: 'Council', brandAr: 'اسمع الرأي والرأي المضاد', brandEn: 'Hear the view and counterview',
    descriptionAr: 'ضع القضية أمام مجلس آراء متعددة قبل أن تحسم.', descriptionEn: 'Put the issue before multiple viewpoints before deciding.',
    keywordsAr: ['مجلس', 'نقاش', 'آراء', 'حوار'], keywordsEn: ['council', 'debate', 'views', 'dialogue'],
  },
  {
    id: 'strategicarena', category: 'decide', icon: ClipboardCheck,
    titleAr: 'الميدان الاستراتيجي', titleEn: 'Strategic Arena', brandAr: 'حوّل الهدف إلى مناورة', brandEn: 'Turn the goal into a maneuver',
    descriptionAr: 'اختبر الأهداف والخصوم والمخاطر بخطة تنفيذ أكثر صلابة.', descriptionEn: 'Stress-test goals, opposing forces, and risks with a stronger execution plan.',
    keywordsAr: ['استراتيجية', 'هدف', 'مخاطر', 'تنفيذ'], keywordsEn: ['strategy', 'goal', 'risk', 'execution'], featured: true,
  },
  {
    id: 'creativelab', category: 'create', icon: Sparkles,
    titleAr: 'المختبر الإبداعي', titleEn: 'Creative Lab', brandAr: 'اصنع احتمالاً جديداً', brandEn: 'Make a new possibility',
    descriptionAr: 'امزج مجالات وأفكاراً متباعدة لتوليد اتجاهات ومشاريع مبتكرة.', descriptionEn: 'Fuse distant fields and ideas into inventive directions and projects.',
    keywordsAr: ['إبداع', 'ابتكار', 'تصميم', 'توليد'], keywordsEn: ['creative', 'innovation', 'design', 'generate'], featured: true,
  },
  {
    id: 'ar', category: 'create', icon: Box,
    titleAr: 'تبيان الروابط', titleEn: 'Tebyan AR', brandAr: 'شاهد المعرفة في الفضاء', brandEn: 'See knowledge in space',
    descriptionAr: 'حوّل المفاهيم إلى طبقات بصرية وتجربة واقع معزز.', descriptionEn: 'Turn concepts into visual layers and an augmented experience.',
    keywordsAr: ['واقع معزز', 'تصور', 'مجسم', 'روابط'], keywordsEn: ['ar', 'visualize', 'spatial', 'links'],
  },
  {
    id: 'story', category: 'create', icon: BookOpenText,
    titleAr: 'القصة', titleEn: 'Story', brandAr: 'افهم بالحكاية', brandEn: 'Understand through story',
    descriptionAr: 'حوّل الموضوع إلى قصة توضّح المعنى وتبقيه في الذاكرة.', descriptionEn: 'Turn a topic into a story that clarifies and sticks.',
    keywordsAr: ['قصة', 'حكاية', 'تبسيط', 'طفل'], keywordsEn: ['story', 'narrative', 'simplify', 'child'],
  },
  {
    id: 'roadmap', category: 'plan', icon: Route,
    titleAr: 'خارطة الطريق', titleEn: 'Roadmap', brandAr: 'رتّب الطريق خطوة خطوة', brandEn: 'Shape the path step by step',
    descriptionAr: 'حوّل الهدف أو السؤال إلى مراحل عملية قابلة للمتابعة.', descriptionEn: 'Turn a goal or question into practical stages you can follow.',
    keywordsAr: ['خطة', 'مسار', 'مراحل', 'هدف'], keywordsEn: ['plan', 'path', 'stages', 'goal'], featured: true,
  },
  {
    id: 'quizzes', category: 'plan', icon: ClipboardCheck,
    titleAr: 'الاختبارات', titleEn: 'Quizzes', brandAr: 'اختبر الفهم بسرعة', brandEn: 'Check understanding quickly',
    descriptionAr: 'حوّل ما تعلمته إلى أسئلة قصيرة تكشف الفجوات.', descriptionEn: 'Turn learning into short questions that expose gaps.',
    keywordsAr: ['اختبار', 'أسئلة', 'تقييم', 'تعلم'], keywordsEn: ['quiz', 'questions', 'assessment', 'learn'],
  },
  {
    id: 'analytics', category: 'plan', icon: BarChart3,
    titleAr: 'التحليلات', titleEn: 'Analytics', brandAr: 'اقرأ تقدمك بوضوح', brandEn: 'Read your progress clearly',
    descriptionAr: 'تابع أنماط استخدامك ونموك المعرفي ومؤشرات التقدم.', descriptionEn: 'Track usage patterns, cognitive growth, and progress signals.',
    keywordsAr: ['تحليل', 'تقدم', 'مؤشرات', 'إحصاء'], keywordsEn: ['analytics', 'progress', 'metrics', 'stats'],
  },
  {
    id: 'mylibrary', category: 'personal', icon: LibraryBig,
    titleAr: 'مكتبتي', titleEn: 'My Library', brandAr: 'كل محفوظاتك في مكان واحد', brandEn: 'All saved work in one place',
    descriptionAr: 'ارجع للأسئلة والأجوبة والمخطوطات التي حفظتها.', descriptionEn: 'Return to saved questions, answers, and manuscripts.',
    keywordsAr: ['مكتبة', 'محفوظات', 'أرشيف'], keywordsEn: ['library', 'saved', 'archive'],
  },
  {
    id: 'loyalty', category: 'personal', icon: TicketPercent,
    titleAr: 'التقدم والمكافآت', titleEn: 'Progress & Rewards', brandAr: 'حوافز رحلتك', brandEn: 'Rewards for your journey',
    descriptionAr: 'تابع نقاطك وأوسمتك والمزايا المرتبطة برحلتك.', descriptionEn: 'Track points, badges, and benefits tied to your journey.',
    keywordsAr: ['نقاط', 'مكافآت', 'ولاء', 'أوسمة'], keywordsEn: ['points', 'rewards', 'loyalty', 'badges'],
  },
  {
    id: 'contact', category: 'personal', icon: Mail,
    titleAr: 'تواصل معنا', titleEn: 'Contact Us', brandAr: 'باب مباشر للفريق', brandEn: 'A direct door to the team',
    descriptionAr: 'أرسل ملاحظة أو طلب دعم أو فكرة تطوير.', descriptionEn: 'Send feedback, support requests, or improvement ideas.',
    keywordsAr: ['تواصل', 'دعم', 'ملاحظة', 'رسالة'], keywordsEn: ['contact', 'support', 'feedback', 'message'],
  },
  {
    id: 'decisionroom',
    category: 'decide',
    icon: Command,
    titleAr: 'غرفة القرار',
    titleEn: 'Decision Room',
    brandAr: 'احسم من كل الزوايا',
    brandEn: 'Decide from every angle',
    descriptionAr: 'وازن بين خياراتك، اكشف المخاطر، واسمع آراء تخالفك قبل أن تحسم.',
    descriptionEn: 'Weigh your options, expose the risks, and hear opposing views before you decide.',
    keywordsAr: ['قرار', 'محتار', 'أحسم', 'خيار', 'مخاطر', 'مجلس'],
    keywordsEn: ['decision', 'torn', 'decide', 'options', 'risks', 'council'],
    featured: true,
  },
  {
    id: 'simulation',
    category: 'decide',
    icon: Gamepad2,
    titleAr: 'المحاكاة',
    titleEn: 'Simulation',
    brandAr: 'تدرّب قبل الموقف',
    brandEn: 'Rehearse before the moment',
    descriptionAr: 'عش الموقف في بيئة آمنة — حوار تفاعلي ثم تحليل لأدائك.',
    descriptionEn: 'Live the situation safely — interactive dialogue then a performance analysis.',
    keywordsAr: ['تدرب', 'مقابلة', 'حوار', 'تفاوض', 'محاكاة'],
    keywordsEn: ['practice', 'interview', 'dialogue', 'negotiate', 'simulate'],
  },
  {
    id: 'lab',
    category: 'decide',
    icon: Lightbulb,
    titleAr: 'مختبر الأفكار',
    titleEn: 'Idea Lab',
    brandAr: 'ورشة التوليد والإبداع',
    brandEn: 'The generation workshop',
    descriptionAr: 'ولّد أفكاراً جديدة، وحلّل فكرتك من كل زاوية.',
    descriptionEn: 'Generate new ideas and analyse yours from every angle.',
    keywordsAr: ['فكرة', 'إبداع', 'ابتكار', 'مشروع', 'توليد'],
    keywordsEn: ['idea', 'creative', 'innovate', 'project', 'generate'],
  },
  {
    id: 'knowledgegraph',
    category: 'understand',
    icon: Network,
    titleAr: 'خريطة المعرفة',
    titleEn: 'Knowledge Map',
    brandAr: 'أفكارك شبكة مترابطة',
    brandEn: 'Your ideas as a living network',
    descriptionAr: 'كل سؤال سألته يصير نجمة — شاهد الروابط بين أفكارك.',
    descriptionEn: 'Every question becomes a star — see the links between your ideas.',
    keywordsAr: ['خريطة', 'ربط', 'شبكة', 'أفكاري'],
    keywordsEn: ['map', 'connect', 'network', 'my ideas'],
  },
  {
    id: 'growth',
    category: 'personal',
    icon: Route,
    titleAr: 'خارطة الطريق والتقدم',
    titleEn: 'Roadmap & Progress',
    brandAr: 'من الهدف إلى الخطة',
    brandEn: 'From goal to plan',
    descriptionAr: 'حوّل هدفك إلى مراحل واضحة، وتابع تقدمك خطوة بخطوة.',
    descriptionEn: 'Turn your goal into clear stages and follow your progress step by step.',
    keywordsAr: ['هدف', 'خطة', 'أتعلم', 'أوصل', 'تقدم', 'اختبار'],
    keywordsEn: ['goal', 'plan', 'learn', 'reach', 'progress', 'quiz'],
    featured: true,
  },
  {
    id: 'ripple',
    category: 'personal',
    icon: Waves,
    titleAr: 'أثر الفراشة',
    titleEn: 'Ripple Effect',
    brandAr: 'أفكار المجتمع تتلاقى',
    brandEn: 'Where community ideas meet',
    descriptionAr: 'ازرع بذرة فكرة، وشاهد كيف يبني عليها الآخرون.',
    descriptionEn: 'Plant an idea seed and watch others build on it.',
    keywordsAr: ['مجتمع', 'مشاركة', 'بذرة', 'أفكار'],
    keywordsEn: ['community', 'share', 'seed', 'ideas'],
  },
  {
    id: 'rukni',
    category: 'personal',
    icon: LibraryBig,
    titleAr: 'ركني',
    titleEn: 'My Corner',
    brandAr: 'مساحتك الخاصة',
    brandEn: 'Your own space',
    descriptionAr: 'كل ما بنيته في تبيان — مكتبتك، مكافآتك، وبابك للتواصل معنا.',
    descriptionEn: 'Everything you built — your library, rewards, and our door to you.',
    keywordsAr: ['مكتبتي', 'محفوظات', 'نقاط', 'تواصل'],
    keywordsEn: ['library', 'saved', 'points', 'contact'],
  },
];


export function getServiceLabel(service: TebyanService, language: 'ar' | 'en') {
  return language === 'ar' ? service.titleAr : service.titleEn;
}

export function getServiceBrand(service: TebyanService, language: 'ar' | 'en') {
  return language === 'ar' ? service.brandAr : service.brandEn;
}

export function getServiceDescription(service: TebyanService, language: 'ar' | 'en') {
  return language === 'ar' ? service.descriptionAr : service.descriptionEn;
}

export function getServiceTabs(language: 'ar' | 'en') {
  return TEBYAN_SERVICES.map((service) => ({
    id: service.id,
    label: getServiceLabel(service, language),
    brand: getServiceBrand(service, language),
    icon: service.icon,
    tooltip: getServiceDescription(service, language),
    category: service.category,
    hidden: false,
  }));
}
