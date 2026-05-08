import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, RefreshCw, BookOpen, Search, Library, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';
import { useUser } from '../../contexts/UserContext';

export const CouncilTab = React.memo(({ language, initialValue, onValueUsed, handleTabChange }: { language: 'ar' | 'en', initialValue?: string, onValueUsed?: () => void, handleTabChange: any }) => {
  const [councilTopic, setCouncilTopic] = React.useState('');
  const [councilData, setCouncilData] = React.useState<any>(null);
  const [activeConsultantIndex, setActiveConsultantIndex] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isShadowCouncil, setIsShadowCouncil] = React.useState(false);

  React.useEffect(() => {
    if (initialValue && !councilData && !isLoading) {
      setCouncilTopic(initialValue);
      loadCouncil();
      if (onValueUsed) onValueUsed();
    }
  }, [initialValue]);

  const loadCouncil = async () => {
    if (!councilTopic.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const { generateCouncilConsultation } = await import('../../services/gemini');
      const data = await generateCouncilConsultation(councilTopic, language, isShadowCouncil ? 'shadow' : 'standard');
      setCouncilData(data);
      setActiveConsultantIndex(0);
      window.dispatchEvent(new CustomEvent('add_xp', { detail: { amount: 200 } }));
    } catch (err: any) {
      setError(language === 'ar' 
        ? "تفرق الخبراء لمناقشة طارئة.. يرجى الضغط مرة أخرى ليجتمعوا ويصدروا إجابتهم." 
        : "The experts are in a heated debate.. please click again to gather them.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 px-2">
    <TabHeader 
      icon={Users}
      title={{ ar: 'طاولة الخبراء', en: 'Expert Table' }}
      description={{ 
          ar: 'اجمع الخبراء والمفكرين ليتجادلوا ويقدموا خلاصة عميقة ومدروسة لحالتك أو تحديك الخاص.', 
          en: 'Gather historical and educational experts to debate and provide a deep, well-thought-out verdict for your specific challenge.' 
      }}
      language={language}
      onBack={() => handleTabChange('discover', '')}
      onClose={() => handleTabChange('discover', '', true)}
    />
    <div className="bg-zinc-900 border border-zinc-800 text-white p-6 md:p-10 rounded-[32px] shadow-2xl space-y-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      <div className="space-y-6 z-10 relative">
        <div className="mb-8">
           <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{language === 'ar' ? 'استشارة المجلس' : 'Council Consultation'}</h2>
           <p className="text-zinc-400 mt-2 font-medium">{language === 'ar' ? 'اطرح قضيتك أو تحديك على نخبة الخبراء ليتم تحليله بعمق.' : 'Present your case or challenge to the elite experts for deep analysis.'}</p>
        </div>

      <div className="flex flex-col gap-8 mt-6 p-6 bg-zinc-900/40 rounded-[32px] border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-3 bg-zinc-800/50 p-1.5 rounded-full border border-zinc-700/50">
             <button 
               onClick={() => setIsShadowCouncil(false)}
               className={cn("px-4 py-2 rounded-full text-sm font-bold transition-all", !isShadowCouncil ? "bg-indigo-500 text-white" : "text-zinc-400 hover:text-white")}
             >
               {language === 'ar' ? 'المجلس القياسي' : 'Standard Council'}
             </button>
             <button 
               onClick={() => setIsShadowCouncil(true)}
               className={cn("px-4 py-2 rounded-full text-sm font-bold transition-all", isShadowCouncil ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]" : "text-zinc-400 hover:text-white")}
             >
               {language === 'ar' ? 'مجلس الظل 🗡️' : 'Shadow Council 🗡️'}
             </button>
           </div>
        </div>

        <div className="relative group shadow-xl rounded-[24px]">
          <input 
            value={councilTopic} 
            onChange={(e) => setCouncilTopic(e.target.value)} 
            className={cn(
               "w-full p-6 md:p-8 rounded-[24px] text-lg outline-none transition-all font-bold shadow-[inset_0_4px_12px_rgba(0,0,0,0.3)]",
               isShadowCouncil 
                 ? "bg-black border-2 border-red-900/50 text-red-100 placeholder-red-900/50 focus:border-red-500 focus:shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:border-red-800"
                 : "bg-zinc-800 border-2 border-zinc-600 text-white placeholder-zinc-400 focus:border-indigo-400 focus:bg-zinc-800 focus:shadow-[0_0_30px_rgba(129,140,248,0.3)] hover:border-zinc-500"
            )}
            placeholder={language === 'ar' ? "اكتب سؤالك أو صف الموقف هنا بدقة..." : "Type your question or describe the situation here..."} 
          />
        </div>
        
        <button 
          onClick={loadCouncil} 
          disabled={isLoading}
          className={cn(
            "w-full md:w-auto self-end md:px-12 py-5 rounded-[20px] font-black text-lg transition-all flex items-center justify-center gap-3 cursor-pointer",
            isLoading 
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700" 
              : isShadowCouncil
                ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_8px_30px_rgba(220,38,38,0.4)] hover:shadow-[0_12px_45px_rgba(220,38,38,0.6)] border border-red-400/30"
                : "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white shadow-[0_8px_30px_rgba(99,102,241,0.4)] border border-indigo-400/30"
          )}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>{language === 'ar' ? 'جاري الاستدعاء...' : 'Summoning...'}</span>
            </>
          ) : (
            <>
              <Users className="w-6 h-6" />
              <span>{isShadowCouncil ? (language === 'ar' ? 'استدعاء مجلس الظل' : 'Summon Shadow Council') : (language === 'ar' ? 'استدعاء المجلس' : 'Summon Council')}</span>
            </>
          )}
        </button>
      </div>

      {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-[16px] font-bold text-sm">{error}</div>}

      <div className="relative min-h-[200px]">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full bg-zinc-800/50 backdrop-blur-md rounded-[24px] md:rounded-[32px] flex flex-col items-center justify-center space-y-8 py-32 border-2 border-dashed border-zinc-700"
          >
            <div className="relative">
              <div className="w-24 h-24 border-8 border-zinc-700 rounded-full"></div>
              <RefreshCw className="w-24 h-24 text-indigo-500 animate-spin absolute top-0 left-0" />
            </div>
            <div className="text-2xl md:text-4xl font-bold text-white text-center">
              {language === 'ar' ? 'مجلس الخبراء يجتمع الآن...' : 'Experts are convening...'}
            </div>
          </motion.div>
        ) : councilData && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="bg-zinc-800/40 rounded-[32px] p-8 border border-zinc-700/50">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                     <Users className="w-6 h-6" />
                     {language === 'ar' ? 'نقاش الطاولة المستديرة' : 'Roundtable Discussion'}
                  </h3>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                   {councilData.council_discussion.map((msg: any, i: number) => (
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       transition={{ delay: i * 0.15 }}
                       key={i} 
                       className={cn(
                         "p-5 rounded-[20px] max-w-[90%] shadow-lg",
                         i % 2 === 0 ? "bg-indigo-600/20 border border-indigo-500/20 text-white ml-auto" : "bg-zinc-800 border border-zinc-700 text-zinc-200 mr-auto"
                       )}
                     >
                       <div className={cn("text-xs font-bold uppercase tracking-wider mb-2", i % 2 === 0 ? "text-indigo-300" : "text-emerald-400")}>{msg.speaker}</div>
                       <p className="leading-relaxed font-medium text-[15px]">{msg.message}</p>
                     </motion.div>
                   ))}
                </div>
             </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {councilData?.consultants?.map((c: any, i: number) => (
                <button 
                  key={i} 
                  onClick={() => setActiveConsultantIndex(i)}
                  className={cn(
                    "p-6 rounded-[16px] border-2 transition-all text-center space-y-3 cursor-pointer",
                    activeConsultantIndex === i ? "bg-indigo-600/20 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.2)]" : "bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-500/50 hover:bg-zinc-800"
                  )}
                >
                  <div className="w-12 h-12 bg-zinc-800 rounded-full mx-auto flex items-center justify-center border border-zinc-700">
                    <Users className={cn("w-6 h-6", activeConsultantIndex === i ? "text-indigo-400" : "text-zinc-500")} />
                  </div>
                  <h4 className="font-bold text-sm leading-tight text-white">{c?.role}</h4>
                </button>
              ))}
            </div>

            {activeConsultantIndex !== null && councilData?.consultants?.[activeConsultantIndex] && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                key={activeConsultantIndex}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-zinc-800/60 p-5 md:p-8 lg:p-12 rounded-[24px] md:rounded-[32px] border border-zinc-700/60 shadow-xl"
              >
                <div className="space-y-4">
                   <div className="text-xs font-bold uppercase text-zinc-400 tracking-widest">{language === 'ar' ? 'التشخيص' : 'Diagnosis'}</div>
                   <p className="text-xl font-bold leading-relaxed">{councilData.consultants[activeConsultantIndex].diagnosis}</p>
                </div>
                <div className="space-y-4">
                   <div className="text-xs font-bold uppercase text-emerald-400 tracking-widest">{language === 'ar' ? 'النصائح العملية' : 'Actionable Advice'}</div>
                   <ul className="space-y-3">
                      {councilData.consultants[activeConsultantIndex].advice?.map((a: string, idx: number) => (
                        <li key={idx} className="flex gap-3 text-zinc-300 font-bold">
                          <span className="text-emerald-400">•</span>
                          <span>{a}</span>
                        </li>
                      ))}
                   </ul>
                </div>
                <div className="space-y-4">
                   <div className="text-xs font-bold uppercase text-orange-400 tracking-widest">{language === 'ar' ? 'الفكرة السحرية' : 'Genius Hack'}</div>
                   <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-[16px]">
                      <p className="text-orange-200 font-bold italic">"{councilData.consultants[activeConsultantIndex].genius_hack}"</p>
                   </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-8 pt-8 border-t border-white/10">
               <div className="bg-indigo-900/20 border-2 border-indigo-500/30 p-8 rounded-[24px] md:rounded-[32px] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                    {language === 'ar' ? 'القرار التنفيذي النهائي' : 'Final Executive Verdict'}
                  </h3>
                  <p className="text-xl font-bold text-indigo-100 leading-relaxed italic">{councilData?.executive_verdict}</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <h4 className="font-bold text-zinc-400 uppercase tracking-widest text-sm"><Library className="w-4 h-4" />
                        {language === 'ar' ? 'المراجع والمصادر العالمية' : 'Global References & Sources'}</h4>
                     <div className="flex flex-wrap gap-2">
                        {councilData?.global_references?.map((r: string, i: number) => (
                          <span key={i} className="bg-white/10 px-4 py-2 rounded-lg text-xs font-bold text-zinc-300">{r}</span>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-4">
                     <h4 className="font-bold text-zinc-400 uppercase tracking-widest text-sm"><Users className="w-4 h-4" />
                        {language === 'ar' ? 'توصيات الميديا والبحث' : 'Media & Research Picks'}</h4>
                     <div className="grid gap-4">
                        {councilData?.media_recommendations?.map((m: any, i: number) => (
                          <a 
                            key={i} 
                            href={`https://www.youtube.com/results?search_query=${m?.search_keyword}`}
                            target="_blank"
                            rel="noreferrer"
                            className="group bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 hover:bg-zinc-800 hover:border-indigo-500/50 hover:shadow-[0_4px_15px_rgba(0,0,0,0.2)] transition-all"
                          >
                             <div className="font-bold text-zinc-200 group-hover:text-indigo-400 transition-all">{m?.title}</div>
                             <div className="text-xs text-zinc-400 mt-1">{m?.description}</div>
                          </a>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
</motion.div>
)});
