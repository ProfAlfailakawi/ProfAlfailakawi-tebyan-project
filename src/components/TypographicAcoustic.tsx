import React, { forwardRef } from 'react';
import { motion } from 'motion/react';

export const TypographicAcoustic = forwardRef<HTMLDivElement, { 
  children: React.ReactNode, 
  type?: 'snap' | 'whisper' | 'normal',
  className?: string
}>(({ 
  children, 
  type = 'normal', 
  className = '' 
}, ref) => {
  if (type === 'snap') {
    // Sharp, decisive truth. Snaps into place.
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(2px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 25, mass: 0.5 }}
        className={`font-bold tracking-tight ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  if (type === 'whisper') {
    // Philosophical, gentle. Fades in slowly as if whispered.
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 5, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
        className={`leading-relaxed text-zinc-600 ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  // Normal flow
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

TypographicAcoustic.displayName = 'TypographicAcoustic';
