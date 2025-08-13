// Force-update SW: v7
const CACHE = 'vascular-quiz-jg-v7';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
  // NOTE: intentionally NOT precaching questions.json so it always checks network first
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(ASSETS);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Always try network first for the questions dataset so updates show immediately
  if (e.request.method === 'GET' && url.pathname.endsWith('/questions.json')) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(e.request, { cache: 'no-store' });
        // Optionally cache the latest for offline fallback
        const c = await caches.open(CACHE);
        c.put(e.request, fresh.clone());
        return fresh;
      } catch {
        // Offline fallback from cache if available
        const cached = await caches.match(e.request);
        if (cached) return cached;
        return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
      }
    })())
