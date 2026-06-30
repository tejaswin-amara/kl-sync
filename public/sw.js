self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('kl-sync-v1').then((cache) => {
      return cache.addAll([
        '/login',
        '/icon.png'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Network first, fallback to cache for HTML and API
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const resClone = response.clone();
        caches.open('kl-sync-v1').then((cache) => {
          if (event.request.method === 'GET') {
            cache.put(event.request, resClone);
          }
        });
        return response;
      })
      .catch(() => caches.match(event.request).then(res => res))
  );
});
