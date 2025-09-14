const VERSION='reset-2025-09-11';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.clients.claim();
    try { await self.registration.unregister(); } catch (err) {}
    const cs = await self.clients.matchAll({ type: 'window' });
    cs.forEach(c => c.navigate(c.url));
  })());
});
self.addEventListener('fetch', () => {}); // nessun caching
