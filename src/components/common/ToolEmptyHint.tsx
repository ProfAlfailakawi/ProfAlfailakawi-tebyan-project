import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Calm empty state for tool screens: one small thin-line icon and a
 * single hint line (text that is already on the page). Purely visual.
 */
export const ToolEmptyHint: React.FC<{
  icon: React.ElementType;
  /** Optional: omit when the tab header already carries the same sentence. */
  text?: string;
  /** Keep the caption for screen readers only (the header above already shows it visibly). */
  srOnlyText?: boolean;
  className?: string;
}> = ({ icon: Icon, text, srOnlyText, className }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center gap-2.5 px-6 py-8 md:py-10 text-center select-none pointer-events-none',
      className
    )}
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#8E7AAE]/18 bg-transparent">
      <Icon className="h-5 w-5 text-[#8E7AAE]/55" strokeWidth={1.4} aria-hidden="true" />
    </div>
    {text && <p className={cn('max-w-sm text-[13px] font-semibold leading-relaxed text-[#8A97A6]', srOnlyText && 'sr-only')}>{text}</p>}
  </div>
);
