import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Infinity } from 'lucide-react';

export const SpatialGhost = ({ 
  message, 
  x = 'right-8', 
  y = 'top-1/3' 
}: { 
  message: string, 
  x?: string, 
  y?: string 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`hidden md:block fixed ${x} ${y} z-30 pointer-events-auto`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        initial={{ opacity: 0.1, scale: 0.9 }}
        animate={{ 
          opacity: isHovered ? 1 : 0.15,
          scale: isHovered ? 1 : 0.95,
          filter: isHovered ? 'blur(0px)' : 'blur(2px)' // Ghostly blur when not hovered
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative group"
      >
        {!isHovered && (
          <div className="w-8 h-8 flex items-center justify-center">
            <Infinity className="w-4 h-4 text-zinc-400 animate-pulse" />
          </div>
        )}
        
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, width: 0, padding: 0 }}
              animate={{ opacity: 1, width: 'auto', padding: '12px 16px' }}
              exit={{ opacity: 0, width: 0, padding: 0 }}
              className="bg-zinc-900 text-zinc-100 text-xs rounded-2xl shadow-xl overflow-hidden whitespace-nowrap flex items-center gap-3 backdrop-blur-md bg-opacity-90 border border-white/10"
            >
              <Infinity className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
