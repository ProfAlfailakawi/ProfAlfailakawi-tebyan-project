/**
 * صفحة تشخيص ركن الودجت على iPhone Duo — تُحمَّل فقط عند وجود ?duo-debug=1 (انظر main.tsx).
 * ترسم إطار المنطقة المحجوزة بحدود حمراء شفافة (pointer-events: none) ولوحة صغيرة بقيم
 * safe-area والنافذة والوضع (standalone / Capacitor) وقيم المتغيرات، وتضع اللوحة خارج المنطقة (أسفل اليسار).
 * لا تغيّر شيئاً في الصفحة ولا تكتب أي بيانات.
 */

const W = 96; // نفس --duo-widget-w (تقدير)
const H = 'clamp(64px, 31vh, 270px)'; // نفس --duo-widget-h (تقدير)

function envPx(side: 'top' | 'right' | 'bottom' | 'left'): string {
  const probe = document.createElement('div');
  probe.style.cssText = `position:fixed;visibility:hidden;pointer-events:none;width:0;height:0;padding-${side}:env(safe-area-inset-${side}, 0px)`;
  document.body.appendChild(probe);
  const v = getComputedStyle(probe).getPropertyValue(`padding-${side}`);
  probe.remove();
  return v || '0px';
}

export function mountDuoDebug(): void {
  if (document.getElementById('duo-debug-root')) return;
  // معايرة حيّة على الجهاز: ?duo-debug=1&duo-w=110&duo-h=270 تتجاوز المتغيرين (هنا فقط، ومع duo-debug).
  const q = new URLSearchParams(window.location.search);
  const ow = parseFloat(q.get('duo-w') || '');
  const oh = parseFloat(q.get('duo-h') || '');
  if (ow > 0) document.documentElement.style.setProperty('--duo-widget-w', `${ow}px`);
  if (oh > 0) document.documentElement.style.setProperty('--duo-widget-h', `${oh}px`);
  const root = document.createElement('div');
  root.id = 'duo-debug-root';
  root.setAttribute('aria-hidden', 'true');
  root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';

  // الإطار: يُرسم دائماً بمقاس الركن المتوقع، حتى لو كانت المنطقة غير نشطة، ليرى المالك أين ستقع.
  const frame = document.createElement('div');
  frame.style.cssText = `position:absolute;top:0;right:0;width:${ow > 0 ? ow : W}px;height:${oh > 0 ? oh + 'px' : H};box-sizing:border-box;border:2px solid rgba(220,0,0,.9);background:rgba(220,0,0,.10);pointer-events:none`;
  root.appendChild(frame);

  const panel = document.createElement('pre');
  panel.style.cssText = 'position:absolute;left:6px;bottom:6px;margin:0;max-width:calc(100vw - 90px);padding:6px 8px;border-radius:8px;background:rgba(20,20,30,.82);color:#fff;font:11px/1.45 ui-monospace,Menlo,monospace;direction:ltr;text-align:left;white-space:pre-wrap;pointer-events:none';
  root.appendChild(panel);
  document.body.appendChild(root);

  const render = () => {
    const cs = getComputedStyle(document.documentElement);
    const v = (n: string) => cs.getPropertyValue(n).trim() || '(unset)';
    const w = parseFloat(v('--duo-widget-w')) || 0;
    const vv = window.visualViewport;
    const nav = navigator as Navigator & { standalone?: boolean };
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    panel.textContent = [
      `widget zone active : ${w > 0 ? 'YES' : 'NO (tokens are 0 on this screen)'}`,
      `--duo-widget-w/gap : ${v('--duo-widget-w')} / ${v('--duo-widget-gap')}`,
      `--duo-widget-h     : ${v('--duo-widget-h')} (frame ${oh > 0 ? oh : Math.round(Math.min(270, Math.max(64, window.innerHeight * 0.31)))}px)`,
      `safe-area t/r/b/l  : ${envPx('top')} ${envPx('right')} ${envPx('bottom')} ${envPx('left')}`,
      `inner              : ${window.innerWidth} x ${window.innerHeight}`,
      `visualViewport     : ${vv ? `${Math.round(vv.width)} x ${Math.round(vv.height)} @ ${vv.scale.toFixed(2)}x` : 'n/a'}`,
      `dir / orientation  : ${document.documentElement.dir || getComputedStyle(document.body).direction} / ${window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait'}`,
      `standalone         : navigator=${String(nav.standalone ?? 'n/a')} display-mode=${matchMedia('(display-mode: standalone)').matches}`,
      `Capacitor          : ${cap?.isNativePlatform?.() ? `native ${(cap as { getPlatform?: () => string }).getPlatform?.() ?? '?'}` : 'not native (browser)'}`,
      `UA                 : ${/AppleWebKit/.test(navigator.userAgent) && !/Safari\//.test(navigator.userAgent) ? 'WKWebView-like (no Safari/ token)' : 'Safari/browser (has Safari/ token)'}`,
      `override           : duo-w=${ow > 0 ? ow : '-'} duo-h=${oh > 0 ? oh : '-'}`,
      'calibrate: send a screenshot WITH the red frame; raise duo-w / duo-h',
      '(?duo-debug=1&duo-w=110&duo-h=270) until the frame covers the capsule.',
    ].join('\n');
  };
  render();
  window.addEventListener('resize', render);
  window.addEventListener('orientationchange', render);
  window.visualViewport?.addEventListener('resize', render);
}
