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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
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
     shell names hashed bundles the next deploy removed. Cache is an offline fallback only. */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(url.pathname + url.search, { cache: 'no-store', credentials: 'same-origin' })
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('/', copy));
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
