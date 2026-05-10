import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardCheck, Network, BarChart3, Route } from 'lucide-react';
import { cn } from '../../lib/utils';
import { QuizTab } from './QuizTab';
import { KnowledgeGraphTab } from './KnowledgeGraphTab';
import { AnalyticsTab } from './AnalyticsTab';
import { RoadmapTab } from './RoadmapTab';

export default React.memo(({ language, handleTabChange, initialValue, onValueUsed }: any) => {
  const [activeSubTab, setActiveSubTab] = useState<'quizzes' | 'analytics' | 'roadmap'>('quizzes');

  const tabs = [
    { id: 'quizzes', label: language === 'ar' ? 'الاختبارات الذكية' : 'Smart Quizzes', icon: ClipboardCheck },
    { id: 'analytics', label: language === 'ar' ? 'الرادار الاستباقي' : 'Predictive Radar', icon: BarChart3 },
    { id: 'roadmap', label: language === 'ar' ? 'طريق النجاح' : 'Success Roadmap', icon: Route }
  ];

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar hide-scrollbar-on-mobile">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all whitespace-nowrap",
                isActive ? "bg-mood-primary text-white shadow-lg shadow-mood-glow" : "bg-white text-zinc-500 hover:bg-zinc-100 border border-zinc-200"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
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
               {activeSubTab === 'quizzes' && <QuizTab language={language} handleTabChange={handleTabChange} initialValue={initialValue} onValueUsed={onValueUsed} />}
               {activeSubTab === 'analytics' && <AnalyticsTab language={language} handleTabChange={handleTabChange} />}
               {activeSubTab === 'roadmap' && <RoadmapTab language={language} handleTabChange={handleTabChange} initialValue={initialValue} onValueUsed={onValueUsed} />}
            </motion.div>
         </AnimatePresence>
      </div>
    </div>
  );
});
