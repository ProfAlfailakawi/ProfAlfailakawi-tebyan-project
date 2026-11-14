/* Pose I (live resize on one page instance) and pose J (accessibility stress).
 * Same setup as audit.cjs:
 *   NODE_PATH=/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
 *     BASE=http://127.0.0.1:5170 node docs/iphone-duo-final/live-stress.cjs [out.json]
 * Simulation only (window resizes in WebKit), not a fold on a device.
 */
const { webkit } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://127.0.0.1:5170';
const OUT = process.argv[2] || 'duo-live-stress.json';
const BOOK_MQ = '(min-width: 640px) and (max-width: 760px) and (min-height: 520px), (min-width: 840px) and (max-width: 1000px) and (min-height: 520px) and (min-aspect-ratio: 3/2)';
const SEQ = [[951, 585], [669, 867], [470, 700], [382, 580], [594, 368], [951, 350], [951, 585]];

const geometry = (page) => page.evaluate((BOOK_MQ) => {
  const vw = document.documentElement.clientWidth;
  const main = document.querySelector('main');
  const book = matchMedia(BOOK_MQ).matches;
  const z0 = vw / 2 - 16, z1 = vw / 2 + 16;
  let spine = 0;
  if (book) for (const el of document.querySelectorAll('main input, main textarea, main button, .tebyan-book-aside button, header button')) {
    const r = el.getBoundingClientRect();
    if (r.width && r.height && r.right > z0 && r.left < z1 && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true }))) {
      // painted part only (chip rows scroll sideways)
      let L = r.left, R = r.right;
      for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (cs.overflowX !== 'visible') { const pr = p.getBoundingClientRect(); L = Math.max(L, pr.left); R = Math.min(R, pr.right); }
      }
      if (R > z0 && L < z1 && R - L > 0.5) spine++;
    }
  }
  return {
    book,
    overflow: Math.max(document.documentElement.scrollWidth - vw, main ? main.scrollWidth - main.clientWidth : 0),
    spine,
    scrollTop: main ? Math.round(main.scrollTop) : 0,
    marker: window.__duoMarker === 42,
  };
}, BOOK_MQ);

const TEXT200 = 'html{font-size:200% !important;-webkit-text-size-adjust:200% !important}';

async function newPage(browser, w, h, extra = {}, demo = true) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: 'ar', reducedMotion: 'reduce', ...extra });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('tebyan_splash_seen', 'true'); localStorage.setItem('tebyan_onboarding_seen_v3', 'true'); localStorage.setItem('tebyan_onboarding_seen_v3_guest', 'true'); } catch {} });
  const page = await ctx.newPage();
  if (demo) {
    await page.goto(BASE + '/?demo=1', { waitUntil: 'load' });
    await page.waitForTimeout(800);
  }
  return { ctx, page };
}

