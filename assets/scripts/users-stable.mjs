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

  // Blocca qualsiasi reload automatico
  try{ location.reload = function(){ console.info('[users-stable] reload bloccato'); }; }catch(_){}

  // Wrapper fetch SOLO per query utenti via Supabase REST
  const origFetch = window.fetch.bind(window);
  window.fetch = async function(resource, init){
    const url = typeof resource === 'string' ? resource : (resource && resource.url) || '';
    const isUsers = /\/rest\/v1\/utenti(\b|\/|\?)/.test(url);
    if (!isUsers) return origFetch(resource, init);

    if (inFlight) return origFetch(resource, init); // lascia passare ma evitiamo burst con backoff sotto

    inFlight = true;
    try{
      const res = await origFetch(resource, init);
      if (!res.ok) {
        failures = Math.min(failures + 1, 8);
        const delay = Math.min(1000 * (2 ** failures), MAX_BACKOFF);
        console.warn('[users-stable] HTTP', res.status, '-> backoff', delay, 'ms');

        // Non consentire allo UI di svuotarsi: se la pagina tenterà di rileggere, avrà ancora lastGood
        setTimeout(()=>{ inFlight = false; }, delay);
        return res; // l'handler originario vede l'errore, ma la tabella non viene pulita (vedi guard DOM sotto)
      }

      failures = 0;
      const clone = res.clone();
      try{
        const data = await clone.json().catch(()=>null);
        if (Array.isArray(data)) { lastGood = data; lastGoodAt = Date.now(); }
      }catch(_){}
      inFlight = false;
      return res;

    }catch(e){
      failures = Math.min(failures + 1, 8);
      const delay = Math.min(1000 * (2 ** failures), MAX_BACKOFF);
      console.warn('[users-stable] fetch error -> backoff', delay, 'ms', e?.message||e);
      setTimeout(()=>{ inFlight = false; }, delay);
      throw e;
    }
  };

  // Guard DOM: evita "schermo vuoto" ripristinando ultima tabella valida se il codice la svuota
  const table = document.querySelector('table');
  if (table){
    const mo = new MutationObserver(()=>{
      // se la tabella è stata svuotata e abbiamo lastGood, prova a ripristinare via evento custom
      const rows = table.querySelectorAll('tbody tr').length;
      if (rows === 0 && lastGood && lastGood.length){
        document.dispatchEvent(new CustomEvent('users-stable:restore', {detail:{data:lastGood, ts:lastGoodAt}}));
      }
    });
    mo.observe(table, {childList:true, subtree:true});
  }

  // Espone la cache (opzionale per il renderer)
  globalThis.__USERS_CACHE__ = { get data(){ return lastGood; }, get ts(){ return lastGoodAt; } };

  console.info('[users-stable] attivo', {isRender});
}
