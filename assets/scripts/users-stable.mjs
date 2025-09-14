// [users-stable] Stabilizzazione fetch utenti su Render/Prod
let __installed = false;
export function installUsersStable(){
  if (__installed) return; __installed = true;

  const isUtenti = /(^|\/)utenti\.html(\?|#|$)/.test(location.pathname + location.search + location.hash);
  if (!isUtenti) return;

  const isRender = /\.onrender\.com$/.test(location.hostname);
  const MAX_BACKOFF = 30000;
  let failures = 0;
  let inFlight = false;
  let lastGood = null;
  let lastGoodAt = 0;
  let retryTimeout = null;

  console.info('[users-stable] attivo', {isRender, url: location.href});

  // Blocca qualsiasi reload automatico
  const origReload = location.reload;
  location.reload = function(){ 
    console.warn('[users-stable] reload bloccato - uso cache invece');
    if (lastGood && lastGood.length) {
      document.dispatchEvent(new CustomEvent('users-stable:restore', {detail:{data:lastGood, ts:lastGoodAt}}));
    }
  };

  // Intercetta errori di rete per evitare loop di retry
  window.addEventListener('error', (e) => {
    if (e.message && e.message.includes('supabase')) {
      console.warn('[users-stable] Supabase error intercepted:', e.message);
      e.preventDefault();
    }
  });

  // Wrapper fetch SOLO per query utenti via Supabase REST
  const origFetch = window.fetch.bind(window);
  window.fetch = async function(resource, init){
    const url = typeof resource === 'string' ? resource : (resource && resource.url) || '';
    const isUsers = /\/rest\/v1\/utenti(\b|\/|\?)/.test(url);
    
    if (!isUsers) return origFetch(resource, init);

    console.info('[users-stable] fetch utenti intercettato:', url);

    // Se c'è già una richiesta in corso, restituisci la cache se disponibile
    if (inFlight) {
      if (lastGood && Date.now() - lastGoodAt < 60000) { // cache valida per 1 minuto
        console.info('[users-stable] usando cache durante fetch in corso');
        return new Response(JSON.stringify(lastGood), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return origFetch(resource, init);
    }

    inFlight = true;
    
    try{
      const res = await origFetch(resource, init);
      
      if (!res.ok) {
        failures = Math.min(failures + 1, 8);
        const delay = Math.min(1000 * (2 ** failures), MAX_BACKOFF);
        console.warn('[users-stable] HTTP', res.status, '-> backoff', delay, 'ms');

        // Programma retry con backoff
        if (retryTimeout) clearTimeout(retryTimeout);
        retryTimeout = setTimeout(()=>{ 
          inFlight = false; 
          console.info('[users-stable] retry disponibile dopo backoff');
        }, delay);

        // Se abbiamo cache valida, restituiscila invece dell'errore
        if (lastGood && lastGood.length) {
          console.info('[users-stable] restituisco cache invece di errore HTTP', res.status);
          return new Response(JSON.stringify(lastGood), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return res;
      }

      // Successo: reset failures e salva cache
      failures = 0;
      if (retryTimeout) { clearTimeout(retryTimeout); retryTimeout = null; }
      
      const clone = res.clone();
      try{
        const data = await clone.json().catch(()=>null);
        if (Array.isArray(data) && data.length > 0) { 
          lastGood = data; 
          lastGoodAt = Date.now();
          console.info('[users-stable] cache aggiornata:', data.length, 'utenti');
        }
      }catch(_){}
      
      inFlight = false;
      return res;

    }catch(e){
      failures = Math.min(failures + 1, 8);
      const delay = Math.min(1000 * (2 ** failures), MAX_BACKOFF);
      console.warn('[users-stable] fetch error -> backoff', delay, 'ms', e?.message||e);
      
      if (retryTimeout) clearTimeout(retryTimeout);
      retryTimeout = setTimeout(()=>{ 
        inFlight = false;
        console.info('[users-stable] retry disponibile dopo errore');
      }, delay);

      // Se abbiamo cache valida, restituiscila invece di lanciare errore
      if (lastGood && lastGood.length) {
        console.info('[users-stable] restituisco cache invece di errore fetch');
        return new Response(JSON.stringify(lastGood), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      throw e;
    }
  };

  // Guard DOM: evita "schermo vuoto" ripristinando ultima tabella valida
  const checkTable = () => {
    const table = document.querySelector('table tbody');
    if (table) {
      const rows = table.querySelectorAll('tr').length;
      if (rows === 0 && lastGood && lastGood.length) {
        console.info('[users-stable] tabella vuota rilevata, ripristino cache');
        document.dispatchEvent(new CustomEvent('users-stable:restore', {detail:{data:lastGood, ts:lastGoodAt}}));
      }
    }
  };

  // Controlla tabella ogni 2 secondi
  setInterval(checkTable, 2000);

  // Observer per cambiamenti DOM
  const observer = new MutationObserver(checkTable);
  observer.observe(document.body, {childList:true, subtree:true});

  // Espone la cache
  globalThis.__USERS_CACHE__ = { 
    get data(){ return lastGood; }, 
    get ts(){ return lastGoodAt; },
    get failures(){ return failures; }
  };
}
