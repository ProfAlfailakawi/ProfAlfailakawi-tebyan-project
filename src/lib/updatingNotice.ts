/**
 * «نُحدّث البرنامج» داخل التطبيق.
 *
 * دالة /api (Cloud Function «api») تجيب بـ JSON دائماً. فإن جاء 500/502/503/504 بصفحة
 * HTML، فهذا جوابُ منصّة Google لا جوابُ تبيان: الدالة تُنشر أو تتعثّر. بدل رسالة خطأٍ غامضة
 * يظهر شريطٌ هادئ واحد، ويسأل `probe` كل ثلاث ثوانٍ (ويتباطأ إلى خمس عشرة) حتى يعود
 * الخادم، فيختفي ويُعلم من ينتظر عبر SERVER_BACK_EVENT.
 */

const UPDATING_STATUSES = new Set([500, 502, 503, 504]);

export const UPDATING_MESSAGE = 'نُحدّث البرنامج الآن ✨ لحظاتٍ ونعود.';
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
  bar.textContent = UPDATING_MESSAGE;
  bar.style.cssText = [
    'position:fixed', 'inset-inline:0', 'bottom:max(18px,env(safe-area-inset-bottom))', 'margin:0 auto', 'width:max-content', 'max-width:calc(100vw - 32px)',
    'z-index:2147483000', 'padding:11px 18px', 'border-radius:14px', 'font-family:inherit', 'font-size:14px', 'font-weight:600', 'line-height:1.6',
    'background:#ffffff', 'color:#182231', 'border:1px solid rgb(24 34 49 / .12)',
    'box-shadow:0 14px 36px rgb(24 34 49 / .18)', 'text-align:center', 'pointer-events:none',
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
