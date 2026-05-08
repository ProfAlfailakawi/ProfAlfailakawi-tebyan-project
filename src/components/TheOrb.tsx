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
  const controls = useAnimation();
  
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
        className="fixed bottom-4 left-4 z-[90] touch-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn(
        "absolute -top-16 left-1/2 -translate-x-1/2 transition-opacity duration-300 bg-black/90 backdrop-blur-xl text-white px-4 py-2 rounded-full shadow-lg font-black text-[10px] uppercase tracking-[0.2em] border border-white/20 whitespace-nowrap pointer-events-none z-[100]",
        isHovered ? "opacity-100" : "opacity-0"
      )}>
          {language === 'ar' ? 'اسحب للأعلى' : 'PULL UP'}
      </div>
      
      <motion.button
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={controls}
        whileTap={{ scale: 0.95 }}
        className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center group border border-white/20 relative"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-indigo-500 via-purple-500 to-emerald-500 opacity-20 group-hover:opacity-60 blur-xl transition-all duration-500"></div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent to-black/50 pointer-events-none" />
        <Sparkles className="w-8 h-8 md:w-10 md:h-10 relative z-10 animate-pulse transition-transform text-white/90" />
      </motion.button>
    </motion.div>
  );
};
