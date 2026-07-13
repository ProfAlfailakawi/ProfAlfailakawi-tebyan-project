import { useCallback, useEffect, useRef, useState } from 'react';

type FluidTheme = 'calm' | 'active' | 'hyper';

/**
 * Keeps the visual typing mood without re-rendering the 5k-line gateway on
 * every key stroke. The old implementation updated two counters per key and
 * ran a permanent interval; on mobile that queued renders right before submit.
 */
export const useFluidTyping = () => {
  const [fluidTheme, setFluidTheme] = useState<FluidTheme>('calm');
  const themeRef = useRef<FluidTheme>('calm');
  const lastTypeTimeRef = useRef(Date.now());
  const burstRef = useRef(0);
  const calmTimerRef = useRef<number | null>(null);

  const commitTheme = useCallback((next: FluidTheme) => {
    if (themeRef.current === next) return;
    themeRef.current = next;
    setFluidTheme(next);
  }, []);

  const onType = useCallback(() => {
    const now = Date.now();
    const delta = now - lastTypeTimeRef.current;
    lastTypeTimeRef.current = now;
    burstRef.current = delta < 180
      ? Math.min(12, burstRef.current + 1)
      : Math.max(1, burstRef.current - 2);

    const next: FluidTheme = burstRef.current >= 9
      ? 'hyper'
      : burstRef.current >= 4
        ? 'active'
        : 'calm';
    commitTheme(next);

    if (calmTimerRef.current !== null) window.clearTimeout(calmTimerRef.current);
    calmTimerRef.current = window.setTimeout(() => {
      burstRef.current = 0;
      commitTheme('calm');
    }, 650);
  }, [commitTheme]);

  useEffect(() => () => {
    if (calmTimerRef.current !== null) window.clearTimeout(calmTimerRef.current);
  }, []);

  const getFluidStyles = useCallback(() => {
    switch (fluidTheme) {
      case 'hyper': return 'bg-gradient-to-r from-orange-500/10 to-rose-500/10 border-orange-400 font-bold transition-colors duration-150';
      case 'active': return 'bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 border-indigo-400 transition-colors duration-150';
      default: return 'bg-zinc-50 border-zinc-200 transition-colors duration-150';
    }
  }, [fluidTheme]);

  const getFluidAmbient = useCallback(() => {
    switch (fluidTheme) {
      case 'hyper': return 'shadow-[0_0_28px_rgba(249,115,22,0.10)] ring-1 ring-orange-400/35';
      case 'active': return 'shadow-[0_0_16px_rgba(99,102,241,0.08)] ring-1 ring-indigo-400/22';
      default: return 'shadow-none ring-0';
    }
  }, [fluidTheme]);

  return { onType, fluidTheme, getFluidStyles, getFluidAmbient };
};
