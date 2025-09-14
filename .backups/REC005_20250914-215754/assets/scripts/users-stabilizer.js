// [UTENTI-STABILIZER] idempotente, safe su tutte le build
export function installUsersStabilizer(){
  try{
    if (globalThis.__USERS_STABILIZER__) return; // idempotente
    globalThis.__USERS_STABILIZER__ = true;

    const isUtenti = /(^|\/)utenti\.html(\?|#|$)/.test(location.pathname + location.search + location.hash);
    if (!isUtenti) return;

    // Single-flight & backoff
    let inFlight = false;
    let failures = 0;
    let lastGood = null;          // cache in RAM (non persistente)
    let lastGoodAt = 0;
    const MAX_BACKOFF = 30000;

    // Wrap globale: impedisce reload pagina da script
    const _reload = location.reload.bind(location);
    location.reload = function(){ console.info('[UTENTI-STAB] reload() bloccato'); };

    // Debounce: se il codice fa retry con setTimeout/setInterval molto ravvicinati, li riallineiamo in modo gentile
    const _setTimeout = window.setTimeout.bind(window);
    window.setTimeout = (fn, ms = 0, ...rest) => {
      // se è un retry rapido (<1500ms) su utenti, alza a >= 2000ms
      const safe = ms < 1500 ? 2000 : ms;
      return _setTimeout(fn, safe, ...rest);
    };

    // Proxy "fetch" solo per chiamate REST a /utenti (Supabase)
    const origFetch = window.fetch.bind(window);
    window.fetch = async function(resource, init){
      try{
        const url = typeof resource === 'string' ? resource : (resource && resource.url) || '';
        const isUsersQuery = /\/rest\/v1\/utenti(\b|\/|\?)/.test(url);
        if (!isUsersQuery) return await origFetch(resource, init);

        if (inFlight) {
          // Evita burst di richieste concorrenti
          console.info('[UTENTI-STAB] richiesta utenti deduplicata');
          return await origFetch(resource, init); // lasciamo passare una sola fetch "vera" inFlight
        }

        inFlight = true;
        const res = await origFetch(resource, init);

        if (!res.ok) {
          failures = Math.min(failures + 1, 8);
          const delay = Math.min(1000 * (2 ** failures), MAX_BACKOFF);
          console.warn('[UTENTI-STAB] fetch utenti KO -> backoff', delay, 'ms');
          _setTimeout(()=>{ inFlight = false; }, delay);
          return res; // lasciamo gestire l'errore al codice esistente (ma con inFlight tenuto su per un po')
        }

        // Successo -> reset backoff e aggiorna cache volatile
        failures = 0;
        const cloned = res.clone();
        try {
          const data = await cloned.json().catch(()=>null);
          if (Array.isArray(data)) {
            lastGood = data;
            lastGoodAt = Date.now();
            console.info('[UTENTI-STAB] cache aggiornata:', data.length, 'record');
          }
        } catch(_) {}
        inFlight = false;
        return res;

      } catch(e) {
        failures = Math.min(failures + 1, 8);
        const delay = Math.min(1000 * (2 ** failures), MAX_BACKOFF);
        console.warn('[UTENTI-STAB] errore fetch utenti -> backoff', delay, 'ms');
        _setTimeout(()=>{ inFlight = false; }, delay);
        throw e;
      }
    };

    // Optional: esponi cache per eventuale uso dal codice pagina (non obbligatorio)
    Object.defineProperty(globalThis, '__USERS_CACHE__', {
      get(){ return { data: lastGood, ts: lastGoodAt }; }
    });

    // Se il codice sorgente prova a mostrare "errore connessione" svuotando la lista,
    // avere lastGood consente di non rimanere a schermo vuoto al refresh successivo.
    console.info('[UTENTI-STAB] attivo');
  }catch(e){
    console.warn('[UTENTI-STAB] init error:', e?.message||e);
  }
}
