self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through fetch for standard PWA detection
  event.respondWith(
    fetch(event.request).catch(() => {
      // Offline support can fallback to cached shell if desired
      return caches.match(event.request);
    })
  );
});
