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
        "group rounded-[24px] md:rounded-[32px] p-4 md:p-6 border transition-all flex flex-col justify-between relative overflow-hidden",
        inverted ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-black hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]"
      )}
      style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
    >
      <div className="relative z-10 w-full">
        <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-5">
           <div className={cn(
             "w-10 h-10 md:w-12 md:h-12 rounded-[14px] md:rounded-[18px] flex items-center justify-center transition-all shadow-sm shrink-0 border",
             inverted ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-100 text-zinc-900 group-hover:bg-black group-hover:text-white"
           )}>
             <Icon className="w-5 h-5 md:w-6 md:h-6" />
           </div>
           <div>
             <h3 className={cn(
               "text-base md:text-xl font-black leading-tight tracking-tighter",
               inverted ? "text-white" : "text-black"
             )}>{title}</h3>
             <p className={cn(
               "text-[10px] md:text-xs font-medium mt-0.5 leading-relaxed",
               inverted ? "text-zinc-500" : "text-zinc-400"
             )}>{description}</p>
           </div>
        </div>
        
        <div className={cn("grid gap-2 w-full", visibleItems.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={(e) => { e.stopPropagation(); handleTabChange(item.id); }}
              className={cn(
                "flex items-center gap-2 p-3 md:p-3 rounded-xl border transition-all group/item text-right active:scale-95 cursor-pointer",
                inverted 
                  ? "bg-zinc-800/50 border-zinc-700/50 hover:border-white hover:bg-zinc-800 text-white" 
                  : "bg-zinc-50/50 border-zinc-100/50 hover:border-black hover:bg-white text-zinc-800"
              )}
            >
              <div className={cn(
                "w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center shadow-sm transition-all shrink-0 border",
                inverted 
                  ? "bg-zinc-700/50 border-zinc-600/50 group-hover/item:border-white group-hover/item:bg-zinc-700" 
                  : "bg-zinc-100/50 border-zinc-200/50 group-hover/item:border-black group-hover/item:bg-white"
              )}>
                <item.icon className={cn(
                  "w-3.5 h-3.5 md:w-5 md:h-5",
                  inverted 
                    ? (item.id === 'mindmap' ? "text-indigo-300 group-hover/item:text-white" : "text-zinc-400 group-hover/item:text-white") 
                    : (item.id === 'mindmap' ? "text-indigo-500 group-hover/item:text-indigo-600" : "text-zinc-600 group-hover/item:text-black")
                )} />
              </div>
              <span className={cn(
                "text-xs md:text-[13px] font-black tracking-tight truncate", 
                inverted ? "text-white" : "text-zinc-900", 
                item.id === 'mindmap' && (inverted ? "text-indigo-200" : "text-indigo-600")
              )}>{item.label}</span>
            </button>
          ))}
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

  return (
    <div className="w-full flex flex-col pt-4 pb-16 md:pt-6 px-4 md:px-6 max-w-6xl mx-auto space-y-5">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-200/60 pb-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div>
          <div className="flex items-center gap-2 mb-2 justify-start">
            <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
            <span className="text-zinc-500 font-bold text-[10px] tracking-widest uppercase">{language === 'ar' ? 'الواجهة الرئيسية' : 'Main Dashboard'}</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-black leading-[1.05] tracking-tight">
            {language === 'ar' ? 'نظامك الشامل' : 'Your Complete System'}
          </h1>
          <p className="text-sm md:text-base text-zinc-500 font-medium leading-relaxed max-w-sm mt-1">
            {language === 'ar' ? 'أدوات ذكية لتعزيز إدراكك وتحليل المواقف بعمق.' : 'Smart tools to enhance your perception and analyze situations.'}
          </p>
        </div>
      </header>

      {/* Daily Mission */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[20px] md:rounded-[24px] p-4 md:p-6 text-white relative overflow-hidden shadow-lg mb-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-1.5">
                      <Target className="w-4 h-4 text-blue-200" />
                      <h3 className="font-bold text-blue-100 tracking-widest uppercase text-[10px] md:text-xs">{language === 'ar' ? 'التحدي الميداني اليومي' : 'Daily Challenge'}</h3>
                  </div>
                  {missionLoading ? (
                      <div className="h-8 md:h-12 flex items-center text-blue-200 font-bold text-xs md:text-sm">{language === 'ar' ? 'جاري استلام المهمة من الذكاء الاصطناعي...' : 'Receiving mission from AI...'}</div>
                  ) : (
                      <>
                        <h4 className="text-lg md:text-xl font-black mb-0.5">{mission?.title}</h4>
                        <p className="text-blue-100/90 leading-relaxed font-medium text-xs md:text-sm">{mission?.task}</p>
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
                            ? "bg-white/10 text-white cursor-default"
                            : "bg-white text-blue-600 hover:bg-blue-50 shadow-md active:scale-95"
                     )}
                  >
                      {missionCompleted ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Star className="w-4 h-4" />}
                      <span>{missionCompleted ? (language === 'ar' ? 'تم الإنجاز!' : 'Completed!') : (language === 'ar' ? `أنجزت المهمة (+${mission?.xp_reward || 0} XP)` : `Mission Accomplished (+${mission?.xp_reward || 0} XP)`)}</span>
                  </button>
              </div>
          </div>
      </div>

      <div className="mb-6">
        <NeuralTree language={language} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* AR FEATURE (NEW & PROMINENT) */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => handleTabChange('ar')}
          className="group relative h-[200px] md:h-[240px] bg-gradient-to-br from-indigo-950 via-purple-900 to-black rounded-[24px] md:rounded-[40px] p-6 text-right overflow-hidden shadow-[0_20px_50px_rgba(79,70,229,0.4)] border border-indigo-400/30 active:scale-[0.98] transition-all"
        >
           <motion.div 
             animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.5, 1], rotate: [0, 90, 0] }} 
             transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
             className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4"
           />
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
           <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
             <div className="w-16 h-16 bg-white/10 backdrop-blur-xl text-white rounded-[20px] flex items-center justify-center shadow-2xl mb-4 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500 border border-white/20">
               <Box className="w-8 h-8" />
             </div>
             <h3 className="text-xl md:text-2xl font-black text-white drop-shadow-lg">
               {language === 'ar' ? 'فضاء تبيان الممتد (AR)' : 'Tibyan Extended Space (AR)'}
             </h3>
             <p className="text-indigo-200 text-sm font-bold mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
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
            className="group relative h-[300px] md:h-[360px] md:row-span-2 bg-gradient-to-br from-emerald-600 via-teal-700 to-indigo-900 rounded-[24px] md:rounded-[40px] p-6 md:p-8 text-right overflow-hidden shadow-[0_25px_60px_rgba(16,185,129,0.3)] border border-emerald-400/30 active:scale-[0.98] transition-all"
          >
             <motion.div 
               animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }} 
               transition={{ duration: 5, repeat: Infinity }}
               className="absolute top-0 right-0 w-64 h-64 md:w-80 md:h-80 bg-amber-200/20 rounded-full blur-[80px] md:blur-[100px] -translate-x-1/4 -translate-y-1/4"
             />
             <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                   <div className="bg-white text-emerald-700 w-12 h-12 md:w-16 md:h-16 rounded-[16px] md:rounded-[22px] flex items-center justify-center shadow-xl mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-500">
                      <tab.icon className="w-7 h-7 md:w-11 md:h-11 animate-pulse" />
                   </div>
                   <span className="bg-amber-400 text-black text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full mb-2 md:mb-3 inline-block shadow-lg">
                      {language === 'ar' ? 'البوصلة النوعية' : 'THE CORE EDGE'}
                   </span>
                   <h3 className="text-xl md:text-3xl lg:text-4xl font-black text-white leading-[1.1] mb-2 md:mb-4 drop-shadow-sm">
                      {tab.label}
                   </h3>
                   <p className="text-emerald-50/70 text-sm md:text-base font-medium max-w-[220px] leading-relaxed">
                      {language === 'ar' ? 'الميزة الجوهرية في كل مشروع تعليمي' : 'The essential difference in every project'}
                   </p>
                </div>
                <div className="flex items-center gap-2 md:gap-3 text-white font-black text-sm md:text-lg">
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
            { id: 'story', label: language === 'ar' ? 'الراوي' : 'Story Weaver', icon: LibraryBig },
            { id: 'mylibrary', label: language === 'ar' ? 'المكتبة المفضلة' : 'My Library', icon: Bookmark }
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
    </div>
  );
};
