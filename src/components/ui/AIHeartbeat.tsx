import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export const AIHeartbeat = ({ className = "" }: { className?: string }) => {
  // MotionConfig only disables transforms; this loop is opacity-based, so guard it explicitly.
  const reduceMotion = useReducedMotion();
  return (
    <div className={`relative flex items-center justify-center w-8 h-8 ${className}`}>
      {/* Outer Glow: the one quiet indicator (a single slow breath while the AI is thinking) */}
      <motion.div
        className="absolute inset-0 rounded-full bg-lilac/30 blur-md"
        animate={reduceMotion ? { scale: 1, opacity: 0.5 } : {
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={reduceMotion ? { duration: 0 } : {
          duration: 3, // Human breathing pace is ~3-4 seconds per cycle
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Core: static (kept in markup; no second loop) */}
      <div className="absolute w-2 h-2 rounded-full bg-white opacity-90 shadow-[0_0_15px_rgba(255,255,255,1)]" />
    </div>
  );
};
