import React, { useEffect, useState } from 'react';
import { DemoStarters } from '../../components/ui/DemoStarters';
import { motion } from 'motion/react';
import { Users, RefreshCw, BookOpen, Search, Library, ExternalLink, Box, Swords } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';
import { useUser } from '../../contexts/UserContext';
import { ToolEmptyHint } from '../common/ToolEmptyHint';
import { TebyanLoader, TebyanButtonLoader } from '../ui/TebyanLoader';

export const CouncilTab = React.memo(({ language, initialValue, onValueUsed, handleTabChange, inArena }: { language: 'ar' | 'en', initialValue?: string, onValueUsed?: () => void, handleTabChange: any, inArena?: boolean }) => {
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
      hideTitleVisually={inArena}
      onBack={() => handleTabChange('discover', '')}
      onClose={() => handleTabChange('discover', '', true)}
    />
    <div className="bg-white border border-[#8FA9C7]/12 text-navy p-4 md:p-8 rounded-[28px] md:rounded-[32px] shadow-[0_18px_45px_rgba(24,34,49,0.20)] space-y-6 md:space-y-10 relative overflow-hidden">
      
      <div className="space-y-6 z-10 relative text-right">
        <div className="mb-4 md:mb-5 text-right">
           <h2 className="text-xl md:text-3xl font-extrabold text-navy tracking-tight leading-snug">{language === 'ar' ? 'استشارة المجلس' : 'Council Consultation'}</h2>
           <p className="text-ink-mute mt-2 font-semibold text-sm md:text-base leading-relaxed max-w-2xl ml-auto">{language === 'ar' ? 'اطرح قضيتك أو تحديك على نخبة الخبراء ليتم تحليله بعمق.' : 'Present your case or challenge to the elite experts for deep analysis.'}</p>
        </div>

      <div className="flex flex-col gap-5 md:gap-8 mt-2 md:mt-3 p-4 md:p-6 bg-white rounded-[28px] md:rounded-[40px] border border-navy/10 shadow-inner">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-3 bg-white p-2 rounded-full border border-navy/10 shadow-sm">
             <button 
               onClick={(e) => { e.stopPropagation(); setIsShadowCouncil(false); }}
               className={cn("px-6 py-2.5 rounded-full text-sm font-black transition-all cursor-pointer", !isShadowCouncil ? "bg-white text-black shadow-lg" : "text-ink-mute hover:text-navy")}
             >
               {language === 'ar' ? 'المجلس القياسي' : 'Standard Council'}
             </button>
             <button 
               onClick={(e) => { e.stopPropagation(); setIsShadowCouncil(true); }}
               className={cn("px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-extrabold transition-all cursor-pointer", isShadowCouncil ? "bg-[#B85D63] text-white shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)]" : "text-ink-mute hover:text-navy")}
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
                 ? "bg-white border-2 border-lilac/30 text-navy placeholder-[#8A97A6] focus:border-lilac/30 focus:shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)]"
                 : "bg-white border-2 border-navy/10 text-navy placeholder-[#8A97A6] focus:border-lilac/30 focus:bg-ivory"
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
              ? "bg-white text-ink-mute cursor-not-allowed" 
              : isShadowCouncil
                ? "bg-lilac hover:bg-lilac text-white shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)]"
                : "bg-lilac text-white hover:bg-lilac-deep shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)]"
          )}
        >
          {isLoading ? (
            <>
              <TebyanButtonLoader className="text-current" />
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

      {error && <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 p-5 rounded-3xl font-bold text-base text-center">{error}</div>}

      <div className="relative min-h-[300px]">
        {!isLoading && !councilData && (
          <ToolEmptyHint icon={Users} text={language === 'ar' ? 'اكتب موقفك ثم استدعِ المجلس، ليسمعك كل خبير من زاويته.' : 'Describe your situation, then summon the council to hear each expert.'} />
        )}
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full bg-lilac-mist/40 rounded-[32px] flex flex-col items-center justify-center space-y-6 py-20 border border-lilac-soft/25"
          >
            <TebyanLoader size={48} label={language === 'ar' ? 'المجلس يجتمع' : 'The council is convening'} />
            <div className="font-serif text-2xl md:text-3xl font-bold text-navy text-center">
              {language === 'ar' ? 'مجلس الخبراء يجتمع الآن...' : 'Experts are convening...'}
            </div>
          </motion.div>
        ) : councilData && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
             <div className="bg-white rounded-[48px] p-8 md:p-12 border border-navy/10 shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)]">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-navy/10 pb-8">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-lilac-mist rounded-2xl flex items-center justify-center text-lilac">
                        <Users className="w-6 h-6" />
                     </div>
                     <h3 className="font-serif text-2xl font-bold">
                        {language === 'ar' ? 'نقاش الطاولة المستديرة' : 'Roundtable Discussion'}
                     </h3>
                  </div>
                  <div className="text-xs font-bold text-ink-mute bg-lilac-mist/60 px-4 py-2 rounded-full">
                     {language === 'ar' ? 'حوار المجلس' : 'Live council'}
                  </div>
                </div>
                
                <div className="space-y-6 md:max-h-[560px] md:overflow-y-auto md:pr-4 custom-scrollbar">
                   {councilData.council_discussion.map((msg: any, i: number) => (
                     <motion.div 
                       initial={{ opacity: 0, x: i % 2 === 0 ? 30 : -30 }}
                       whileInView={{ opacity: 1, x: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: 0.15 + i * 0.22, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                       key={i} 
                       className={cn(
                         "p-6 md:p-8 rounded-[32px] max-w-[85%] shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)] relative",
                         i % 2 === 0 
                           ? "bg-lilac-mist border border-lilac/30 text-navy ml-auto" 
                           : "bg-white border border-navy/10 text-navy mr-auto"
                       )}
                     >
                       <div className="mb-3 flex items-center gap-2.5 text-right">
                         <span aria-hidden="true" className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-serif text-base font-bold", i % 2 === 0 ? "bg-lilac text-white" : "bg-lilac-mist text-lilac")}>{String(msg.speaker || '').trim().charAt(0)}</span>
                         <span className="text-sm font-bold text-lilac">{msg.speaker}</span>
                       </div>
                       <p className="leading-[1.9] font-semibold text-base md:text-xl text-right">
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
                      ? "bg-white border-lilac shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)] text-navy" 
                      : "bg-ivory border-navy/10 hover:border-lilac-soft/60 text-ink-mute"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors",
                    activeConsultantIndex === i ? "bg-lilac-mist border-lilac-soft/30 text-lilac" : "bg-white border-navy/10 text-ink-mute"
                  )}>
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm leading-snug">{c?.role}</h4>
                </button>
              ))}
            </div>

            {activeConsultantIndex !== null && councilData?.consultants?.[activeConsultantIndex] && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }}
                key={activeConsultantIndex}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white p-8 md:p-12 rounded-[40px] border border-navy/10 shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)]"
              >
                <div className="space-y-6 text-right">
                   <div className="text-sm font-bold text-ink-mute flex items-center gap-2 justify-end">
                     {language === 'ar' ? 'التشخيص العميق' : 'Deep Diagnosis'}
                     <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                   </div>
                   <p className="font-serif text-xl md:text-2xl font-bold leading-snug text-navy">{councilData.consultants[activeConsultantIndex].diagnosis}</p>
                </div>
                
                <div className="space-y-6 text-right">
                   <div className="text-sm font-bold text-lilac flex items-center gap-2 justify-end">
                     {language === 'ar' ? 'النصائح العملية' : 'Actionable Advice'}
                     <span className="w-2 h-2 rounded-full bg-lilac"></span>
                   </div>
                   <ul className="space-y-4">
                      {councilData.consultants[activeConsultantIndex].advice?.map((a: string, idx: number) => (
                        <li key={idx} className="flex gap-4 text-navy font-bold text-lg justify-end">
                          <span>{a}</span>
                          <span className="text-lilac shrink-0">•</span>
                        </li>
                      ))}
                   </ul>
                </div>
                
                <div className="space-y-6 text-right">
                   <div className="text-sm font-bold text-lilac flex items-center gap-2 justify-end">
                     {language === 'ar' ? 'الفكرة الحاكمة' : 'Ruling Principle'}
                     <span className="w-2 h-2 rounded-full bg-lilac"></span>
                   </div>
                   <div className="bg-lilac-mist border border-lilac/30 p-8 rounded-[32px]">
                      <p className="text-navy font-black italic text-xl leading-relaxed text-right">"{councilData.consultants[activeConsultantIndex].genius_hack}"</p>
                   </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-12 pt-12 border-t border-navy/10">
               <motion.div 
                 whileInView={{ scale: [0.98, 1] }}
                 className="bg-white border border-navy/10 rounded-[28px] md:rounded-[32px] p-8 md:p-14 text-navy relative overflow-hidden shadow-[0_12px_30px_-18px_rgba(24,34,49,0.2)]"
               >
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 bg-lilac-mist text-lilac px-5 py-2 rounded-full text-sm font-bold mb-8">
                      {language === 'ar' ? 'القرار التنفيذي النهائي' : 'Final Executive Verdict'}
                    </div>
                    <p className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold text-navy leading-snug">
                      "{councilData?.executive_verdict}"
                    </p>
                  </div>
               </motion.div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4 text-right">
                     <h4 className="font-bold text-ink-mute text-sm flex items-center justify-end gap-2">
                        {language === 'ar' ? 'المراجع والمصادر العالمية' : 'Global References & Sources'}
                        <Box className="w-4 h-4" />
                     </h4>
                     <div className="flex flex-wrap gap-2 justify-end">
                        {councilData?.global_references?.map((r: string, i: number) => (
                          <span key={i} className="bg-ivory px-4 py-2 rounded-lg text-sm font-semibold text-navy">{r}</span>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-4 text-right">
                     <h4 className="font-bold text-ink-mute text-sm flex items-center justify-end gap-2">
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
                            className="group bg-ivory p-4 rounded-xl border border-navy/10 hover:bg-ivory hover:border-lilac/30 hover:shadow-[0_4px_15px_rgba(0,0,0,0.2)] transition-all"
                          >
                             <div className="font-bold text-navy group-hover:text-lilac transition-all">{m?.title}</div>
                             <div className="text-sm text-ink-mute mt-1">{m?.description}</div>
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
