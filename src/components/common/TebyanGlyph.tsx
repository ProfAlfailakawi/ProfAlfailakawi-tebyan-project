import React from 'react';
import { cn } from '../../lib/utils';

type GlyphKind = 'gateway' | 'qawlfasl' | 'fabric' | 'decision' | 'reactor' | 'lighthouse';

export const TebyanGlyph: React.FC<{ kind: GlyphKind; className?: string }> = ({ kind, className }) => {
  const common = 'fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round';
  return (
    <svg viewBox="0 0 48 48" className={cn('w-6 h-6', className)} aria-hidden="true">
      {kind === 'gateway' && (
        <g className={common}>
          <circle cx="23" cy="22" r="12" />
          <path d="M32 31l7 7" />
          <path d="M23 14l1.8 4 4.2 1.1-3.2 2.8.9 4.1-3.7-2.1-3.7 2.1.9-4.1-3.2-2.8 4.2-1.1L23 14z" />
        </g>
      )}
      {kind === 'qawlfasl' && (
        <g className={common}>
          <path d="M24 8v30" />
          <path d="M12 15h24" />
          <path d="M16 15l-7 12h14l-7-12z" />
          <path d="M32 15l-7 12h14l-7-12z" />
          <path d="M17 40h14" />
        </g>
      )}
      {kind === 'fabric' && (
        <g className={common}>
          <circle cx="12" cy="18" r="4" />
          <circle cx="30" cy="11" r="4" />
          <circle cx="36" cy="31" r="4" />
          <circle cx="18" cy="35" r="4" />
          <path d="M16 17l10-4" /><path d="M31 15l4 12" /><path d="M32 32l-10 2" /><path d="M15 22l3 9" /><path d="M15 19l17 11" />
        </g>
      )}
      {kind === 'decision' && (
        <g className={common}>
          <circle cx="24" cy="24" r="15" />
          <path d="M24 14v10l7 4" />
          <path d="M24 9v4M24 35v4M9 24h4M35 24h4" />
        </g>
      )}
      {kind === 'reactor' && (
        <g className={common}>
          <circle cx="24" cy="24" r="7" />
          <path d="M9 24c6-10 24-10 30 0-6 10-24 10-30 0z" />
          <path d="M24 9c10 6 10 24 0 30-10-6-10-24 0-30z" />
          <circle cx="24" cy="24" r="2" />
        </g>
      )}
      {kind === 'lighthouse' && (
        <g className={common}>
          <path d="M19 41h10l-2-25h-6l-2 25z" />
          <path d="M18 16h12l-2-7h-8l-2 7z" />
          <path d="M14 22L5 17M34 22l9-5" />
          <path d="M20 28h8M20 34h8" />
        </g>
      )}
    </svg>
  );
};
