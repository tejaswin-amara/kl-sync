// KL Sync Service Worker — immutable asset cache only.
// HTML navigations always go to the network so deployments cannot strand
// an old document against a newer set of Next.js build assets.
const CACHE_PREFIX = 'kl-sync-cache-';
const CACHE_NAME = 'kl-sync-cache-v3';
const STATIC_ASSETS = [
  '/manifest.json',
  '/logo.webp',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(STATIC_ASSETS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME
            )
            .map((key) => caches.delete(key))
        )
      ),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept cross-origin requests, APIs, non-GET requests, or HTML.
  // In particular, do not cache '/' or dashboard navigations: their HTML
  // contains deployment-specific asset references and must stay in sync with
  // the currently deployed Next.js build.
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    request.method !== 'GET' ||
    request.mode === 'navigate' ||
    request.destination === 'document'
  ) {
    return;
  }

  // Next.js production assets are build-scoped/immutable. The explicitly
  // listed public assets are also safe to cache across page navigations.
  if (
    url.pathname.startsWith('/_next/static/') ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) return cached;

        const response = await fetch(request);
        if (response.ok && response.type !== 'opaque') {
          await cache.put(request, response.clone());
        }
        return response;
      })()
    );
  }
});
