import React from 'react';
import { motion } from 'motion/react';

export const AIHeartbeat = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative flex items-center justify-center w-8 h-8 ${className}`}>
      {/* Outer Glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-indigo-500/30 blur-md"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 3, // Human breathing pace is ~3-4 seconds per cycle
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Core */}
      <motion.div
        className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,1)]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};
