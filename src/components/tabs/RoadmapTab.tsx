import React, { useState } from 'react';
import { DemoStarters } from '../../components/ui/DemoStarters';
import { motion, AnimatePresence } from 'motion/react';
import { Map, Flag, CheckCircle, Clock, ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react';
import { generateRoadmap } from '../../services/gemini';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../AuthProvider';
import { getGenderWord } from '../../utils/genderHelper';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';
import { ToolEmptyHint } from '../common/ToolEmptyHint';
import { TebyanButtonLoader } from '../ui/TebyanLoader';

export const RoadmapTab = ({ language, initialValue, onValueUsed, handleTabChange, inDoor }: { language: 'ar' | 'en', initialValue?: string, onValueUsed?: () => void, handleTabChange: any, inDoor?: boolean }) => {
  const { preferences, addToLibrary, removeFromLibrary } = useUser();
  const { userGender } = useAuth();
  const [goal, setGoal] = useState('');
  const [roadmap, setRoadmap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (currentGoal?: string) => {
    const targetGoal = currentGoal || goal;
    if (!targetGoal.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateRoadmap(targetGoal, language);
      setRoadmap(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (initialValue && !roadmap && !isLoading) {
      setGoal(initialValue);
      handleGenerate(initialValue);
      if (onValueUsed) onValueUsed();
    }
  }, [initialValue, roadmap, isLoading, onValueUsed]);

  React.useEffect(() => {
    if (!isLoading && roadmap) {
       setTimeout(() => {
           document.getElementById('roadmap-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
       }, 100);
    }
  }, [isLoading, roadmap]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 px-4 sm:px-6 pb-20 relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <TabHeader 
        icon={Map}
        title={{ ar: 'طريق النجاح', en: 'Success Roadmap' }}
        description={{ 
            ar: getGenderWord(userGender, 'رؤية واضحة لمسارك الشخصي نحو كل هدف تطمح إليه.', 'رؤية واضحة لمساركِ الشخصي نحو كل هدف تطمحين إليه.', 'رؤية واضحة لمسارك الشخصي نحو كل هدف تطمح إليه.'), 
            en: 'A clear vision of your personal path towards every goal you aspire to.' 
        }}
        language={language}
        hideTitleVisually={inDoor}
        onBack={() => handleTabChange('discover', '')}
        onClose={() => handleTabChange('discover', '', true)}
      />
      
      <div className="relative overflow-hidden bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-[#6e5f8e]/10">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#6e5f8e]/[0.06] rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#8fa9c7]/[0.08] rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col gap-6">
          <label htmlFor="roadmap-goal" className={cn("block text-sm font-bold text-ink-mute", language === 'ar' ? 'text-right' : 'text-left')}>
            {language === 'ar' ? 'حدد وجهتك القادمة' : 'Define your next destination'}
          </label>
<DemoStarters tab="roadmap" language={language} onPick={setGoal} className="mb-3" />
          <div className="relative">
            <input 
              id="roadmap-goal"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              disabled={isLoading}
              placeholder={language === 'ar' ? 'مثال: تعلم لغة جديدة، بدء مشروع تجاري، احتراف البرمجة...' : 'Example: Learn a new language, start a business, master programming...'}
              className={cn(
                "w-full bg-white/70 border border-[#6e5f8e]/20 rounded-[24px] p-5 md:p-6 text-base md:text-xl font-medium text-ellipsis placeholder:text-ellipsis outline-none focus:border-[#6e5f8e]/50 focus:ring-4 focus:ring-[#6e5f8e]/10 transition-all text-navy",
                language === 'ar' ? 'text-right' : 'text-left'
              )}
            />
          </div>
          <button 
            onClick={() => handleGenerate()}
            disabled={isLoading || !goal.trim()}
            className="w-full py-5 bg-lilac text-white hover:bg-lilac-deep rounded-[24px] font-bold text-lg md:text-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-sm hover:shadow-md active:scale-[0.98] group"
          >
            {isLoading ? (
              <TebyanButtonLoader className="text-current" />
            ) : (
              <ArrowRight className={cn("w-6 h-6 group-hover:translate-x-1 transition-transform", language === 'ar' ? 'rotate-180' : '')} />
            )}
            {language === 'ar' ? 'رسم مسار الإنجاز' : 'Map Your Path'}
          </button>
          
        </div>
        {error && (
          <motion.div role="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-center font-bold border border-rose-100">
            {error}
          </motion.div>
        )}
      </div>

      <div id="roadmap-results">
      {!isLoading && !roadmap && (
        <ToolEmptyHint icon={Map} className="py-3 md:py-4" text={language === 'ar' ? getGenderWord(userGender, 'اكتب هدفك، وسنرسم لك طريقه خطوة بعد خطوة.', 'اكتبي هدفكِ، وسنرسم لكِ طريقه خطوة بعد خطوة.', 'اكتب هدفك، وسنرسم لك طريقه خطوة بعد خطوة.') : 'Write your goal and we will draw the path, step by step.'} />
      )}
      <AnimatePresence mode="wait">
        {roadmap && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            {/* Clean Header */}
            <div className="bg-white border text-navy border-lilac-soft/25 p-6 md:p-8 rounded-3xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-lilac-mist rounded-bl-[100px] -z-10"></div>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-lilac-mist text-lilac rounded-full text-sm font-bold mb-4">
                    <Flag className="w-3 h-3" />
                    {language === 'ar' ? 'خطة الطريق المعتمدة' : 'Verified Roadmap'}
                  </div>
                  <h3 className={cn("font-serif text-2xl md:text-3xl font-bold mb-4 leading-snug", language === 'ar' ? 'text-right' : 'text-left')}>
                    {roadmap.title}
                  </h3>
                  <div className="flex items-center gap-2 text-ink-mute font-bold text-sm">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    <span>{roadmap.estimated_duration}</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    const isSaved = preferences.savedLibrary.some((s: any) => s.type === 'roadmap' && s.title === roadmap.title);
                    if (isSaved) {
                      const itemToRemove = preferences.savedLibrary.find((s: any) => s.type === 'roadmap' && s.title === roadmap.title);
                      if (itemToRemove) removeFromLibrary(itemToRemove);
                    } else {
                      addToLibrary({
                        id: `roadmap-${Date.now()}`,
                        type: 'roadmap',
                        goal,
                        ...roadmap,
                        timestamp: new Date().toISOString()
                      }, 'roadmap');
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all border shrink-0",
                    preferences.savedLibrary.some((s: any) => s.type === 'roadmap' && s.title === roadmap.title)
                      ? "bg-lilac text-white border-lilac"
                      : "bg-white text-ink-soft border-lilac-soft/30 hover:bg-lilac-mist/50"
                  )}
                >
                  {preferences.savedLibrary.some((s: any) => s.type === 'roadmap' && s.title === roadmap.title) ? (
                    <>
                      <BookmarkCheck className="w-4 h-4" />
                      <span>{language === 'ar' ? 'محفوظة في المكتبة' : 'Saved'}</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span>{language === 'ar' ? 'حفظ الخطة' : 'Save Plan'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Clean Timeline */}
            <div className="relative">
              {/* Connector line */}
              <div aria-hidden="true" className="tbn-roadmap-line absolute top-8 bottom-8 w-0.5 bg-lilac-soft/40 hidden md:block rtl:right-[2.5rem] ltr:left-[2.5rem]"></div>

              <div className="space-y-6">
                {roadmap.milestones?.map((milestone: any, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.05 }}
                    key={i} 
                    className="relative"
                  >
                    <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
                      {/* Timeline Node */}
                      <div className="relative z-10 hidden md:flex flex-col items-center shrink-0 w-20">
                        <div className={cn(
                          "w-10 h-10 rounded-full border-2 bg-white flex flex-col items-center justify-center font-bold text-base",
                          i === 0 ? "border-lilac text-lilac shadow-sm" :
                          i === (roadmap.milestones.length - 1) ? "border-emerald-500 text-emerald-600" :
                          "border-lilac-soft/60 text-lilac"
                        )}>
                          {i + 1}
                        </div>
                      </div>

                      {/* Content Card */}
                      <div className="flex-1 bg-white border border-lilac-soft/25 p-6 rounded-[24px] shadow-sm hover:shadow-md transition-all">
                        <div aria-hidden="true" className="md:hidden hidden"></div><div className="md:hidden inline-flex items-center justify-center w-8 h-8 rounded-full bg-lilac-mist text-lilac font-bold text-sm mb-4">
                          {i + 1}
                        </div>
                        
                        <h4 className={cn("font-serif text-lg md:text-xl font-bold text-navy mb-2 leading-snug", language === 'ar' ? 'text-right' : 'text-left')}>
                          {milestone.title?.replace(/\*\*/g, '')}
                        </h4>
                        
                        <p className={cn("text-ink-soft text-base leading-relaxed mb-5", language === 'ar' ? 'text-right' : 'text-left')}>
                          {milestone.description?.replace(/\*\*/g, '')}
                        </p>
                        
                        {milestone.tasks && milestone.tasks.length > 0 && (
                          <div className="bg-ivory rounded-2xl p-4 border border-lilac-soft/15">
                            <h5 className={cn("text-sm font-bold text-lilac mb-3", language === 'ar' ? 'text-right' : 'text-left')}>
                              {language === 'ar' ? 'المهام الأساسية' : 'Key Tasks'}
                            </h5>
                            <ul className="space-y-2.5">
                              {milestone.tasks.map((task: string, j: number) => (
                                <li key={j} className="flex items-start gap-3">
                                  <div className="mt-[6px] w-[5px] h-[5px] rounded-full bg-[#8E7AAE] shrink-0" />
                                  <span className={cn("text-base font-medium text-[#273548] leading-snug", language === 'ar' ? 'text-right' : 'text-left')}>{task?.replace(/\*\*/g, '')}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Ending message */}
            <div className="flex justify-center pt-2">
              <div className="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-sm flex items-center gap-2 border border-emerald-100 shadow-sm">
                <CheckCircle className="w-5 h-5" />
                {language === 'ar' ? 'اكتمل المسار بنجاح' : 'Path successfully mapped'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>

  );
};

