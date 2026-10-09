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
  /** @deprecated kept for call-site compatibility: the friendly hint is always visible now. */
  srOnlyText?: boolean;
  className?: string;
}> = ({ icon: Icon, text, className }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center gap-2.5 px-6 py-8 md:py-10 text-center select-none pointer-events-none',
      className
    )}
  >
    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-lilac-soft/30 bg-lilac-mist/60">
      <Icon className="h-6 w-6 text-lilac" strokeWidth={1.4} aria-hidden="true" />
    </div>
    {text && <p className={cn("max-w-sm text-sm font-semibold leading-relaxed text-ink-mute")}>{text}</p>}
  </div>
);
