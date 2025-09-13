/* 🚀 BADGENODE Service Worker - PWA Caching Strategy
 * POLITICA: Attivo solo in PRODUZIONE, disabilitato in DEV
 * Strategia: Network-first per HTML, Cache-first per assets
 */
const CACHE_VERSION = 'v6-2025-09-13';
const STATIC_CACHE = `badgenode-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `badgenode-runtime-${CACHE_VERSION}`;

// 📋 PRECACHE: Risorse critiche per funzionamento offline
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/utenti.html', 
  '/storico.html',
  '/ex-dipendenti.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/style.css',
  '/assets/icons/badgenode-192.png',
  '/assets/icons/badgenode-512.png',
  '/assets/icons/BADGENODE.png'
];

// 🔧 CONFIGURAZIONE: Ambiente detection
const isDev = self.location.hostname === 'localhost' || 
              self.location.hostname.includes('replit.dev') ||
              self.location.port === '5173' ||
              self.location.port === '5000';

console.log(`[SW] Ambiente rilevato: ${isDev ? 'DEV' : 'PROD'}`);

// ⚠️ KILL-SWITCH DEV: Termina SW se in sviluppo
if (isDev) {
  console.log('[SW] 🛑 KILL-SWITCH: Service Worker disabilitato in DEV');
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', () => {
    // Pulisci tutte le cache in DEV
    caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
    self.clients.claim();
  });
  // Blocca tutti i fetch in DEV
  self.addEventListener('fetch', () => {});
  // Termina esecuzione
  return;
}

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching files');
        return cache.addAll(PRECACHE_URLS);
      })
      .catch((err) => {
        console.error('[SW] Precache failed:', err);
      })
  );
  // PRODUZIONE: skipWaiting immediato
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
          .map(k => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      )
    )
  );
  // PRODUZIONE: claim clients immediato
  self.clients.claim();
});

const ASSETS_REGEX = /^\/assets\/.+\.(?:js|css|png|webp|jpg|svg|ico)$/i;
const ROOT_ICONS_REGEX = /^\/(?:favicon\.ico|.*\.png|.*\.svg)$/i;
const PUB_ICONS_REGEX = /^\/icons\/.*$/i;
const SUPABASE_REGEX = /^https?:\/\/([a-z0-9-]+\.)*supabase\.co\//i;

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests e Supabase
  if (url.origin !== self.location.origin || SUPABASE_REGEX.test(request.url)) {
    return;
  }

  // Skip WebSocket e EventSource requests
  if (request.url.includes('ws://') || request.url.includes('wss://') || request.headers.get('Accept') === 'text/event-stream') {
    return;
  }

  // Navigazioni HTML - network-first con fallback offline
  if (request.mode === 'navigate') {
    console.log('[SW] Navigation request:', request.url);
    event.respondWith((async () => {
      try {
        // Prova la rete prima
        const netResponse = await fetch(request);
        console.log('[SW] Navigation network success');

        // Cache in background
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, netResponse.clone()).catch(()=>{});

        return netResponse;
      } catch (err) {
        console.log('[SW] Navigation network failed, trying cache');

        // Prova cache della pagina specifica
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        if (cached) {
          console.log('[SW] Serving cached page');
          return cached;
        }

        // Prova cache statica
        const staticCache = await caches.open(STATIC_CACHE);
        const staticCached = await staticCache.match(request);
        if (staticCached) {
          console.log('[SW] Serving static cached page');
          return staticCached;
        }

        // Fallback alla pagina offline
        console.log('[SW] Serving offline page');
        const offlinePage = await staticCache.match('/offline.html');
        return offlinePage || new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  // Asset fingerprintati - cache-first
  if (url.origin === self.location.origin && ASSETS_REGEX.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);

      if (cached) {
        console.log('[SW] Serving cached asset:', url.pathname);
        return cached;
      }

      try {
        const netResponse = await fetch(request);
        console.log('[SW] Caching new asset:', url.pathname);
        cache.put(request, netResponse.clone()).catch(()=>{});
        return netResponse;
      } catch (err) {
        console.log('[SW] Asset fetch failed:', url.pathname);
        return cached || new Response('Asset not available', { status: 503 });
      }
    })());
    return;
  }

  // Icone root e /icons/* -> stale-while-revalidate
  if (url.origin === self.location.origin && (ROOT_ICONS_REGEX.test(url.pathname) || PUB_ICONS_REGEX.test(url.pathname))) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);

      // Aggiorna in background
      const netPromise = fetch(request).then(res => {
        cache.put(request, res.clone()).catch(()=>{});
        return res;
      }).catch(()=>null);

      return cached || (await netPromise) || new Response('Icon not available', { status: 503 });
    })());
    return;
  }

  // Default: passa alla rete
  console.log('[SW] Default fetch:', request.url);
});