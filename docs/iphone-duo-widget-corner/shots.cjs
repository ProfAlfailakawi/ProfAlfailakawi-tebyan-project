/* لقطات «قبل/بعد» لركن الودجت (Playwright WebKit، محاكاة مقاسات لا جهاز).
 *   BASE=http://127.0.0.1:5183 PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node docs/iphone-duo-widget-corner/shots.cjs before|after
 * يرسم إطار المنطقة (96px × clamp(64px,31vh,270px)) بالأحمر فوق الصفحة ليظهر ما يقع داخله.
 */
const { webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const path = require('node:path');

const BASE = process.env.BASE || 'http://127.0.0.1:5183';
const tag = process.argv[2] || 'after';
const SHOTS = [
  ['home', '/'],
  ['discover', '/?tab=discover'],
];
const SIZES = [[382, 580], [669, 867], [951, 585]];

(async () => {
  const browser = await webkit.launch();
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: 'ar', reducedMotion: 'reduce' });
    await ctx.addInitScript(() => { try { sessionStorage.setItem('tebyan_splash_seen', 'true'); localStorage.setItem('tebyan_onboarding_seen_v3', 'true'); localStorage.setItem('tebyan_onboarding_seen_v3_guest', 'true'); } catch { /* */ } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/?demo=1', { waitUntil: 'load' });
    await page.waitForTimeout(800);
    for (const [name, url] of SHOTS) {
      await page.goto(BASE + url, { waitUntil: 'load' });
      await page.waitForTimeout(1800);
      await page.evaluate(() => {
        const vh = window.innerHeight;
        const d = document.createElement('div');
        d.style.cssText = `position:fixed;top:0;left:${document.documentElement.clientWidth - 96}px;width:96px;height:${Math.min(270, Math.max(64, 0.31 * vh))}px;border:2px solid rgba(220,0,0,.9);background:rgba(220,0,0,.12);pointer-events:none;z-index:2147483647;box-sizing:border-box`;
        document.body.appendChild(d);
      });
      await page.screenshot({ path: path.join(__dirname, name === "home" ? `${tag}-${w}x${h}.png` : `${tag}-${name}-${w}x${h}.png`) });
    }
    await ctx.close();
  }
  await browser.close();
})();
