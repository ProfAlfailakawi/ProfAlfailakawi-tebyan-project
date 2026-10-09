import React from 'react';
import { motion } from 'motion/react';
import { Hourglass } from 'lucide-react';
import { TebyanLoader, TebyanButtonLoader } from '../ui/TebyanLoader';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';
import { ToolEmptyHint } from '../common/ToolEmptyHint';

export const TimeMachineTab = React.memo(({ language, initialValue, onValueUsed, handleTabChange }: { language: 'ar' | 'en', initialValue?: string, onValueUsed?: () => void, handleTabChange: any }) => {
  const [timeMachineTopic, setTimeMachineTopic] = React.useState(initialValue || 'طرق التدريس');

  React.useEffect(() => {
    if (initialValue && onValueUsed) {
        setTimeMachineTopic(initialValue);
        onValueUsed();
    }
  }, [initialValue, onValueUsed]);

  const [timeMachineData, setTimeMachineData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isLoading && timeMachineData) {
       setTimeout(() => {
           document.getElementById('time-machine-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
       }, 100);
    }
  }, [isLoading, timeMachineData]);

  const loadTimeMachine = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { generateTimeMachineJourney } = await import('../../services/gemini');
      const data = await generateTimeMachineJourney(timeMachineTopic, language);
      setTimeMachineData(data);
    } catch (err: any) {
      setError(language === 'ar' 
        ? "آلة الزمن واجهت مطباً زمنياً صغيراً.. اضغط مجدداً لتتجاوز الفجوة وتكمل الرحلة." 
        : "The time machine hit a minor temporal bump.. click again to skip the gap.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 px-2">
    <TabHeader 
      icon={Hourglass}
      title={{ ar: 'رحلة عبر آلة الزمن', en: 'Time Machine Journey' }}
      description={{ 
          ar: 'شاهد كيف تطور العلم وسيتطور مستقبلاً عبر رحلة مشوقة في العصور المختلفة.', 
          en: 'See how education evolved and will evolve in the future through an exciting journey across different eras.' 
      }}
      language={language}
      onBack={() => handleTabChange('discover', '')}
      onClose={() => handleTabChange('discover', '', true)}
    />
    <div className="bg-white text-navy p-8 rounded-[32px] shadow space-y-10">
       <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2">
             <h2 className="font-serif text-2xl md:text-3xl font-bold">{language === 'ar' ? 'استكشاف التطور' : 'Evolution Explorer'}</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
             <input 
               value={timeMachineTopic} 
               onChange={(e) => setTimeMachineTopic(e.target.value)}
               className="bg-ivory border border-navy/10 p-4 rounded-xl text-navy placeholder-[#8A97A6] outline-none focus:border-lilac/30 flex-1 w-full md:w-64"
               placeholder={language === 'ar' ? "مفهوم الرحلة..." : "Journey concept..."}
             />
             <button 
               onClick={loadTimeMachine} 
               disabled={isLoading}
               title={language === 'ar' ? 'بدء الرحلة عبر الزمن' : 'Start time journey'}
               className="w-full md:w-auto bg-lilac hover:bg-lilac-deep text-white disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer min-w-[140px]"
             >
               {isLoading ? (
                 <>
                   <TebyanButtonLoader className="text-current" />
                   <span>{language === 'ar' ? 'جاري السفر...' : 'Traveling...'}</span>
                 </>
               ) : (
                 <span>{language === 'ar' ? 'انطلاق' : 'Launch'}</span>
               )}
             </button>
          </div>
       </div>

       {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 font-semibold">{error}</div>}
       <div className="relative min-h-[300px]">
         {!isLoading && !timeMachineData && (
           <ToolEmptyHint icon={Hourglass} text={language === 'ar' ? 'اكتب موضوعاً، ثم اضغط «انطلاق» لنرى كيف تغيّر عبر العصور.' : 'Type a topic, then press Launch to see how it changed across the ages.'} />
         )}
         {isLoading ? (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="w-full bg-lilac-mist/40 rounded-[24px] md:rounded-[32px] flex flex-col items-center justify-center space-y-6 py-20 border border-lilac-soft/25 px-4"
           >
             <TebyanLoader size={48} label={language === 'ar' ? 'جاري السفر عبر الزمن' : 'Traveling through time'} />
             <div className="font-serif text-2xl md:text-3xl font-bold text-navy text-center">
               {language === 'ar' ? 'جاري السفر عبر الزمن...' : 'Traveling through time...'}
             </div>
             <div className="px-6 py-3 bg-white text-ink-soft rounded-full font-semibold text-base text-center">
               {language === 'ar' ? 'نحن ننتقل بين العصور لجمع لك أدق المعلومات والتحليلات' : 'Navigating through eras to gather precise intelligence'}
             </div>
           </motion.div>
         ) : timeMachineData && (
           <div id="time-machine-results" role="region" aria-label={language === 'ar' ? 'رحلة عبر العصور' : 'Journey through the ages'} className="space-y-12 animate-in fade-in duration-700">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
             <div aria-hidden="true" className="tbn-timeline-rail absolute top-1/2 inset-x-0 h-0.5 bg-lilac-soft/40 -translate-y-1/2 hidden md:block"></div>
             <div aria-hidden="true" className="tbn-timeline-rail-v absolute inset-y-0 start-1/2 w-0.5 bg-lilac-soft/40 md:hidden"></div>
             {timeMachineData.eras?.map((e: any, i: number) => (
               <motion.div 
                 key={i} 
                 initial={{ opacity: 0, y: 18, scale: 0.96 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 transition={{ delay: 0.3 + i * 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                 className="relative bg-ivory p-6 rounded-[16px] border border-navy/10 hover:bg-ivory transition-all group z-10"
               >
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lilac text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
                   {e.year}
                 </div>
                 <div className="pt-4 space-y-4">
                    <h4 className="font-serif text-xl font-bold text-lilac">{e.era}</h4>
                    <div className="space-y-3">
                       <div>
                         <div className="text-xs text-lilac font-bold mb-1">{language === 'ar' ? 'طريقة التدريس' : 'Teaching Method'}</div>
                         <div className="text-sm font-bold text-ink-soft leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{e.teaching_method}</ReactMarkdown>
                         </div>
                       </div>
                       <div className="pt-2 border-t border-navy/10">
                         <div className="text-xs text-lilac font-bold mb-1">{language === 'ar' ? 'الأدوات' : 'Tools'}</div>
                         <div className="text-sm font-semibold text-navy prose prose-sm max-w-none">
                            <ReactMarkdown>{e.tools}</ReactMarkdown>
                         </div>
                       </div>
                    </div>
                 </div>
               </motion.div>
             ))}
           </div>
           
           <div className="bg-ivory p-8 rounded-[24px] border border-navy/10 text-navy font-serif text-xl md:text-2xl text-center leading-loose font-bold">
             "{timeMachineData.summary}"
           </div>
         </div>
       )}
    </div>
   </div>
  </motion.div>
 )});
