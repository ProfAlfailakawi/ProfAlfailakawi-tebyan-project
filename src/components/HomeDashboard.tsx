import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, Command, ClipboardCheck, Gamepad2, Hourglass, BrainCircuit, Zap, MessageCircleQuestion, Trophy, Star, Target, CheckCircle, LibraryBig, BarChart3, Route, Gift, TicketPercent, Bookmark, Box, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useGamification } from '../hooks/useGamification';
import { generateDailyMission } from '../services/gemini';
import { Network } from 'lucide-react';

const HubCard: React.FC<{
  title: string;
  description: string;
  icon: any;
  items: { id: string; label: string; icon: any; hidden?: boolean }[];
  handleTabChange: (id: string) => void;
  language: string;
  color: string;
  inverted?: boolean;
}> = ({ title, description, icon: Icon, items, handleTabChange, language, color, inverted }) => {
  const visibleItems = items.filter(item => !item.hidden);
  if (visibleItems.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "tebyan-glass-card tebyan-tool-tile group rounded-[32px] md:rounded-[40px] p-6 md:p-8 border transition-all duration-500 flex flex-col justify-between relative overflow-hidden",
        inverted ? "bg-gradient-to-br from-[#FFFCF7] via-[#F8F5EF] to-[#EEF2F6] border-[#8FA9C7]/18 hover:shadow-[0_22px_70px_rgba(142,122,174,0.10)] hover:border-[#8E7AAE]/24" : "bg-white/88 border-[#E7E1D8] hover:shadow-[0_22px_70px_rgba(24,34,49,0.07)] hover:border-[#D8CEDF]"
      )}
      style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-[#F8F5EF]/20 to-[#8FA9C7]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
      <div className="relative z-10 w-full flex flex-col h-full">
        {/* Header section */}
        <div className="flex items-start gap-4 md:gap-5 mb-8">
           <div className={cn(
             "w-12 h-12 md:w-14 md:h-14 rounded-[20px] flex items-center justify-center transition-transform duration-500 shadow-sm shrink-0 border transform group-hover:scale-105",
             inverted ? "bg-white/78 border-[#8E7AAE]/16 text-[#6E5F8E]" : "bg-[#FBFAF7] border-[#E7E1D8] text-[#182231]"
           )}>
             <Icon className={cn("w-6 h-6 md:w-7 md:h-7 opacity-80")} />
           </div>
           <div className="pt-1">
             <h3 className={cn(
               "text-xl md:text-2xl font-black leading-tight tracking-tight mb-2",
               inverted ? "text-[#182231]" : "text-[#182231]"
             )}>{title}</h3>
             <p className={cn(
               "text-xs md:text-sm font-medium leading-relaxed max-w-[280px]",
               inverted ? "text-[#64788D]" : "text-[#64788D]"
             )}>{description}</p>
           </div>
        </div>
        
        {/* Action items */}
        <div className="mt-auto">
          <div className="grid gap-3 w-full grid-cols-1">
            {visibleItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={(e) => { e.stopPropagation(); handleTabChange(item.id); }}
                className={cn(
                  "tebyan-micro-tile flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group/item text-right hover:-translate-y-0.5",
                  inverted 
                    ? "bg-white/74 border border-[#8FA9C7]/16 hover:bg-white hover:border-[#8E7AAE]/25 shadow-[0_8px_26px_rgba(24,34,49,0.04)]" 
                    : "bg-[#FBFAF7] border border-[#E7E1D8] hover:bg-white hover:border-[#D8CEDF] hover:shadow-[0_10px_34px_rgba(24,34,49,0.05)] shadow-sm"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                  inverted 
                    ? "bg-[#F1EEF4] border-[#8E7AAE]/15 group-hover/item:bg-white" 
                    : "bg-white border-[#E7E1D8] group-hover/item:border-[#D8CEDF]"
                )}>
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors",
                    inverted ? "text-[#7C8796] group-hover/item:text-[#6E5F8E]" : "text-[#7C8796] group-hover/item:text-[#182231]"
                  )} />
                </div>
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className={cn(
                    "text-sm font-black tracking-tight truncate", 
                    inverted ? "text-[#182231] group-hover/item:text-[#6E5F8E]" : "text-zinc-700 group-hover/item:text-[#182231]"
                  )}>{item.label}</span>
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                    inverted ? "bg-[#F1EEF4] text-[#8E7AAE] group-hover/item:bg-white" : "bg-[#F1EEF4] text-[#7C8796] group-hover/item:text-[#182231]"
                  )}>
                    <ArrowLeft className={cn("w-3 h-3 text-current", language === 'ar' ? "" : "rotate-180")} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

