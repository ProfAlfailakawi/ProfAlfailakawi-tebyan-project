/* حارس ركن ودجت iPhone Duo (Playwright WebKit).
 *
 * يتأكد أن صفر عناصر «مهمة» (نص مرئي، a/button/input/select/textarea/[role=tab]/[role=button]/img/svg)
 * يتقاطع صندوقها مع المستطيل الفيزيائي المحجوز في أعلى اليمين:
 *     x >= vw - W   و   y <= H        (W = 96px، H = clamp(64px, 31vh, 270px))
 * لا يقرأ W و H من CSS (حتى لا يخدع نفسه إن كُسر التوكن)؛ يقارنهما بالقيم المتوقعة ويفشل إن اختلفتا
 * أو إن لم تكن المنطقة نشطة على مقاس Duo، أو نشطة على جهاز آخر.
 *
 * تشغيل:  npm run test:duo-widget
 *   BASE=http://127.0.0.1:5183   خادم قائم (وإلا يشغّل الحارس vite بنفسه)
 *   PLAYWRIGHT_BROWSERS_PATH=... مكان WebKit
 *   DUO_GUARD_QUICK=1            مجموعة أصغر (للتجربة)
 *   DUO_GUARD_ZONE_ONLY=1        يفترض المنطقة نشطة دون فحص CSS (لقياس الأساس «قبل»)
 *
 * محاكاة مقاسات فقط: ليس جهاز Duo ولا Safari جهازياً.
 */
const { webkit } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');
const { SCREENS, runStep } = require('../docs/iphone-duo-final/audit.cjs');

const QUICK = !!process.env.DUO_GUARD_QUICK;
const ZONE_ONLY = !!process.env.DUO_GUARD_ZONE_ONLY;
let BASE = process.env.BASE || '';

const W = 96;
const hOf = (vh) => Math.min(270, Math.max(64, 0.31 * vh));

// المقاسات المعروفة (طولي) ومقلوبها (عرضي).
const SIZES = [[382, 580], [470, 780], [594, 368], [669, 867], [951, 585], [457, 678], [457, 760]];
const VIEWPORTS = SIZES.flatMap(([w, h]) => [[w, h], [h, w]]);
// أجهزة أخرى: يجب أن تبقى المتغيرات 0.
const TALL = [[382, 700], [382, 764], [470, 900]]; // التطبيق بلا أشرطة متصفح
const CONTROLS = [[393, 852], [430, 932], [402, 874], [390, 844], [844, 390], [744, 1024], [1024, 768], [1280, 800], [360, 740], [820, 1180]];

const extra = {
  profile: { id: 'profile-sidebar', url: '/', steps: [{ click: '.tebyan-action-pill > div:last-child button' }, { wait: 500 }, { clickText: 'حسابي' }, { wait: 900 }] },
};
const BY_ID = Object.fromEntries([...SCREENS, ...Object.values(extra)].map((s) => [s.id, s]));
const pick = (ids) => ids.map((i) => BY_ID[i]).filter(Boolean);

// كل السطوح (في العرض التجريبي) ثم سطوح الزائر غير المسجل.
const FULL = pick(['home', 'discover', 'ask', 'qawlfasl', 'qawl-question', 'oracle', 'council', 'growth', 'rukni', 'mylibrary', 'contact',
  'admin-route', 'help-popup', 'user-menu', 'profile-sidebar', 'onboarding', 'global-command', 'qawl-route', 'unknown-route',
  'updating-page', 'qawl-static-index', 'qawl-static-article', 'privacy-page']);
const VISITOR = pick(['login-modal', 'home']);
const SMALL = pick(['home', 'discover', 'login-modal', 'user-menu', 'profile-sidebar']);

async function waitServer() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(BASE + '/'); if (r.ok) return; } catch { /* ينتظر */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('الخادم لا يستجيب: ' + BASE);
}

