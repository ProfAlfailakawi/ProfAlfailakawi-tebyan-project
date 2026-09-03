import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles } from 'lucide-react';

const STORAGE_KEY = 'tebyan_learned_icons_v1';
const GUTTER = 12; // 12px viewport gutter boundary constraint

/**
 * Checks if the current environment is a touch / mobile device.
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (window.matchMedia && window.matchMedia('(max-width: 768px)').matches)
  );
};

// Global learned icons store backed by localStorage
const getLearnedIcons = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const saveLearnedIcons = (set: Set<string>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('Failed to save learned icon state:', e);
  }
};

let learnedSet = getLearnedIcons();
const listeners = new Set<() => void>();

export const markIconAsLearned = (id: string) => {
  if (!id) return;
  learnedSet.add(id);
  saveLearnedIcons(learnedSet);
  listeners.forEach((fn) => fn());
};

export const isIconLearned = (id: string): boolean => {
  if (!id) return true;
  return learnedSet.has(id);
};

export const resetAllLearnedIcons = () => {
  learnedSet.clear();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  listeners.forEach((fn) => fn());
};

export const useLearnedIcons = () => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  return {
    isIconLearned,
    markIconAsLearned,
    resetAllLearnedIcons,
  };
};

export interface SmartIconWrapperProps {
  /** Unique ID for the specialized icon tool across Tebyan */
  id: string;
  /** Short explanatory guidance sentence */
  guidanceText: string | { ar: string; en?: string };
  /** Preferred position relative to icon */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Language ('ar' | 'en') */
  lang?: 'ar' | 'en';
  /** If false, bypasses guidance entirely (for universal icons like search/close) */
  isSpecialized?: boolean;
  /** Children element (the button or icon) */
  children: React.ReactNode;
  /** Optional container class name */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

interface PortalTooltipProps {
  targetRef: React.RefObject<HTMLElement | null>;
  guidanceText: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  lang: 'ar' | 'en';
  onDismiss: () => void;
}

/**
 * Floating Coach Mark Tooltip rendered directly into document.body using React Portal
 * with fixed positioning, viewport boundary auto-clamping, and precision target arrow.
 */
const GuidancePortalTooltip: React.FC<PortalTooltipProps> = ({
  targetRef,
  guidanceText,
  side,
  lang,
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    arrowX: number;
    arrowY: number;
    isFlipped: boolean;
  }>({
    top: -9999,
    left: -9999,
    arrowX: 0,
    arrowY: 0,
    isFlipped: false,
  });

  const updatePosition = useCallback(() => {
    if (!targetRef.current || !tooltipRef.current) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;

    let computedTop = 0;
    let computedLeft = 0;
    let flipped = false;

    // Handle Top / Bottom primary positioning with auto-flip
    if (side === 'bottom') {
      computedTop = targetRect.bottom + 10;
      if (computedTop + tooltipHeight > vh - GUTTER) {
        computedTop = targetRect.top - tooltipHeight - 10;
        flipped = true;
      }
    } else {
      // Default 'top' side
      computedTop = targetRect.top - tooltipHeight - 10;
      if (computedTop < GUTTER) {
        computedTop = targetRect.bottom + 10;
        flipped = true;
      }
    }

    // Default horizontal alignment centered on icon center
    computedLeft = targetCenterX - tooltipWidth / 2;

    // Viewport bounds clamping with GUTTER (12px)
    if (computedLeft < GUTTER) {
      computedLeft = GUTTER;
    } else if (computedLeft + tooltipWidth > vw - GUTTER) {
      computedLeft = vw - GUTTER - tooltipWidth;
    }

    // Calculate Arrow position relative to the tooltip box to point PRECISELY at targetCenterX
    let arrowXRelativeToBox = targetCenterX - computedLeft;
    // Keep arrow inside rounded corners of tooltip
    const minArrowOffset = 18;
    const maxArrowOffset = Math.max(minArrowOffset, tooltipWidth - 18);
    arrowXRelativeToBox = Math.max(minArrowOffset, Math.min(arrowXRelativeToBox, maxArrowOffset));

    setCoords({
      top: Math.round(computedTop),
      left: Math.round(computedLeft),
      arrowX: Math.round(arrowXRelativeToBox),
      arrowY: 0,
      isFlipped: flipped,
    });
  }, [targetRef, side]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition]);

  useEffect(() => {
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition]);

  if (typeof document === 'undefined') return null;

  const showBelow = side === 'bottom' ? !coords.isFlipped : coords.isFlipped;

  return createPortal(
    <div
      ref={tooltipRef}
      role="tooltip"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 999999,
      }}
      className="pointer-events-none flex flex-col items-center max-w-[240px] sm:max-w-[280px] w-max select-none animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Downward Arrow pointing up if tooltip is below icon */}
      {showBelow && (
        <div
          style={{ left: `${coords.arrowX}px` }}
          className="absolute -top-1.5 -translate-x-1/2 w-3 h-3 rotate-45 bg-zinc-950 border-t border-l border-amber-500/50 z-10"
        />
      )}

      {/* Main Tooltip Body */}
      <div className="relative bg-zinc-950/95 text-white backdrop-blur-md border border-amber-500/40 px-3.5 py-2.5 rounded-2xl shadow-2xl shadow-black/70 text-right">
        <div className="flex items-start gap-2 dir-rtl">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-[11px] leading-snug font-medium text-zinc-100">
            <span>{guidanceText}</span>
            <span className="block text-[10px] text-amber-300 font-bold mt-1 dir-rtl">
              {lang === 'en' ? 'Tap again to activate' : 'انقر مجدداً للتفعيل'}
            </span>
          </div>
        </div>
      </div>

      {/* Upward Arrow pointing down if tooltip is above icon */}
      {!showBelow && (
        <div
          style={{ left: `${coords.arrowX}px` }}
          className="absolute -bottom-1.5 -translate-x-1/2 w-3 h-3 rotate-45 bg-zinc-950 border-b border-r border-amber-500/50 z-10"
        />
      )}
    </div>,
    document.body
  );
};

