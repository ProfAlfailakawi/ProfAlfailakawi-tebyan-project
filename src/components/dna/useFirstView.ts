import * as React from 'react';
import { effectiveThreshold, hasPlayed, isInTransition, journeySlot, markPlayed, prefersReducedMotion } from './useJourneyReveal';

/**
 * One-shot "first view" trigger for draw-in effects (rings, sparklines, timelines, count-up).
 * Reuses the journey reveal's play-once store, reduced-motion check and page-transition wait.
 *
 * `phase` is `null` whenever the FINAL state should simply be shown (first render, SSR, tests,
 * no IntersectionObserver, reduced motion, already played key, after the effect settled).
 * Otherwise it goes `'pre'` (initial, un-drawn state; armed in a layout effect before paint)
 * then `'go'` (transition to the final state) then back to `null`.
 */
export type FirstViewPhase = null | 'pre' | 'go';

export interface FirstViewOptions {
  enabled?: boolean;
  /** Entity id: plays once per key per tab session, even across remounts. Without it: once per mount. */
  playKey?: string | number | null;
  threshold?: number;
  /** How long the 'go' phase lasts before settling back to the final state. */
  ms?: number;
  /** Keep waiting (stay un-drawn) while true, e.g. while data is loading. */
  hold?: boolean;
}

const SETTLE_WAIT_MAX_MS = 2600;
const SETTLE_POLL_MS = 90;
const START_DELAY_MS = 120;

const useIsoLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

/** Play-once key namespace, so a draw never collides with a journey stepper that shares an id. */
export const drawStoreKey = (playKey: string | number | null | undefined) =>
  playKey == null || playKey === '' ? null : `draw:${playKey}`;

export function useFirstView<T extends Element = HTMLElement>({
  enabled = true,
  playKey,
  threshold = 0.4,
  ms = 1400,
  hold = false,
}: FirstViewOptions = {}) {
  const ref = React.useRef<T | null>(null);
  const [phase, setPhase] = React.useState<FirstViewPhase>(null);
  const doneRef = React.useRef<string | null>(null);
  const key = drawStoreKey(playKey);
  const slot = journeySlot(key);

  useIsoLayoutEffect(() => {
    if (!enabled || hold || doneRef.current === slot) return;
    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) return;
    if (key && hasPlayed(key)) {
      doneRef.current = slot;
      return;
    }
    const el = ref.current;
    if (!el) return;

    setPhase('pre');
    const timers: number[] = [];
    const start = () => {
      io.disconnect();
      if (key) markPlayed(key);
      const t0 = Date.now();
      let lastTop: number | null = null;
      const go = () =>
        timers.push(
          window.setTimeout(() => {
            setPhase('go');
            timers.push(
              window.setTimeout(() => {
                doneRef.current = slot;
                setPhase(null);
              }, ms),
            );
          }, START_DELAY_MS),
        );
      const waitSettled = () => {
        if (!el.isConnected || Date.now() - t0 >= SETTLE_WAIT_MAX_MS || !isInTransition(el, lastTop)) return go();
        lastTop = el.getBoundingClientRect().top;
        timers.push(window.setTimeout(waitSettled, SETTLE_POLL_MS));
      };
      waitSettled();
    };
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        if (!e || !e.isIntersecting) return;
        const need = effectiveThreshold(threshold, el.getBoundingClientRect().height, window.innerHeight);
        if (e.intersectionRatio >= need - 0.01) start();
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      // interrupted before settling (unmount, strict-mode double effect): never leave it un-drawn
      if (doneRef.current !== slot) setPhase(null);
    };
  }, [enabled, hold, key, slot, threshold, ms]);

  return { ref, phase };
}

/** ease-out using the kit's own curve family (cubic-bezier(0.22, 0.78, 0.24, 1) ~ easeOutCubic). */
export const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

/** Value shown while counting: rounded to `decimals`, never above the final value's magnitude. */
export const countStep = (final: number, progress: number, decimals = 0) => {
  const f = 10 ** decimals;
  return Math.round(final * easeOut(progress) * f) / f;
};

/**
 * Count 0 -> value once per playKey on first view. Returns the number to display and the
 * element ref. After it has played, later value changes snap (no re-roll).
 */
export function useCountUp<T extends Element = HTMLElement>(
  value: number,
  { playKey, decimals = 0, enabled = true, hold = false, ms = 700 }: { playKey?: string | number | null; decimals?: number; enabled?: boolean; hold?: boolean; ms?: number } = {},
) {
  const finite = Number.isFinite(value);
  const { ref, phase } = useFirstView<T>({ enabled: enabled && finite, playKey, ms: ms + 250, hold });
  const [p, setP] = React.useState(0);
  React.useEffect(() => {
    if (phase === 'pre') setP(0);
    if (phase !== 'go') return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      setP(t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, ms]);
  const shown = !finite ? value : phase === 'pre' ? 0 : phase === 'go' ? countStep(value, p, decimals) : value;
  return { ref, shown, phase };
}
