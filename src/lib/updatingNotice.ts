/**
 * «نُحدّث البرنامج» داخل التطبيق.
 *
 * دالة /api (Cloud Function «api») تجيب بـ JSON دائماً. فإن جاء 500/502/503/504 بصفحة
 * HTML، فهذا جوابُ منصّة Google لا جوابُ تبيان: الدالة تُنشر أو تتعثّر. بدل رسالة خطأٍ غامضة
 * يظهر إشعارٌ هادئ واحد بشكل إشعارات تبيان (حبّة أعلى الشاشة بنقطةٍ ذهبية)، ويسأل `probe` كل ثلاث ثوانٍ (ويتباطأ إلى خمس عشرة) حتى يعود
 * الخادم، فيختفي ويُعلم من ينتظر عبر SERVER_BACK_EVENT.
 */

const UPDATING_STATUSES = new Set([500, 502, 503, 504]);

export const UPDATING_MESSAGE = 'يُجدَّد تبيان الآن؛ نُعيد ترتيب صفحاته ونعود بعد قليل.';
/** يُطلق على window حين يعود الخادم. */
export const SERVER_BACK_EVENT = 'tebyan:server-back';

/** جوابُ المنصّة لا جوابُ البرنامج: 5xx بغير JSON. */
export const isPlatformUpdating = (status: number, contentType: string | null | undefined): boolean =>
  UPDATING_STATUSES.has(status) && !String(contentType || '').includes('application/json');

/** هل تجيب دالة /api أصلاً؟ */
export const apiAnswers = (): Promise<boolean> =>
  fetch('/api/health', { cache: 'no-store', credentials: 'same-origin' }).then((r) => r.ok, () => false);

/** هل تجيب الاستضافة نفسها؟ (الصفحة الأولى، لا /api) */
export const siteAnswers = (): Promise<boolean> =>
  fetch('/', { cache: 'no-store', credentials: 'same-origin' }).then((r) => r.ok, () => false);

let notice: HTMLElement | null = null;
const waiting = new Set<() => void>();

/** يُظهر الشريطَ مرّةً واحدة مهما تكرّر الطلب، ويختفي حين يجيب `probe`. */
export function showUpdatingNotice(probe: () => Promise<boolean>, onBack?: () => void): void {
  if (onBack) waiting.add(onBack);
  if (notice || typeof document === 'undefined' || !document.body) return;
  const bar = document.createElement('div');
  bar.className = 'tebyan-updating-notice';
  bar.setAttribute('role', 'status');
  bar.setAttribute('aria-live', 'polite');
  bar.dir = 'rtl';
  /* مثل إشعار App.tsx: حبّةٌ أعلى الشاشة تحت الترويسة، بيضاءُ شفيفة ونقطةٌ في أولها — هنا ذهبيةٌ كشريط العلامة. */
  const dot = document.createElement('span');
  dot.setAttribute('aria-hidden', 'true');
  dot.style.cssText = 'flex:none;width:8px;height:8px;border-radius:999px;background:#a68f58;box-shadow:0 0 0 3px rgb(166 143 88 / .18)';
  const text = document.createElement('span');
  text.textContent = UPDATING_MESSAGE;
  bar.append(dot, text);
  bar.style.cssText = [
    'position:fixed', 'top:calc(env(safe-area-inset-top) + 5.25rem)', 'left:50%', 'transform:translateX(-50%)', 'width:max-content', 'max-width:90vw',
    'z-index:2147483000', 'display:flex', 'align-items:center', 'gap:12px', 'padding:12px 22px', 'border-radius:999px',
    'font-family:inherit', 'font-size:14px', 'font-weight:500', 'line-height:1.6',
    'background:rgb(255 255 255 / .9)', 'color:#182231', 'border:1px solid rgb(110 91 145 / .18)',
    '-webkit-backdrop-filter:blur(24px)', 'backdrop-filter:blur(24px)', 'box-shadow:0 8px 30px rgb(0 0 0 / .12)', 'pointer-events:none',
  ].join(';');
  document.body.appendChild(bar);
  notice = bar;
  let tries = 0;
  const ask = async () => {
    const back = await probe().catch(() => false);
    if (!back) {
      tries++;
      window.setTimeout(ask, Math.min(15_000, 3000 * Math.pow(1.3, Math.max(0, tries - 5))));
      return;
    }
    bar.remove();
    notice = null;
    const callbacks = [...waiting];
    waiting.clear();
    callbacks.forEach((callback) => { try { callback(); } catch { /* لا يُوقف منتظرٌ البقية */ } });
    window.dispatchEvent(new Event(SERVER_BACK_EVENT));
  };
  window.setTimeout(ask, 3000);
}
