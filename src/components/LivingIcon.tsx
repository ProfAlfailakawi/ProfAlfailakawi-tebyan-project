import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { LucideIcon } from 'lucide-react';

interface LivingIconProps {
  icon: LucideIcon;
  mood: 'default' | 'revolutionary' | 'calm' | 'melancholic' | 'optimistic';
  className?: string;
  type?: 'home' | 'search' | 'settings' | 'generic';
}

export const LivingIcon: React.FC<LivingIconProps> = ({ icon: Icon, mood, className, type = 'generic' }) => {
  const getVariants = (): any => {
    switch (type) {
      case 'home':
        if (mood === 'calm') {
          return {
            animate: {
              rotate: [0, 5, -5, 0],
              y: [0, -2, 2, 0],
            },
            transition: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }
          };
        }
        if (mood === 'revolutionary') {
          return {
            animate: {
              scale: [1, 1.1, 1],
              filter: ["drop-shadow(0 0 0px rgba(244, 63, 94, 0))", "drop-shadow(0 0 8px rgba(244, 63, 94, 0.5))", "drop-shadow(0 0 0px rgba(244, 63, 94, 0))"],
            },
            transition: {
              duration: 1,
              repeat: Infinity,
              ease: "circOut"
            }
          };
        }
        break;

      case 'search':
        if (mood === 'optimistic') {
          return {
            animate: {
              scale: [1, 1.1, 0.9, 1.1, 1],
              rotate: [0, 10, -10, 10, 0],
            },
            transition: {
              duration: 5,
              repeat: Infinity,
              times: [0, 0.1, 0.2, 0.3, 1],
              ease: "easeInOut"
            }
          };
        }
        break;

      case 'settings':
        return {
          animate: {
            rotate: mood === 'revolutionary' ? [0, 90, 180, 270, 360] : [0, 45, 0],
            scale: mood === 'calm' ? [1, 0.9, 1] : [1, 1.05, 1],
            borderRadius: mood === 'melancholic' ? ["20%", "50%", "20%"] : "0%"
          },
          transition: {
            duration: mood === 'revolutionary' ? 2 : 4,
            repeat: Infinity,
            ease: "linear"
          }
        };
    }

    // Default generic animations based on mood if no specific type match or for generic type
    switch (mood) {
      case 'revolutionary':
        return {
          animate: { scale: [1, 1.1, 1] },
          transition: { duration: 0.5, repeat: Infinity }
        };
      case 'calm':
        return {
          animate: { y: [0, -3, 0] },
          transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        };
      case 'melancholic':
        return {
          animate: { opacity: [0.6, 1, 0.6] },
          transition: { duration: 4, repeat: Infinity }
        };
      case 'optimistic':
        return {
          animate: { rotate: [0, 15, -15, 0] },
          transition: { duration: 2, repeat: Infinity }
        };
      default:
        return {};
    }
  };

  const variants = getVariants();

  return (
    <motion.div
      {...variants}
      className={cn("relative flex items-center justify-center", className)}
    >
      <Icon className="w-full h-full" />
      
      {/* Revolutionary Pulse lines */}
      {mood === 'revolutionary' && type === 'home' && (
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 border border-mood-primary rounded-full"
          />
        </div>
      )}
    </motion.div>
  );
};