import { NeuralTree } from './NeuralTree';

export const HomeDashboard = ({ tabs, handleTabChange, language }: { tabs: any[], handleTabChange: (id: string) => void, language: string }) => {
  const { state, addXp } = useGamification();
  const [mission, setMission] = useState<any>(null);
  const [missionLoading, setMissionLoading] = useState(true);
  const [missionCompleted, setMissionCompleted] = useState(false);
  const [showFullDashboard, setShowFullDashboard] = useState(false);
  const [lastSession, setLastSession] = useState<any>(null);

  useEffect(() => {
    // Check if we did it today
    const lastCompleted = localStorage.getItem('daily_mission_date');
    const today = new Date().toDateString();
    
    if (lastCompleted === today) {
        setMissionCompleted(true);
        setMission({ title: language === 'ar' ? 'أنجزت مهمة اليوم!' : 'Today\'s mission completed!', task: language === 'ar' ? 'عد غداً لتحدي ميداني جديد.' : 'Come back tomorrow for a new field challenge.', xp_reward: 0 });
        setMissionLoading(false);
        return;
    }

    const cachedMission = localStorage.getItem('daily_mission_cache');
    const cachedDate = localStorage.getItem('daily_mission_cache_date');
    
    if (cachedMission && cachedDate === today) {
        setMission(JSON.parse(cachedMission));
        setMissionLoading(false);
    } else {
        generateDailyMission(language).then(res => {
            setMission(res);
            localStorage.setItem('daily_mission_cache', JSON.stringify(res));
            localStorage.setItem('daily_mission_cache_date', today);
        }).catch(() => {
            // fallback mock
            setMission({ title: 'تحدي الاستماع', task: 'استمع للطرف الآخر اليوم لمدة 5 دقائق دون مقاطعته أبداً.', xp_reward: 50 });
        }).finally(() => {
            setMissionLoading(false);
        });
    }
  }, [language]);

  const handleCompleteMission = () => {
    if (!missionCompleted && mission?.xp_reward) {
        addXp(mission.xp_reward);
        setMissionCompleted(true);
        localStorage.setItem('daily_mission_date', new Date().toDateString());
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('tebyan_last_session');
      setLastSession(raw ? JSON.parse(raw) : null);
    } catch (e) {
      setLastSession(null);
    }
  }, []);

  return (
    <div className="tebyan-home-signature w-full flex flex-col pt-4 pb-16 md:pt-6 px-4 md:px-6 max-w-6xl mx-auto space-y-5">
      <header className="tebyan-cinematic-hero flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div>
          <div className="flex items-center gap-2 mb-2 justify-start">
            <div className="w-1.5 h-1.5 rounded-full bg-[#8E7AAE]"></div>
            <span className="text-zinc-500 font-bold text-[10px] tracking-widest uppercase">{language === 'ar' ? 'الواجهة الرئيسية' : 'Main Dashboard'}</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-[#182231] leading-[1.05] tracking-tight">
            {language === 'ar' ? 'نظامك الشامل' : 'Your Complete System'}
          </h1>
          <p className="text-sm md:text-base text-zinc-500 font-medium leading-relaxed max-w-sm mt-1">
            {language === 'ar' ? 'أدوات ذكية لتعزيز إدراكك وتحليل المواقف بعمق.' : 'Smart tools to enhance your perception and analyze situations.'}
          </p>
        </div>
      </header>

      {/* Calm entry: simple for everyone, full depth on demand */}
      <section className="tebyan-living-awareness tebyan-glass-card bg-white/82 border border-[#8FA9C7]/15 rounded-[28px] md:rounded-[40px] p-5 md:p-8 shadow-[0_12px_50px_rgba(0,0,0,0.04)]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#7C8796]">{language === 'ar' ? 'ابدأ ببساطة' : 'Start simple'}</p>
            <h2 className="text-2xl md:text-4xl font-black text-[#182231] tracking-tight leading-tight">
              {language === 'ar' ? 'وش تبي تسوي اليوم؟' : 'What do you want to do today?'}
            </h2>
            <p className="text-sm md:text-base text-zinc-500 font-bold leading-relaxed max-w-xl">
              {language === 'ar' ? 'ثلاثة أبواب تكفي للبداية. العمق كامل موجود متى ما احتجته.' : 'Three doors are enough to start. Full depth is available when needed.'}
            </p>
          </div>
          <button
            onClick={() => setShowFullDashboard(v => !v)}
            className="tebyan-primary-action shrink-0 px-6 py-4 rounded-2xl bg-[#8E7AAE] text-white font-black text-sm hover:bg-[#806D9F] active:scale-95 transition-all shadow-lg"
          >
            {showFullDashboard ? (language === 'ar' ? 'إخفاء اللوحة الكاملة' : 'Hide full board') : (language === 'ar' ? 'افتح تبيان الكامل' : 'Open full Tebyan')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          {[
            { id: 'oracle', icon: BrainCircuit, ar: 'أفهم', en: 'Understand', descAr: 'اشرح لي الصورة ببساطة', descEn: 'Explain the picture simply' },
            { id: 'qawlfasl', icon: MessageCircleQuestion, ar: 'أحسم', en: 'Decide', descAr: 'أعطني خلاصة واضحة', descEn: 'Give me a clear answer' },
            { id: 'strategicarena', icon: Route, ar: 'أتعمّق', en: 'Go deeper', descAr: 'حلّلها كخبير', descEn: 'Analyze like an expert' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className="tebyan-entry-tile group p-5 rounded-[24px] bg-zinc-50 border border-zinc-100 text-right hover:bg-white hover:border-zinc-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-900 group-hover:bg-[#8E7AAE] group-hover:text-white transition-all">
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#182231]">{language === 'ar' ? item.ar : item.en}</h3>
                  <p className="text-xs text-zinc-500 font-bold mt-1">{language === 'ar' ? item.descAr : item.descEn}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Session Memory */}
      <section className="tebyan-glass-card rounded-[24px] border border-[#8FA9C7]/15 bg-white/78 p-4 md:p-5 shadow-[0_14px_45px_rgba(24,34,49,0.05)]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#F1ECF7] text-[#6E5F8E] flex items-center justify-center shrink-0 border border-[#8E7AAE]/15">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black tracking-widest text-[#8E7AAE] uppercase">{language === 'ar' ? 'آخر ما كنت تفكر فيه' : 'Where you left off'}</p>
              <h3 className="mt-1 text-base md:text-lg font-black text-[#182231] truncate max-w-2xl">
                {lastSession?.query || (language === 'ar' ? 'لم تبدأ جلسة محفوظة بعد' : 'No saved session yet')}
              </h3>
              <p className="mt-1 text-xs font-bold text-[#7C8796]">
                {lastSession?.toolLabel ? `${language === 'ar' ? 'آخر مسار' : 'Last path'}: ${lastSession.toolLabel}` : (language === 'ar' ? 'اكتب أول سؤال، وسنحفظ لك المسار القادم هنا.' : 'Write your first question and your next path will appear here.')}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => handleTabChange('discover')} className="px-4 py-2.5 rounded-full bg-[#8E7AAE] text-white text-xs font-black active:scale-95 transition-all">
              {lastSession ? (language === 'ar' ? 'أكمل' : 'Continue') : (language === 'ar' ? 'ابدأ فكرة' : 'Start')}
            </button>
            {lastSession?.tool && lastSession.tool !== 'discover' && (
              <button onClick={() => handleTabChange(lastSession.tool)} className="px-4 py-2.5 rounded-full bg-white border border-[#8FA9C7]/20 text-[#465568] text-xs font-black active:scale-95 transition-all">
                {language === 'ar' ? 'افتح المسار' : 'Open path'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Living Idea Fabric Shadow — a soft dashboard signature without replacing the real feature */}
      <section className="tebyan-wow-section relative overflow-hidden rounded-[30px] border border-[#8E7AAE]/14 bg-[#FBFAF7]/86 p-5 md:p-7 shadow-[0_18px_60px_rgba(142,122,174,0.08)]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="absolute inset-0 pointer-events-none opacity-80">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(142,122,174,0.16),transparent_18%),radial-gradient(circle_at_72%_22%,rgba(143,169,199,0.18),transparent_20%),radial-gradient(circle_at_62%_76%,rgba(142,122,174,0.12),transparent_18%)]" />
          {[...Array(12)].map((_, i) => (
            <motion.span
              key={i}
              animate={{ y: [0, i % 2 ? 5 : -5, 0], opacity: [0.35, 0.75, 0.35] }}
              transition={{ duration: 5 + (i % 4), repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
              className="absolute h-1.5 w-1.5 rounded-full bg-[#8E7AAE]/50 shadow-[0_0_18px_rgba(142,122,174,0.35)]"
              style={{ right: `${10 + (i * 7) % 78}%`, top: `${18 + (i * 13) % 62}%` }}
            />
          ))}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 900 240" preserveAspectRatio="none" aria-hidden>
            <path d="M90 70 C 210 20, 280 170, 410 90 S 620 35, 765 145" fill="none" stroke="rgba(142,122,174,0.18)" strokeWidth="2" strokeDasharray="7 12" />
            <path d="M130 170 C 240 120, 340 205, 470 145 S 640 88, 815 55" fill="none" stroke="rgba(143,169,199,0.18)" strokeWidth="2" strokeDasharray="5 14" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] border border-[#8E7AAE]/16 bg-white/70 text-[#8E7AAE] shadow-sm">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-black tracking-[0.24em] uppercase text-[#8E7AAE]/75">{language === 'ar' ? 'ظل النسيج الحي' : 'Living fabric shadow'}</p>
              <h3 className="mt-1 text-xl md:text-2xl font-black text-[#182231]">{language === 'ar' ? 'أفكارك بدأت ترسم خريطة هادئة' : 'Your ideas are forming a quiet map'}</h3>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-relaxed text-[#7C8796]">
                {language === 'ar' ? 'هذا ظل بصري فقط؛ خريطة النسيج الكاملة محفوظة في شبكتك المعرفية ويمكن فتحها متى أردت.' : 'This is only a visual shadow; the full idea fabric remains in your knowledge network.'}
              </p>
            </div>
          </div>
          <button onClick={() => handleTabChange('knowledgegraph')} className="shrink-0 rounded-full border border-[#8E7AAE]/18 bg-white/80 px-5 py-3 text-xs font-black text-[#6E5F8E] shadow-sm transition-all hover:border-[#8E7AAE]/40 hover:bg-[#F4F1F8] active:scale-95">
            {language === 'ar' ? 'افتح النسيج الكامل' : 'Open full fabric'}
          </button>
        </div>
      </section>

      {/* Daily Mission */}
      <div className="bg-gradient-to-r from-[#EEF2F6] to-[#F7F3FB] rounded-[20px] md:rounded-[24px] p-4 md:p-6 text-[#182231] border border-[#8FA9C7]/18 relative overflow-hidden shadow-lg mb-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-1.5">
                      <Target className="w-4 h-4 text-[#8E7AAE]" />
                      <h3 className="font-bold text-[#64788D] tracking-widest uppercase text-[10px] md:text-xs">{language === 'ar' ? 'التحدي الميداني اليومي' : 'Daily Challenge'}</h3>
                  </div>
                  {missionLoading ? (
                      <div className="h-8 md:h-12 flex items-center text-[#8E7AAE] font-bold text-xs md:text-sm">{language === 'ar' ? 'نرتّب تحدي اليوم بهدوء…' : 'Preparing today’s challenge calmly…'}</div>
                  ) : (
                      <>
                        <h4 className="text-lg md:text-xl font-black mb-0.5">{mission?.title}</h4>
                        <p className="text-[#64788D]/90 leading-relaxed font-medium text-xs md:text-sm">{mission?.task}</p>
                      </>
                  )}
              </div>
              <div className="shrink-0 w-full md:w-auto">
                  <button 
                     onClick={handleCompleteMission}
                     disabled={missionLoading || missionCompleted}
                     className={cn(
                         "w-full md:w-auto px-6 md:px-5 py-3 md:py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-sm md:text-sm",
                         missionCompleted 
                            ? "bg-[#EEF7F1] text-[#2F7D55] cursor-default"
                            : "bg-white text-[#6E5F8E] hover:bg-[#F1EEF4] shadow-md active:scale-95"
                     )}
                  >
                      {missionCompleted ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Star className="w-4 h-4" />}
                      <span>{missionCompleted ? (language === 'ar' ? 'تم الإنجاز!' : 'Completed!') : (language === 'ar' ? `أنجزت المهمة (+${mission?.xp_reward || 0} XP)` : `Mission Accomplished (+${mission?.xp_reward || 0} XP)`)}</span>
                  </button>
              </div>
          </div>
      </div>

      {showFullDashboard && (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="tebyan-quiet-dashboard space-y-6">
      <div className="mb-6">
        <NeuralTree language={language} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* AR FEATURE (NEW & PROMINENT) */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => handleTabChange('ar')}
          className="tebyan-glass-card tebyan-tool-tile group relative h-[200px] md:h-[240px] bg-gradient-to-br from-[#F7F3FB] via-[#EEF2F6] to-[#FBFAF7] rounded-[24px] md:rounded-[40px] p-6 text-right overflow-hidden shadow-[0_20px_50px_rgba(142,122,174,0.12)] border border-[#8E7AAE]/18 active:scale-[0.98] transition-all"
        >
           <motion.div 
             animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.5, 1], rotate: [0, 90, 0] }} 
             transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
             className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4"
           />
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
           <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
             <div className="w-16 h-16 bg-white/80 backdrop-blur-xl text-[#6E5F8E] rounded-[20px] flex items-center justify-center shadow-2xl mb-4 group-hover:scale-110 group-hover:bg-[#F1EEF4] group-hover:text-[#6E5F8E] transition-all duration-500 border border-white/20">
               <Box className="w-8 h-8" />
             </div>
             <h3 className="text-xl md:text-2xl font-black text-[#182231] drop-shadow-sm">
               {language === 'ar' ? 'فضاء تبيان الممتد (AR)' : 'Tibyan Extended Space (AR)'}
             </h3>
             <p className="text-[#64788D] text-sm font-bold mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
               {language === 'ar' ? 'تجسيد الأفكار في عالمك الحقيقي' : 'Materialize concepts in your real world'}
             </p>
           </div>
        </motion.button>

        {/* قول فصل - THE DECISIVE WORD (Unique Featured) */}
        {tabs.filter(t => t.id === 'qawlfasl').map((tab) => (
          <motion.button
            key={tab.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => handleTabChange(tab.id)}
            className="tebyan-glass-card tebyan-tool-tile group relative h-[300px] md:h-[360px] md:row-span-2 bg-gradient-to-br from-[#F7F5F2] via-[#EEF2F6] to-[#F1EEF4] rounded-[24px] md:rounded-[40px] p-6 md:p-8 text-right overflow-hidden shadow-[0_25px_60px_rgba(24,34,49,0.08)] border border-[#8FA9C7]/18 active:scale-[0.98] transition-all"
          >
             <motion.div 
               animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }} 
               transition={{ duration: 5, repeat: Infinity }}
               className="absolute top-0 right-0 w-64 h-64 md:w-80 md:h-80 bg-amber-200/20 rounded-full blur-[80px] md:blur-[100px] -translate-x-1/4 -translate-y-1/4"
             />
             <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                   <div className="bg-white text-[#6E5F8E] w-12 h-12 md:w-16 md:h-16 rounded-[16px] md:rounded-[22px] flex items-center justify-center shadow-xl mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-500">
                      <tab.icon className="w-7 h-7 md:w-11 md:h-11 animate-pulse" />
                   </div>
                   <span className="bg-[#F6F0E3] text-[#7A6B42] text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full mb-2 md:mb-3 inline-block shadow-lg">
                      {language === 'ar' ? 'البوصلة النوعية' : 'THE CORE EDGE'}
                   </span>
                   <h3 className="text-xl md:text-3xl lg:text-4xl font-black text-[#182231] leading-[1.1] mb-2 md:mb-4">
                      {tab.label}
                   </h3>
                   <p className="text-[#64788D] text-sm md:text-base font-medium max-w-[220px] leading-relaxed">
                      {language === 'ar' ? 'الميزة الجوهرية في كل مشروع' : 'The essential difference in every project'}
                   </p>
                </div>
                <div className="flex items-center gap-2 md:gap-3 text-[#6E5F8E] font-black text-sm md:text-lg">
                   <ArrowLeft className={cn("w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-2 md:group-hover:-translate-x-3 transition-transform", language === 'ar' ? '' : 'rotate-180 group-hover:translate-x-2 md:group-hover:translate-x-3')} />
                   <span>{language === 'ar' ? 'اكتشف العمق' : 'Discover Depth'}</span>
                </div>
             </div>
          </motion.button>
        ))}

        {/* HUB 1: Intelligence Hub (Oracle + Analytics) */}
        <HubCard 
          title={language === 'ar' ? 'منصة الذكاء الكلي' : 'Omni Intelligence Hub'}
          description={language === 'ar' ? 'الاستشارة الشاملة والتحليل الاستباقي' : 'Total guidance and predictive analysis'}
          icon={BrainCircuit}
          items={[
            { id: 'oracle', label: language === 'ar' ? 'المستشار الكلي' : 'Omni Counselor', icon: Command },
            { id: 'analytics', label: language === 'ar' ? 'الرادار الاستباقي' : 'Predictive Radar', icon: BarChart3 },
            { id: 'decisionroom', label: language === 'ar' ? 'غرفة القرار السرية' : 'Secret Decision Room', icon: Lock }
          ]}
          handleTabChange={handleTabChange}
          language={language}
          color="bg-white"
        />

        <HubCard 
          title={language === 'ar' ? 'الولاء والمكافآت' : 'Loyalty & Rewards'}
          description={language === 'ar' ? 'إدارة العملاء والولاء بالدينار الكويتي' : 'Customer & loyalty management (KWD)'}
          icon={Gift}
          items={[
            { id: 'loyalty', label: language === 'ar' ? 'الولاء والكوبونات' : 'Loyalty & Coupons', icon: TicketPercent, hidden: tabs.find(t => t.id === 'loyalty')?.hidden }
          ]}
          handleTabChange={handleTabChange}
          language={language}
          color="bg-zinc-900"
          inverted
        />

        {/* HUB 2: Innovation Lab (Concepts + Lab + Mindmap) */}
        <HubCard 
          title={language === 'ar' ? 'مختبر هندسة الابتكار' : 'Innovation Engineering Lab'}
          description={language === 'ar' ? 'هيكلة الأفكار والربط العبقري' : 'Idea structuring and genius connections'}
          icon={Zap}
          items={[
            { id: 'concepts', label: language === 'ar' ? 'هندسة الأفكار' : 'Idea Engineering', icon: Sparkles },
            { id: 'lab', label: language === 'ar' ? 'المختبر الإبداعي' : 'Creative Lab', icon: Zap },
            { id: 'mindmap', label: language === 'ar' ? 'العقل المدبر' : 'Mastermind', icon: Network }
          ]}
          handleTabChange={handleTabChange}
          language={language}
          color="bg-white"
        />

        {/* HUB 3: Execution Hub (Roadmap + Simulation) */}
        <HubCard 
          title={language === 'ar' ? 'مسار التنفيذ والمحاكاة' : 'Execution & Strategy Path'}
          description={language === 'ar' ? 'من الرؤية إلى الميدان' : 'From vision to the field'}
          icon={Route}
          items={[
            { id: 'roadmap', label: language === 'ar' ? 'طريق النجاح' : 'Success Roadmap', icon: Route },
            { id: 'simulation', label: language === 'ar' ? 'المحاكي الميداني' : 'Simulator', icon: Gamepad2 }
          ]}
          handleTabChange={handleTabChange}
          language={language}
          color="bg-white"
        />

        {/* HUB 4: Knowledge Horizon (TimeMachine + Council + Story + Library) */}
        <HubCard 
          title={language === 'ar' ? 'أفق المعرفة والمكتبة' : 'Knowledge & Library Horizon'}
          description={language === 'ar' ? 'الحكمة التاريخية والمصادر المختارة' : 'Historical wisdom and selected resources'}
          icon={LibraryBig}
          items={[
            { id: 'timemachine', label: language === 'ar' ? 'آلة الزمن' : 'Time Machine', icon: Hourglass },
            { id: 'council', label: language === 'ar' ? 'طاولة الخبراء' : 'Expert Table', icon: BrainCircuit },
            { id: 'story', label: language === 'ar' ? 'الراوي' : 'Story Weaver', icon: LibraryBig }
          ]}
          handleTabChange={handleTabChange}
          language={language}
          color="bg-white"
        />

        {/* HUB 5: Academy (Quizzes) - Scalable for more later */}
        <HubCard 
          title={language === 'ar' ? 'أكاديمية التقييم' : 'Assessment Academy'}
          description={language === 'ar' ? 'قياس أثر التطور المعرفي' : 'Measuring cognitive growth impact'}
          icon={ClipboardCheck}
          items={[
            { id: 'quizzes', label: language === 'ar' ? 'الاختبارات الذكية' : 'Smart Quizzes', icon: ClipboardCheck }
          ]}
          handleTabChange={handleTabChange}
          language={language}
          color="bg-white"
        />

        {/* HUB 6: Support & Contact */}
        <HubCard 
          title={language === 'ar' ? 'الدعم الفني و التواصل' : 'Support & Contact'}
          description={language === 'ar' ? 'نحن هنا لخدمتك والاستماع لمقترحاتك' : 'We are here to serve you and listen to your feedback'}
          icon={Bookmark}
          items={[
            { id: 'contact', label: language === 'ar' ? 'تواصل معنا' : 'Contact Us', icon: Bookmark }
          ]}
          handleTabChange={handleTabChange}
          language={language}
          color="bg-white"
        />
      </div>
      </motion.div>
      )}
    </div>
  );
};
