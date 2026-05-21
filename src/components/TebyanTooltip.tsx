import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

export const TebyanTooltip = ({ children, text, side = 'top' }: { children: React.ReactNode, text?: string, side?: 'top' | 'bottom' | 'left' | 'right' }) => {
  if (!text) return <>{children}</>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} align="center" className="bg-zinc-900 text-white font-medium text-xs px-3 py-2 rounded-lg shadow-xl shadow-black/20 border border-zinc-800 animate-in fade-in zoom-in duration-200">
        {text}
      </TooltipContent>
    </Tooltip>
  );
};