/**
 * SmartIconWrapper intercepts the first tap on mobile for specialized icons,
 * shows a brief explanatory coach mark via React Portal, saves the icon ID in localStorage globally,
 * and allows direct execution on the second tap or on desktop.
 */
export const SmartIconWrapper: React.FC<SmartIconWrapperProps> = ({
  id,
  guidanceText,
  side = 'top',
  lang = 'ar',
  isSpecialized = true,
  children,
  className = '',
  disabled = false,
}) => {
  const { isIconLearned, markIconAsLearned } = useLearnedIcons();
  const [activeGuidance, setActiveGuidance] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const textToDisplay = typeof guidanceText === 'string'
    ? guidanceText
    : (lang === 'en' && guidanceText.en ? guidanceText.en : guidanceText.ar);

  const dismissGuidance = useCallback(() => {
    setActiveGuidance(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Dismiss tooltip on tap outside or auto-timeout
  useEffect(() => {
    if (!activeGuidance) return;

    const handleOutsideTouch = (e: TouchEvent | MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        dismissGuidance();
      }
    };

    document.addEventListener('touchstart', handleOutsideTouch, { passive: true });
    document.addEventListener('mousedown', handleOutsideTouch);

    timerRef.current = setTimeout(() => {
      dismissGuidance();
    }, 3800);

    return () => {
      document.removeEventListener('touchstart', handleOutsideTouch);
      document.removeEventListener('mousedown', handleOutsideTouch);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeGuidance, dismissGuidance]);

  // Intercept click during capture phase if first-time touch on specialized icon
  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    const isTouch = isTouchDevice();
    const alreadyLearned = isIconLearned(id);

    // If desktop or universal icon or already learned globally:
    if (!isTouch || !isSpecialized || alreadyLearned) {
      if (activeGuidance) dismissGuidance();
      // Allow event to propagate normally to inner onClick handler!
      return;
    }

    // First time touch on mobile for specialized icon:
    // show the coach mark WITHOUT swallowing the tap — the action must always fire.
    markIconAsLearned(id);
    setActiveGuidance(textToDisplay);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center ${className}`}
      onClickCapture={handleClickCapture}
    >
      {children}

      {/* Portal Coach Mark Tooltip */}
      {activeGuidance && (
        <GuidancePortalTooltip
          targetRef={containerRef}
          guidanceText={activeGuidance}
          side={side}
          lang={lang}
          onDismiss={dismissGuidance}
        />
      )}
    </div>
  );
};
