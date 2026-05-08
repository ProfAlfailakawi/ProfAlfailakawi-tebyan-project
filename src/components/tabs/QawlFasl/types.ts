export interface QawlFaslQuestion {
  id: string;
  question: string;
  title?: string;
  category: string;
  categoryId?: string;
  categorySlug: string;
  keywords: string[];
  ageGroups: string[];
  riskLevel: 'low' | 'medium' | 'high';
  status: 'draft' | 'review' | 'published';
  createdAt: number;
  updatedAt: number;
  reviewStatus: {
    educational: string;
    religious: string;
    sources: string;
  };
  // pedagogical content
  quickSummary: string;
  quickAnswer: {
    sayThis: string;
    dontSayThis: string;
    doThisNow: string;
  };
  commonMistake: string;
  educationalView: string;
  suggestedAnswer: string;
  byAgeVersions: {
    age: string;
    text: string;
  }[];
  practicalSteps: string[];
  exercises: string[];
  whenToWorry: string;
  religiousReference?: string;
  scientificStat?: string;
  resources: {
    type: 'video' | 'book' | 'site' | 'study';
    title: string;
    description: string;
    url?: string;
  }[];
  closingThought: string;
  viewCount?: number;
  feedback?: {
    positive?: number;
    partial?: number;
    negative?: number;
  };
  savedBy?: string[];
  reviewedBy?: string[];
  mainCategory?: string;
  isDailyPick?: boolean;
  dailyPickDate?: string;
}

export const MAIN_CATEGORIES = [
  'الإيمان والأسئلة الدينية',
  'السلوك والتربية والتعامل',
  'المشاعر والذكاء العاطفي',
  'التعلم والمدرسة',
  'التقنية والإنترنت',
  'الوقاية وحماية الطفل',
  'المستقبل والإستراتيجية',
  'بناء الشخصية والثقة',
  'المال والاستهلاك'
];

export const CATEGORIES = [
  { id: 'faith-religious-questions', title: 'الإيمان والأسئلة الدينية', description: 'أسئلة العقيدة، التربية الإيمانية، والغيبيات...' },
  { id: 'behavior', title: 'السلوك والتربية والتعامل', description: 'العناد، الانضباط، تعديل السلوك، العادات...' },
  { id: 'emotions', title: 'المشاعر والذكاء العاطفي', description: 'الغضب، القلق، الحب، الذكاء الوجداني...' },
  { id: 'education', title: 'التعلم والمدرسة', description: 'التحصيل الدراسي، المشاكل المدرسية، الشغف...' },
  { id: 'digital', title: 'التقنية والإنترنت', description: 'الهوية الرقمية، الألعاب، الرقابة الأبوية...' },
  { id: 'prevention', title: 'الوقاية وحماية الطفل', description: 'حماية الجسد، التحرش، الغرباء، السلامة...' },
  { id: 'future', title: 'المستقبل والإستراتيجية', description: 'الذكاء الاصطناعي، المهارات، استشراف الغد...' },
  { id: 'personality', title: 'بناء الشخصية والثقة', description: 'الثقة بالنفس، الخوف، الاستقلالية...' },
  { id: 'money', title: 'المال والاستهلاك', description: 'الوعي المالي، الادخار، غرس قيمة العمل...' }
];
