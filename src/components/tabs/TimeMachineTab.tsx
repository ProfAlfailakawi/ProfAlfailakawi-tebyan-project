import React from 'react';
import { motion } from 'motion/react';
import { Hourglass, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';

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
    <div className="bg-indigo-900 text-white p-8 rounded-[32px] shadow space-y-10">
       <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2">
             <h2 className="text-2xl md:text-4xl font-bold">{language === 'ar' ? 'استكشاف التطور' : 'Evolution Explorer'}</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
             <input 
               value={timeMachineTopic} 
               onChange={(e) => setTimeMachineTopic(e.target.value)}
               className="bg-white/10 border border-white/20 p-4 rounded-xl text-white placeholder-indigo-300 outline-none focus:border-indigo-400 flex-1 w-full md:w-64"
               placeholder={language === 'ar' ? "مفهوم الرحلة..." : "Journey concept..."}
             />
             <button 
               onClick={loadTimeMachine} 
               disabled={isLoading}
               title={language === 'ar' ? 'بدء الرحلة عبر الزمن' : 'Start time journey'}
               className="w-full md:w-auto bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-900/50 disabled:cursor-not-allowed px-8 py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer min-w-[140px]"
             >
               {isLoading ? (
                 <>
                   <RefreshCw className="w-5 h-5 animate-spin" />
                   <span>{language === 'ar' ? 'جاري السفر...' : 'Traveling...'}</span>
                 </>
               ) : (
                 <span>{language === 'ar' ? 'انطلاق' : 'Launch'}</span>
               )}
             </button>
          </div>
       </div>

       {error && <div className="text-red-400 font-bold">{error}</div>}
       <div className="relative min-h-[300px]">
         {isLoading ? (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="w-full bg-indigo-900/50 backdrop-blur-md rounded-[24px] md:rounded-[32px] flex flex-col items-center justify-center space-y-8 py-32 border-2 border-dashed border-white/10"
           >
             <div className="relative">
               <div className="w-24 h-24 border-8 border-white/5 rounded-full"></div>
               <RefreshCw className="w-24 h-24 text-indigo-400 animate-spin absolute top-0 left-0" />
             </div>
             <div className="text-2xl md:text-4xl font-bold text-white text-center">
               {language === 'ar' ? 'جاري السفر عبر الزمن...' : 'Traveling through time...'}
             </div>
             <div className="px-10 py-4 bg-indigo-500/20 text-indigo-200 rounded-full font-bold animate-pulse text-lg">
               {language === 'ar' ? 'نحن ننتقل بين العصور لجمع لك أدق المعلومات والتحليلات' : 'Navigating through eras to gather precise intelligence'}
             </div>
           </motion.div>
         ) : timeMachineData && (
           <div id="time-machine-results" className="space-y-12 animate-in fade-in duration-700">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
             <div className="absolute top-1/2 left-0 right-0 h-1 bg-indigo-500/30 -translate-y-1/2 hidden md:block"></div>
             {timeMachineData.eras?.map((e: any, i: number) => (
               <motion.div 
                 key={i} 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: i * 0.1 }}
                 className="relative bg-white/10 p-6 rounded-[16px] border border-white/10 hover:bg-white/15 transition-all group z-10"
               >
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                   {e.year}
                 </div>
                 <div className="pt-4 space-y-4">
                    <h4 className="text-xl font-bold text-indigo-300">{e.era}</h4>
                    <div className="space-y-3">
                       <div>
                         <div className="text-[10px] text-indigo-400 font-bold uppercase mb-1">{language === 'ar' ? 'طريقة التدريس' : 'Teaching Method'}</div>
                         <div className="text-sm font-bold text-white/90 leading-relaxed prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{e.teaching_method}</ReactMarkdown>
                         </div>
                       </div>
                       <div className="pt-2 border-t border-white/5">
                         <div className="text-[10px] text-indigo-400 font-bold uppercase mb-1">{language === 'ar' ? 'الأدوات' : 'Tools'}</div>
                         <div className="text-xs font-bold text-indigo-200 prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{e.tools}</ReactMarkdown>
                         </div>
                       </div>
                    </div>
                 </div>
               </motion.div>
             ))}
           </div>
           
           <div className="bg-white/5 p-8 rounded-[24px] border border-white/10 italic text-indigo-100 text-lg text-center leading-relaxed font-bold">
             "{timeMachineData.summary}"
           </div>
         </div>
       )}
    </div>
   </div>
  </motion.div>
 )});
