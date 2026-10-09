import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TebyanEmptyStateProps {
  language: 'ar' | 'en' | string;
  icon?: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const TebyanEmptyState: React.FC<TebyanEmptyStateProps> = ({
  language,
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  const isAr = language === 'ar';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-[24px] border border-[#E9E2F1] bg-[#FBFAF7] p-6 md:p-8 text-center',
        className
      )}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative z-10 mx-auto mb-3 w-12 h-12 rounded-full bg-transparent border border-[#8E7AAE]/18 flex items-center justify-center text-[#8E7AAE]/70">
        <Icon className="w-5 h-5" strokeWidth={1.4} />
      </div>
      <h3 className="relative z-10 text-base md:text-lg font-black text-navy tracking-tight mb-1.5">{title}</h3>
      <p className="relative z-10 text-[13px] font-semibold text-ink-mute leading-relaxed max-w-md mx-auto">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="relative z-10 mt-4 px-5 py-2.5 rounded-xl bg-lilac hover:bg-lilac-deep text-white font-black text-sm transition-all active:scale-95 inline-flex items-center gap-2"
        >
          {actionLabel}
          <ArrowLeft className={cn('w-4 h-4', !isAr && 'rotate-180')} />
        </button>
      )}
    </motion.div>
  );
};
