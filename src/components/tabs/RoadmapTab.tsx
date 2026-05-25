import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, Flag, CheckCircle, Loader2, ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react';
import { generateRoadmap } from '../../services/gemini';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../AuthProvider';
import { getGenderWord } from '../../utils/genderHelper';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';

export const RoadmapTab = ({ language, initialValue, onValueUsed, handleTabChange }: { language: 'ar' | 'en', initialValue?: string, onValueUsed?: () => void, handleTabChange: any }) => {
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 max-h-[90vh] overflow-y-auto px-4 sm:px-6 pb-20 custom-scrollbar relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <TabHeader 
        icon={Map}
        title={{ ar: 'طريق النجاح', en: 'Success Roadmap' }}
        description={{ 
            ar: getGenderWord(userGender, 'رؤية واضحة لمسارك الشخصي نحو كل هدف تطمح إليه.', 'رؤية واضحة لمساركِ الشخصي نحو كل هدف تطمحين إليه.', 'رؤية واضحة لمسارك الشخصي نحو كل هدف تطمح إليه.'), 
            en: 'A clear vision of your personal path towards every goal you aspire to.' 
        }}
        language={language}
        onBack={() => handleTabChange('discover', '')}
        onClose={() => handleTabChange('discover', '', true)}
      />
      
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-rose-50 p-8 rounded-[40px] shadow-2xl border border-white/50 backdrop-blur-sm">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative flex flex-col gap-6">
          <label className={cn("block text-sm font-black text-zinc-500 uppercase tracking-widest", language === 'ar' ? 'text-right' : 'text-left')}>
            {language === 'ar' ? 'حدد وجهتك القادمة' : 'Define your next destination'}
          </label>
          <div className="relative">
            <input 
              value={goal}
              onChange={e => setGoal(e.target.value)}
              disabled={isLoading}
              placeholder={language === 'ar' ? 'مثال: تعلم لغة جديدة، بدء مشروع تجاري، احتراف البرمجة...' : 'Example: Learn a new language, start a business, master programming...'}
              className={cn(
                "w-full bg-white/70 border-2 border-zinc-200 rounded-[32px] p-6 text-xl font-bold outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all text-zinc-900 shadow-sm",
                language === 'ar' ? 'text-right' : 'text-left'
              )}
            />
          </div>
          <button 
            onClick={() => handleGenerate()}
            disabled={isLoading || !goal.trim()}
            className="w-full py-6 bg-zinc-950 text-white hover:bg-zinc-800 rounded-[32px] font-black text-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl active:scale-[0.98] group"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <ArrowRight className={cn("w-6 h-6 group-hover:translate-x-1 transition-transform", language === 'ar' ? 'rotate-180' : '')} />
            )}
            {language === 'ar' ? 'رسم مسار الإنجاز' : 'Map Your Path'}
          </button>
          
        </div>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-center font-bold border border-rose-100">
            {error}
          </motion.div>
        )}
      </div>

      <div id="roadmap-results">
      <AnimatePresence mode="wait">
        {roadmap && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            {/* Clean Header */}
            <div className="bg-white border text-zinc-900 border-zinc-200 p-8 rounded-3xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -z-10"></div>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold mb-4">
                    <Flag className="w-3 h-3" />
                    {language === 'ar' ? 'خطة الطريق المعتمدة' : 'Verified Roadmap'}
                  </div>
                  <h3 className={cn("text-xl md:text-2xl font-black mb-4 leading-snug", language === 'ar' ? 'text-right' : 'text-left')}>
                    {roadmap.title}
                  </h3>
                  <div className="flex items-center gap-2 text-zinc-500 font-bold text-sm">
                    <Loader2 className="w-4 h-4" />
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
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300"
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
              <div className="absolute top-8 bottom-8 w-px bg-zinc-200 hidden md:block rtl:right-[2.5rem] ltr:left-[2.5rem]"></div>

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
                          "w-10 h-10 rounded-full border-2 bg-white flex flex-col items-center justify-center font-black text-sm",
                          i === 0 ? "border-indigo-500 text-indigo-600 shadow-sm" :
                          i === (roadmap.milestones.length - 1) ? "border-emerald-500 text-emerald-600" :
                          "border-zinc-300 text-zinc-500"
                        )}>
                          {i + 1}
                        </div>
                      </div>

                      {/* Content Card */}
                      <div className="flex-1 bg-white border border-zinc-200 p-6 rounded-[24px] shadow-sm hover:shadow-md transition-all">
                        <div className="md:hidden inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 font-black text-xs mb-4">
                          {i + 1}
                        </div>
                        
                        <h4 className={cn("text-base md:text-lg font-black text-zinc-900 mb-2 leading-tight", language === 'ar' ? 'text-right' : 'text-left')}>
                          {milestone.title?.replace(/\*\*/g, '')}
                        </h4>
                        
                        <p className={cn("text-zinc-500 text-sm leading-relaxed mb-5", language === 'ar' ? 'text-right' : 'text-left')}>
                          {milestone.description?.replace(/\*\*/g, '')}
                        </p>
                        
                        {milestone.tasks && milestone.tasks.length > 0 && (
                          <div className="bg-zinc-50/80 rounded-2xl p-4 border border-zinc-100">
                            <h5 className={cn("text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3", language === 'ar' ? 'text-right' : 'text-left')}>
                              {language === 'ar' ? 'المهام الأساسية' : 'Key Tasks'}
                            </h5>
                            <ul className="space-y-2.5">
                              {milestone.tasks.map((task: string, j: number) => (
                                <li key={j} className="flex items-start gap-3">
                                  <div className="mt-[6px] w-[5px] h-[5px] rounded-full bg-indigo-400 opacity-60 shrink-0" />
                                  <span className={cn("text-sm font-medium text-zinc-700 leading-snug", language === 'ar' ? 'text-right' : 'text-left')}>{task?.replace(/\*\*/g, '')}</span>
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

