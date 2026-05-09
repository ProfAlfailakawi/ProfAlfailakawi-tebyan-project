import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useGamification } from '../hooks/useGamification';

export const NeuralTree = ({ language }: { language: string }) => {
  const { state } = useGamification();
  const xp = state.xp;
  const level = state.level;

  // Generate branches based on level/xp
  const branches = useMemo(() => {
    const numBranches = Math.min(20, 5 + Math.floor(level / 2) + Math.floor(xp / 100)); // Cap to avoid lag
    const items = [];
    for(let i=0; i<numBranches; i++) {
       // Random angles and distances, mapped to nodes
       const angle = (Math.PI * 2 * i) / numBranches + (Math.random() * 0.5);
       const distance = 40 + Math.random() * (40 + min(level * 5, 60)); // Grow outward as level increases
       items.push({
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          size: Math.random() * 8 + 4,
          delay: Math.random() * 2,
          color: i % 3 === 0 ? 'bg-fuchsia-500' : (i % 2 === 0 ? 'bg-indigo-500' : 'bg-cyan-400')
       });
    }
    return items;
  }, [xp, level]);

  const activeDays = 5; // We could infer from state, let's assume active

  return (
    <div className="w-full relative h-[300px] md:h-[400px] rounded-[32px] overflow-hidden bg-black flex items-center justify-center p-4 border border-zinc-800 shadow-2xl group">
       <div className="absolute top-6 left-6 z-20">
         <div className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-1">
           {language === 'ar' ? 'الشجرة العصبية الحية' : 'Living Neural Tree'}
         </div>
         <div className="text-white font-black text-xl md:text-2xl flex items-center gap-2">
            <span>{language === 'ar' ? `المستوى ${level}` : `Level ${level}`}</span>
            <span className="text-xs px-2 py-1 bg-white/10 rounded-full font-bold ml-2">
              {xp} XP
            </span>
         </div>
       </div>

       {/* Subtext to encourage network effect */}
       <div className="absolute bottom-6 right-6 z-20 text-right opacity-50 group-hover:opacity-100 transition-opacity">
         <div className="text-xs text-zinc-400 max-w-[200px]">
           {language === 'ar' 
             ? 'شجرتك العصبية تنمو وتتنفس مع كل فكرة تبنيها. استمر بالاستكشاف لتتفرع أكثر.' 
             : 'Your neural tree grows and breathes with every idea. Keep exploring to expand branches.'}
         </div>
       </div>

       {/* Visual Galaxy / Tree */}
       <div className="relative w-full h-full flex items-center justify-center z-10 perspective-[1000px]">
          {/* Core */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full bg-white blur-[20px] absolute z-10"
          />
          <div className="w-12 h-12 rounded-full bg-indigo-500 z-20 border-[4px] border-white/20 shadow-[0_0_50px_rgba(99,102,241,0.8)]" />

          {/* Branches */}
          {branches.map((branch) => (
            <React.Fragment key={branch.id}>
              {/* Lines */}
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.3, scale: 1 }}
                transition={{ duration: 2, delay: branch.delay }}
                className="absolute top-1/2 left-1/2 bg-gradient-to-r from-white/40 to-transparent origin-left"
                style={{
                  width: Math.sqrt(branch.x*branch.x + branch.y*branch.y),
                  height: 1,
                  transform: `rotate(${Math.atan2(branch.y, branch.x)}rad)`,
                  zIndex: 5
                }}
              />
              {/* Nodes */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0.5, 1, 0.5], 
                  scale: [1, 1.3, 1],
                  x: branch.x,
                  y: branch.y 
                }}
                transition={{ 
                  opacity: { duration: 2 + Math.random()*2, repeat: Infinity, delay: branch.delay },
                  scale: { duration: 2 + Math.random()*2, repeat: Infinity, delay: branch.delay },
                  x: { type: 'spring', damping: 10, mass: 0.5 },
                  y: { type: 'spring', damping: 10, mass: 0.5 }
                }}
                className={`absolute rounded-full ${branch.color} shadow-[0_0_20px_inherit] z-10`}
                style={{
                   width: branch.size,
                   height: branch.size,
                   boxShadow: '0 0 15px currentColor'
                }}
              />
            </React.Fragment>
          ))}
       </div>

       {/* Ambient glow */}
       <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-black pointer-events-none z-0" />
    </div>
  );
};

export function min(a: number, b: number) { return a < b ? a : b; }
