import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';

// The landscape book (Duo inner screen opened): see «Book spread» in src/index.css.
const BOOK_QUERY =
  'screen and (min-width: 721px) and (max-width: 1000px) and (min-height: 520px) and (max-height: 960px) and (orientation: landscape)';
const SPREAD_EDGE = 20; // px between the window edge and the open book

/**
 * In the book a result is a reading text: instead of a narrow column on one page it
 * opens across both pages (two columns, the first on the right page in Arabic, the
 * fold in the middle). The task page keeps its width; only the card is widened, so it
 * needs the distance from its page's start edge to the window's edge, measured here.
 * Outside the book nothing is set and the card is the ordinary single column.
 */
function useBookSpread(ref: React.RefObject<HTMLElement | null>) {
  React.useLayoutEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(BOOK_QUERY);
    const clear = () => {
      el.removeAttribute('data-spread');
      el.style.removeProperty('--spread-w');
      el.style.removeProperty('--spread-shift');
    };
    const apply = () => {
      if (!mq.matches) return clear();
      const w = document.documentElement.clientWidth;
      const hostRect = host.getBoundingClientRect();
      if (!hostRect.width) return clear();
      const rtl = getComputedStyle(host).direction === 'rtl';
      const shift = rtl ? w - SPREAD_EDGE - hostRect.right : hostRect.left - SPREAD_EDGE;
      el.setAttribute('data-spread', '');
      el.style.setProperty('--spread-w', `${w - 2 * SPREAD_EDGE}px`);
      el.style.setProperty('--spread-shift', `${-shift}px`);
    };
    apply();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(apply) : null;
    ro?.observe(host);
    ro?.observe(document.documentElement);
    mq.addEventListener?.('change', apply);
    window.addEventListener('resize', apply);
    return () => {
      ro?.disconnect();
      mq.removeEventListener?.('change', apply);
      window.removeEventListener('resize', apply);
      clear();
    };
  }, [ref]);
}

/**
 * Shared sectioned result card for the tool tabs (Oracle, Concepts, ...).
 * Purely presentational: renders the same markdown text it is given, with
 * Amiri section headings and a gentle staggered fade-in of each section.
 */
export const ResultCard: React.FC<{
  text: string;
  /** Small caption above the text (e.g. "الجواب"). */
  label?: string;
  className?: string;
  id?: string;
}> = ({ text, label, className, id }) => {
  const ref = React.useRef<HTMLElement | null>(null);
  useBookSpread(ref);
  return (
    <section id={id} ref={ref} className={cn('tbn-result', className)}>
      {label && <div className="tbn-result__label">{label}</div>}
      <div className="tbn-result__body">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    </section>
  );
};