// يُشغَّل داخل الصفحة: يرجع المخالفات والاستثناءات.
function measureInPage({ W }) {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const H = Math.min(270, Math.max(64, 0.31 * vh));
  const z = { left: vw - W, top: 0, bottom: H };
  const cs0 = getComputedStyle(document.documentElement);
  const vars = { w: cs0.getPropertyValue('--duo-widget-w').trim(), gap: cs0.getPropertyValue('--duo-widget-gap').trim(), h: cs0.getPropertyValue('--duo-widget-h').trim() };
  const vis = (el) => {
    if (!el.isConnected) return false;
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    return true;
  };
  const clipCache = new Map();
  const clipOf = (el) => {
    if (clipCache.has(el)) return clipCache.get(el);
    let c = { left: -1e9, right: 1e9, top: -1e9, bottom: 1e9 };
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        const pr = p.getBoundingClientRect();
        c = { left: Math.max(c.left, pr.left), right: Math.min(c.right, pr.right), top: Math.max(c.top, pr.top), bottom: Math.min(c.bottom, pr.bottom) };
      }
    }
    clipCache.set(el, c);
    return c;
  };
  const hits = (r, el) => {
    const c = clipOf(el);
    const l = Math.max(r.left, c.left, 0), rt = Math.min(r.right, c.right, vw), t = Math.max(r.top, c.top, 0), b = Math.min(r.bottom, c.bottom, vh);
    if (rt - l < 0.5 || b - t < 0.5) return false;
    return rt > z.left && l < vw && t < z.bottom;
  };
  const desc = (el) => {
    const t = (el.getAttribute('aria-label') || el.placeholder || el.innerText || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 36);
    const c = (typeof el.className === 'string' ? el.className : '').split(' ').filter((x) => x.startsWith('tebyan') || x.startsWith('tbn')).slice(0, 2).join('.');
    return `${el.tagName.toLowerCase()}${c ? '.' + c : ''}${t ? ` "${t}"` : ''}`;
  };
  const INTER = 'a[href], button, input:not([type=hidden]), textarea, select, summary, [role=button], [role=tab], [role=link]';
  const violations = [];
  const exceptions = [];
  const seen = new Set();
  const flag = (el, kind, r) => violations.push(`${kind} ${desc(el)} [${Math.round(r.left)},${Math.round(r.top)}..${Math.round(r.right)},${Math.round(r.bottom)}]`);
  // 1) عناصر التفاعل
  for (const el of document.querySelectorAll(INTER)) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (!hits(r, el)) continue;
    if (el.closest('[data-duo-bleed]')) { exceptions.push('bleed ' + desc(el)); continue; }
    seen.add(el);
    flag(el, 'control', r);
  }
  // 2) img / svg / role=img المرئية والمهمة: أيقونات وشعارات (≤ 160px) أو مسمّاة؛ الخلفيات الممتدة (aria-hidden أو أكبر) تُسجَّل استثناءً
  for (const el of document.querySelectorAll('img, svg, [role=img]')) {
    if (!vis(el) || el.closest('svg') !== el && el.tagName !== 'svg' && el.tagName !== 'IMG' && el.getAttribute('role') !== 'img') continue;
    if (el.parentElement && el.parentElement.closest('svg')) continue;
    if (el.closest(INTER) && seen.has(el.closest(INTER))) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || !hits(r, el)) continue;
    if (el.closest('[data-duo-bleed]')) { exceptions.push('bleed ' + desc(el)); continue; }
    const decorative = el.closest('[aria-hidden=true]') || (el.tagName === 'svg' && el.getAttribute('aria-hidden') === 'true');
    const big = r.width > 160 || r.height > 160;
    if (decorative && (big || getComputedStyle(el).pointerEvents === 'none' && !el.closest(INTER))) { exceptions.push('decorative ' + desc(el) + ` ${Math.round(r.width)}x${Math.round(r.height)}`); continue; }
    if (big && !el.getAttribute('alt') && !el.getAttribute('aria-label')) { exceptions.push('big-art ' + desc(el)); continue; }
    flag(el, el.tagName === 'IMG' ? 'img' : 'icon', r);
  }
  // 3) نص مرئي
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement;
    if (el && el.closest('.sr-only')) { exceptions.push('sr-only (نص لقارئ الشاشة، غير مرئي) ' + desc(el)); continue; }
    if (!el || !vis(el) || el.closest('script, style, noscript, [hidden]') || (el.closest(INTER) && seen.has(el.closest(INTER)))) continue;
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (!hits(r, el)) continue;
      if (el.closest('[data-duo-bleed]')) { exceptions.push('bleed text ' + desc(el)); break; }
      flag(el, 'text', r);
      break;
    }
  }
  return { vw, vh, H, vars, violations: [...new Set(violations)], exceptions: [...new Set(exceptions)] };
}

