// تبيان service worker — real offline app shell.
// Versioned cache: bump CACHE_VERSION to invalidate old assets on deploy.
/* بصمة البناء تُطبع هنا عند البناء (scripts/build-stamp.mjs). بايتات هذا الملف يجب أن
   تتغيّر مع كل إصدار، وإلا لم يرَ المتصفح تحديثاً أصلاً ولم تعلم التبويبات المفتوحة بشيء. */
const BUILD = '__BUILD_ID__';
const CACHE_VERSION = 'tebyan-' + BUILD;
/* الأصول المبصومة بهاش في اسمها وحدها تُقدَّم من الكاش مباشرة. */
const HASHED = /\/assets\/.+[-.][A-Za-z0-9_]{8,}\.[a-z0-9]+$/i;
const APP_SHELL = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/pwa-maskable-512.png',
];

/* «نُحدّث البرنامج» بدل صفحة Google الإنجليزية. التنقّل يُجاب من Firebase Hosting، فلا
   فجوة نشرٍ هنا عادةً؛ لكن إن أجابت الاستضافة تنقّلاً بـ 500/502/503/504 قُدّمت هذه الصفحة
   (503، no-store) من الكاش، وهي تعيد فتح الرابط نفسه حين يعود الموقع. لا تمسّ /api ولا غير
   GET ولا الجواب الناجح، ولا يُحفظ أيّ 5xx. انقطاعُ الطلب يبقى كما كان: هيكل التطبيق. */
const UPDATING_PAGE = '/updating.html';
const isUpdatingStatus = (status) => status === 500 || status === 502 || status === 503 || status === 504;
const storeUpdatingPage = () =>
  fetch(UPDATING_PAGE, { cache: 'no-store', credentials: 'same-origin' })
    .then((response) => {
      if (!response.ok || !(response.headers.get('content-type') || '').includes('text/html')) return undefined;
      return caches.open(CACHE_VERSION).then((cache) => cache.put(UPDATING_PAGE, response));
    })
    .catch(() => undefined);
/* مسحها التعافي مع كل الكاش؟ تُعاد بعد أول تنقّلٍ ناجح، ولا يُنتظر ذلك. */
const refillUpdatingPage = () =>
  caches
    .open(CACHE_VERSION)
    .then((cache) => cache.match(UPDATING_PAGE))
    .then((hit) => (hit ? undefined : storeUpdatingPage()))
    .catch(() => undefined);
const updatingResponse = () =>
  caches
    .open(CACHE_VERSION)
    .then((cache) => cache.match(UPDATING_PAGE))
    .then((page) => {
      if (!page) return null;
      return page.text().then(
        (body) =>
          new Response(body, {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '5', 'X-Tebyan-Updating': '1' },
          }),
      );
    })
    .catch(() => null);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
      .then(() => storeUpdatingPage())
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET; let the browser deal with everything else.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Bypass cross-origin (fonts, CDNs, Firebase) and API traffic.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;

  /* Navigations (HTML) always come from the network with cache: "no-store" — a stored
     shell names hashed bundles the next deploy removed. Cache is an offline fallback only.
     redirect: 'manual' hands a redirect (Hosting sends /qawl/q-5 → /qawl/q-5/) back to the
     browser: a navigation answered with an already-followed redirect is a network error.
     Only the real app shell at "/" becomes the offline page — never a static article,
     a redirect or an error response. */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(url.pathname + url.search, { cache: 'no-store', credentials: 'same-origin', redirect: 'manual' })
        .then((response) => {
          if (isUpdatingStatus(response.status)) return updatingResponse().then((page) => page || response);
          if (url.pathname === '/' && response.ok && response.type === 'basic' && !response.redirected) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put('/', copy));
          }
          if (response.ok) void refillUpdatingPage();
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/')),
        ),
    );
    return;
  }

  const store = (response) => {
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
    }
    return response;
  };

  // Hash-named build assets: cache-first — the name changes with the bytes.
  if (HASHED.test(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then(store)));
    return;
  }

  // Unhashed icons and fonts: network first, cache only as the offline fallback.
  if (/\.(png|svg|jpg|jpeg|webp|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then(store)
        .catch(() => caches.match(request).then((cached) => cached || Response.error())),
    );
  }
});
