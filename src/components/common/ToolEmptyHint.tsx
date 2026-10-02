import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Calm empty state for tool screens: one large faint thin-line icon and a
 * single hint line (text that is already on the page). Purely visual.
 */
export const ToolEmptyHint: React.FC<{
  icon: React.ElementType;
  /** Optional: omit when the tab header already carries the same sentence. */
  text?: string;
  className?: string;
}> = ({ icon: Icon, text, className }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center gap-4 px-6 py-12 md:py-16 text-center select-none pointer-events-none',
      className
    )}
  >
    <div className="flex h-36 w-36 items-center justify-center rounded-full border border-dashed border-[#8E7AAE]/20 bg-[#8E7AAE]/[0.04]">
      <Icon className="h-20 w-20 text-[#8E7AAE]/30" strokeWidth={0.9} aria-hidden="true" />
    </div>
    {text && <p className="max-w-sm text-[13px] font-semibold leading-relaxed text-[#8A97A6]">{text}</p>}
  </div>
);