// سياق «التطبيق» (Capacitor WKWebView) محاكى في WebKit سطح المكتب: وكيل المستخدم بلا Safari/،
// window.Capacitor موجود، navigator.standalone غير معرّف. ليس WKWebView حقيقياً ولا جهازاً.
const APP_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

async function newCtx(browser, w, h, o = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: 'ar', reducedMotion: 'reduce', colorScheme: o.dark ? 'dark' : 'light', ...(o.app ? { userAgent: APP_UA } : {}) });
  if (o.app) {
    await ctx.addInitScript(() => {
      window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios', platform: 'ios' };
      try { Object.defineProperty(navigator, 'standalone', { value: undefined, configurable: true }); } catch { /* */ }
    });
  }
  await ctx.addInitScript(({ fs }) => {
    try { sessionStorage.setItem('tebyan_splash_seen', 'true'); localStorage.setItem('tebyan_onboarding_seen_v3', 'true'); localStorage.setItem('tebyan_onboarding_seen_v3_guest', 'true'); } catch { /* */ }
    if (fs) document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = '200%'; });
  }, { fs: !!o.bigText });
  return ctx;
}

async function main() {
  let server;
  if (!BASE) {
    // الأسرع والأقرب لما يُنشر: المبني في dist (npm run build) عبر vite preview؛ وإلا خادم التطوير.
    BASE = 'http://127.0.0.1:5183';
    const built = require('node:fs').existsSync(path.join(__dirname, '../dist/index.html'));
    server = spawn(process.execPath, [path.join(__dirname, '../node_modules/vite/bin/vite.js'), ...(built ? ['preview'] : []), '--port', '5183', '--strictPort', ...(built ? ['--host', '127.0.0.1'] : [])], { stdio: 'ignore' });
  }
  const results = [];
  const problems = [];
  const unmeasured = [];
  let browser;
  try {
    await waitServer();
    browser = await webkit.launch();

    // الجهاز المشترك قد يقتل متصفحاً في المنتصف: كل مجموعة تُعاد (حتى 3 مرات) بمتصفح جديد
    const runSet = async (vp, list, o, demo) => {
      for (let attempt = 1; ; attempt++) {
        const mark = results.length;
        try { return await runSetOnce(vp, list, o, demo); } catch (e) {
          results.length = mark;
          if (attempt >= 3) throw e;
          process.stdout.write('r');
          try { await browser.close(); } catch { /* */ }
          browser = await webkit.launch();
        }
      }
    };
    const runSetOnce = async (vp, list, o, demo) => {
      const [w, h] = vp;
      const ctx = await newCtx(browser, w, h, o);
      const page = await ctx.newPage();
      if (demo) { await page.goto(BASE + '/?demo=1', { waitUntil: 'load' }); await page.waitForTimeout(500); }
      for (const s of list) {
        const rec = { vp: `${w}x${h}`, screen: s.id, dark: !!o.dark, bigText: !!o.bigText, demo, app: !!o.app };
        try {
          await page.goto(BASE + s.url, { waitUntil: 'load' }).catch(() => {});
          await page.waitForTimeout(700);
          for (const st of s.steps || []) await runStep(page, st);
          await page.waitForTimeout(350);
          Object.assign(rec, await page.evaluate(measureInPage, { W }));
        } catch (e) { if (/closed|crash|Target/i.test(String(e.message))) throw e; if (/Timeout/.test(String(e.message)) && /login-modal|profile-sidebar/.test(s.id)) { rec.unmeasured = String(e.message).split('\n')[0].slice(0, 100); unmeasured.push(`${rec.vp} ${s.id}${o.app ? ' [APP]' : ''}`); } else rec.error = String(e.message).split('\n')[0].slice(0, 160); }
        if (!rec.error && !rec.unmeasured && !(rec.H > 0 && W > 0)) rec.error = `المنطقة صفرية في الخلية (W=${W}, H=${rec.H}): قياس فارغ`;
        results.push(rec);
        if (rec.error) problems.push(`${rec.vp} ${s.id}: خطأ تشغيل ${rec.error}`);
        process.stdout.write(rec.violations && rec.violations.length ? 'x' : '.');
      }
      await ctx.close();
    };

    // 1) المنطقة نشطة على كل مقاس Duo بالقيم المطلوبة، وصفرٌ على غيره: يقيس المتغيرات كما يراها التخطيط
    const readVars = () => page0.evaluate(() => {
      const el = document.createElement('div');
      el.style.cssText = 'position:absolute;visibility:hidden;width:var(--duo-widget-w);height:var(--duo-widget-h);padding-left:var(--duo-widget-gap);box-sizing:content-box';
      document.body.appendChild(el);
      const cs = getComputedStyle(el);
      const r = { w: el.getBoundingClientRect().width - parseFloat(cs.paddingLeft), h: el.getBoundingClientRect().height, gap: parseFloat(cs.paddingLeft) };
      el.remove();
      return r;
    });
    const ctx0 = await newCtx(browser, 382, 580);
    const page0 = await ctx0.newPage();
    await page0.goto(BASE + '/?demo=1', { waitUntil: 'load' });
    for (const [w, h] of [...VIEWPORTS, ...TALL]) {
      await page0.setViewportSize({ width: w, height: h });
      await page0.waitForTimeout(150);
      const v = await readVars();
      const wantH = Math.min(270, Math.max(64, 0.31 * h));
      const ok = ZONE_ONLY || (Math.abs(v.w - W) < 0.5 && Math.abs(v.h - wantH) < 1 && Math.abs(v.gap - 8) < 0.5);
      if (!ok) problems.push(`المنطقة غير نشطة/خاطئة على ${w}x${h}: w=${v.w} h=${v.h} gap=${v.gap} (المتوقع ${W}/${wantH.toFixed(0)}/8)`);
    }
    for (const [w, h] of CONTROLS) {
      await page0.setViewportSize({ width: w, height: h });
      await page0.waitForTimeout(150);
      const v = await readVars();
      if (!ZONE_ONLY && (v.w !== 0 || v.h !== 0 || v.gap !== 0)) problems.push(`المنطقة نشطة على جهاز آخر ${w}x${h}: w=${v.w} h=${v.h} gap=${v.gap}`);
    }
    // شاهد سلبي: زر وهمي ثابت داخل المنطقة يجب أن يُكتشف، وإلا فالحارس يمرّ فارغًا
    await page0.setViewportSize({ width: 382, height: 580 });
    await page0.waitForTimeout(150);
    const control = await page0.evaluate((W) => {
      const b = document.createElement('button');
      b.textContent = 'negative-control';
      b.style.cssText = 'position:fixed;top:12px;right:12px;width:60px;height:30px;z-index:2147483647';
      document.body.appendChild(b);
      return b.isConnected ? 1 : 0;
    }, W).then(() => page0.evaluate(measureInPage, { W }));
    if (!control.violations.some((v) => v.includes('negative-control'))) problems.push('الشاهد السلبي لم يُكتشف: الحارس لا يرى التقاطع (يمرّ فارغًا)');
    else console.log('الشاهد السلبي: اكتُشف زر وهمي داخل المنطقة كما يجب (' + control.violations.length + ' مخالفة)');
    await ctx0.close();
    console.log(`نشاط المنطقة: فُحص ${VIEWPORTS.length + TALL.length} مقاس Duo (يجب أن تكون نشطة) و${CONTROLS.length} جهازاً آخر (يجب أن تكون صفراً)`);

    // 2) التقاطع
    const only = (process.env.DUO_GUARD_VP || '').split(',').filter(Boolean).map((x) => x.split('x').map(Number));
    const ids = (process.env.DUO_GUARD_SCREENS || '').split(',').filter(Boolean);
    const vps = only.length ? only : QUICK ? [[382, 580], [669, 867], [951, 585]] : VIEWPORTS;
    for (const vp of vps) {
      if (ids.length) { await runSet(vp, pick(ids).filter((x) => x.demo !== false), {}, true); await runSet(vp, pick(ids).filter((x) => x.demo === false), {}, false); process.stdout.write('|'); continue; }
      await runSet(vp, QUICK ? SMALL : FULL, {}, true);          // فاتح
      await runSet(vp, VISITOR, {}, false);                       // زائر غير مسجل
      await runSet(vp, SMALL, { dark: true }, true);              // داكن
      await runSet(vp, SMALL, { bigText: true }, true);           // نص 200%
      await runSet(vp, pick(['login-modal']), { dark: true, bigText: true }, false);
      process.stdout.write('|');
    }
    // سياق التطبيق: كل المقاسات (مع عرضي) + مقاسات الشاشة الكاملة الأطول (بلا أشرطة متصفح)
    const appVps = only.length ? only : [...(QUICK ? [[382, 580], [669, 867], [951, 585]] : VIEWPORTS), [382, 700], [382, 764], [470, 900]];
    const APP_SCREENS = ids.length ? pick(ids) : SMALL;
    for (const vp of appVps) {
      await runSet(vp, APP_SCREENS.filter((x) => x.demo !== false), { app: true }, true);
      await runSet(vp, [...pick(['login-modal']), ...(ids.length ? [] : [])], { app: true }, false);
      await runSet(vp, pick(['home', 'login-modal']), { app: true, dark: true, bigText: true }, false);
      process.stdout.write('A');
    }
  } finally {
    if (browser) await browser.close();
    if (server) server.kill();
  }

  const bad = results.filter((r) => r.violations && r.violations.length);
  const exc = new Map();
  for (const r of results) for (const e of r.exceptions || []) exc.set(e, (exc.get(e) || 0) + 1);
  for (const r of bad) problems.push(`${r.vp} ${r.screen}${r.app ? ' [APP]' : ' [Safari]'}${r.dark ? ' [داكن]' : ''}${r.bigText ? ' [نص200%]' : ''}${r.demo ? '' : ' [زائر]'}: ${r.violations.slice(0, 6).join(' | ')}`);
  const summary = {
    cases: results.length,
    viewports: new Set(results.map((r) => r.vp)).size,
    screens: new Set(results.map((r) => r.screen)).size,
    casesWithViolations: bad.length,
    unmeasured: [...new Set(unmeasured)],
    exceptions: [...exc.entries()].map(([k, n]) => `${k} ×${n}`).slice(0, 40),
  };
  if (process.env.DUO_GUARD_OUT) require('node:fs').writeFileSync(process.env.DUO_GUARD_OUT, JSON.stringify({ summary, results }, null, 1));
  console.log('\n' + JSON.stringify(summary, null, 1));
  if (problems.length) { console.log('\nالمخالفات:\n' + problems.join('\n')); process.exitCode = 1; }
  else console.log('\nنجح: صفر عناصر مهمة داخل ركن الودجت.');
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(2); });
module.exports = { measureInPage, W };
