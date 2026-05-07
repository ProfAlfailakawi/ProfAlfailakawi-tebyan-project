self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Let the browser handle standard requests since we rely on the network for AI and dynamic content.
  // This minimal fetch listener is just enough to satisfy PWA installation requirements.
});
