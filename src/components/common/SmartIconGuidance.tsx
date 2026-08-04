import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles } from 'lucide-react';

const STORAGE_KEY = 'tebyan_learned_icons_v1';

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
  /** Preferred position relative to icon ('top' | 'bottom') */
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

interface PortalPosition {
  top: number;
  left: number;
  arrowLeft: number;
  placeBelow: boolean;
  maxWidth: number;
}

/**
 * SmartIconWrapper intercepts the first tap on mobile for specialized icons,
 * displays a brief explanatory coach mark via a Portal in document.body,
 * dynamically fits within viewport bounds (with a 12px gutter),
 * aligns the tooltip arrow directly to the center of the icon,
 * saves the learned icon state globally in localStorage,
 * and allows immediate interaction on the second tap or on desktop.
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
  const [pos, setPos] = useState<PortalPosition | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const textToDisplay = typeof guidanceText === 'string'
    ? guidanceText
    : (lang === 'en' && guidanceText.en ? guidanceText.en : guidanceText.ar);

  const dismissGuidance = useCallback(() => {
    setActiveGuidance(null);
    setPos(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Calculate position with viewport boundary clamping and arrow alignment
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gutter = 12; // 12px minimum distance from screen edges
    const maxWidth = Math.min(270, vw - gutter * 2);

    const centerX = rect.left + rect.width / 2;
    const placeBelow = side === 'bottom' || rect.top < 100;

    // Default target width estimate or measured width
    let actualWidth = maxWidth;
    let actualHeight = 60;
    if (tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      if (tooltipRect.width > 0) actualWidth = tooltipRect.width;
      if (tooltipRect.height > 0) actualHeight = tooltipRect.height;
    }

    // Clamp tooltip horizontally within viewport bounds [gutter, vw - gutter]
    const idealLeft = centerX - actualWidth / 2;
    const clampedLeft = Math.max(gutter, Math.min(vw - gutter - actualWidth, idealLeft));

    // Calculate exact arrow location relative to the tooltip box
    const rawArrowLeft = centerX - clampedLeft;
    const arrowLeft = Math.max(16, Math.min(actualWidth - 16, rawArrowLeft));

    let top = rect.top - actualHeight - 10;
    if (placeBelow) {
      top = rect.bottom + 10;
    } else if (top < gutter) {
      // If placing top overflows top of screen, flip to bottom
      top = Math.min(vh - gutter - actualHeight, rect.bottom + 10);
    }

    setPos({
      top,
      left: clampedLeft,
      arrowLeft,
      placeBelow,
      maxWidth,
    });
  }, [side]);

  // Adjust measurement after tooltip mounts in DOM
  useLayoutEffect(() => {
    if (activeGuidance) {
      updatePosition();
    }
  }, [activeGuidance, updatePosition]);

  // Handle click outside, scroll, resize, auto-dismiss
  useEffect(() => {
    if (!activeGuidance) return;

    const handleOutsideTouch = (e: TouchEvent | MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        tooltipRef.current && !tooltipRef.current.contains(e.target as Node)
      ) {
        dismissGuidance();
      }
    };

    const handleWindowChange = () => {
      updatePosition();
    };

    document.addEventListener('touchstart', handleOutsideTouch, { passive: true });
    document.addEventListener('mousedown', handleOutsideTouch);
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    timerRef.current = setTimeout(() => {
      dismissGuidance();
    }, 3800);

    return () => {
      document.removeEventListener('touchstart', handleOutsideTouch);
      document.removeEventListener('mousedown', handleOutsideTouch);
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeGuidance, dismissGuidance, updatePosition]);

  // Intercept first tap on mobile for specialized icon
  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    const isTouch = isTouchDevice();
    const alreadyLearned = isIconLearned(id);

    // Desktop or universal icon or already learned globally:
    if (!isTouch || !isSpecialized || alreadyLearned) {
      if (activeGuidance) dismissGuidance();
      return; // Allow normal event propagation
    }

    // First time touch on mobile for specialized icon:
    e.preventDefault();
    e.stopPropagation();

    // Mark as learned globally across the app
    markIconAsLearned(id);

    // Show coach mark tooltip
    setActiveGuidance(textToDisplay);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center ${className}`}
      onClickCapture={handleClickCapture}
    >
      {children}

      {/* Render tooltip via React Portal in document.body with fixed positioning */}
      {activeGuidance && typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: pos ? `${pos.top}px` : '-9999px',
            left: pos ? `${pos.left}px` : '-9999px',
            maxWidth: pos ? `${pos.maxWidth}px` : '270px',
            zIndex: 99999,
          }}
          className="pointer-events-none flex flex-col items-center w-max animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="relative bg-zinc-950/95 text-white backdrop-blur-md border border-amber-500/40 px-3.5 py-2.5 rounded-2xl shadow-2xl shadow-black/60 text-right dir-rtl">
            {/* Arrow pointing accurately to icon center */}
            {pos && (
              <div
                className={`absolute w-2.5 h-2.5 bg-zinc-950 border-amber-500/40 pointer-events-none ${
                  pos.placeBelow
                    ? '-top-1.5 border-t border-r'
                    : '-bottom-1.5 border-b border-l'
                }`}
                style={{
                  left: `${pos.arrowLeft}px`,
                  transform: 'translateX(-50%) rotate(45deg)',
                }}
              />
            )}

            <div className="flex items-start gap-2 dir-rtl relative z-10">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-[11px] leading-snug font-medium text-zinc-100">
                <span>{activeGuidance}</span>
                <span className="block text-[10px] text-amber-300 font-bold mt-1 dir-rtl">
                  {lang === 'en' ? 'Tap again to activate' : 'انقر مجدداً للتفعيل'}
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
