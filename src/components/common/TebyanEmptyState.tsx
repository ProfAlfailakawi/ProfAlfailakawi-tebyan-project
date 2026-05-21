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
        'relative overflow-hidden rounded-[36px] border border-[#E9E2F1] bg-[#FBFAF7] p-8 md:p-12 text-center shadow-[0_24px_80px_rgba(142,122,174,0.10)]',
        className
      )}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="absolute -top-24 -right-20 w-72 h-72 bg-[#E9E2F1]/70 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-20 w-72 h-72 bg-[#E8F0F6]/80 blur-[80px] rounded-full pointer-events-none" />
      <div className="relative z-10 mx-auto mb-6 w-20 h-20 rounded-[28px] bg-white border border-[#EFEAF4] flex items-center justify-center text-[#8E7AAE] shadow-sm">
        <Icon className="w-9 h-9" strokeWidth={1.7} />
      </div>
      <h3 className="relative z-10 text-2xl md:text-3xl font-black text-[#182231] tracking-tight mb-3">{title}</h3>
      <p className="relative z-10 text-sm md:text-base font-bold text-[#7C8796] leading-relaxed max-w-xl mx-auto">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="relative z-10 mt-7 px-6 py-3 rounded-2xl bg-[#8E7AAE] text-white font-black text-sm shadow-[0_14px_40px_rgba(142,122,174,0.22)] hover:-translate-y-0.5 transition-all active:scale-95 inline-flex items-center gap-2"
        >
          {actionLabel}
          <ArrowLeft className={cn('w-4 h-4', !isAr && 'rotate-180')} />
        </button>
      )}
    </motion.div>
  );
};
