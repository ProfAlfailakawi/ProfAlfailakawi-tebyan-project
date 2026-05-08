import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, Hourglass, Gamepad2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CouncilTab } from './CouncilTab';
import { TimeMachineTab } from './TimeMachineTab';
import { SimulationTab } from './SimulationTab';

export default React.memo(({ language, handleTabChange, initialValue, onValueUsed }: any) => {
  const [activeSubTab, setActiveSubTab] = useState<'council' | 'timemachine' | 'simulation'>('council');

  const tabs = [
    { id: 'council', label: language === 'ar' ? 'طاولة الخبراء' : 'Expert Table', icon: BrainCircuit },
    { id: 'timemachine', label: language === 'ar' ? 'آلة الزمن' : 'Time Machine', icon: Hourglass },
    { id: 'simulation', label: language === 'ar' ? 'المحاكي الميداني' : 'Simulator', icon: Gamepad2 }
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
               {activeSubTab === 'council' && <CouncilTab language={language} handleTabChange={handleTabChange} initialValue={initialValue} onValueUsed={onValueUsed} />}
               {activeSubTab === 'timemachine' && <TimeMachineTab language={language} handleTabChange={handleTabChange} initialValue={initialValue} onValueUsed={onValueUsed} />}
               {activeSubTab === 'simulation' && <SimulationTab language={language} handleTabChange={handleTabChange} initialValue={initialValue} onValueUsed={onValueUsed} />}
            </motion.div>
         </AnimatePresence>
      </div>
    </div>
  );
});
