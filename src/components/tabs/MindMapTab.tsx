import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Network, Sparkles, Brain, ArrowRight, Loader2, Save } from 'lucide-react';
import { universalOracle } from '../../services/gemini';
import ReactMarkdown from 'react-markdown';
import { TabHeader } from '../TabHeader';

export const MindMapTab = ({ language, initialValue, onValueUsed, handleTabChange }: { language: string, initialValue?: string, onValueUsed?: () => void, handleTabChange: any }) => {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mindMapData, setMindMapData] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialValue) {
      setTopic(initialValue);
      if (onValueUsed) onValueUsed();
    }
  }, [initialValue]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const prompt = `قم ببناء 'خريطة ذهنية نصية متفرعة وشاملة' (شجرة هيكلية) حول الموضوع التالي: "${topic}". 
      استخدم تنسيق القوائم المتداخلة (Nested Lists) أو Markdown لتمثيل التفرعات الرئيسية والفرعية بوضوح شديد.
      أريد أن يكون التحليل عميقاً ومبنياً على أسس تربوية وعلمية قوية.
      تجنب الكتل النصية الطويلة. استخدم فقرات قصيرة جداً ومباشرة.
      اللغة المطلوبة: ${language === 'ar' ? 'العربية' : 'English'}`;
      
      const result = await universalOracle(prompt, 'MindMap AI', language);
      setMindMapData(result);
    } catch (error) {
      console.error(error);
      setMindMapData('حدث خطأ أثناء الاتصال بعقل النظام. يرجى المحاولة لاحقاً.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full space-y-8 px-2">
      <TabHeader 
        icon={Network}
        title={{ ar: 'العقل المدبر', en: 'The Mastermind' }}
        description={{ 
            ar: 'أدخل أي مفهوم أو مشكلة تربوية وسيقوم الذكاء الكلي بتفكيكها إلى خريطة ذهنية هيكلية عميقة.', 
            en: 'Enter any educational concept or problem, and the Omni-AI will dismantle it into a deep structural mind map.' 
        }}
        language={language}
        onBack={() => handleTabChange('discover', '')}
        onClose={() => handleTabChange('discover', '', true)}
      />
      
      <div className="bg-white/60 backdrop-blur-2xl min-h-[60vh] rounded-[32px] overflow-hidden relative border border-white/40 shadow-sm p-8 md:p-12">
        <div className="max-w-4xl mx-auto space-y-12">

        <form onSubmit={handleGenerate} className="relative z-10 flex flex-col md:flex-row gap-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="flex-1 relative">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: التنمر المدرسي، تعزيز الثقة بالنفس، صعوبات التعلم...' : 'e.g. School Bullying, Self-confidence...'}
              className="w-full bg-white border border-zinc-200/80 rounded-[20px] py-4 px-6 text-lg font-bold text-black placeholder:text-zinc-400 outline-none focus:border-black focus:shadow-lg transition-all"
            />
            <Brain className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-300 ${language === 'ar' ? 'left-6' : 'right-6'}`} />
          </div>
          <button
            type="submit"
            disabled={isGenerating || !topic.trim()}
            className="bg-black hover:bg-zinc-800 text-white rounded-[20px] px-8 py-4 font-bold text-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50 shrink-0"
          >
            {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
            {language === 'ar' ? 'توليد الخريطة' : 'Generate Map'}
          </button>
        </form>

        {isGenerating && (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-zinc-100 rounded-full"></div>
              <div className="w-24 h-24 border-4 border-black rounded-full border-t-transparent animate-spin absolute inset-0"></div>
              <Network className="w-8 h-8 text-black animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-6 text-zinc-500 font-bold animate-pulse text-lg">
              {language === 'ar' ? 'جاري فك تشفير الفكرة وهندسة الخريطة...' : 'Decoding the concept and engineering the map...'}
            </p>
          </div>
        )}

        {mindMapData && !isGenerating && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-50/80 border border-zinc-200/60 rounded-[24px] p-6 md:p-10 shadow-sm markdown-body"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-zinc-200/50">
              <Brain className="w-8 h-8 text-black" />
              <h3 className="text-2xl font-bold m-0">{language === 'ar' ? 'التحليل الهيكلي' : 'Structural Analysis'}</h3>
            </div>
            <ReactMarkdown>{mindMapData}</ReactMarkdown>
          </motion.div>
        )}

      </div>
    </div>
  </div>
);
};
