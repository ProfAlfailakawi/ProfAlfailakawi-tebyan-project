import React, { useState } from 'react';
import { DemoStarters } from '../../components/ui/DemoStarters';
import { motion } from 'motion/react';
import { Network, Sparkles, Brain, ArrowRight, Save } from 'lucide-react';
import { universalOracle } from '../../services/gemini';
import { useAuth } from '../AuthProvider';
import { getGenderWord } from '../../utils/genderHelper';
import ReactMarkdown from 'react-markdown';
import { TabHeader } from '../TabHeader';
import { TebyanLoader, TebyanButtonLoader } from '../ui/TebyanLoader';
import { ToolEmptyHint } from '../common/ToolEmptyHint';

export const MindMapTab = ({ language, initialValue, onValueUsed, handleTabChange }: { language: string, initialValue?: string, onValueUsed?: () => void, handleTabChange: any }) => {
  const { userGender } = useAuth();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mindMapData, setMindMapData] = useState<string | null>(null);

  const handleGenerate = async (overrideTopic?: string) => {
    const activeTopic = overrideTopic || topic;
    if (!activeTopic.trim()) return;

    setIsGenerating(true);
    try {
      const prompt = `قم ببناء 'خريطة ذهنية نصية متفرعة وشاملة' (شجرة هيكلية) حول الموضوع التالي: "${activeTopic}". 
      استخدم تنسيق القوائم المتداخلة (Nested Lists) أو Markdown لتمثيل التفرعات الرئيسية والفرعية بوضوح شديد.
      أريد أن يكون التحليل عميقاً ومبنياً على أسس تربوية وعلمية قوية.
      تجنب الكتل النصية الطويلة. استخدم فقرات قصيرة جداً ومباشرة.
      اللغة المطلوبة: ${language === 'ar' ? 'العربية' : 'English'}`;
      
      const { universalOracle } = await import('../../services/gemini');
      const result = await universalOracle(prompt, 'MindMap AI', language);
      setMindMapData(result);
    } catch (error) {
      console.error(error);
      setMindMapData(language === 'ar' ? 'تعثرت الأفكار قليلاً.. لنأخذ استراحة قصيرة ونحاول مرة أخرى؟' : 'Ideas got a bit stuck.. Shall we take a quick break and try again?');
    } finally {
      setIsGenerating(false);
    }
  };

  React.useEffect(() => {
    if (initialValue && !mindMapData && !isGenerating) {
      setTopic(initialValue);
      handleGenerate(initialValue);
      if (onValueUsed) onValueUsed();
    }
  }, [initialValue, mindMapData, isGenerating, onValueUsed]);

  React.useEffect(() => {
    if (!isGenerating && mindMapData) {
       setTimeout(() => {
           document.getElementById('mindmap-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
       }, 100);
    }
  }, [isGenerating, mindMapData]);

  return (
    <div className="w-full space-y-8 px-2">
      <TabHeader 
        icon={Network}
        title={{ ar: 'العقل المدبر', en: 'The Mastermind' }}
        description={{ 
            ar: getGenderWord(userGender, 'أدخل أي مفهوم أو مشكلة تربوية وسيقوم الذكاء الكلي بتفكيكها إلى خريطة ذهنية هيكلية عميقة.', 'أدخلي أي مفهوم أو مشكلة تربوية وسيقوم الذكاء الكلي بتفكيكها إلى خريطة ذهنية هيكلية عميقة.', 'أدخل أي مفهوم أو مشكلة تربوية.'), 
            en: 'Enter any educational concept or problem, and the Omni-AI will dismantle it into a deep structural mind map.' 
        }}
        language={language}
        onBack={() => handleTabChange('discover', '')}
        onClose={() => handleTabChange('discover', '', true)}
      />
      
      <div className="bg-white/60 backdrop-blur-2xl min-h-[60vh] rounded-[32px] overflow-hidden relative border border-[#182231]/10 shadow-sm p-8 md:p-12">
        <div className="max-w-4xl mx-auto space-y-12">

<DemoStarters tab="mindmap" language={language} onPick={setTopic} className="mb-3" />
        <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="relative z-10 flex flex-col md:flex-row gap-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="flex-1 relative">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: التنمر المدرسي، تعزيز الثقة بالنفس، صعوبات التعلم...' : 'e.g. School Bullying, Self-confidence...'}
              className={`w-full bg-white border border-zinc-200/80 rounded-[20px] py-4 ${language === 'ar' ? 'pr-6 pl-14' : 'pl-6 pr-14'} text-lg font-medium text-[#182231] placeholder:text-[#64788D] outline-none focus:border-[#6e5f8e]/50 focus:shadow-sm transition-all`}
            />
            <Brain className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-[#6e5f8e]/70 ${language === 'ar' ? 'left-5' : 'right-5'}`} />
          </div>
          <button
            type="submit"
            disabled={isGenerating || !topic.trim()}
            className="bg-[#6E5B91] hover:bg-[#5F4E7F] text-white rounded-[20px] px-8 py-4 font-bold text-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50 shrink-0"
          >
            {isGenerating ? <TebyanButtonLoader className="text-current" /> : <Sparkles className="w-6 h-6" />}
            {language === 'ar' ? 'توليد الخريطة' : 'Generate Map'}
          </button>
        </form>
        

        {isGenerating && (
          <div className="py-20 flex flex-col items-center justify-center">
            <TebyanLoader size={48} label={language === 'ar' ? 'جاري بناء الخريطة' : 'Building the map'} />
            <p className="mt-6 text-[#64788D] font-bold animate-pulse text-lg">
              {language === 'ar' ? 'جاري فك تشفير الفكرة وهندسة الخريطة...' : 'Decoding the concept and engineering the map...'}
            </p>
          </div>
        )}

        {!mindMapData && !isGenerating && (
          <ToolEmptyHint icon={Network} text={language === 'ar' ? 'أدخل أي مفهوم أو مشكلة تربوية.' : 'Enter any educational concept or problem, and the Omni-AI will dismantle it into a deep structural mind map.'} />
        )}

        {mindMapData && !isGenerating && (
          <motion.div 
            id="mindmap-results"
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            className="bg-white border border-[#182231]/10 rounded-[40px] p-8 md:p-14 shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)] relative overflow-hidden"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Subtle glow effect */}

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10 pb-8 border-b border-[#182231]/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F8F5EF] flex items-center justify-center">
                    <Brain className="w-7 h-7 text-[#182231]" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-[#182231] m-0 tracking-tight">
                      {language === 'ar' ? 'التحليل الهيكلي' : 'Structural Analysis'}
                    </h3>
                    <p className="text-[#64788D] text-sm font-bold mt-1">
                      {language === 'ar' ? 'رؤية عميقة مسبارة' : 'In-depth probing vision'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const blob = new Blob([mindMapData], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `mindmap-${topic.slice(0, 20)}.md`;
                    a.click();
                  }}
                  className="p-3 bg-[#F8F5EF] hover:bg-[#F8F5EF] text-[#182231] rounded-full transition-colors group"
                >
                  <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              <div className="prose max-w-none prose-p:text-[#182231] prose-p:leading-[1.8] prose-p:text-lg md:prose-p:text-xl prose-headings:text-[#182231] prose-headings:font-black prose-li:text-[#182231] prose-li:marker:text-[#6E5B91] prose-strong:text-[#4B3F6B]">
                <ReactMarkdown>{mindMapData}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  </div>
);
};
