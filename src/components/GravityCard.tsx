import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { Save, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface GravityCardProps {
  content: string;
  weight: 'light' | 'heavy'; // heavy = complex/long, light = short/simple
  className?: string;
}

export const GravityCard = ({ content, weight, className }: GravityCardProps) => {
  const [saved, setSaved] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Heavier objects have higher mass and lower stiffness
  const physics = weight === 'heavy' 
    ? { stiffness: 80, damping: 20, mass: 2 } 
    : { stiffness: 300, damping: 30, mass: 0.5 };

  // Calculate pull resistance
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const handleDragEnd = (e: any, info: any) => {
    // If dragged far enough to the right or bottom, "save" it
    if (info.offset.x > 100 || info.offset.y > 100) {
      setSaved(true);
      // Subtle sensory flash (handled by UI state)
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={weight === 'heavy' ? 0.1 : 0.4} // Heavier is harder to drag
      dragTransition={{ bounceStiffness: physics.stiffness, bounceDamping: physics.damping }}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotateX, rotateY }}
      whileTap={{ scale: 0.98, cursor: 'grabbing' }}
      className={cn(
        "relative cursor-grab bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow",
        saved && "ring-2 ring-indigo-500 bg-indigo-50/50",
        className
      )}
    >
      <div className="flex gap-4 items-start">
        <div className="text-zinc-800 text-sm leading-relaxed flex-1">
          {content}
        </div>
        <div className={cn(
          "shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
          saved ? "bg-indigo-500 text-white" : "bg-zinc-100 text-zinc-400"
        )}>
           {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        </div>
      </div>
      
      {/* Sensory feedback flash */}
      {saved && (
        <motion.div 
          initial={{ opacity: 0.8, scale: 0.8 }}
          animate={{ opacity: 0, scale: 1.5 }}
          className="absolute inset-0 bg-indigo-400 rounded-2xl z-[-1]"
        />
      )}
    </motion.div>
  );
};
