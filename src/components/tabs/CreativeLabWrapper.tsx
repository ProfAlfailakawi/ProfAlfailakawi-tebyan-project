import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Sparkles, Network, LibraryBig, Waves } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LabTab } from './LabTab';
import { ConceptsTab } from './ConceptsTab';
import { MindMapTab } from './MindMapTab';
import { StoryTab } from './StoryTab';
import { RippleEffectTab } from './RippleEffectTab';

export default React.memo(({ language, handleTabChange, initialValue, onValueUsed }: any) => {
  const [activeSubTab, setActiveSubTab] = useState<'lab' | 'concepts' | 'mindmap' | 'story' | 'ripple'>('lab');

  const tabs = [
    { id: 'lab', label: language === 'ar' ? 'المختبر الأصلي' : 'Original Lab', icon: Zap },
    { id: 'concepts', label: language === 'ar' ? 'هندسة الأفكار' : 'Idea Engineering', icon: Sparkles },
    { id: 'mindmap', label: language === 'ar' ? 'خريطة العقل' : 'Mind Map', icon: Network },
    { id: 'story', label: language === 'ar' ? 'الراوي' : 'Story Weaver', icon: LibraryBig },
    { id: 'ripple', label: language === 'ar' ? 'التأثير المتسلسل' : 'Ripple Effect', icon: Waves }
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
                isActive ? "bg-black text-white shadow-lg" : "bg-white text-zinc-500 hover:bg-zinc-100 border border-zinc-200"
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
               {activeSubTab === 'lab' && <LabTab language={language} handleTabChange={handleTabChange} initialValue={initialValue} onValueUsed={onValueUsed} />}
               {activeSubTab === 'concepts' && <ConceptsTab language={language} handleTabChange={handleTabChange} initialValue={initialValue} onValueUsed={onValueUsed} />}
               {activeSubTab === 'mindmap' && <MindMapTab language={language} handleTabChange={handleTabChange} initialValue={initialValue} onValueUsed={onValueUsed} />}
               {activeSubTab === 'story' && <StoryTab language={language} handleTabChange={handleTabChange} initialValue={initialValue} onValueUsed={onValueUsed} />}
               {activeSubTab === 'ripple' && <RippleEffectTab language={language} />}
            </motion.div>
         </AnimatePresence>
      </div>
    </div>
  );
});
