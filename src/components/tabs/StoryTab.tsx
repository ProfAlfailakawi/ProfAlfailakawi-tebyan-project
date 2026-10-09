import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Wand2 } from 'lucide-react';
import { TebyanLoader, TebyanButtonLoader } from '../ui/TebyanLoader';
import { generateStory } from '../../services/gemini';
import { cn } from '../../lib/utils';
import Markdown from 'react-markdown';
import { TabHeader } from '../TabHeader';
import { ToolEmptyHint } from '../common/ToolEmptyHint';

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
        title={{ ar: 'الراوي', en: 'Story Weaver' }}
        description={{ 
            ar: 'القصص هي أسرع طريق لغرس القيم. أخبرني ماذا تريد أن تزرع في عقل الطفل أو الطالب وسأنسج لك قصة ساحرة.', 
            en: 'Stories are the fastest way to instill values. Tell me what you want to plant in your child\'s or student\'s mind, and I will weave a magical story.' 
        }}
        language={language}
        onBack={() => handleTabChange('discover', '')}
        onClose={() => handleTabChange('discover', '', true)}
      />
      <div className="bg-white text-navy rounded-[32px] p-8 md:p-12 shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)] relative overflow-hidden">
        
        <div className="relative z-10 flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-1/3 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-lilac text-sm font-bold mb-2">{language === 'ar' ? 'موضوع القصة' : 'Story Topic'}</label>
                <input 
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: التنمر في المدرسة' : 'e.g. Bullying at school'}
                  className="w-full bg-ivory border border-navy/10 rounded-xl px-5 py-4 text-navy font-bold outline-none focus:border-lilac/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-lilac text-sm font-bold mb-2">{language === 'ar' ? 'القيمة المطلوبة / تفاصيل' : 'Moral / Details'}</label>
                <textarea 
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: أريد أن يتعلم أن الكلمة الطيبة صدقة.' : 'e.g. I want them to learn that kind words matter.'}
                  className="w-full bg-ivory border border-navy/10 rounded-xl px-5 py-4 text-navy font-bold outline-none focus:border-lilac/30 transition-colors h-32 resize-none"
                />
              </div>
              
              <button 
                onClick={handleGenerate}
                disabled={isLoading || !topic.trim()}
                className="w-full py-4 bg-lilac text-white hover:bg-lilac-deep rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <TebyanButtonLoader className="text-current" /> : <Wand2 className="w-6 h-6" />}
                {language === 'ar' ? 'انسج القصة' : 'Weave Story'}
              </button>
            </div>
            {error && <div role="alert" className="mt-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 font-bold">{error}</div>}
          </div>

          <div className="w-full md:w-2/3 bg-ivory border border-navy/10 rounded-[24px] p-8 min-h-[400px]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center flex-col gap-4 text-lilac">
                <TebyanLoader size={48} label={language === 'ar' ? 'جاري كتابة القصة' : 'Writing the story'} />
                <span className="font-serif text-xl font-bold">{language === 'ar' ? 'الخيال ينسج خيوطه...' : 'Weaving magic...'}</span>
              </div>
            ) : story ? (
              <div className="tbn-result__body font-serif max-w-none md:max-h-[640px] md:overflow-y-auto md:pr-4 custom-scrollbar tbn-story">
                <Markdown>{story}</Markdown>
              </div>
            ) : (
              <ToolEmptyHint icon={BookOpen} text={language === 'ar' ? 'اكتب موضوع القصة والقيمة التي تريد غرسها، وستظهر هنا قصتك.' : 'Write a topic and the value you want to plant, and your story appears here.'} className="h-full" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
