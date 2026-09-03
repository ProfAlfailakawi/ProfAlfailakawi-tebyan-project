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
    brandAr: 'سؤال واحد، جواب بأسلوبك',
    brandEn: 'One question, your style of answer',
    descriptionAr: 'مستشار، تبسيط، خريطة، قصة، عبر الزمن، أو تأملي — أنت تختار نمط الجواب.',
    descriptionEn: 'Counsel, simplify, map, story, through time, or reflective — you choose the style.',
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
    id: 'decisionroom',
    category: 'decide',
    icon: Command,
    titleAr: 'غرفة القرار',
    titleEn: 'Decision Room',
    brandAr: 'احسم من كل الزوايا',
    brandEn: 'Decide from every angle',
    descriptionAr: 'ميزان الخيارات، كشف المخاطر، الفريق الأحمر، ومجلس الحكماء — في غرفة واحدة.',
    descriptionEn: 'Weigh options, expose risks, red team, and the council — in one room.',
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
    descriptionAr: 'اصطدام الأفكار، تشريح الفكرة، تحليل الشخصيات، وتصميم استراتيجي.',
    descriptionEn: 'Idea collisions, idea anatomy, persona analysis, and strategic design.',
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
    brandAr: 'خطّط · تتبّع · تحقّق',
    brandEn: 'Plan · Track · Verify',
    descriptionAr: 'هدفك يتحول لمراحل، تتبّع تقدمك يوماً بيوم، واختبر نفسك عند كل محطة.',
    descriptionEn: 'Your goal becomes stages; track daily and verify at each stop.',
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
    brandAr: 'محفوظاتك ونقاطك وتواصلك',
    brandEn: 'Your saves, points, and contact',
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
