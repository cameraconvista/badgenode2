// sw-cleanup.js - Bonifica Service Worker zombie
// Eseguito una tantum all'avvio per rimuovere SW precedenti e cache stale

export async function cleanupServiceWorker() {
  // Controlla se già eseguita la bonifica (flag localStorage)
  const cleanupKey = 'badgenode-sw-cleanup-done';
  if (localStorage.getItem(cleanupKey) === 'true') {
    return; // Bonifica già eseguita, skip
  }

  console.log('[SW-Cleanup] Avvio bonifica Service Worker zombie...');

  try {
    // 1. Unregister tutti i Service Worker esistenti
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        console.log('[SW-Cleanup] Unregistering SW:', registration.scope);
        await registration.unregister();
      }
      
      if (registrations.length > 0) {
        console.log(`[SW-Cleanup] Rimossi ${registrations.length} Service Worker`);
      }
    }

    // 2. Pulizia cache associate ai SW
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        console.log('[SW-Cleanup] Eliminando cache:', cacheName);
        await caches.delete(cacheName);
      }
      
      if (cacheNames.length > 0) {
        console.log(`[SW-Cleanup] Eliminate ${cacheNames.length} cache`);
      }
    }

    // 3. Marca bonifica come completata
    localStorage.setItem(cleanupKey, 'true');
    console.log('[SW-Cleanup] Bonifica completata con successo');

  } catch (error) {
    console.warn('[SW-Cleanup] Errore durante bonifica:', error);
    // Non bloccare l'app se la bonifica fallisce
  }
}
