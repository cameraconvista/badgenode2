// [users-stable] v2 — anti-loop definitivo per utenti.html (deploy)
// - Snapshot del <tbody> quando i dati sono validi
// - Se la pagina tenta di svuotarlo, ripristina l'ultimo HTML buono
// - Backoff su fetch REST /utenti, no reload(), single-flight
let __installed=false;
export function installUsersStable(){
  if(__installed) return; __installed=true;

  const isUtenti = /(^|\/)utenti\.html(\?|#|$)/.test(location.pathname+location.search+location.hash);
  if(!isUtenti) return;

  const isRender = /\.onrender\.com$/.test(location.hostname);
  const MAX_BACKOFF=30000;
  let failures=0, inFlight=false;
  let lastGoodHTML=null, lastGoodRows=0, restoring=false;

  // Blocca reload aggressivi
  try{ location.reload = function(){ console.info('[users-stable] reload bloccato'); }; }catch(_){}

  // Trova tbody principale
  function findTbody(){
    return document.querySelector('table tbody') ||
           document.querySelector('#lista-utenti tbody') ||
           document.querySelector('tbody');
  }

  // Salva snapshot quando la tabella è popolata
  function snapshotIfGood(){
    const tb = findTbody(); if(!tb) return;
    const rows = tb.querySelectorAll('tr').length;
    if(rows>0){
      lastGoodHTML = tb.innerHTML;
      lastGoodRows = rows;
      //console.info('[users-stable] snapshot', rows);
    }
  }

  // Ripristina snapshot se il tbody viene svuotato
  function restoreIfEmpty(){
    const tb = findTbody(); if(!tb) return;
    const rows = tb.querySelectorAll('tr').length;
    if(rows===0 && lastGoodHTML && !restoring){
      restoring=true;
      tb.innerHTML = lastGoodHTML; // ripristina senza toccare layout/handler inline
      //console.info('[users-stable] ripristino snapshot', lastGoodRows);
      setTimeout(()=>{ restoring=false; }, 50);
    }
  }

  // Observer per prevenire "schermo vuoto"
  const mo = new MutationObserver(()=>{ snapshotIfGood(); restoreIfEmpty(); });
  const startMO = ()=>{
    const tb = findTbody(); if(!tb) return setTimeout(startMO,150);
    mo.observe(tb, {childList:true, subtree:true});
    snapshotIfGood();
  };
  startMO();

  // Wrapper fetch per le chiamate a /rest/v1/utenti (via supabase-js o fetch diretto)
  const _fetch = window.fetch.bind(window);
  window.fetch = async function(resource, init){
    const url = typeof resource==='string' ? resource : (resource&&resource.url)||'';
    const isUsers = /\/rest\/v1\/utenti(\b|\/|\?)/.test(url);
    if(!isUsers) return _fetch(resource, init);

    if(inFlight){ return _fetch(resource, init); } // lasciamo scorrere ma evitiamo burst al reset

    inFlight=true;
    try{
      const res = await _fetch(resource, init);
      if(!res.ok){
        failures = Math.min(failures+1, 8);
        const delay = Math.min(1000*(2**failures), MAX_BACKOFF);
        console.warn('[users-stable] HTTP', res.status, '→ backoff', delay,'ms');
        setTimeout(()=>{ inFlight=false; }, delay);
        // NON svuotiamo nulla: observer ripristina lastGood se il codice lo svuota
        return res;
      }
      failures=0;
      // successo → inFlight off subito; snapshot avviene via observer quando DOM si popola
      inFlight=false;
      return res;
    }catch(e){
      failures = Math.min(failures+1, 8);
      const delay = Math.min(1000*(2**failures), MAX_BACKOFF);
      console.warn('[users-stable] fetch error → backoff', delay,'ms', e?.message||e);
      setTimeout(()=>{ inFlight=false; }, delay);
      throw e;
    }
  };

  // Hard guard: se dopo N secondi il tbody è vuoto ma in passato era pieno, ripristina
  setInterval(()=>{ if(lastGoodHTML) restoreIfEmpty(); }, 3000);

  console.info('[users-stable] v2 attivo', {isRender});
}