(async () => {
  const browser = await webkit.launch();
  const out = { live: [], stress: [] };

  const SKIP_FLOWS = process.env.PER_SCREEN_ONLY === '1';
  // ---- I: live sequence, no reload ----
  const flows = [
    {
      id: 'oracle: typed input + selected perspective + open help sheet', url: '/?tab=oracle',
      prepare: async (p) => {
        await p.locator('main input[type=text]').first().fill('اختبار الطي: نص لا يضيع');
        await p.getByRole('button', { name: /قائد/ }).first().click();
        await p.locator('.tebyan-page-help-button').click();
      },
      check: (p) => p.evaluate(() => ({
        input: document.querySelector('main input[type=text]')?.value === 'اختبار الطي: نص لا يضيع',
        selection: !!document.querySelector('main button[title*="قائد"][class*="bg-[#8E7AAE]"]'),
        dialog: !!document.querySelector('.tebyan-page-help-popup'),
      })),
    },
    {
      id: 'discover: search text + category filter + scrolled list', url: '/?tab=discover',
      prepare: async (p) => {
        await p.getByRole('button', { name: 'أحسم وأنجز' }).click();
        await p.evaluate(() => { const m = document.querySelector('main'); m.scrollTop = 260; });
        await p.locator('.tebyan-service-search-input').fill('');
      },
      check: (p) => p.evaluate(() => ({
        selection: document.querySelector('.tebyan-service-filters [aria-pressed=true]')?.textContent?.includes('أحسم') ?? false,
        scrolled: document.querySelector('main').scrollTop > 0,
      })),
    },
    {
      id: 'ask: typed question in the composer', url: '/?tab=ask',
      prepare: async (p) => { await p.locator('main textarea, main input[type=text]').first().fill('سؤال يبقى بعد الطي'); },
      check: (p) => p.evaluate(() => ({ input: [...document.querySelectorAll('main textarea, main input[type=text]')].some((e) => e.value === 'سؤال يبقى بعد الطي') })),
    },
  ];
  for (const f of SKIP_FLOWS ? [] : flows) {
    const { ctx, page } = await newPage(browser, ...SEQ[0]);
    await page.goto(BASE + f.url, { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    await page.evaluate(() => { window.__duoMarker = 42; });
    await f.prepare(page);
    await page.waitForTimeout(500);
    const steps = [];
    for (const [w, h] of SEQ) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(700);
      steps.push({ vp: `${w}x${h}`, ...(await geometry(page)), ...(await f.check(page)) });
    }
    out.live.push({ flow: f.id, steps });
    await ctx.close();
    process.stdout.write('L');
  }

  // ---- J: accessibility stress ----
  const screens = ['/', '/?tab=discover', '/?tab=oracle', '/?tab=qawlfasl', '/qawl/q_1', '/?tab=council', '/?tab=rukni', '/?tab=contact', '/?tab=admindashboard'];
  const sizes = [[382, 580], [669, 867], [951, 585], [951, 350], [600, 350]];
  const variants = [
    { id: 'text-200', css: 'html{font-size:200% !important;-webkit-text-size-adjust:200% !important}' },
    { id: 'dark', opts: { colorScheme: 'dark' } },
    { id: 'motion-on', opts: { reducedMotion: 'no-preference' } },
    // A 47px cut-out on the left only. WebKit cannot set env(safe-area-inset-*), so the
    // places that read it (header side paddings, Back/Help corner) get the value directly.
    { id: 'safe-area-asym', css: 'header.fixed.tebyan-app-header{padding-left:47px !important}.tebyan-page-controls{left:47px !important}' },
  ];
  for (const v of SKIP_FLOWS ? [] : variants) {
    for (const [w, h] of sizes) {
      const { ctx, page } = await newPage(browser, w, h, v.opts || {});
      for (const url of screens) {
        await page.goto(BASE + url, { waitUntil: 'load' });
        await page.waitForTimeout(1600);
        if (v.css) await page.addStyleTag({ content: v.css });
        await page.waitForTimeout(400);
        const g = await geometry(page);
        const clipped = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth; let n = 0;
          for (const el of document.querySelectorAll('main h1, main h2, main button, main input, main textarea, header button')) {
            const r = el.getBoundingClientRect();
            if (!r.width || (el.checkVisibility && !el.checkVisibility({ opacityProperty: true }))) continue;
            let scroller = false;
            for (let p = el.parentElement; p && p.tagName !== 'MAIN'; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o !== 'visible') { scroller = true; break; } }
            if (!scroller && (r.right > vw + 1 || r.left < -1)) n++;
          }
          return n;
        });
        out.stress.push({ variant: v.id, vp: `${w}x${h}`, url, overflow: g.overflow, spine: g.spine, book: g.book, clipped });
      }
      await ctx.close();
      process.stdout.write('S');
    }
  }
  // keyboard open: a focused field while the window shrinks to ~350 tall
  for (const [w, url, sel] of SKIP_FLOWS ? [] : [[382, '/?tab=oracle', 'main input[type=text]'], [669, '/?tab=oracle', 'main input[type=text]'], [951, '/?tab=contact', 'main input'], [382, '/', 'main textarea, main input']]) {
    const { ctx, page } = await newPage(browser, w, w > 700 ? 585 : 867);
    await page.goto(BASE + url, { waitUntil: 'load' });
    await page.waitForTimeout(1800);
    await page.locator(sel).first().focus();
    await page.setViewportSize({ width: w, height: 350 });
    await page.waitForTimeout(700);
    const r = await page.evaluate((sel) => {
      const el = document.activeElement; const b = el.getBoundingClientRect();
      const hb = document.querySelector('header.fixed'); const bar = hb && getComputedStyle(hb).opacity !== '0' ? hb.getBoundingClientRect() : null;
      return { focusedKept: el.matches(sel), visible: b.top >= 0 && b.bottom <= innerHeight, coveredByBar: !!bar && b.bottom > bar.top && b.top < bar.bottom && bar.top > innerHeight / 2 };
    }, sel);
    // the browser scrolls a focused field into view when the keyboard opens; emulate that once
    if (!r.visible) await page.locator(sel).first().scrollIntoViewIfNeeded();
    const r2 = await page.evaluate(() => { const b = document.activeElement.getBoundingClientRect(); const hb = document.querySelector('header.fixed'); const bar = hb && getComputedStyle(hb).opacity !== '0' ? hb.getBoundingClientRect() : null; return { visibleAfterScroll: b.top >= 0 && b.bottom <= innerHeight, coveredByBarAfterScroll: !!bar && bar.top > innerHeight / 2 && b.bottom > bar.top }; });
    out.stress.push({ variant: 'keyboard', vp: `${w}x350`, url, ...r, ...r2, ...(await geometry(page)) });
    await ctx.close();
    process.stdout.write('K');
  }
  // ---- I and J for every inventoried screen (audit.cjs SCREENS) ----
  const { SCREENS, measure, runStep } = require('./audit.cjs');
  const ONLY = (process.env.SCREENS || '').split(',').filter(Boolean);
  out.perScreen = [];
  for (const sc of SCREENS.filter((x) => !x.slowChunk && (!ONLY.length || ONLY.includes(x.id)))) {
    const rec = { screen: sc.id, live: [], stress: [] };
    try {
      // I: one page instance through the whole sequence
      const { ctx, page } = await newPage(browser, ...SEQ[0], {}, sc.demo !== false);
      await page.goto(BASE + sc.url, { waitUntil: 'load' });
      // settle: some tabs replace their URL a moment after load (e.g. ripple)
      await page.waitForTimeout(Number(process.env.SETTLE || 1800));
      for (const st of sc.steps || []) await runStep(page, st);
      await page.evaluate(() => { window.__duoMarker = 42; });
      for (const [w, h] of SEQ) {
        await page.setViewportSize({ width: w, height: h });
        await page.waitForTimeout(500);
        const m = await measure(page);
        rec.live.push({ vp: `${w}x${h}`, marker: await page.evaluate(() => window.__duoMarker === 42), overflow: m.overflow, spine: m.spine.length, clipped: m.clipped.length });
      }
      // J on the same page instance: 200% text in both book poses and on the outer
      // screen, then the dark scheme on the inner screen
      const tag = await page.addStyleTag({ content: TEXT200 });
      for (const [w, h] of [[669, 867], [951, 585], [382, 580]]) {
        await page.setViewportSize({ width: w, height: h });
        await page.waitForTimeout(450);
        const m = await measure(page);
        rec.stress.push({ variant: 'text-200', vp: `${w}x${h}`, overflow: m.overflow, spine: m.spine.length, clipped: m.clipped.length, spineList: m.spine.slice(0, 3) });
      }
      await tag.evaluate((el) => el.remove());
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.setViewportSize({ width: 951, height: 585 });
      await page.waitForTimeout(450);
      const md = await measure(page);
      rec.stress.push({ variant: 'dark', vp: '951x585', overflow: md.overflow, spine: md.spine.length, clipped: md.clipped.length, spineList: md.spine.slice(0, 3) });
      await ctx.close();
    } catch (e) { rec.error = String(e.message).split('\n')[0].slice(0, 160); }
    out.perScreen.push(rec);
    process.stdout.write('p');
  }

  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  const liveOk = out.live.every((f) => f.steps.every((s) => s.marker && s.overflow <= 1 && s.spine === 0 && Object.entries(s).filter(([k]) => ['input', 'selection', 'dialog', 'scrolled'].includes(k)).every(([, v]) => v)));
  const stressBad = out.stress.filter((s) => s.overflow > 1 || s.spine > 0 || s.clipped > 0 || s.coveredByBarAfterScroll || s.visibleAfterScroll === false);
  const ps = out.perScreen.map((r) => ({ s: r.screen, I: r.error ? 'ERR' : r.live.every((x) => x.marker && x.overflow.doc <= 1 && x.spine === 0 && x.clipped === 0) ? 'ok' : 'bad', J: r.error ? 'ERR' : r.stress.every((x) => x.overflow.doc <= 1 && x.spine === 0 && x.clipped === 0) ? 'ok' : 'bad' }));
  console.log('\n' + JSON.stringify({ liveOk, stressCases: out.stress.length, stressBad: stressBad.length, perScreenBad: ps.filter((x) => x.I !== 'ok' || x.J !== 'ok') }));
})();
