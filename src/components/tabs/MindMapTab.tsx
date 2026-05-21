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
            ar: 'أدخل أي مفهوم أو مشكلة تربوية وسيقوم الذكاء الكلي بتفكيكها إلى خريطة ذهنية هيكلية عميقة.', 
            en: 'Enter any educational concept or problem, and the Omni-AI will dismantle it into a deep structural mind map.' 
        }}
        language={language}
        onBack={() => handleTabChange('discover', '')}
        onClose={() => handleTabChange('discover', '', true)}
      />
      
      <div className="bg-white/60 backdrop-blur-2xl min-h-[60vh] rounded-[32px] overflow-hidden relative border border-white/40 shadow-sm p-8 md:p-12">
        <div className="max-w-4xl mx-auto space-y-12">

        <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="relative z-10 flex flex-col md:flex-row gap-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
            id="mindmap-results"
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            className="bg-black border border-white/10 rounded-[40px] p-8 md:p-14 shadow-[0_20px_80px_rgba(0,0,0,0.5)] relative overflow-hidden"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Subtle glow effect */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10 pb-8 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white m-0 tracking-tight">
                      {language === 'ar' ? 'التحليل الهيكلي' : 'Structural Analysis'}
                    </h3>
                    <p className="text-zinc-500 text-sm font-bold mt-1">
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
                  className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors group"
                >
                  <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              <div className="prose prose-invert prose-indigo max-w-none prose-p:text-white prose-p:leading-[1.8] prose-p:text-lg md:prose-p:text-xl prose-headings:text-white prose-headings:font-black prose-li:text-white prose-li:marker:text-indigo-400 prose-strong:text-indigo-400">
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
