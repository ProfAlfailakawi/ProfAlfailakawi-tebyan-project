import { BrainCircuit, MessageCircleQuestion, Sparkles } from 'lucide-react';

export const levels = [
    { id: 'seeker', ar: 'باحث', en: 'Seeker', min: 0 },
    { id: 'awakened', ar: 'متيقظ', en: 'Awakened', min: 100 },
    { id: 'enlightened', ar: 'مستنير', en: 'Enlightened', min: 300 },
    { id: 'sage', ar: 'حكيم', en: 'Sage', min: 600 },
    { id: 'transcendent', ar: 'متسامي', en: 'Transcendent', min: 1000 }
  ];
  
export const badges = [
    { id: 'wisdom', icon: BrainCircuit, ar: 'وسام الحكمة', en: 'Wisdom Badge', desc: { ar: 'تُمنح لتحليل المواقف بعمق قبل الرد', en: 'Awarded for deep analysis before acting' } },
    { id: 'dialogue', icon: MessageCircleQuestion, ar: 'وسام الحوار', en: 'Dialogue Badge', desc: { ar: 'تُمنح للتدريب على الحوار المتزن', en: 'Awarded for practicing balanced dialogue' } },
    { id: 'patience', icon: Sparkles, ar: 'وسام الصبر', en: 'Patience Badge', desc: { ar: 'تُمنح للمتابعة والوصول لنتائج هادئة', en: 'Awarded for following up and reaching calm results' } }
];
