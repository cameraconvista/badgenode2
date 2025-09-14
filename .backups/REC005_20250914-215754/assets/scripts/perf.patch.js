
(() => {
  // Passive listeners for smoother scroll/touch
  const orig = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    try {
      const needsPassive = type === 'touchstart' || type === 'touchmove' || type === 'wheel' || type === 'mousewheel';
      if (needsPassive) {
        if (typeof options === 'boolean' || options == null) options = { passive: true, capture: !!options };
        else if (typeof options === 'object' && !('passive' in options)) options = { ...options, passive: true };
      }
    } catch {}
    return orig.call(this, type, listener, options);
  };

  // Lazy images (+ decoding async)
  const enhanceImg = (img) => {
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
    if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
  };
  const imgs = document.getElementsByTagName('img');
  for (let i = 0; i < imgs.length; i++) enhanceImg(imgs[i]);
  new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes?.forEach((n) => {
        if (n.tagName === 'IMG') enhanceImg(n);
        if (n.querySelectorAll) n.querySelectorAll('img').forEach(enhanceImg);
      });
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  // Pagination for very large tables
  const PAGE_SIZE = 50, MAX_ROWS_NO_PAGINATION = 200;
  function paginateTable(table) {
    if (!table || table.__patchedPagination) return;
    const tbody = table.tBodies?.[0]; if (!tbody) return;
    const rows = Array.from(tbody.rows);
    if (rows.length <= MAX_ROWS_NO_PAGINATION) return;
    table.__patchedPagination = true;
    let page = 0; const pages = Math.ceil(rows.length / PAGE_SIZE);

    const nav = document.createElement('div');
    Object.assign(nav.style, { display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap', margin:'8px 0' });
    const info = document.createElement('span');
    const btn = (t)=>Object.assign(document.createElement('button'),{textContent:t,style:'padding:4px 8px;border-radius:6px;border:1px solid #ccc;background:#fff;cursor:pointer;'});
    const prev = btn('‹'), next = btn('›');

    function renderPage() {
      const start = page * PAGE_SIZE, end = start + PAGE_SIZE;
      rows.forEach((tr, i)=> tr.style.display = (i>=start && i<end) ? '' : 'none');
      info.textContent = `Pagina ${page+1}/${pages} • ${rows.length} righe`;
      prev.disabled = page === 0; next.disabled = page === pages-1;
    }
    prev.onclick = ()=>{ if (page>0){ page--; renderPage(); } };
    next.onclick = ()=>{ if (page<pages-1){ page++; renderPage(); } };
    nav.append(prev, next, info);
    table.parentNode.insertBefore(nav, table);
    renderPage();
  }

  function scan(){ document.querySelectorAll('table').forEach(paginateTable); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan, { once:true }); else scan();
  new MutationObserver((muts)=>{ for (const m of muts){ m.addedNodes?.forEach((n)=>{ if (n.tagName==='TABLE') paginateTable(n); if (n.querySelectorAll) n.querySelectorAll('table').forEach(paginateTable); }); } })
    .observe(document.body || document.documentElement, { childList:true, subtree:true });

  // Optional chunk helper available for future heavy loops
  window.__perfChunk = function(items, fn, chunk=200){
    let i=0; function step(deadline){ let c=0;
      while(i<items.length && (deadline?deadline.timeRemaining()>1:c<chunk)){ fn(items[i], i); i++; c++; }
      if(i<items.length) (window.requestIdleCallback || ((cb)=>setTimeout(()=>cb({timeRemaining:()=>50}),0)))(step);
    }
    (window.requestIdleCallback || ((cb)=>setTimeout(()=>cb({timeRemaining:()=>50}),0)))(step);
  };

  // Silence debug logs outside localhost (leave errors)
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!isLocal) console.debug = ()=>{};
})();
