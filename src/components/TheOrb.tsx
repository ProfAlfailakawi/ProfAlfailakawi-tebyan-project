import React, { useRef, useState } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface TheOrbProps {
  onTap: () => void;
  onDragUp: () => void;
  language: 'ar' | 'en';
}

export const TheOrb: React.FC<TheOrbProps> = ({ onTap, onDragUp, language }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const controls = useAnimation();

  React.useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);
  
  const handleDragEnd = (event: any, info: any) => {
    // If dragged UP significantly
    if (info.offset.y < -50) {
      onDragUp();
    } else if (Math.abs(info.offset.y) < 20 && Math.abs(info.offset.x) < 20) {
      // Tap
      onTap();
    }
    controls.start({ x: 0, y: 0 });
  };

  return (
    <motion.div
        className="tebyan-orb-dock fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] z-[90] touch-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn(
        "absolute left-full top-1/2 -translate-y-1/2 ml-3 transition-opacity duration-500 bg-black/90 backdrop-blur-xl text-white px-4 py-2 rounded-full shadow-lg font-black text-xs uppercase tracking-[0.2em] rtl:tracking-normal border border-white/20 whitespace-nowrap pointer-events-none z-[100] flex items-center justify-center min-w-[104px]",
        (isHovered || showHint) ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
      )}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            {language === 'ar' ? 'اسحب للأعلى' : 'PULL UP'}
          </div>
      </div>
      
      <motion.button
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={controls}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black text-white shadow-[0_6px_20px_rgba(0,0,0,0.25)] flex items-center justify-center group border border-white/20 relative"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-indigo-500 via-purple-500 to-emerald-500 opacity-20 group-hover:opacity-60 blur-xl transition-all duration-500"></div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent to-black/50 pointer-events-none" />
        <Sparkles className="w-6 h-6 md:w-8 md:h-8 relative z-10 transition-transform text-white/90" />
      </motion.button>
    </motion.div>
  );
};
