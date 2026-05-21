import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, RefreshCw, BookOpen, Search, Library, ExternalLink, Box } from 'lucide-react';
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 px-2 relative z-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
    <div className="bg-zinc-950 border border-zinc-800 text-white p-6 md:p-10 rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      <div className="space-y-6 z-10 relative text-right">
        <div className="mb-10 text-right">
           <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">{language === 'ar' ? 'استشارة المجلس' : 'Council Consultation'}</h2>
           <p className="text-zinc-400 mt-4 font-bold text-lg md:text-xl leading-relaxed max-w-2xl ml-auto">{language === 'ar' ? 'اطرح قضيتك أو تحديك على نخبة الخبراء ليتم تحليله بعمق.' : 'Present your case or challenge to the elite experts for deep analysis.'}</p>
        </div>

      <div className="flex flex-col gap-8 mt-6 p-6 md:p-10 bg-zinc-900 rounded-[40px] border border-zinc-800 shadow-inner">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-3 bg-zinc-800 p-2 rounded-full border border-zinc-700 shadow-sm">
             <button 
               onClick={(e) => { e.stopPropagation(); setIsShadowCouncil(false); }}
               className={cn("px-6 py-2.5 rounded-full text-sm font-black transition-all cursor-pointer", !isShadowCouncil ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300")}
             >
               {language === 'ar' ? 'المجلس القياسي' : 'Standard Council'}
             </button>
             <button 
               onClick={(e) => { e.stopPropagation(); setIsShadowCouncil(true); }}
               className={cn("px-6 py-2.5 rounded-full text-sm font-black transition-all cursor-pointer", isShadowCouncil ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]" : "text-zinc-500 hover:text-zinc-300")}
             >
               {language === 'ar' ? 'مجلس الظل 🗡️' : 'Shadow Council 🗡️'}
             </button>
           </div>
        </div>

        <div className="relative group">
          <input 
            value={councilTopic} 
            onChange={(e) => setCouncilTopic(e.target.value)} 
            className={cn(
               "w-full p-4 md:p-10 rounded-2xl md:rounded-[32px] text-base md:text-2xl outline-none transition-all font-black text-right",
               isShadowCouncil 
                 ? "bg-black border-2 border-red-900 text-red-100 placeholder-red-900/40 focus:border-red-500 focus:shadow-[0_0_40px_rgba(220,38,38,0.2)]"
                 : "bg-zinc-800 border-2 border-zinc-700 text-white placeholder-zinc-500 focus:border-indigo-400 focus:bg-zinc-850"
            )}
            placeholder={language === 'ar' ? "اكتب سؤالك أو صف الموقف هنا بدقة..." : "Type your question or describe the situation here..."} 
          />
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); loadCouncil(); }}
          disabled={isLoading}
          className={cn(
            "w-full md:w-auto self-end md:px-16 py-6 rounded-3xl font-black text-xl transition-all flex items-center justify-center gap-4 cursor-pointer active:scale-95",
            isLoading 
              ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" 
              : isShadowCouncil
                ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_12_40px_rgba(220,38,38,0.4)]"
                : "bg-white text-black hover:bg-zinc-100 shadow-[0_12_40px_rgba(255,255,255,0.1)]"
          )}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-7 h-7 animate-spin" />
              <span>{language === 'ar' ? 'جاري الاستدعاء...' : 'Summoning...'}</span>
            </>
          ) : (
            <>
              <Users className="w-7 h-7" />
              <span>{isShadowCouncil ? (language === 'ar' ? 'استدعاء مجلس الظل' : 'Summon Shadow Council') : (language === 'ar' ? 'استدعاء المجلس' : 'Summon Council')}</span>
            </>
          )}
        </button>
      </div>

      {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-3xl font-bold text-lg text-center animate-pulse">{error}</div>}

      <div className="relative min-h-[300px]">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full bg-zinc-900/60 backdrop-blur-xl rounded-[48px] flex flex-col items-center justify-center space-y-10 py-40 border-4 border-dashed border-zinc-800"
          >
            <div className="relative">
              <div className="w-32 h-32 border-8 border-zinc-800 rounded-full"></div>
              <RefreshCw className="w-32 h-32 text-indigo-400 animate-spin absolute top-0 left-0" />
            </div>
            <div className="text-3xl md:text-5xl font-black text-white text-center tracking-tighter">
              {language === 'ar' ? 'مجلس الخبراء يجتمع الآن...' : 'Experts are convening...'}
            </div>
          </motion.div>
        ) : councilData && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
             <div className="bg-zinc-900/80 rounded-[48px] p-8 md:p-12 border border-zinc-800 shadow-2xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-zinc-800 pb-8">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                        <Users className="w-6 h-6" />
                     </div>
                     <h3 className="text-2xl font-black">
                        {language === 'ar' ? 'نقاش الطاولة المستديرة' : 'Roundtable Discussion'}
                     </h3>
                  </div>
                  <div className="text-xs font-black text-zinc-500 bg-zinc-800 px-4 py-2 rounded-full uppercase tracking-widest">
                     {language === 'ar' ? 'البث المباشر للمجلس' : 'LIVE COUNCIL STREAM'}
                  </div>
                </div>
                
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                   {councilData.council_discussion.map((msg: any, i: number) => (
                     <motion.div 
                       initial={{ opacity: 0, x: i % 2 === 0 ? 30 : -30 }}
                       whileInView={{ opacity: 1, x: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.1 }}
                       key={i} 
                       className={cn(
                         "p-6 md:p-8 rounded-[32px] max-w-[85%] shadow-2xl relative",
                         i % 2 === 0 
                           ? "bg-indigo-600/10 border border-indigo-500/30 text-white ml-auto" 
                           : "bg-zinc-800 border border-zinc-700 text-zinc-200 mr-auto"
                       )}
                     >
                       <div className={cn(
                         "text-sm font-black uppercase tracking-[0.2em] mb-3 text-right", 
                         i % 2 === 0 ? "text-indigo-400" : "text-emerald-400"
                        )}>
                         {msg.speaker}
                       </div>
                       <p className="leading-relaxed font-bold text-lg md:text-xl text-right">
                         {msg.message}
                       </p>
                     </motion.div>
                   ))}
                </div>
             </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-5">
              {councilData?.consultants?.map((c: any, i: number) => (
                <button 
                  key={i} 
                  onClick={(e) => { e.stopPropagation(); setActiveConsultantIndex(i); }}
                  className={cn(
                    "p-6 md:p-8 rounded-[24px] border-2 transition-all text-center space-y-4 cursor-pointer flex flex-col items-center justify-center",
                    activeConsultantIndex === i 
                      ? "bg-white border-white shadow-[0_0_30px_rgba(255,255,255,0.2)] text-black" 
                      : "bg-zinc-800/50 border-zinc-800 hover:border-zinc-600 text-zinc-400"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors",
                    activeConsultantIndex === i ? "bg-black/5 border-black/10 text-black" : "bg-zinc-900 border-zinc-700 text-zinc-500"
                  )}>
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-xs md:text-sm leading-tight uppercase tracking-widest">{c?.role}</h4>
                </button>
              ))}
            </div>

            {activeConsultantIndex !== null && councilData?.consultants?.[activeConsultantIndex] && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }}
                key={activeConsultantIndex}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-zinc-900 p-8 md:p-12 rounded-[40px] border border-zinc-800 shadow-2xl"
              >
                <div className="space-y-6 text-right">
                   <div className="text-xs font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2 justify-end">
                     {language === 'ar' ? 'التشخيص العميق' : 'Deep Diagnosis'}
                     <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                   </div>
                   <p className="text-xl md:text-2xl font-black leading-tight text-white">{councilData.consultants[activeConsultantIndex].diagnosis}</p>
                </div>
                
                <div className="space-y-6 text-right">
                   <div className="text-xs font-black uppercase text-emerald-500 tracking-widest flex items-center gap-2 justify-end">
                     {language === 'ar' ? 'النصائح العملية' : 'Actionable Advice'}
                     <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                   </div>
                   <ul className="space-y-4">
                      {councilData.consultants[activeConsultantIndex].advice?.map((a: string, idx: number) => (
                        <li key={idx} className="flex gap-4 text-zinc-100 font-bold text-lg justify-end">
                          <span>{a}</span>
                          <span className="text-emerald-400 shrink-0">•</span>
                        </li>
                      ))}
                   </ul>
                </div>
                
                <div className="space-y-6 text-right">
                   <div className="text-xs font-black uppercase text-orange-400 tracking-widest flex items-center gap-2 justify-end">
                     {language === 'ar' ? 'الفكرة الحاكمة' : 'Ruling Principle'}
                     <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                   </div>
                   <div className="bg-orange-500/10 border border-orange-500/20 p-8 rounded-[32px]">
                      <p className="text-orange-100 font-black italic text-xl leading-relaxed text-right">"{councilData.consultants[activeConsultantIndex].genius_hack}"</p>
                   </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-12 pt-12 border-t border-zinc-800/50">
               <motion.div 
                 whileInView={{ scale: [0.98, 1] }}
                 className="bg-emerald-600 rounded-[40px] p-10 md:p-16 text-white relative overflow-hidden shadow-[0_20px_50px_rgba(16,185,129,0.3)]"
               >
                  <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)] pointer-events-none"></div>
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-white/20">
                      {language === 'ar' ? 'القرار التنفيذي النهائي' : 'Final Executive Verdict'}
                    </div>
                    <p className="text-2xl md:text-3xl lg:text-5xl font-black text-white leading-tight tracking-tighter drop-shadow-lg italic">
                      "{councilData?.executive_verdict}"
                    </p>
                  </div>
               </motion.div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4 text-right">
                     <h4 className="font-bold text-zinc-400 uppercase tracking-widest text-sm flex items-center justify-end gap-2">
                        {language === 'ar' ? 'المراجع والمصادر العالمية' : 'Global References & Sources'}
                        <Box className="w-4 h-4" />
                     </h4>
                     <div className="flex flex-wrap gap-2 justify-end">
                        {councilData?.global_references?.map((r: string, i: number) => (
                          <span key={i} className="bg-white/10 px-4 py-2 rounded-lg text-xs font-bold text-zinc-300">{r}</span>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-4 text-right">
                     <h4 className="font-bold text-zinc-400 uppercase tracking-widest text-sm flex items-center justify-end gap-2">
                        {language === 'ar' ? 'توصيات الميديا والبحث' : 'Media & Research Picks'}
                        <Users className="w-4 h-4" />
                     </h4>
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
