import * as React from 'react';

/**
 * One-shot "stations light up in sequence" intro for a journey stepper.
 *
 * Truth rule: `target` is the number of stations that are REALLY lit (index of the
 * last done/current step + 1). The hook only controls how many of those are shown so
 * far; it never goes past `target`, and it never runs when there is nothing to reveal.
 *
 * Returns `lit`: a number while the intro runs (render step i as its real state only
 * when i < lit), or `null` when settled / not animating (render the real states).
 * The first render is always the final state (SSR / no-JS safe); the intro is armed
 * in a layout effect before the first paint so there is no flash of the end state.
 */

export interface JourneyRevealOptions {
  /** Number of stations that are really lit. */
  target: number;
  /** Total number of stations (drives the default step duration). */
  count: number;
  /** Delay between stations. Default: clamp(4000 / count, 350, 750). */
  stepMs?: number;
  /** Visible fraction of the element needed to start. Default 0.5. */
  threshold?: number;
  enabled?: boolean;
  /** Keep waiting (do not start) while true, e.g. while data is still loading. */
  hold?: boolean;
  /** Entity id: the intro plays once per key per tab session, even across remounts. */
  playKey?: string | number | null;
}

const played = new Set<string>();
const STORAGE_PREFIX = 'tbn-journey:';
/** Time the last station keeps its one-shot halo before the intro is considered settled. */
const SETTLE_MS = 1600;
const START_DELAY_MS = 180;

const hasPlayed = (key: string) => {
  if (played.has(key)) return true;
  try {
    return sessionStorage.getItem(STORAGE_PREFIX + key) === '1';
  } catch {
    return false;
  }
};

const markPlayed = (key: string) => {
  played.add(key);
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, '1');
  } catch {
    /* storage unavailable: the module-level Set still covers this tab */
  }
};

export const journeyStepMs = (count: number) =>
  Math.min(750, Math.max(350, Math.round(4000 / Math.max(1, count))));

/**
 * A threshold the element can actually reach: an element taller than ~90% of the viewport
 * can never be 50% visible in a short viewport, which would leave the intro waiting forever.
 */
export const effectiveThreshold = (threshold: number, elementHeight: number, viewportHeight: number) => {
  if (!(elementHeight > 0) || !(viewportHeight > 0)) return threshold;
  return Math.max(0.1, Math.min(threshold, (0.9 * viewportHeight) / elementHeight));
};
/** If the element is on screen but below the threshold, start anyway after this long. */
const VISIBLE_FALLBACK_MS = 1200;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// No layout-effect warning when rendered on the server (static prerender).
const useIsoLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

export function useJourneyReveal<T extends Element = HTMLElement>({
  target,
  count,
  stepMs,
  threshold = 0.5,
  enabled = true,
  hold = false,
  playKey,
}: JourneyRevealOptions) {
  const ref = React.useRef<T | null>(null);
  const [lit, setLit] = React.useState<number | null>(null);
  const targetRef = React.useRef(target);
  targetRef.current = target;
  // Once per mount: later re-renders (live / polled data) must never replay the intro.
  const doneRef = React.useRef(false);
  const step = stepMs ?? journeyStepMs(count);
  const key = playKey == null || playKey === '' ? null : String(playKey);
  const hasTarget = target > 0;

  useIsoLayoutEffect(() => {
    // `doneRef` is per mount: later re-renders (live / polled data) never replay the intro.
    if (!enabled || hold || doneRef.current || !hasTarget) return;
    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) return;
    if (key && hasPlayed(key)) {
      doneRef.current = true;
      return;
    }
    const el = ref.current;
    if (!el) return;

    setLit(0);
    const timers: number[] = [];
    let interval: number | undefined;
    const finish = () => {
      window.clearInterval(interval);
      timers.push(
        window.setTimeout(() => {
          doneRef.current = true;
          setLit(null);
        }, SETTLE_MS),
      );
    };
    let fallback: number | undefined;
    const need = effectiveThreshold(threshold, el.getBoundingClientRect().height, window.innerHeight);
    const start = () => {
      window.clearTimeout(fallback);
      io.disconnect();
      if (key) markPlayed(key);
      let n = 0;
      const tick = () => {
        n += 1;
        const goal = Math.max(0, targetRef.current);
        setLit(Math.min(n, goal));
        if (n >= goal) finish();
      };
      timers.push(
        window.setTimeout(() => {
          tick();
          if (n < Math.max(0, targetRef.current)) interval = window.setInterval(tick, step);
        }, START_DELAY_MS),
      );
    };
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        if (!e) return;
        if (!e.isIntersecting) {
          window.clearTimeout(fallback);
          fallback = undefined;
        } else if (e.intersectionRatio >= need - 0.01) {
          start();
        } else if (fallback === undefined) {
          // visible but clipped below the threshold (overflow, split screen): never stay hidden
          fallback = window.setTimeout(() => {
            // still really on screen (not a 1px sliver)? then stop waiting for an unreachable ratio
            const r = el.getBoundingClientRect();
            const shown = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
            if (r.height > 0 && shown / Math.min(r.height, window.innerHeight) >= 0.5) start();
            else fallback = undefined;
          }, VISIBLE_FALLBACK_MS);
        }
      },
      { threshold: [0, need] },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(fallback);
      window.clearInterval(interval);
      // Interrupted before settling (unmount, strict-mode double effect): never leave lit stuck.
      if (!doneRef.current) setLit(null);
    };
    // `target` itself is read through a ref so live data never restarts the intro.
  }, [enabled, hold, key, step, threshold, hasTarget]);

  return { ref, lit };
}
