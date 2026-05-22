import React, { useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { BrainCircuit, Hourglass, Gamepad2, Move, Activity, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CouncilTab } from './CouncilTab';
import { TimeMachineTab } from './TimeMachineTab';
import { SimulationTab } from './SimulationTab';

const PhysicsCard = ({ children, className, icon: Icon = Move }: { children: React.ReactNode, className?: string, icon?: React.ComponentType<{ className?: string }> }) => {
  return (
    <motion.div
      drag
      dragConstraints={{ left: -300, right: 300, top: -200, bottom: 200 }}
      whileDrag={{ scale: 1.05, zIndex: 50, cursor: 'grabbing' }}
      whileHover={{ y: -5 }}
      className={cn(
        "absolute cursor-grab bg-white p-6 rounded-3xl border-2 border-[#8FA9C7]/25 shadow-xl w-64 select-none",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4 text-[#7C8796]">
        <Icon className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">Interactive Component</span>
      </div>
      {children}
    </motion.div>
  );
};

const EmotionalLandscape = ({ language }: { language: 'ar' | 'en' }) => {
  const emotions = [
    { label: language === 'ar' ? 'القلق' : 'Anxiety', value: 30, color: 'text-amber-500' },
    { label: language === 'ar' ? 'الثقة' : 'Confidence', value: 85, color: 'text-[#6E948A]' },
    { label: language === 'ar' ? 'الابتكار' : 'Innovation', value: 60, color: 'text-mood-primary' },
    { label: language === 'ar' ? 'المخاطرة' : 'Risk', value: 45, color: 'text-rose-500' }
  ];

  return (
    <div className="w-full bg-[#F1EEF4] p-8 rounded-[40px] border border-zinc-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-mood-primary/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-2 mb-10">
          <Activity className="w-5 h-5 text-mood-primary" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">
            {language === 'ar' ? 'الموجات العاطفية للقرار' : 'DECISION EMOTIONAL LANDSCAPE'}
          </h3>
        </div>
        <div className="flex flex-col gap-6">
          {emotions.map((e, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                 <span className="text-[#7C8796] uppercase tracking-widest">{e.label}</span>
                 <span className={cn(e.color)}>{e.value}%</span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${e.value}%` }}
                   transition={{ duration: 1.5, delay: idx * 0.2 }}
                   className={cn("h-full bg-current", e.color)}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-[10px] text-[#465568] font-bold uppercase tracking-widest text-center">
            {language === 'ar' ? 'تحليل المشاعر الإدراكي' : 'COGNITIVE EMOTION ANALYSIS'}
        </p>
    </div>
  );
};

export default React.memo(({ language, handleTabChange, initialValue, onValueUsed }: any) => {
  const [activeSubTab, setActiveSubTab] = useState<'council' | 'timemachine' | 'simulation' | 'spatial'>('council');
  const [showArenaPicker, setShowArenaPicker] = useState(true);

  const tabs = [
    { id: 'council', label: language === 'ar' ? 'طاولة الخبراء' : 'Expert Table', icon: BrainCircuit },
    { id: 'timemachine', label: language === 'ar' ? 'آلة الزمن' : 'Time Machine', icon: Hourglass },
    { id: 'simulation', label: language === 'ar' ? 'المحاكي الميداني' : 'Simulator', icon: Gamepad2 },
    { id: 'spatial', label: language === 'ar' ? 'الميدان الفراغي' : 'Spatial Field', icon: Move }
  ];

  const activeArenaTab = tabs.find(tab => tab.id === activeSubTab) || tabs[0];

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      <div className="bg-[#FAF9F6]/88 border border-[#8FA9C7]/15 rounded-[32px] p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="text-right">
            <h2 className="text-lg md:text-xl font-black text-[#182231]">{language === 'ar' ? 'ماذا تريد أن ترى في الميدان؟' : 'What do you want to explore in the arena?'}</h2>
            <p className="text-xs md:text-sm text-[#64788D] font-bold mt-1 leading-relaxed">{language === 'ar' ? 'أربع بوابات مرتبة بوضوح، كل واحدة تقودك لعمق مختلف بدون إخفاء أي ميزة.' : 'Four clear gates, each leading to a different depth without hiding any feature.'}</p>
          </div>
        </div>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowArenaPicker(v => !v)}
          className="w-full flex items-center justify-between gap-3 rounded-[20px] border border-[#8FA9C7]/18 bg-white/88 px-4 py-3 text-right shadow-sm active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3 font-black text-[#182231]">
            {React.createElement(activeArenaTab.icon, { className: 'w-5 h-5 text-[#8E7AAE]' })}
            <span>{activeArenaTab.label}</span>
          </div>
          <ChevronDown className={cn("w-5 h-5 text-[#8E7AAE] transition-transform", showArenaPicker && "rotate-180")} />
        </button>
        {showArenaPicker && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveSubTab(tab.id as any); setShowArenaPicker(false); }}
                  className={cn(
                    "flex items-center justify-between gap-3 px-3 md:px-5 py-3.5 md:py-4 rounded-[18px] md:rounded-[22px] font-bold text-[11px] md:text-sm transition-all text-right border min-h-[82px] md:min-h-[88px]",
                    isActive ? "bg-mood-primary text-white shadow-lg shadow-mood-glow border-mood-primary" : "bg-[#F7F5F2] text-[#465568] hover:bg-[#FAF9F6]/88 border-[#8FA9C7]/15 hover:border-zinc-300"
                  )}
                >
                  <span className={cn("w-10 h-10 md:w-11 md:h-11 rounded-[14px] flex items-center justify-center shrink-0 border transition-all", isActive ? "bg-white/14 border-white/16" : "bg-white border-[#8FA9C7]/18 text-[#6E5F8E]")}>
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </span>
                  <span className="leading-tight line-clamp-2 flex-1">{tab.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
      </div>

      <div className="flex-1 w-full">
         <AnimatePresence mode="wait">
            <motion.div
              key={activeSubTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar"
            >
               {activeSubTab === 'council' && <CouncilTab language={language} handleTabChange={handleTabChange} initialValue={initialValue} onValueUsed={onValueUsed} />}
               {activeSubTab === 'timemachine' && <TimeMachineTab language={language} handleTabChange={handleTabChange} initialValue={initialValue} onValueUsed={onValueUsed} />}
               {activeSubTab === 'simulation' && <SimulationTab language={language} handleTabChange={handleTabChange} initialValue={initialValue} onValueUsed={onValueUsed} />}
               {activeSubTab === 'spatial' && (
                 <div className="relative w-full h-[600px] bg-[#F7F5F2] rounded-[48px] border border-[#8FA9C7]/25 overflow-hidden p-12">
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[length:40px_40px]" />
                     
                     <button 
                        onClick={() => setActiveSubTab('council')}
                        className="absolute top-6 left-6 px-4 py-2 bg-white text-[#64788D] font-bold text-xs rounded-full border border-[#8FA9C7]/25 hover:border-[#8E7AAE] hover:text-[#182231] z-50 flex items-center gap-2"
                     >
                        ← {language === 'ar' ? 'رجوع' : 'Back'}
                     </button>

                     <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full items-start">
                        <div className="col-span-12 md:col-span-4 h-full">
                           <EmotionalLandscape language={language} />
                        </div>
                        
                        <div className="col-span-12 md:col-span-8 relative h-full flex items-center justify-center">
                           <PhysicsCard icon={BrainCircuit} className="top-10 left-10 border-blue-200">
                              <h4 className="font-black text-lg mb-2 text-blue-600">{language === 'ar' ? 'البنية المنطقية' : 'Logical Structure'}</h4>
                              <p className="text-xs text-[#64788D] font-bold">{language === 'ar' ? 'تنظيم الأفكار المعقدة' : 'Organizing complex ideas'}</p>
                           </PhysicsCard>

                           <PhysicsCard icon={Hourglass} className="bottom-20 right-10 border-amber-200">
                              <h4 className="font-black text-lg mb-2 text-[#8B7B4E]">{language === 'ar' ? 'الجدول الزمني' : 'Timeline'}</h4>
                              <p className="text-xs text-[#64788D] font-bold">{language === 'ar' ? 'توقع النتائج المستقبلية' : 'Forecasting future results'}</p>
                           </PhysicsCard>

                           <PhysicsCard icon={Move} className="top-1/3 left-1/3 border-emerald-200">
                              <h4 className="font-black text-lg mb-2 text-[#5F837A]">{language === 'ar' ? 'ديناميكيات الحركة' : 'Motion Dynamics'}</h4>
                              <p className="text-xs text-[#64788D] font-bold">{language === 'ar' ? 'الاستجابة للمتغيرات' : 'Responding to variables'}</p>
                           </PhysicsCard>
                           
                           <PhysicsCard icon={Gamepad2} className="bottom-1/4 left-10 border-purple-200">
                              <h4 className="font-black text-lg mb-2 text-purple-600">{language === 'ar' ? 'قواعد اللعبة' : 'Game Rules'}</h4>
                              <p className="text-xs text-[#64788D] font-bold">{language === 'ar' ? 'تعديل سياسات العمل' : 'Adjusting work policies'}</p>
                           </PhysicsCard>

                           <div className="text-center space-y-4">
                              <div className="w-32 h-32 bg-white rounded-full border-4 border-dashed border-[#8FA9C7]/25 flex items-center justify-center mb-4">
                                 <Move className="w-8 h-8 text-zinc-300 animate-pulse" />
                              </div>
                              <h3 className="font-black text-zinc-300 uppercase tracking-widest text-sm">
                                {language === 'ar' ? 'مساحة المحاكاة الفراغية' : 'SPATIAL SIMULATION ARENA'}
                              </h3>
                              <p className="text-[10px] text-[#7C8796] font-bold italic">
                                {language === 'ar' ? 'قم بسحب المكونات لتركيب الاستراتيجية' : 'Drag components to assemble strategy'}
                              </p>
                           </div>
                        </div>
                     </div>
                 </div>
               )}
            </motion.div>
         </AnimatePresence>
      </div>
    </div>
  );
});
