import React, { useEffect, useState } from 'react';
import { DemoStarters } from '../../components/ui/DemoStarters';
import { motion } from 'motion/react';
import { Users, RefreshCw, BookOpen, Search, Library, ExternalLink, Box, Swords } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';
import { useUser } from '../../contexts/UserContext';
import { ToolEmptyHint } from '../common/ToolEmptyHint';

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
    <div className="bg-white border border-[#8FA9C7]/12 text-[#182231] p-4 md:p-10 rounded-[28px] md:rounded-[32px] shadow-[0_18px_45px_rgba(24,34,49,0.20)] space-y-6 md:space-y-10 relative overflow-hidden">
      
      <div className="space-y-6 z-10 relative text-right">
        <div className="mb-10 text-right">
           <h2 className="text-2xl md:text-5xl font-extrabold text-[#182231] tracking-tight leading-snug">{language === 'ar' ? 'استشارة المجلس' : 'Council Consultation'}</h2>
           <p className="text-[#64788D] mt-4 font-bold text-lg md:text-xl leading-relaxed max-w-2xl ml-auto">{language === 'ar' ? 'اطرح قضيتك أو تحديك على نخبة الخبراء ليتم تحليله بعمق.' : 'Present your case or challenge to the elite experts for deep analysis.'}</p>
        </div>

      <div className="flex flex-col gap-5 md:gap-8 mt-4 md:mt-6 p-4 md:p-10 bg-white rounded-[28px] md:rounded-[40px] border border-[#182231]/10 shadow-inner">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-3 bg-white p-2 rounded-full border border-[#182231]/10 shadow-sm">
             <button 
               onClick={(e) => { e.stopPropagation(); setIsShadowCouncil(false); }}
               className={cn("px-6 py-2.5 rounded-full text-sm font-black transition-all cursor-pointer", !isShadowCouncil ? "bg-white text-black shadow-lg" : "text-[#64788D] hover:text-[#182231]")}
             >
               {language === 'ar' ? 'المجلس القياسي' : 'Standard Council'}
             </button>
             <button 
               onClick={(e) => { e.stopPropagation(); setIsShadowCouncil(true); }}
               className={cn("px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-extrabold transition-all cursor-pointer", isShadowCouncil ? "bg-[#B85D63] text-white shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)]" : "text-[#64788D] hover:text-[#182231]")}
             >
               <span className="inline-flex items-center gap-1.5"><Swords className="w-4 h-4" aria-hidden="true" />{language === 'ar' ? 'مجلس الظل' : 'Shadow Council'}</span>
             </button>
           </div>
        </div>

<DemoStarters tab="council" language={language} onPick={setCouncilTopic} className="mb-3" />
        <div className="relative group">
          <input 
            value={councilTopic} 
            onChange={(e) => setCouncilTopic(e.target.value)} 
            className={cn(
               "w-full p-4 md:p-10 rounded-2xl md:rounded-[32px] text-[15px] md:text-2xl outline-none transition-all font-semibold md:font-black text-right leading-relaxed",
               isShadowCouncil 
                 ? "bg-white border-2 border-[#6E5B91]/30 text-[#182231] placeholder-[#8A97A6] focus:border-[#6E5B91]/30 focus:shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)]"
                 : "bg-white border-2 border-[#182231]/10 text-[#182231] placeholder-[#8A97A6] focus:border-[#6E5B91]/30 focus:bg-[#F8F5EF]"
            )}
            placeholder={language === 'ar' ? "اكتب سؤالك أو صف الموقف هنا بدقة..." : "Type your question or describe the situation here..."} 
          />
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); loadCouncil(); }}
          disabled={isLoading}
          className={cn(
            "w-full md:w-auto self-end md:px-16 py-4 md:py-6 rounded-[22px] md:rounded-3xl font-extrabold text-base md:text-xl transition-all flex items-center justify-center gap-3 md:gap-4 cursor-pointer active:scale-95",
            isLoading 
              ? "bg-white text-[#64788D] cursor-not-allowed" 
              : isShadowCouncil
                ? "bg-[#6E5B91] hover:bg-[#6E5B91] text-white shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)]"
                : "bg-[#6E5B91] text-white hover:bg-[#5F4E7F] shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)]"
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

      {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-3xl font-bold text-lg text-center">{error}</div>}

      <div className="relative min-h-[300px]">
        {!isLoading && !councilData && (
          <ToolEmptyHint icon={Users} text={language === 'ar' ? 'اجمع الخبراء والمفكرين ليتجادلوا ويقدموا خلاصة عميقة ومدروسة لحالتك أو تحديك الخاص.' : 'Gather historical and educational experts to debate and provide a deep, well-thought-out verdict for your specific challenge.'} />
        )}
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full bg-white backdrop-blur-xl rounded-[48px] flex flex-col items-center justify-center space-y-10 py-40 border-4 border-dashed border-[#182231]/10"
          >
            <div className="relative">
              <div className="w-32 h-32 border-8 border-[#182231]/10 rounded-full"></div>
              <RefreshCw className="w-32 h-32 text-[#6E5B91] animate-spin absolute top-0 left-0" />
            </div>
            <div className="text-3xl md:text-5xl font-black text-[#182231] text-center tracking-tighter">
              {language === 'ar' ? 'مجلس الخبراء يجتمع الآن...' : 'Experts are convening...'}
            </div>
          </motion.div>
        ) : councilData && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
             <div className="bg-white rounded-[48px] p-8 md:p-12 border border-[#182231]/10 shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)]">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-[#182231]/10 pb-8">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#EFEAF6] rounded-2xl flex items-center justify-center text-[#6E5B91]">
                        <Users className="w-6 h-6" />
                     </div>
                     <h3 className="text-2xl font-black">
                        {language === 'ar' ? 'نقاش الطاولة المستديرة' : 'Roundtable Discussion'}
                     </h3>
                  </div>
                  <div className="text-xs font-black text-[#64788D] bg-white px-4 py-2 rounded-full uppercase tracking-widest">
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
                         "p-6 md:p-8 rounded-[32px] max-w-[85%] shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)] relative",
                         i % 2 === 0 
                           ? "bg-[#EFEAF6] border border-[#6E5B91]/30 text-[#182231] ml-auto" 
                           : "bg-white border border-[#182231]/10 text-[#182231] mr-auto"
                       )}
                     >
                       <div className={cn(
                         "text-sm font-black uppercase tracking-[0.2em] mb-3 text-right", 
                         i % 2 === 0 ? "text-[#6E5B91]" : "text-[#6E5B91]"
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
                      ? "bg-white border-white shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)] text-black" 
                      : "bg-[#F8F5EF] border-[#182231]/10 hover:border-[#182231]/10 text-[#64788D]"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors",
                    activeConsultantIndex === i ? "bg-[#F8F5EF] border-black/10 text-black" : "bg-white border-[#182231]/10 text-[#64788D]"
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
                className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white p-8 md:p-12 rounded-[40px] border border-[#182231]/10 shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)]"
              >
                <div className="space-y-6 text-right">
                   <div className="text-xs font-black uppercase text-[#64788D] tracking-widest flex items-center gap-2 justify-end">
                     {language === 'ar' ? 'التشخيص العميق' : 'Deep Diagnosis'}
                     <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                   </div>
                   <p className="text-xl md:text-2xl font-black leading-tight text-[#182231]">{councilData.consultants[activeConsultantIndex].diagnosis}</p>
                </div>
                
                <div className="space-y-6 text-right">
                   <div className="text-xs font-black uppercase text-[#6E5B91] tracking-widest flex items-center gap-2 justify-end">
                     {language === 'ar' ? 'النصائح العملية' : 'Actionable Advice'}
                     <span className="w-2 h-2 rounded-full bg-[#6E5B91]"></span>
                   </div>
                   <ul className="space-y-4">
                      {councilData.consultants[activeConsultantIndex].advice?.map((a: string, idx: number) => (
                        <li key={idx} className="flex gap-4 text-[#182231] font-bold text-lg justify-end">
                          <span>{a}</span>
                          <span className="text-[#6E5B91] shrink-0">•</span>
                        </li>
                      ))}
                   </ul>
                </div>
                
                <div className="space-y-6 text-right">
                   <div className="text-xs font-black uppercase text-[#6E5B91] tracking-widest flex items-center gap-2 justify-end">
                     {language === 'ar' ? 'الفكرة الحاكمة' : 'Ruling Principle'}
                     <span className="w-2 h-2 rounded-full bg-[#6E5B91]"></span>
                   </div>
                   <div className="bg-[#EFEAF6] border border-[#6E5B91]/30 p-8 rounded-[32px]">
                      <p className="text-[#182231] font-black italic text-xl leading-relaxed text-right">"{councilData.consultants[activeConsultantIndex].genius_hack}"</p>
                   </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-12 pt-12 border-t border-[#182231]/10">
               <motion.div 
                 whileInView={{ scale: [0.98, 1] }}
                 className="bg-white border border-[#182231]/10 rounded-[28px] md:rounded-[32px] p-8 md:p-14 text-[#182231] relative overflow-hidden shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)]"
               >
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 bg-[#EFEAF6] text-[#6E5B91] px-5 py-2 rounded-full text-xs font-black mb-8">
                      {language === 'ar' ? 'القرار التنفيذي النهائي' : 'Final Executive Verdict'}
                    </div>
                    <p className="text-2xl md:text-3xl lg:text-5xl font-black text-[#182231] leading-tight tracking-tight">
                      "{councilData?.executive_verdict}"
                    </p>
                  </div>
               </motion.div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4 text-right">
                     <h4 className="font-bold text-[#64788D] uppercase tracking-widest text-sm flex items-center justify-end gap-2">
                        {language === 'ar' ? 'المراجع والمصادر العالمية' : 'Global References & Sources'}
                        <Box className="w-4 h-4" />
                     </h4>
                     <div className="flex flex-wrap gap-2 justify-end">
                        {councilData?.global_references?.map((r: string, i: number) => (
                          <span key={i} className="bg-[#F8F5EF] px-4 py-2 rounded-lg text-xs font-bold text-[#182231]">{r}</span>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-4 text-right">
                     <h4 className="font-bold text-[#64788D] uppercase tracking-widest text-sm flex items-center justify-end gap-2">
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
                            className="group bg-[#F8F5EF] p-4 rounded-xl border border-[#182231]/10 hover:bg-[#F8F5EF] hover:border-[#6E5B91]/30 hover:shadow-[0_4px_15px_rgba(0,0,0,0.2)] transition-all"
                          >
                             <div className="font-bold text-[#182231] group-hover:text-[#6E5B91] transition-all">{m?.title}</div>
                             <div className="text-xs text-[#64788D] mt-1">{m?.description}</div>
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
