import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { generateStory } from '../../services/gemini';
import { cn } from '../../lib/utils';
import Markdown from 'react-markdown';
import { TabHeader } from '../TabHeader';

export const StoryTab = ({ language, initialValue, onValueUsed, handleTabChange }: { language: 'ar' | 'en', initialValue?: string, onValueUsed?: () => void, handleTabChange: any }) => {
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  const [story, setStory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialValue) {
      setTopic(initialValue);
      if (onValueUsed) onValueUsed();
    }
  }, [initialValue]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setStory('');
    setError(null);
    try {
      const result = await generateStory(topic, details, language);
      setStory(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 px-2">
      <TabHeader 
        icon={BookOpen}
        title={{ ar: 'الحكواتي', en: 'Story Weaver' }}
        description={{ 
            ar: 'القصص هي أسرع طريق لغرس القيم. أخبرني ماذا تريد أن تزرع في عقل طفلك أو طالبك وسأنسج لك قصة ساحرة.', 
            en: 'Stories are the fastest way to instill values. Tell me what you want to plant in your child\'s or student\'s mind, and I will weave a magical story.' 
        }}
        language={language}
        onBack={() => handleTabChange('discover', '')}
        onClose={() => handleTabChange('discover', '', true)}
      />
      <div className="bg-gradient-to-br from-indigo-900 to-black text-white rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-[120px] opacity-10"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-1/3 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-indigo-300 text-sm font-bold mb-2">{language === 'ar' ? 'موضوع القصة' : 'Story Topic'}</label>
                <input 
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: التنمر في المدرسة' : 'e.g. Bullying at school'}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-indigo-300 text-sm font-bold mb-2">{language === 'ar' ? 'القيمة المطلوبة / تفاصيل' : 'Moral / Details'}</label>
                <textarea 
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: أريد أن يتعلم أن الكلمة الطيبة صدقة.' : 'e.g. I want them to learn that kind words matter.'}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-indigo-500 transition-colors h-32 resize-none"
                />
              </div>
              
              <button 
                onClick={handleGenerate}
                disabled={isLoading || !topic.trim()}
                className="w-full py-4 bg-indigo-500 text-white hover:bg-indigo-600 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wand2 className="w-6 h-6" />}
                {language === 'ar' ? 'انسج القصة' : 'Weave Story'}
              </button>
            </div>
            {error && <div className="text-rose-400 font-bold mt-2">{error}</div>}
          </div>

          <div className="w-full md:w-2/3 bg-white/5 border border-white/10 rounded-[24px] p-8 min-h-[400px]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center flex-col gap-4 text-indigo-300">
                <Sparkles className="w-12 h-12 animate-pulse" />
                <span className="font-bold">{language === 'ar' ? 'الخيال ينسج خيوطه...' : 'Weaving magic...'}</span>
              </div>
            ) : story ? (
              <div className="prose prose-invert prose-lg max-w-none font-medium leading-loose custom-scrollbar max-h-[600px] overflow-y-auto pr-4">
                <Markdown>{story}</Markdown>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center flex-col gap-4 text-white/20">
                <BookOpen className="w-20 h-20" />
                <span className="font-bold text-xl">{language === 'ar' ? 'الصفحة البيضاء بانتظارك' : 'The blank page awaits'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
