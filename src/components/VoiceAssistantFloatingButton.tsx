import React from 'react';
import { motion, useAnimation } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export function VoiceAssistantFloatingButton() {
  const controls = useAnimation();
  
  const handleDragEnd = (event: any, info: any) => {
    // If swiped up over 30px
    if (info.offset.y < -30) {
      window.dispatchEvent(new Event('open_voice_assistant'));
    } else {
      // Tap threshold
      if (Math.abs(info.offset.y) < 10 && Math.abs(info.offset.x) < 10) {
        window.dispatchEvent(new Event('open_voice_assistant'));
      }
    }
    controls.start({ x: 0, y: 0 });
  };

  return (
    <motion.button
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      animate={controls}
      className="fixed bottom-24 left-4 z-[99] w-14 h-14 rounded-full bg-black text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center group border border-white/20 hover:scale-105 transition-transform touch-none"
      title="المساعد الصوتي (ارفع للأعلى للتحدث)"
    >
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-indigo-500 via-purple-500 to-emerald-500 opacity-20 group-hover:opacity-60 blur-xl transition-all duration-500 pointer-events-none"></div>
        <Sparkles className="w-6 h-6 relative z-10 animate-pulse transition-transform text-white/90 pointer-events-none" />
    </motion.button>
  );
}
