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
  'اتخاذ القرارات وإدارة المخاطر',
  'السلوك والذكاء العاطفي',
  'إدارة النزاعات والخلافات',
  'مهارات التواصل والإقناع',
  'التقنية والتفكير النقدي',
  'التخطيط والاستراتيجية',
  'الحياة والهوية'
];

export const CATEGORIES = [
  { id: 'decision-making', title: 'صناعة القرار', description: 'المفاضلة، اتخاذ القرار، الخيارات الصعبة...' },
  { id: 'personality', title: 'الشخصية والثقة', description: 'الثقة بالنفس، الخوف، الفشل...' },
  { id: 'conflict', title: 'إدارة النزاعات', description: 'حل الخلافات، الاحتواء، الغضب...' },
  { id: 'behavior', title: 'السلوك والانضباط', description: 'العناد، التغيير، العادات...' },
  { id: 'communication', title: 'التفاوض والإقناع', description: 'نقاشات معقدة، توجيه الفريق...' },
  { id: 'digital', title: 'التقنية والمستقبل', description: 'التأقلم مع التقنية، الذكاء الاصطناعي...' },
  { id: 'prevention', title: 'الوقاية وإدارة المخاطر', description: 'حماية النفس والمشاريع...' },
  { id: 'emotions', title: 'الذكاء العاطفي', description: 'الغضب، الضغوط النفسية، التوتر...' },
  { id: 'money', title: 'المال والأعمال', description: 'المفاوضات المالية، الاستهلاك...' },
  { id: 'innovation', title: 'الابتكار والتغيير', description: 'تبني استراتيجيات جديدة...' },
  { id: 'culture', title: 'الثقافة والهوية', description: 'اختلاف الثقافات، التأقلم...' }
];
