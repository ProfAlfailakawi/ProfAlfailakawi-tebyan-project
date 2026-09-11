import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

/**
 * TebyanLoader — the app's branded micro loader.
 *
 * A small point of light with a very restrained halo; a few fine rays
 * converge once and a condensed mishkat (niche) arch draws itself around
 * the light. After that single assembly the loader settles into a calm
 * idle pulse (no re-scatter, no spinner rotation).
 *
 * - CSS-driven (transform/opacity only), respects prefers-reduced-motion.
 * - Delayed appearance: hidden for ~250ms so fast operations never flash it.
 * - role="status" + sr-only label for assistive tech.
 */

export type TebyanLoaderSize = 16 | 24 | 32 | 48 | 64;

/** Hook: becomes true only after `delay` ms. Use to gate loader mounting. */
export const useDelayedVisible = (delay = 250) => {
  const [visible, setVisible] = useState(delay <= 0);
  useEffect(() => {
    if (delay <= 0) return;
    const t = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(t);
  }, [delay]);
  return visible;
};

export const TebyanLoader: React.FC<{
  size?: TebyanLoaderSize | number;
  className?: string;
  /** sr-only label; defaults to Arabic "جارٍ التحميل" */
  label?: string;
  /** visible calm status text under the loader (for long waits) */
  statusText?: string;
  /** ms before the loader becomes visible (0 = immediate). Default 250. */
  appearDelay?: number;
}> = ({ size = 32, className, label = 'جارٍ التحميل', statusText, appearDelay = 250 }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('tbn-loader-wrap', className)}
      style={{ ['--tbn-delay' as any]: `${appearDelay}ms` }}
    >
      <span className="sr-only">{label}</span>
      <svg
        className="tbn-loader"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        aria-hidden="true"
        focusable="false"
      >
        {/* soft halo — static gradient, animated only via opacity/scale */}
        <defs>
          <radialGradient id="tbnHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle className="tbn-halo" cx="24" cy="26" r="11" fill="url(#tbnHalo)" />
        {/* condensed mishkat arch — draws once */}
        <path
          className="tbn-arch"
          d="M13 40 V26 Q13 16 24 12 Q35 16 35 26 V40"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          pathLength={1}
        />
        {/* fine rays converging toward the light — once */}
        <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <line className="tbn-ray tbn-ray1" x1="24" y1="19.5" x2="24" y2="22" />
          <line className="tbn-ray tbn-ray2" x1="18.5" y1="23" x2="20.5" y2="24.5" />
          <line className="tbn-ray tbn-ray3" x1="29.5" y1="23" x2="27.5" y2="24.5" />
        </g>
        {/* small dots settling at the arch base */}
        <circle className="tbn-dot tbn-dot1" cx="17" cy="36" r="1.1" fill="currentColor" />
        <circle className="tbn-dot tbn-dot2" cx="31" cy="36" r="1.1" fill="currentColor" />
        {/* the point of light */}
        <circle className="tbn-core" cx="24" cy="26" r="2.4" fill="currentColor" />
      </svg>
      {statusText && <p className="tbn-status">{statusText}</p>}
    </div>
  );
};

/** 16px in-button variant with reserved space (no layout shift). */
export const TebyanButtonLoader: React.FC<{ className?: string; label?: string }> = ({
  className,
  label = 'جارٍ المعالجة',
}) => <TebyanLoader size={16} appearDelay={0} label={label} className={cn('tbn-inline', className)} />;

export default TebyanLoader;
